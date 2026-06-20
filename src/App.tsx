import React, { useState, useEffect, useRef } from "react";
import { ActiveClient, Toy, PricingConfig, HistoryEntry, UserRole, StaffUser } from "./types";
import Navbar from "./components/Navbar";
import RegisterClient from "./components/RegisterClient";
import ActiveClients from "./components/ActiveClients";
import HistoryList from "./components/HistoryList";
import ToySettings from "./components/ToySettings";
import Dashboard from "./components/Dashboard";
import { formatCurrency } from "./utils";
import { 
  Clock, 
  Baby, 
  Lock, 
  Key, 
  Sparkles, 
  UserCheck, 
  Users, 
  AlertTriangle,
  PlayCircle,
  TrendingUp,
  Award,
  CircleCheck,
  Smartphone
} from "lucide-react";

// Default seed data for pricing configuration
const DEFAULT_PRICING: PricingConfig = {
  valuePerMinute: 0.50,
  pack10: 5.00,
  pack15: 7.50,
  pack20: 10.00,
  pack30: 15.00
};

// Default seed data for Toys matching requested specifications
const DEFAULT_TOYS: Toy[] = [
  { id: "t1", name: "Piscina de Bolinhas", valuePerMinute: 0.50, color: "blue", icon: "Smile", capacityLimit: 15 },
  { id: "t2", name: "Escorregador", valuePerMinute: 0.50, color: "indigo", icon: "Flame", capacityLimit: 8 },
  { id: "t3", name: "Cama Elástica", valuePerMinute: 0.50, color: "rose", icon: "Compass", capacityLimit: 10 },
  { id: "t4", name: "Kid Play", valuePerMinute: 0.60, color: "amber", icon: "Smile", capacityLimit: 12 },
  { id: "t5", name: "Tombo Legal", valuePerMinute: 0.70, color: "emerald", icon: "Dice6", capacityLimit: 5 },
  { id: "t6", name: "Mini Futebol", valuePerMinute: 0.50, color: "teal", icon: "Flame", capacityLimit: 6 },
  { id: "t7", name: "Carrinhos", valuePerMinute: 0.80, color: "violet", icon: "Timer", capacityLimit: 4 }
];

