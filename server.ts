import express from "express";
import path from "path";
import fs from "fs";
import { put, list } from "@vercel/blob";

const app = express();
const PORT = process.env.IS_DEV_API_SERVER === "true" ? 3001 : 3000;

app.use(express.json({ limit: "50mb" }));

const DB_FILENAME = "parquinho_database.json";
const LOCAL_DB_PATH = path.join(process.cwd(), "parquinho_local_db.json");

// Default lists
const DEFAULT_PRICING = {
  valuePerMinute: 0.50,
  pack10: 5.00,
  pack15: 7.50,
  pack20: 10.00,
  pack30: 15.00
};

const DEFAULT_TOYS = [
  { id: "t1", name: "Piscina de Bolinhas", valuePerMinute: 0.50, color: "blue", icon: "Smile", capacityLimit: 15 },
  { id: "t2", name: "Escorregador", valuePerMinute: 0.50, color: "indigo", icon: "Flame", capacityLimit: 8 },
  { id: "t3", name: "Cama Elástica", valuePerMinute: 0.50, color: "rose", icon: "Compass", capacityLimit: 10 },
  { id: "t4", name: "Kid Play", valuePerMinute: 0.60, color: "amber", icon: "Smile", capacityLimit: 12 },
  { id: "t5", name: "Tombo Legal", valuePerMinute: 0.70, color: "emerald", icon: "Dice6", capacityLimit: 5 },
  { id: "t6", name: "Mini Futebol", valuePerMinute: 0.50, color: "teal", icon: "Flame", capacityLimit: 6 },
  { id: "t7", name: "Carrinhos", valuePerMinute: 0.80, color: "violet", icon: "Timer", capacityLimit: 4 }
];

const DEFAULT_USERS = [
  {
    id: "first_admin",
    name: "Douglas Silva",
    email: "douglasfsnet@gmail.com",
    password: "dfsnet23",
    role: "Admin",
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

// Memory cache to avoid hitting Vercel Blob excessively
let dbCache: any = null;
let blobUrl: string | null = null;

// Helper to load database
async function getDB() {
  if (dbCache) {
    return dbCache;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    console.log("Vercel Blob token detected, loading from Cloud Storage...");
    try {
      const { blobs } = await list({ token });
      const targetBlob = blobs.find(b => b.pathname === DB_FILENAME);
      if (targetBlob) {
        blobUrl = targetBlob.url;
        console.log(`Found target database blob at ${blobUrl}. Fetching data...`);
        const res = await fetch(blobUrl);
        if (res.ok) {
          const cloudData = await res.json();
          dbCache = { ...initialDB, ...cloudData };
          return dbCache;
        }
      } else {
        console.log("No parquinho_database.json found in Vercel Blob. Seeding initial database...");
        await saveDB(initialDB);
        return initialDB;
      }
    } catch (e) {
      console.warn("Failed to load from Vercel Blob. Falling back to local/memory.", e);
    }
  }

  // Fallback to local file
  if (fs.existsSync(LOCAL_DB_PATH)) {
    try {
      const raw = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
      dbCache = JSON.parse(raw);
      return dbCache;
    } catch (e) {
      console.warn("Failed reading local DB file, using memory", e);
    }
  }

  dbCache = initialDB;
  return dbCache;
}

// Helper to save database
async function saveDB(newData: any) {
  dbCache = newData;

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    try {
      console.log("Saving database to Vercel Blob...");
      const blob = await put(DB_FILENAME, JSON.stringify(newData, null, 2), {
        access: "public",
        addRandomSuffix: false,
        token
      });
      blobUrl = blob.url;
      console.log(`Database saved successfully to Vercel Blob: ${blobUrl}`);
    } catch (e) {
      console.error("Vercel Blob save failed, writing locally instead", e);
    }
  }

  // Always write locally as secondary local persistent sync
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(newData, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write database to local file", err);
  }
}

// REST endpoints
app.get("/api/db", async (req, res) => {
  try {
    const dbData = await getDB();
    res.json({
      ...dbData,
      isBlobActive: !!process.env.BLOB_READ_WRITE_TOKEN
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/db", async (req, res) => {
  try {
    const updatedData = req.body;
    if (!updatedData || typeof updatedData !== "object") {
      return res.status(400).json({ error: "Invalid data body" });
    }
    const currentData = await getDB();
    const merged = { ...currentData, ...updatedData };
    await saveDB(merged);
    res.json({ success: true, db: merged });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Single keys saving helpers
app.post("/api/db/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const bodyData = req.body;
    const currentData = await getDB();
    
    if (!(key in currentData)) {
      return res.status(400).json({ error: `Key ${key} of database is not found` });
    }

    const updatedData = {
      ...currentData,
      [key]: bodyData
    };

    await saveDB(updatedData);
    res.json({ success: true, key, data: bodyData });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------
// Static Routing for Production Assets
// ----------------------------------------------------------------------
if (process.env.IS_DEV_API_SERVER !== "true") {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
