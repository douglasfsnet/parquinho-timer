import React from "react";
import { UserRole } from "../types";
import { formatCurrency } from "../utils";
import { 
  Clock, 
  Baby, 
  History, 
  Settings, 
  Sun, 
  Moon, 
  UserCheck, 
  ChevronDown, 
  PlusCircle, 
  LogOut, 
  TrendingUp, 
  Sparkles,
  Award
} from "lucide-react";

interface NavbarProps {
  activeCount: number;
  revenueToday: number;
  currentTab: "active" | "history" | "settings";
  onTabChange: (tab: "active" | "history" | "settings") => void;
  onOpenRegister: () => void;
  staffUser: { name: string; role: UserRole; email: string } | null;
  onLogout: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function Navbar({
  activeCount,
  revenueToday,
  currentTab,
  onTabChange,
  onOpenRegister,
  staffUser,
  onLogout,
  theme,
  onToggleTheme
}: NavbarProps) {
  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-theme no-print shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo Brand Identity */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/10">
              <Clock className="h-5.5 w-5.5" />
            </div>
            <div>
              <span className="font-display font-black text-slate-800 dark:text-white tracking-tight flex items-center space-x-1">
                <span>Parquinho Timer</span>
                <span className="h-1.5 w-1.5 bg-yellow-400 rounded-full animate-ping"></span>
              </span>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">Playground Manager</p>
            </div>
          </div>

          {/* Quick Metrics (Ativos e Faturamento) */}
          <div className="hidden md:flex items-center space-x-6 text-xs">
            {/* Clientes em atendimento */}
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-orange-50 dark:bg-orange-950/20 text-orange-600 flex items-center justify-center">
                <Baby className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Clientes Em Atendimento</span>
                <span className="text-sm font-display font-black text-slate-850 dark:text-slate-100">
                  {activeCount} ativos
                </span>
              </div>
            </div>

            {/* Faturamento */}
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Arrecadado Hoje</span>
                <span className="text-sm font-display font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(revenueToday)}
                </span>
              </div>
            </div>
          </div>

          {/* Core Menu controls & Switch theme */}
          <div className="flex items-center space-x-4">
            
            {/* Dark Mode Switcher */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-205 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer transition-theme"
              title={theme === "light" ? "Mudar para Escuro" : "Mudar para Claro"}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
            </button>

            {/* Custom register trigger button */}
            <button
              onClick={onOpenRegister}
              className="flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-display font-bold py-1.5 px-3.5 rounded-lg text-xs transition-theme shadow-md shadow-blue-500/10 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Novo Cliente</span>
            </button>

            {/* Staff Employee Profile box */}
            {staffUser && (
              <div className="flex items-center space-x-2 border-l border-slate-200 dark:border-slate-800 pl-4 h-8">
                <div className="hidden sm:block text-right">
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">
                    {staffUser.name}
                  </span>
                  <span className="text-[9px] text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-bold font-mono">
                    {staffUser.role}
                  </span>
                </div>
                
                {/* Switch Role / Exit employee */}
                <button
                  onClick={onLogout}
                  className="p-1 px-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded-lg text-xs transition-theme cursor-pointer"
                  title="Trocar operador do caixa"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Secondary Submenu Tab control links */}
      <div className="border-t border-slate-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex space-x-6 h-11 items-center font-display text-xs">
            <button
              onClick={() => onTabChange("active")}
              className={`flex items-center space-x-1 py-3 border-b-2 font-bold px-1 transition-theme cursor-pointer ${
                currentTab === "active"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <Baby className="h-3.5 w-3.5" />
              <span>Clientes Ativos</span>
            </button>

            <button
              onClick={() => onTabChange("history")}
              className={`flex items-center space-x-1 py-3 border-b-2 font-bold px-1 transition-theme cursor-pointer ${
                currentTab === "history"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Histórico de Atendimento</span>
            </button>

            {/* Configs are only accessible to Administration */}
            <button
              onClick={() => onTabChange("settings")}
              className={`flex items-center space-x-1 py-3 border-b-2 font-bold px-1 transition-theme cursor-pointer ${
                currentTab === "settings"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Configurações</span>
              {staffUser?.role !== "Admin" && (
                <span className="text-[8px] bg-slate-100 dark:bg-slate-850 px-1 py-0.5 rounded font-mono text-slate-400 uppercase font-black tracking-widest pl-1">ADMIN ONLY</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
