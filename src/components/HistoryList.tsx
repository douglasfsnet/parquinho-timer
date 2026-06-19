import React, { useState, useMemo } from "react";
import { HistoryEntry, Toy } from "../types";
import { formatCurrency, formatDateTime, exportToCSV, exportToExcel } from "../utils";
import { 
  Search, 
  Calendar, 
  Dribbble, 
  Trash2, 
  ArrowDownToLine, 
  Coins, 
  User, 
  FileSpreadsheet, 
  Printer, 
  Tag, 
  Smartphone,
  Sparkles
} from "lucide-react";

interface HistoryListProps {
  history: HistoryEntry[];
  toys: Toy[];
}

export default function HistoryList({ history, toys }: HistoryListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedToyName, setSelectedToyName] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Filter logs reactively based on user search triggers
  const filteredHistory = useMemo(() => {
    return history.filter((log) => {
      // 1. Search term (matches child name, guardian name, or phone number)
      const matchesSearch = 
        log.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.guardianName && log.guardianName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.phone && log.phone.includes(searchTerm));

      // 2. Toy filter
      const matchesToy = selectedToyName === "" || log.toyName === selectedToyName;

      // 3. Date filter (compares YYYY-MM-DD)
      const matchesDate = selectedDate === "" || log.dateStr === selectedDate;

      return matchesSearch && matchesToy && matchesDate;
    });
  }, [history, searchTerm, selectedToyName, selectedDate]);

  // Aggregate stats derived purely from filtered subsets
  const aggregatedStats = useMemo(() => {
    const totalCount = filteredHistory.length;
    const totalVal = filteredHistory.reduce((sum, h) => sum + h.valueCharged, 0);
    const avgDuration = totalCount > 0 
      ? Math.round(filteredHistory.reduce((sum, h) => sum + h.totalDurationMinutes, 0) / totalCount)
      : 0;
    
    return { totalCount, totalVal, avgDuration };
  }, [filteredHistory]);

  // Exporters
  const handleCSVExport = () => {
    if (filteredHistory.length === 0) return;
    const reportData = filteredHistory.map(h => ({
      "Criança": h.childName,
      "Idade": h.age,
      "Responsável": h.guardianName ?? "-",
      "Telefone": h.phone ?? "-",
      "Brinquedo": h.toyName,
      "Entrada": new Date(h.entryTime).toLocaleTimeString("pt-BR"),
      "Saída": new Date(h.exitTime).toLocaleTimeString("pt-BR"),
      "Duração Minutos": h.totalDurationMinutes,
      "Parquinho Valor R$": h.valueCharged,
      "Pagamento": h.paymentMethod,
      "Operador": h.staffEmail,
      "Data": h.dateStr
    }));
    exportToCSV(reportData, `parquinho-historico-filtrado-${new Date().toISOString().split("T")[0]}.csv`);
  };

  const handleExcelExport = () => {
    if (filteredHistory.length === 0) return;
    const reportData = filteredHistory.map(h => ({
      "Criança": h.childName,
      "Idade": h.age,
      "Responsável": h.guardianName ?? "-",
      "Telefone": h.phone ?? "-",
      "Brinquedo": h.toyName,
      "Entrada": new Date(h.entryTime).toLocaleTimeString("pt-BR"),
      "Saída": new Date(h.exitTime).toLocaleTimeString("pt-BR"),
      "Duração Minutos": h.totalDurationMinutes,
      "Valor Recebido R$": h.valueCharged,
      "Pagamento": h.paymentMethod,
      "Operador": h.staffEmail,
      "Data": h.dateStr
    }));
    exportToExcel(reportData, `parquinho-historico-filtrado-${new Date().toISOString().split("T")[0]}.xls`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header section with description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 no-print">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <Coins className="h-5 w-5 text-indigo-500" />
            <span>Histórico de Atendimento ({filteredHistory.length})</span>
          </h2>
          <p className="text-xs text-slate-500">Consulte relatórios de saídas, formas de pagamento, e filtre os registros.</p>
        </div>

        {/* Dynamic metrics indicators in header */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleCSVExport}
            disabled={filteredHistory.length === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg transition-theme"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExcelExport}
            disabled={filteredHistory.length === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 disabled:opacity-50 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-lg transition-theme"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Excel (.XLS)</span>
          </button>
          <button
            onClick={handlePrint}
            disabled={filteredHistory.length === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold text-xs rounded-lg transition-theme"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Aggregate metrics box */}
      <div className="grid grid-cols-3 gap-4 border border-slate-200 dark:border-slate-800 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 shadow-sm">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Sessões Filtradas</span>
          <span className="text-lg md:text-xl font-display font-black text-slate-800 dark:text-slate-100 block mt-0.5">
            {aggregatedStats.totalCount} <span className="text-xs font-normal text-slate-400">crianças</span>
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Valor Arrecadado</span>
          <span className="text-lg md:text-xl font-display font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
            {formatCurrency(aggregatedStats.totalVal)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Estada Média</span>
          <span className="text-lg md:text-xl font-display font-black text-indigo-600 dark:text-indigo-400 block mt-0.5">
            {aggregatedStats.avgDuration} <span className="text-xs font-normal text-slate-400">minutos</span>
          </span>
        </div>
      </div>

      {/* Search and Filters row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">
        {/* Name/Phone search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome ou celular..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-100 transition-theme"
          />
        </div>

        {/* Toy filter dropdown */}
        <div className="relative">
          <select
            value={selectedToyName}
            onChange={(e) => setSelectedToyName(e.target.value)}
            className="w-full px-4 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700 dark:text-slate-200 transition-theme appearance-none cursor-pointer"
          >
            <option value="">Filtrar todos os brinquedos</option>
            {toys.map((t) => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
          <div className="absolute right-3 top-3 h-2 w-2 border-r border-b border-slate-400 transform rotate-45 pointer-events-none"></div>
        </div>

        {/* Date filter picker */}
        <div className="relative flex items-center">
          <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700 dark:text-slate-200 transition-theme cursor-pointer"
          />
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-theme shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-5 py-3">👧 Criança</th>
                <th className="px-5 py-3">🎡 Brinquedo</th>
                <th className="px-5 py-3">⏱ Duração</th>
                <th className="px-5 py-3">💵 Valor Cobrado</th>
                <th className="px-5 py-3">💳 Forma</th>
                <th className="px-5 py-3">📅 Horários</th>
                <th className="px-5 py-3 text-right">✍ Atendente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs text-slate-700 dark:text-slate-300">
              {filteredHistory.map((item) => {
                
                // Color mapping for payment badges
                let paymentBadge = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                if (item.paymentMethod === "PIX") {
                  paymentBadge = "bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 font-bold";
                } else if (item.paymentMethod === "Dinheiro") {
                  paymentBadge = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 font-bold";
                } else if (item.paymentMethod === "Cartão") {
                  paymentBadge = "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 font-bold";
                } else if (item.paymentMethod === "Vale") {
                  paymentBadge = "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 font-bold";
                }

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-theme">
                    {/* Kid Profile Name and Guardian info column */}
                    <td className="px-5 py-3.5">
                      <div className="font-display font-bold text-slate-800 dark:text-slate-100">
                        {item.childName}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {item.age} anos {item.guardianName ? `• Resp: ${item.guardianName}` : ""} {item.phone ? `• Tel: ${item.phone}` : ""}
                      </span>
                    </td>

                    {/* Toy Name */}
                    <td className="px-5 py-3.5 font-medium text-slate-600 dark:text-slate-300">
                      {item.toyName}
                    </td>

                    {/* Total Duration minutes */}
                    <td className="px-5 py-3.5 font-mono font-semibold">
                      {item.totalDurationMinutes} min
                    </td>

                    {/* Fee Charged */}
                    <td className="px-5 py-3.5 font-display font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatCurrency(item.valueCharged)}
                    </td>

                    {/* Payment Method Badge */}
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-mono tracking-wide ${paymentBadge}`}>
                        {item.paymentMethod}
                      </span>
                    </td>

                    {/* Timestamps */}
                    <td className="px-5 py-3.5 text-[10px] text-slate-400">
                      <span className="block">Entrada: <strong>{new Date(item.entryTime).toLocaleTimeString("pt-BR", {hour: "2-digit", minute:"2-digit"})}</strong></span>
                      <span className="block">Saída: <strong>{new Date(item.exitTime).toLocaleTimeString("pt-BR", {hour: "2-digit", minute:"2-digit"})}</strong> ({new Date(item.exitTime).toLocaleDateString("pt-BR")})</span>
                    </td>

                    {/* Staff operator email */}
                    <td className="px-5 py-3.5 text-right font-mono text-[10px] text-slate-400 max-w-[120px] truncate">
                      {item.staffEmail.split("@")[0]}
                    </td>
                  </tr>
                );
              })}

              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400 italic">
                    Nenhum registro encontrado correspondente aos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
