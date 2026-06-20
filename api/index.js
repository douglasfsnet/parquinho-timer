import express from 'express';
import path from 'path';
import fs from 'fs';
import { put, list, del } from '@vercel/blob';

const app = express();

app.use(express.json({ limit: '50mb' }));

const DB_FILENAME = 'parquinho_database.json';
const LOCAL_DB_PATH = path.join(process.cwd(), 'parquinho_local_db.json');

// Default lists
const DEFAULT_PRICING = {
  valuePerMinute: 0.50,
  pack10: 5.00,
  pack15: 7.50,
  pack20: 10.00,
  pack30: 15.00
};

const DEFAULT_TOYS = [
  { id: 't1', name: 'Piscina de Bolinhas', valuePerMinute: 0.50, color: 'blue', icon: 'Smile', capacityLimit: 15 },
  { id: 't2', name: 'Escorregador', valuePerMinute: 0.50, color: 'indigo', icon: 'Flame', capacityLimit: 8 },
  { id: 't3', name: 'Cama Elástica', valuePerMinute: 0.50, color: 'rose', icon: 'Compass', capacityLimit: 10 },
  { id: 't4', name: 'Kid Play', valuePerMinute: 0.60, color: 'amber', icon: 'Smile', capacityLimit: 12 },
  { id: 't5', name: 'Tombo Legal', valuePerMinute: 0.70, color: 'emerald', icon: 'Dice6', capacityLimit: 5 },
  { id: 't6', name: 'Mini Futebol', valuePerMinute: 0.50, color: 'teal', icon: 'Flame', capacityLimit: 6 },
  { id: 't7', name: 'Carrinhos', valuePerMinute: 0.80, color: 'violet', icon: 'Timer', capacityLimit: 4 }
];

const DEFAULT_USERS = [
  {
    id: 'first_admin',
    name: 'Douglas Silva',
    email: 'douglasfsnet@gmail.com',
    password: 'dfsnet23',
    role: 'Admin',
    createdAt: Date.now()
  }
];

const initialDB = {
  toys: DEFAULT_TOYS,
  activeClients: [],
  pricingConfig: DEFAULT_PRICING,
  history: [],
  staffList: DEFAULT_USERS
};

let dbCache = null;
let blobUrl = null;

async function getDB() {
  if (dbCache) {
    return dbCache;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    console.log('Vercel Blob token detected, loading from Cloud Storage...');
    try {
      const { blobs } = await list({ token });
      const targetBlob = blobs.find(b => b.pathname === DB_FILENAME);
      if (targetBlob) {
        blobUrl = targetBlob.url;
        console.log(`Found target database blob at ${blobUrl}. Fetching data...`);
        const res = await fetch(blobUrl);
        if (res.ok) {
          const cloudData = await res.json();
          // Use cloud data as-is, don't merge with initialDB to avoid duplicates
          // Only use initialDB values for missing keys
          dbCache = {
            toys: cloudData.toys || initialDB.toys,
            activeClients: cloudData.activeClients ?? [],
            pricingConfig: cloudData.pricingConfig || initialDB.pricingConfig,
            history: cloudData.history || [],
            staffList: cloudData.staffList || initialDB.staffList
          };
          return dbCache;
        }
      } else {
        console.log('No parquinho_database.json found in Vercel Blob. Seeding initial database...');
        await saveDB(initialDB);
        return initialDB;
      }
    } catch (e) {
      console.warn('Failed to load from Vercel Blob. Falling back to local/memory.', e);
    }
  }

  if (fs.existsSync(LOCAL_DB_PATH)) {
    try {
      const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      dbCache = JSON.parse(raw);
      return dbCache;
    } catch (e) {
      console.warn('Failed reading local DB file, using memory', e);
    }
  }

  dbCache = initialDB;
  return dbCache;
}

async function saveDB(data) {
  dbCache = data;
  console.log('[saveDB] Called with data keys:', Object.keys(data));

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error('[saveDB] CRITICAL: BLOB_READ_WRITE_TOKEN not configured!');
    throw new Error('BLOB_READ_WRITE_TOKEN not configured');
  }

  try {
    const jsonStr = JSON.stringify(data, null, 2);
    console.log(`[saveDB] Saving ${jsonStr.length} bytes to Vercel Blob...`);
    
    const result = await put(DB_FILENAME, jsonStr, { 
      token,
      access: 'public',
      allowOverwrite: true
    });
    
    console.log('[saveDB] SUCCESS: Saved to', result.url, 'Size:', result.size);
  } catch (e) {
    console.error('[saveDB] FAILED:', e.message);
    console.error('[saveDB] Error details:', e);
    throw e;
  }
}

// API Routes
app.get('/api/db', async (req, res) => {
  try {
    // Disable caching to ensure fresh data on every request
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const db = await getDB();
    res.json({ ...db, isBlobActive: !!process.env.BLOB_READ_WRITE_TOKEN });
  } catch (error) {
    console.error('GET /api/db error:', error);
    res.status(500).json({ error: 'Failed to fetch database' });
  }
});

app.post('/api/db', async (req, res) => {
  try {
    console.log('[POST /api/db] Received request');
    const db = await getDB();
    const merged = { ...db, ...req.body };
    await saveDB(merged);
    res.json({ success: true, data: merged });
  } catch (error) {
    console.error('[POST /api/db] ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/db/:key', async (req, res) => {
  try {
    console.log(`[POST /api/db/:key] Saving key: ${req.params.key}`);
    const db = await getDB();
    db[req.params.key] = req.body;
    await saveDB(db);
    res.json({ success: true, data: db });
  } catch (error) {
    console.error(`[POST /api/db/:key] ERROR for key ${req.params.key}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Admin-only: Reset database to initial state (removes duplicates)
app.post('/api/admin/reset-db', async (req, res) => {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (token) {
      // Delete the blob file
      await del(DB_FILENAME, { token });
      console.log('Deleted parquinho_database.json from Vercel Blob');
    }
    // Clear cache
    dbCache = null;
    blobUrl = null;
    // Reinitialize with default data
    await saveDB(initialDB);
    res.json({ success: true, message: 'Database reset to initial state', data: initialDB });
  } catch (error) {
    console.error('POST /api/admin/reset-db error:', error);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

export default app;