export default function App() {
  // Staff User / Authentication State
  const [staffUser, setStaffUser] = useState<{ name: string; role: UserRole; email: string } | null>(null);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  
  // Login credentials states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Forgot password flow states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Active UI Tabs or Modals
  const [currentTab, setCurrentTab] = useState<"active" | "history" | "settings">("active");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Core Functional Database States (Synced Local & Cloud Database)
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(DEFAULT_PRICING);
  const [toys, setToys] = useState<Toy[]>([]);
  const [activeClients, setActiveClients] = useState<ActiveClient[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Track Cloud/Blob database connection state
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isBlobActive, setIsBlobActive] = useState(false);

  // Refs for tracking local edits (offline/hybrid synchronization)
  const deletedClientIds = useRef<Set<string>>(new Set());
  const localClientOverrides = useRef<Record<string, { isPaused: boolean; status: "em_andamento" | "pausado"; elapsedMs: number; startTime: number }>>({});

  // Read local theme registry on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("parquinho-theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }

    // Restore login session if cached
    const savedUser = localStorage.getItem("parquinho-staff-user");
    if (savedUser) {
      try {
        setStaffUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to restore user session", e);
      }
    }
  }, []);

  // Sync dark/light class on body elements
  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("parquinho-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  // Central database helper to save a specific collection key
  const saveKey = async (key: string, data: any) => {
    try {
      const res = await fetch(`/api/db/${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        console.error(`Failed to save key ${key} to server`);
      } else {
        setIsCloudConnected(true);
      }
    } catch (err) {
      console.warn(`Offline or server down while saving key ${key}`, err);
      setIsCloudConnected(false);
    }
  };

  // Bulk database helper to save multiple keys
  const saveMultipleKeys = async (data: Record<string, any>) => {
    try {
      const res = await fetch(`/api/db`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        console.error("Failed to save merged keys to server");
      } else {
        setIsCloudConnected(true);
      }
    } catch (err) {
      console.warn("Offline or server down while saving merged keys", err);
      setIsCloudConnected(false);
    }
  };

  const loadDatabase = async () => {
    try {
      // Add cache-busting parameter to force fresh data from server
      const res = await fetch(`/api/db?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setIsCloudConnected(true);
        setIsBlobActive(!!data.isBlobActive);
        
        if (data.toys) {
          setToys(data.toys);
          localStorage.setItem("cache-brinquedos", JSON.stringify(data.toys));
        } else {
          setToys(DEFAULT_TOYS);
        }
        
        if (data.activeClients) {
          const list = data.activeClients.filter((c: any) => !deletedClientIds.current.has(c.id));
          setActiveClients(list);
          localStorage.setItem("cache-clientes", JSON.stringify(list));
        }
        
        if (data.pricingConfig) {
          setPricingConfig(data.pricingConfig);
          localStorage.setItem("cache-pricing", JSON.stringify(data.pricingConfig));
        }
        
        if (data.history) {
          const sorted = data.history.sort((a: any, b: any) => b.exitTime - a.exitTime);
          setHistory(sorted);
          localStorage.setItem("cache-historico", JSON.stringify(sorted));
        }
        
        if (data.staffList) {
          setStaffList(data.staffList);
          localStorage.setItem("cache-[#staffList]", JSON.stringify(data.staffList));
        }
      } else {
        throw new Error("HTTP error: " + res.status);
      }
    } catch (error) {
      console.warn("Backend load error, using cache fallbacks", error);
      setIsCloudConnected(false);
      
      const cachedToys = localStorage.getItem("cache-brinquedos");
      const cachedClients = localStorage.getItem("cache-clientes");
      const cachedPricing = localStorage.getItem("cache-pricing");
      const cachedHistory = localStorage.getItem("cache-historico");
      const cachedStaff = localStorage.getItem("cache-[#staffList]");
      
      if (cachedToys) setToys(JSON.parse(cachedToys));
      else setToys(DEFAULT_TOYS);
      
      if (cachedClients) {
        const parsed = JSON.parse(cachedClients) as ActiveClient[];
        setActiveClients(parsed.filter(c => !deletedClientIds.current.has(c.id)));
      }
      
      if (cachedPricing) setPricingConfig(JSON.parse(cachedPricing));
      
      if (cachedHistory) setHistory(JSON.parse(cachedHistory));
      
      if (cachedStaff) setStaffList(JSON.parse(cachedStaff));
    }
  };

  // Initialize and load datasets using REST polling setup
  useEffect(() => {
    loadDatabase();
    // Reduced polling frequency: only check every 10 seconds instead of 3
    // This prevents constant re-renders from alternating between old/new data
    const interval = setInterval(() => {
      loadDatabase();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("Por favor, preencha todos os campos!");
      return;
    }

    const matched = staffList.find(
      (u) =>
        u.email.toLowerCase().trim() === loginEmail.toLowerCase().trim() &&
        u.password === loginPassword
    );

    if (matched) {
      const userObj = {
        name: matched.name,
        role: matched.role,
        email: matched.email
      };
      setStaffUser(userObj);
      localStorage.setItem("parquinho-staff-user", JSON.stringify(userObj));
      setLoginEmail("");
      setLoginPassword("");
      setLoginError("");
    } else {
      setLoginError("E-mail ou senha incorretos. Verifique suas credenciais!");
    }
  };

  const handleLogout = () => {
    setStaffUser(null);
    localStorage.removeItem("parquinho-staff-user");
  };

  // ----------------------------------------------------
  // STAFF MEMBERS (OPERATORS) REGISTRATION & TERMINATION
  // ----------------------------------------------------
  const handleAddStaff = async (newStaff: { name: string; email: string; password?: string; role: UserRole }) => {
    try {
      const docId = "staff_" + Date.now();
      const updatedStaffList = [...staffList, {
        id: docId,
        name: newStaff.name,
        email: newStaff.email.toLowerCase().trim(),
        password: newStaff.password || "123",
        role: newStaff.role,
        createdAt: Date.now()
      }];
      setStaffList(updatedStaffList);
      localStorage.setItem("cache-[#staffList]", JSON.stringify(updatedStaffList));
      await saveKey("staffList", updatedStaffList);
    } catch (e) {
      console.error("Failed to add user", e);
      alert("Erro ao salvar operador!");
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      if (id === "first_admin") {
        alert("Erro: O primeiro administrador do sistema não pode ser removido!");
        return;
      }
      const updated = staffList.filter(u => u.id !== id);
      setStaffList(updated);
      localStorage.setItem("cache-[#staffList]", JSON.stringify(updated));
      await saveKey("staffList", updated);
    } catch (e) {
      console.error("Failed to delete user", e);
      alert("Erro ao excluir operador!");
    }
  };

  const handleUpdateStaffPassword = async (id: string, newPassword: string) => {
    try {
      const updated = staffList.map(u => u.id === id ? { ...u, password: newPassword } : u);
      setStaffList(updated);
      localStorage.setItem("cache-[#staffList]", JSON.stringify(updated));
      await saveKey("staffList", updated);
      alert("Senha redefinida com sucesso!");
    } catch (e) {
      console.error("Failed to update password", e);
      alert("Erro ao atualizar a senha do operador!");
    }
  };

  const handlePasswordRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryMessage(null);

    const emailTrimmed = recoveryEmail.toLowerCase().trim();
    if (!emailTrimmed) {
      setRecoveryMessage({
        type: "error",
        text: "Por favor, digite um e-mail válido!"
      });
      return;
    }

    const matched = staffList.find(
      (u) => u.email.toLowerCase().trim() === emailTrimmed
    );

    if (matched) {
      setRecoveryMessage({
        type: "success",
        text: `Link de alteração de senha enviado com sucesso para ${matched.email} (Senha atual é "${matched.password}"). Verifique sua caixa de entrada.`
      });
    } else {
      setRecoveryMessage({
        type: "error",
        text: "Por favor, contate o administrador do sistema. E-mail não encontrado!"
      });
    }
  };

  // ----------------------------------------------------
  // CLIENT ADMISSION (NEW CLIENT REGISTRATION)
  // ----------------------------------------------------
  const handleRegisterClient = async (clientData: Omit<ActiveClient, "id" | "startTime" | "elapsedMs" | "isPaused" | "status" | "currentDurationMinutes" | "currentValue" | "createdAt">) => {
    const newClient: ActiveClient = {
      id: "client_" + Date.now(),
      ...clientData,
      startTime: Date.now(),
      elapsedMs: 0,
      isPaused: false,
      status: "em_andamento",
      currentDurationMinutes: 0,
      currentValue: 0,
      createdAt: Date.now()
    };

    const updated = [...activeClients, newClient];
    setActiveClients(updated);
    localStorage.setItem("cache-clientes", JSON.stringify(updated));

    try {
      await saveKey("activeClients", updated);
    } catch (e) {
      console.warn("Failed to write Active Clients list to server, using local fallback", e);
    }
  };

  // ----------------------------------------------------
  // PAUSE TIMER ACTION
  // ----------------------------------------------------
  const handlePauseClient = async (id: string, elapsedMs: number) => {
    // 1. Immediately update local override ref to protect snapshot updates
    localClientOverrides.current[id] = {
      isPaused: true,
      status: "pausado",
      elapsedMs,
      startTime: Date.now() // placeholder
    };

    // 2. Immediately update state and cache to respond instantly (0ms latency!)
    const updated = activeClients.map(c => {
      if (c.id === id) {
        return { ...c, elapsedMs, isPaused: true, status: "pausado" as const };
      }
      return c;
    });
    setActiveClients(updated);
    localStorage.setItem("cache-clientes", JSON.stringify(updated));

    // 3. Trigger write to server
    try {
      await saveKey("activeClients", updated);
    } catch (e) {
      console.warn("Could not pause client on server, using local update", e);
    }
  };

  // ----------------------------------------------------
  // RESUME TIMER ACTION
  // ----------------------------------------------------
  const handleResumeClient = async (id: string) => {
    const resumeTime = Date.now();
    
    // Find current client to check and inherit current elapsedMs
    const client = activeClients.find(c => c.id === id);
    const elapsed = client ? client.elapsedMs : 0;

    // 1. Immediately update local override ref to protect snapshot updates
    localClientOverrides.current[id] = {
      isPaused: false,
      status: "em_andamento",
      elapsedMs: elapsed,
      startTime: resumeTime
    };

    // 2. Immediately update state and cache for instant UI response
    const updated = activeClients.map(c => {
      if (c.id === id) {
        return { ...c, startTime: resumeTime, isPaused: false, status: "em_andamento" as const };
      }
      return c;
    });
    setActiveClients(updated);
    localStorage.setItem("cache-clientes", JSON.stringify(updated));

    // 3. Trigger write to server
    try {
      await saveKey("activeClients", updated);
    } catch (e) {
      console.warn("Could not resume client on server, using local update", e);
    }
  };

  // ----------------------------------------------------
  // FINALIZE CLIENT ACTION (BILLING ARCHIVE LOGS)
  // ----------------------------------------------------
  const handleFinalizeClient = async (
    id: string, 
    paymentMethod: "PIX" | "Dinheiro" | "Cartão" | "Vale", 
    finalValue: number, 
    finalMinutes: number
  ) => {
    const clientObj = activeClients.find(c => c.id === id);
    if (!clientObj) return;

    const matchedToyObj = toys.find(t => t.id === clientObj.toyId);

    const logRow: HistoryEntry = {
      id: "log_" + Date.now(),
      childName: clientObj.childName,
      age: clientObj.age,
      guardianName: clientObj.guardianName || "",
      phone: clientObj.phone || "",
      toyName: matchedToyObj?.name || "Brinquedo Apagado",
      pricingType: clientObj.pricingType,
      entryTime: clientObj.createdAt,
      exitTime: Date.now(),
      totalDurationMinutes: finalMinutes,
      valueCharged: finalValue,
      paymentMethod,
      staffEmail: staffUser?.email || "atendente_geral@parquinho.com",
      dateStr: new Date().toISOString().split("T")[0] // YYYY-MM-DD
    };

    // 1. Instantly mark client as deleted locally so card disappears immediately
    deletedClientIds.current.add(id);
    delete localClientOverrides.current[id];

    // 2. Instantly update active list and history state in UI & localStorage cache
    const updatedActive = activeClients.filter(c => c.id !== id);
    setActiveClients(updatedActive);
    localStorage.setItem("cache-clientes", JSON.stringify(updatedActive));

    const updatedLogs = [logRow, ...history];
    setHistory(updatedLogs);
    localStorage.setItem("cache-historico", JSON.stringify(updatedLogs));

    // 3. Trigger bulk save to server
    try {
      await saveMultipleKeys({
        activeClients: updatedActive,
        history: updatedLogs
      });
    } catch (e) {
      console.warn("Failed to finalize client on server", e);
    }
  };

  // ----------------------------------------------------
  // CANCEL CLIENT ACTION (DELETE TIMER)
  // ----------------------------------------------------
  const handleCancelClient = async (id: string) => {
    // 1. Instantly mark as deleted locally and remove from local overrides
    deletedClientIds.current.add(id);
    delete localClientOverrides.current[id];

    // 2. Instantly update React state and local storage cache
    const updatedActive = activeClients.filter(c => c.id !== id);
    setActiveClients(updatedActive);
    localStorage.setItem("cache-clientes", JSON.stringify(updatedActive));

    // 3. Trigger write to server
    try {
      await saveKey("activeClients", updatedActive);
    } catch (e) {
      console.warn("Could not cancel client on server", e);
    }
  };

  // ----------------------------------------------------
  // PRICING UPDATE ACTION
  // ----------------------------------------------------
  const handleUpdatePricing = async (updatedPrices: PricingConfig) => {
    setPricingConfig(updatedPrices);
    localStorage.setItem("cache-pricing", JSON.stringify(updatedPrices));

    try {
      await saveKey("pricingConfig", updatedPrices);
    } catch (e) {
      console.warn("Could not save pricing config to server", e);
    }
  };

  // ----------------------------------------------------
  // TOY ACTIONS (CREATE, EDIT, REMOVE)
  // ----------------------------------------------------
  const handleAddToy = async (newToy: Omit<Toy, "id">) => {
    const createdToy: Toy = {
      id: "toy_" + Date.now(),
      ...newToy
    };
    const updated = [...toys, createdToy];
    setToys(updated);
    localStorage.setItem("cache-brinquedos", JSON.stringify(updated));

    try {
      await saveKey("toys", updated);
    } catch (e) {
      console.warn("Could not save new toy to server", e);
    }
  };

  const handleUpdateToy = async (editedToy: Toy) => {
    const updated = toys.map(t => t.id === editedToy.id ? editedToy : t);
    setToys(updated);
    localStorage.setItem("cache-brinquedos", JSON.stringify(updated));

    try {
      await saveKey("toys", updated);
    } catch (e) {
      console.warn("Could not update toy on server", e);
    }
  };

  const handleDeleteToy = async (id: string) => {
    const updated = toys.filter(t => t.id !== id);
    setToys(updated);
    localStorage.setItem("cache-brinquedos", JSON.stringify(updated));

    try {
      await saveKey("toys", updated);
    } catch (e) {
      console.warn("Could not delete toy from server", e);
    }
  };

  // Live revenue summation helper for today focus
  const totalRevenueTodaySum = React.useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return history
      .filter(h => h.dateStr === todayStr)
      .reduce((acc, current) => acc + current.valueCharged, 0);
  }, [history]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 transition-theme flex flex-col justify-between">
      
      {/* 1. EMPLOYEE AUTHENTICATION COVER IF LOGGED OUT */}
      {!staffUser ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-[#0f1115] dark:to-[#15181e] transition-theme animate-fade-in py-12">
          
          <div className="max-w-md w-full bg-white dark:bg-[#1c1f26] border border-slate-200 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 transition-theme relative overflow-hidden">
            
            {/* Artistic decor sphere */}
            <div className="absolute -top-12 -left-12 h-26 w-26 bg-blue-500 rounded-full opacity-10 blur-2xl"></div>
            
            <div className="text-center space-y-2 relative">
              <div className="h-14 w-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/20">
                <Clock className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-display font-black text-slate-800 dark:text-white tracking-tight">
                🎡 Parquinho Timer
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Insira suas credenciais de operador cadastrado para iniciar o controle e caixa.</p>
            </div>

            {/* Error messaging state */}
            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-semibold text-center animate-shake">
                ⚠️ {loginError}
              </div>
            )}

            {/* Custom sign-in / forgot-password layout flow */}
            {isForgotPassword ? (
              <form onSubmit={handlePasswordRecovery} className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Recuperar Senha de Acesso</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed text-left">
                    Informe seu e-mail operacional cadastrado no sistema para receber o link de alteração / consulta de senha.
                  </p>
                </div>

                {recoveryMessage && (
                  <div className={`p-3 rounded-xl text-xs text-center font-medium ${
                    recoveryMessage.type === "success" 
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                      : "bg-rose-500/10 border border-rose-500/35 text-rose-400"
                  }`}>
                    {recoveryMessage.type === "success" ? "✨ " : "⚠️ "} {recoveryMessage.text}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    E-mail Cadastrado
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: douglasfsnet@gmail.com"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none text-slate-900 dark:text-white transition-theme text-xs"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-display font-bold rounded-xl text-xs transition-theme shadow-md shadow-indigo-500/10 cursor-pointer"
                  >
                    Enviar Link de Alteração
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setRecoveryMessage(null);
                    }}
                    className="w-full py-2 bg-transparent text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-white rounded-xl text-xs font-semibold transition-theme cursor-pointer"
                  >
                    Voltar ao Login
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <form onSubmit={handleCustomLogin} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      E-mail do Operador (E-mail)
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Ex: douglasfsnet@gmail.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white transition-theme text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 mr-auto">
                      Senha de Acesso
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white transition-theme text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-display font-bold rounded-xl text-xs transition-theme shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    Entrar no Caixa
                  </button>
                </form>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setRecoveryEmail("");
                      setRecoveryMessage(null);
                    }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-theme cursor-pointer"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      ) : (
        // 2. MAIN APPLICATION WORKSPACE
        <div className="flex-1 flex flex-col justify-between">
          
          {/* Main navigation Header */}
          <Navbar
            activeCount={activeClients.length}
            revenueToday={totalRevenueTodaySum}
            currentTab={currentTab}
            onTabChange={(tab) => {
              // Shield setting constraints
              if (tab === "settings" && staffUser.role !== "Admin") {
                alert("Acesso restrito: Apenas usuários de nível Administrador possuem acesso às configurações do parquinho!");
                return;
              }
              setCurrentTab(tab);
            }}
            onOpenRegister={() => setIsRegisterOpen(true)}
            staffUser={staffUser}
            onLogout={handleLogout}
            theme={theme}
            onToggleTheme={toggleTheme}
          />

          {/* Core Body Container based on selected navigation tab */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
            
            {/* Quick summary metrics panel (Top Banner Dashboard info) */}
            {currentTab === "active" && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                
                {/* Embedded quick summary analytics */}
                <div className="lg:col-span-3">
                  <ActiveClients
                    activeClients={activeClients}
                    toys={toys}
                    pricingConfig={pricingConfig}
                    onPause={handlePauseClient}
                    onResume={handleResumeClient}
                    onFinalize={handleFinalizeClient}
                    onCancel={handleCancelClient}
                  />
                </div>

                {/* Dashboard summary side pane (Caixa/Earnings stats widgets) */}
                <div className="space-y-6 lg:col-span-1">
                  
                  {/* Panel: Caixa do Dia */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-theme">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
                      Resumo Financeiro
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Active count details */}
                      <div>
                        <span className="text-[10px] text-slate-450 block">Clientes Ativos Agora</span>
                        <div className="text-2xl font-display font-black text-indigo-600 dark:text-indigo-400">
                          {activeClients.length} <span className="text-xs font-normal text-slate-400">brincando</span>
                        </div>
                      </div>

                      {/* Revenue Today */}
                      <div>
                        <span className="text-[10px] text-slate-450 block">Faturamento Total Hoje</span>
                        <div className="text-2xl font-display font-black text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(totalRevenueTodaySum)}
                        </div>
                      </div>

                      {/* Finished today count */}
                      <div>
                        <span className="text-[10px] text-slate-455 block">Atendimentos Consolidados</span>
                        <div className="text-base font-bold text-slate-700 dark:text-slate-350">
                          {history.filter(h => h.dateStr === new Date().toISOString().split("T")[0]).length} crianças encerradas
                        </div>
                      </div>

                      {/* Info on connection status */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-400">Banco Nuvem:</span>
                        <span className={`font-bold ${isCloudConnected ? "text-emerald-500" : "text-amber-500"}`}>
                          {isCloudConnected ? (isBlobActive ? "🎯 BLOB CLOUD ACTIVE" : "💻 LOCAL DB SERVER") : "📦 OFFLINE LOCAL CACHE"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Panel: Lotação dos Brinquedos real-time alert widgets */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-theme">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                      Lotação dos Brinquedos
                    </h3>

                    <div className="space-y-3 pt-1">
                      {toys.map((toy) => {
                        const count = activeClients.filter(c => c.toyId === toy.id).length;
                        const ratio = count / toy.capacityLimit;
                        
                        return (
                          <div key={toy.id} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{toy.name}</span>
                              <span className={`font-mono font-bold ${ratio >= 1 ? "text-rose-500" : "text-slate-500"}`}>
                                {count}/{toy.capacityLimit}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${ratio >= 1 ? "bg-rose-500" : ratio >= 0.8 ? "bg-amber-500" : "bg-blue-500"}`}
                                style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {currentTab === "history" && (
              <div className="space-y-6">
                {/* Embedded High Fidelity analytics dashboard */}
                <Dashboard
                  toys={toys}
                  history={history}
                  activeClients={activeClients}
                />
                
                {/* History list queries ledger tables */}
                <div className="pt-4">
                  <HistoryList
                    history={history}
                    toys={toys}
                  />
                </div>
              </div>
            )}

            {currentTab === "settings" && (
              <ToySettings
                toys={toys}
                pricingConfig={pricingConfig}
                onUpdatePricing={handleUpdatePricing}
                onAddToy={handleAddToy}
                onUpdateToy={handleUpdateToy}
                onDeleteToy={handleDeleteToy}
                staffList={staffList}
                onAddStaff={handleAddStaff}
                onDeleteStaff={handleDeleteStaff}
                onUpdateStaffPassword={handleUpdateStaffPassword}
                currentStaffUser={staffUser}
              />
            )}

          </main>

          {/* Footer branding */}
          <footer className="bg-white dark:bg-slate-900 border-t border-slate-150 dark:border-slate-800 py-4 text-center text-[11px] text-slate-400 transition-theme no-print">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <span>© {new Date().getFullYear()} Parquinho Timer Pro • v3.5 • Sistema de controle de parquinhos infantis por minuto</span>
              <div className="flex items-center space-x-1">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
                <span className="font-mono">Logado como {staffUser.name} ({staffUser.role})</span>
              </div>
            </div>
          </footer>

        </div>
      )}

      {/* 3. ADMIT NEW CLIENT REGISTER POPUP DRAWER OVERLAY */}
      {isRegisterOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-start sm:items-center justify-center overflow-y-auto p-2 sm:p-4 z-50 animate-fade-in no-print">
          <div className="max-w-xl w-full my-auto">
            <RegisterClient
              toys={toys}
              activeClients={activeClients}
              pricingConfig={pricingConfig}
              onRegister={handleRegisterClient}
              onClose={() => setIsRegisterOpen(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
}
