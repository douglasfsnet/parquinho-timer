import { put } from "@vercel/blob";

const token = "vercel_blob_rw_BjZzYeSXm2Xrc5hW_BrN1ZqgQYYKX8i2xQ7LsXOvbLd5g6K";

const dbData = {
  toys: [
    { id: "t1", name: "Piscina de Bolinhas", valuePerMinute: 0.50, color: "blue", icon: "Smile", capacityLimit: 15 },
    { id: "t2", name: "Escorregador", valuePerMinute: 0.50, color: "indigo", icon: "Flame", capacityLimit: 8 },
    { id: "t3", name: "Cama Elástica", valuePerMinute: 0.50, color: "rose", icon: "Compass", capacityLimit: 10 },
    { id: "t4", name: "Kid Play", valuePerMinute: 0.60, color: "amber", icon: "Smile", capacityLimit: 12 },
    { id: "t5", name: "Tombo Legal", valuePerMinute: 0.70, color: "emerald", icon: "Dice6", capacityLimit: 5 },
    { id: "t6", name: "Mini Futebol", valuePerMinute: 0.50, color: "teal", icon: "Flame", capacityLimit: 6 },
    { id: "t7", name: "Carrinhos", valuePerMinute: 0.80, color: "violet", icon: "Timer", capacityLimit: 4 }
  ],
  activeClients: [],
  pricingConfig: {
    valuePerMinute: 0.50,
    pack10: 5.00,
    pack15: 7.50,
    pack20: 10.00,
    pack30: 15.00
  },
  history: [],
  staffList: [
    {
      id: "first_admin",
      name: "Douglas Silva",
      email: "douglasfsnet@gmail.com",
      password: "dfsnet23",
      role: "Admin",
      createdAt: Date.now()
    }
  ]
};

async function updateBlob() {
  try {
    console.log("Conectando ao Vercel Blob...");
    const blob = await put("parquinho_database.json", JSON.stringify(dbData, null, 2), {
      access: "public",
      addRandomSuffix: false,
      token
    });
    console.log("✅ Dados atualizados com sucesso no Vercel Blob!");
    console.log("URL:", blob.url);
  } catch (error) {
    console.error("❌ Erro ao atualizar Blob:", error);
    process.exit(1);
  }
}

updateBlob();
