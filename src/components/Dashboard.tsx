import React, { useMemo } from "react";
import { Toy, HistoryEntry, ActiveClient } from "../types";
import { formatCurrency, exportToCSV, exportToExcel } from "../utils";
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Sparkles, 
  Coins, 
  Smartphone, 
  Printer, 
  FileSpreadsheet, 
  ListOrdered,
  CalendarDays,
  ShoppingBag,
  CircleCheck,
  ShieldCheck,
  ArrowRightLeft
} from "lucide-react";

interface DashboardProps {
  toys: Toy[];
  history: HistoryEntry[];
  activeClients: ActiveClient[];
}

export default function Dashboard({ toys, history, activeClients }: DashboardProps) {
  // Compute aggregate metrics
  const todayStats = useMemo(() => {
    // Current date string YYYY-MM-DD
    const todayStr = new Date().toISOString().split("T")[0];
    const todayLogs = history.filter(h => h.dateStr === todayStr);

    const totalActive = activeClients.length;
    const totalRevenueToday = todayLogs.reduce((acc, curr) => acc + curr.valueCharged, 0);
    const totalFinishedCount = todayLogs.length;

    // Calculate average duration today
    const totalDuration = todayLogs.reduce((acc, curr) => acc + curr.totalDurationMinutes, 0);
    const averageDuration = totalFinishedCount > 0 ? Math.round(totalDuration / totalFinishedCount) : 0;

    // Toy popularity rank
    const toyCounts: Record<string, number> = {};
    const toyRevenue: Record<string, number> = {};
    
    // Seed records with 0 for each toy
    toys.forEach(t => {
      toyCounts[t.name] = 0;
      toyRevenue[t.name] = 0;
    });

    todayLogs.forEach(log => {
      toyCounts[log.toyName] = (toyCounts[log.toyName] || 0) + 1;
      toyRevenue[log.toyName] = (toyRevenue[log.toyName] || 0) + log.valueCharged;
    });

    // Find favorite toy
    let favoriteToyName = "Nenhum hoje";
    let favoriteToyCount = 0;
    Object.entries(toyCounts).forEach(([name, count]) => {
      if (count > favoriteToyCount) {
        favoriteToyCount = count;
        favoriteToyName = name;
      }
    });

    // Find highest faturamento toy
    let topEarnerToyName = "Nenhum hoje";
    let maxToyRevenue = 0;
    Object.entries(toyRevenue).forEach(([name, rev]) => {
      if (rev > maxToyRevenue) {
        maxToyRevenue = rev;
        topEarnerToyName = name;
      }
    });

    // Payment methods division
    const payments = { PIX: 0, Dinheiro: 0, Cartão: 0, Vale: 0 };
    todayLogs.forEach(log => {
      if (payments[log.paymentMethod] !== undefined) {
        payments[log.paymentMethod] += log.valueCharged;
      }
    });

    return {
      totalActive,
      totalRevenueToday,
      totalFinishedCount,
      averageDuration,
      favoriteToy: `${favoriteToyName} (${favoriteToyCount} atendimentos)`,
      topEarnerToy: `${topEarnerToyName} (${formatCurrency(maxToyRevenue)})`,
      toyCounts,
      toyRevenue,
      paymentSummary: payments
    };
  }, [toys, history, activeClients]);

  // Handler to print metrics directly
  const handlePrint = () => {
    window.print();
  };

  // Handler to export historical reports details
  const handleExportCSV = () => {
    const reportData = history.map(h => ({
      "Criança": h.childName,
      "Idade": h.age,
      "Responsável": h.guardianName ?? "-",
      "Telefone": h.phone ?? "-",
      "Brinquedo": h.toyName,
      "Forma de Cobrança": h.pricingType === "free_time" ? "Tempo Livre" : "Pacote",
      "Entrada": new Date(h.entryTime).toLocaleTimeString("pt-BR"),
      "Saída": new Date(h.exitTime).toLocaleTimeString("pt-BR"),
      "Duração Minutos": h.totalDurationMinutes,
      "Valor Cobrado (R$)": h.valueCharged,
      "Pagamento": h.paymentMethod,
      "Data": h.dateStr
    }));
    exportToCSV(reportData, `parquinho-historico-relatorio-${new Date().toISOString().split("T")[0]}.csv`);
  };

  const handleExportExcel = () => {
    const reportData = history.map(h => ({
      "Criança": h.childName,
      "Idade": h.age,
      "Responsável": h.guardianName ?? "-",
      "Telefone": h.phone ?? "-",
      "Brinquedo": h.toyName,
      "Forma de Cobrança": h.pricingType === "free_time" ? "Tempo Livre" : "Pacote",
      "Entrada": new Date(h.entryTime).toLocaleTimeString("pt-BR"),
      "Saída": new Date(h.exitTime).toLocaleTimeString("pt-BR"),
      "Duração Minutos": h.totalDurationMinutes,
      "Valor Cobrado (R$)": h.valueCharged,
      "Pagamento": h.paymentMethod,
      "Data": h.dateStr
    }));
    exportToExcel(reportData, `parquinho-relatorio-${new Date().toISOString().split("T")[0]}.xls`);
  };

  // Chart data formatting max items
  const maxToyRevenueVal = Math.max(...(Object.values(todayStats.toyRevenue) as number[]), 1);
  const maxToyCountVal = Math.max(...(Object.values(todayStats.toyCounts) as number[]), 1);

  return (
    <div className="space-y-6">
      {/* Upper header section for report actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <Coins className="h-5 w-5 text-blue-600" />
            <span>Painel Financeiro & Dashboard</span>
          </h2>
          <p className="text-xs text-slate-500">Métricas financeiras do dia atual e relatórios consolidados.</p>
        </div>

        {/* Export and Print actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-theme border border-slate-200 dark:border-slate-700"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimir Dashboard</span>
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-lg transition-theme border border-emerald-100 dark:border-emerald-900/50"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Exportar CSV</span>
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-lg transition-theme border border-blue-100 dark:border-blue-900/50"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Planilha Excel (.XLS)</span>
          </button>
        </div>
      </div>

      {/* Main KPI metric cards container */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI: Revenue today */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-sm transition-theme relative overflow-hidden">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Faturamento Diário</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl md:text-2xl font-display font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(todayStats.totalRevenueToday)}
            </span>
            <div className="h-8 w-8 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/20 rounded-lg flex items-center justify-center text-emerald-600">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-2 block">Somatória de atendimentos fechados hoje.</span>
          <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full opacity-10"></div>
        </div>

        {/* KPI: Registered and Attended count */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-sm transition-theme relative overflow-hidden">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Atendimentos Hoje</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl md:text-2xl font-display font-black text-blue-600 dark:text-blue-400">
              {todayStats.totalFinishedCount} <span className="text-xs font-normal text-slate-400">crianças</span>
            </span>
            <div className="h-8 w-8 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/20 rounded-lg flex items-center justify-center text-blue-600">
              <CircleCheck className="h-4.5 w-4.5" />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-2 block">Crianças que brincaram e saíram hoje.</span>
        </div>

        {/* KPI: Average stay duration */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-sm transition-theme relative overflow-hidden">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tempo Médio Brincado</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl md:text-2xl font-display font-black text-amber-600 dark:text-amber-400">
              {todayStats.averageDuration} <span className="text-xs font-normal text-slate-400">min</span>
            </span>
            <div className="h-8 w-8 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/20 rounded-lg flex items-center justify-center text-amber-600">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-2 block">Duração média das sessões finalizadas.</span>
        </div>

        {/* KPI: Active count */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-sm transition-theme relative overflow-hidden">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clientes em Aberto</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl md:text-2xl font-display font-black text-indigo-600 dark:text-indigo-400">
              {todayStats.totalActive} <span className="text-xs font-normal text-slate-400">ativos</span>
            </span>
            <div className="h-8 w-8 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/20 rounded-lg flex items-center justify-center text-indigo-600">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-2 block">Crianças correndo no parquinho agora.</span>
        </div>
      </div>

      {/* Highlights metrics cards - Toy leaders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Leading Toy by counts / traffic */}
        <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-blue-955/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/40 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1.5">
            <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              🔥 Brinquedo Mais Popular
            </span>
            <h4 className="text-slate-900 dark:text-white font-display font-black text-lg tracking-tight">
              {todayStats.favoriteToy}
            </h4>
            <p className="text-xs text-slate-700 dark:text-slate-200 font-medium font-sans leading-relaxed">
              Brinquedo preferido com o maior fluxo acumulado de crianças.
            </p>
          </div>
          <div className="p-3 bg-blue-100/80 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-2xl shadow-sm flex-shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>

        {/* Leading Toy by revenue earnings */}
        <div className="bg-gradient-to-r from-emerald-50/70 to-teal-50/70 dark:from-emerald-955/20 dark:to-teal-950/20 border border-emerald-100 dark:border-emerald-900/40 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1.5">
            <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              💰 Maior Faturamento Diário
            </span>
            <h4 className="text-slate-900 dark:text-white font-display font-black text-lg tracking-tight">
              {todayStats.topEarnerToy}
            </h4>
            <p className="text-xs text-slate-700 dark:text-slate-200 font-medium font-sans leading-relaxed">
              Atração que gerou a maior renda bruta no caixa hoje.
            </p>
          </div>
          <div className="p-3 bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-2xl shadow-sm flex-shrink-0">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* SVG Interactive Visual Charts (Highly responsive, zero dependency, React-19 compatible) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Chart 1: Revenue per toy */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-theme">
          <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-4 flex items-center space-x-1">
            <span>🔹 Faturamento Líquido por Brinquedo (Hoje)</span>
          </h3>
          
          <div className="space-y-4">
            {(Object.entries(todayStats.toyRevenue) as [string, number][]).map(([toyName, revenue]) => {
              const pct = (revenue / maxToyRevenueVal) * 100;
              return (
                <div key={toyName} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-semibold">{toyName}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(revenue)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(todayStats.toyRevenue).length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-6">Cadastre brinquedos para visualizar estatísticas.</p>
            )}
          </div>
        </div>

        {/* Chart 2: Children traffic counts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-theme">
          <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-4 flex items-center space-x-1">
            <span>🔹 Fluxo de Crianças Atendidas</span>
          </h3>
          
          <div className="space-y-4">
            {(Object.entries(todayStats.toyCounts) as [string, number][]).map(([toyName, count]) => {
              const pct = (count / maxToyCountVal) * 100;
              return (
                <div key={toyName} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-semibold">{toyName}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {count} {count === 1 ? "criança" : "crianças"}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(todayStats.toyCounts).length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-6">Cadastre brinquedos para visualizar estatísticas.</p>
            )}
          </div>
        </div>
      </div>

      {/* Payment methods billing distribution summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-theme">
        <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-4">
          🔹 Faturamento por Forma de Pagamento (Hoje)
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(Object.entries(todayStats.paymentSummary) as [string, number][]).map(([method, amount]) => {
            const colors = {
              PIX: "border-teal-200 dark:border-teal-950 bg-teal-50/50 dark:bg-teal-950/10 text-teal-700 dark:text-teal-400",
              Dinheiro: "border-emerald-200 dark:border-emerald-950 bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400",
              Cartão: "border-indigo-200 dark:border-indigo-950 bg-indigo-50/50 dark:bg-indigo-950/10 text-indigo-700 dark:text-indigo-400",
              Vale: "border-purple-200 dark:border-purple-950 bg-purple-50/50 dark:bg-purple-950/10 text-purple-700 dark:text-purple-400"
            };
            const col = colors[method as keyof typeof colors] || "border-slate-200 bg-slate-50";

            return (
              <div key={method} className={`border rounded-xl p-3 flex flex-col justify-between ${col}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{method}</span>
                <span className="font-display font-bold text-lg mt-1 block">
                  {formatCurrency(amount)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
