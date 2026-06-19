import React, { useState, useEffect, useRef } from "react";
import { ActiveClient, Toy, PricingConfig } from "../types";
import { formatDuration, formatCurrency, playAlertSound, triggerVibration, calculateClientValue } from "../utils";
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Smartphone, 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  BadgeHelp, 
  Wallet, 
  CreditCard, 
  Coins, 
  Bookmark, 
  Check,
  User,
  Tags
} from "lucide-react";

interface ActiveClientsProps {
  activeClients: ActiveClient[];
  toys: Toy[];
  pricingConfig: PricingConfig;
  onPause: (id: string, elapsed: number) => void;
  onResume: (id: string) => void;
  onFinalize: (id: string, paymentMethod: "PIX" | "Dinheiro" | "Cartão" | "Vale", finalValue: number, finalMinutes: number) => void;
  onCancel: (id: string) => void;
}

export default function ActiveClients({
  activeClients,
  toys,
  pricingConfig,
  onPause,
  onResume,
  onFinalize,
  onCancel
}: ActiveClientsProps) {
  // Local trigger state to force accurate re-render every second
  const [secondsTick, setSecondsTick] = useState(0);
  
  // Track children who already alerted to avoid annoying repeating beep beeps
  const warnedClientsRef = useRef<Record<string, { warned5Min: boolean; expired: boolean }>>({});

  // Checkout modal tracking structures
  const [checkoutClientId, setCheckoutClientId] = useState<string | null>(null);
  const [cancelingClientId, setCancelingClientId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<"PIX" | "Dinheiro" | "Cartão" | "Vale">("PIX");
  const [customValueOverride, setCustomValueOverride] = useState<string>("");

  const getMs = (val: any): number => {
    if (!val) return 0;
    if (typeof val === "number") return val;
    if (typeof val === "object" && val !== null) {
      if (typeof val.toMillis === "function") return val.toMillis();
      if (typeof val.seconds === "number") return val.seconds * 1000;
    }
    const parsed = Number(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsTick(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute live duration attributes for a child client
  const getClientCurrentState = (client: ActiveClient) => {
    let now = Date.now();
    let elapsed = getMs(client.elapsedMs);
    let start = getMs(client.startTime);
    let totalMs = elapsed;
    if (!client.isPaused) {
      totalMs += (now - start);
    }
    const durationSeconds = Math.max(0, Math.floor(totalMs / 1000));
    const durationMinutes = Math.floor(durationSeconds / 60);

    const toy = toys.find(t => t.id === client.toyId);
    
    // Live calculated price based on exact minutes used
    // Standard minute ceiling: if seconds > 0, we count as another started minute block (standard playground rule!)
    const ceilingMinutes = Math.max(1, Math.ceil(durationSeconds / 60));
    const liveValue = calculateClientValue(ceilingMinutes, toy, pricingConfig, client.pricingType);

    // Alert states
    let alertState: "normal" | "warning" | "danger" = "normal";
    let alertMessage = "";

    if (client.pricingType !== "free_time" && client.minuteQuota) {
      const remainingSeconds = (client.minuteQuota * 60) - durationSeconds;
      
      if (remainingSeconds <= 0) {
        alertState = "danger";
        alertMessage = "TEMPO ESGOTADO!";
        
        // Trigger alert only on state transition boundary
        if (!warnedClientsRef.current[client.id]?.expired) {
          playAlertSound("danger");
          triggerVibration("danger");
          if (!warnedClientsRef.current[client.id]) {
            warnedClientsRef.current[client.id] = { warned5Min: true, expired: true };
          } else {
            warnedClientsRef.current[client.id].expired = true;
          }
        }
      } else if (remainingSeconds <= 300) { // 5 minutes remaining trigger
        alertState = "warning";
        alertMessage = `Faltam ${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s`;
        
        if (!warnedClientsRef.current[client.id]?.warned5Min) {
          playAlertSound("warning");
          triggerVibration("warning");
          if (!warnedClientsRef.current[client.id]) {
            warnedClientsRef.current[client.id] = { warned5Min: true, expired: false };
          } else {
            warnedClientsRef.current[client.id].warned5Min = true;
          }
        }
      }
    } else {
      // Free time linear notifications
      alertState = "normal";
      alertMessage = "Tempo Livre";
    }

    return {
      durationSeconds,
      ceilingMinutes,
      liveValue,
      alertState,
      alertMessage,
      toy
    };
  };

  const handlePauseToggle = (client: ActiveClient) => {
    if (client.isPaused) {
      onResume(client.id);
    } else {
      let now = Date.now();
      let elapsed = getMs(client.elapsedMs);
      let start = getMs(client.startTime);
      let totalMs = elapsed + (now - start);
      onPause(client.id, totalMs);
    }
  };

  const openCheckout = (client: ActiveClient) => {
    const { ceilingMinutes, liveValue } = getClientCurrentState(client);
    setCheckoutClientId(client.id);
    setCustomValueOverride(liveValue.toFixed(2));
    setSelectedPayment("PIX");
  };

  const confirmCheckout = () => {
    if (!checkoutClientId) return;
    const client = activeClients.find(c => c.id === checkoutClientId);
    if (!client) return;

    const { ceilingMinutes } = getClientCurrentState(client);
    const finalizedVal = parseFloat(customValueOverride) || 0;
    
    onFinalize(checkoutClientId, selectedPayment, finalizedVal, ceilingMinutes);
    setCheckoutClientId(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Search Header indicator */}
      <div className="flex items-center justify-between no-print">
        <h2 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
          <Activity className="h-5 w-5 text-indigo-500 animate-pulse" />
          <span>Controle de Clientes Ativos</span>
        </h2>
        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-xs rounded-full font-bold">
          {activeClients.length} crianças brincando
        </span>
      </div>

      {activeClients.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center transition-theme">
          <div className="h-12 w-12 bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="h-6 w-6" />
          </div>
          <h3 className="text-slate-700 dark:text-slate-300 font-display font-medium text-base">Nenhum brinquedo em uso</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Use o botão "Novo Cliente" acima para registrar uma criança e iniciar o cronômetro correspondente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeClients.map((client) => {
            const { durationSeconds, ceilingMinutes, liveValue, alertState, alertMessage, toy } = getClientCurrentState(client);
            
            // Generate visual style wrappers based on countdown alert state
            let borderStyle = "border-slate-200 dark:border-slate-800";
            let bgHeaderStyle = toy?.color === "rose" ? "from-rose-500 to-rose-600" 
              : toy?.color === "amber" ? "from-amber-500 to-amber-600" 
              : toy?.color === "emerald" ? "from-emerald-500 to-emerald-600"
              : toy?.color === "teal" ? "from-teal-500 to-teal-600"
              : toy?.color === "indigo" ? "from-indigo-500 to-indigo-600"
              : "from-blue-500 to-blue-600";
            
            let pulseBadge = "";

            if (alertState === "danger") {
              borderStyle = "border-rose-400 dark:border-rose-900 border-2 shadow-lg shadow-rose-500/5";
              pulseBadge = "bg-rose-500 text-white animate-pulse font-black";
            } else if (alertState === "warning") {
              borderStyle = "border-amber-400 dark:border-amber-900 border-2";
              pulseBadge = "bg-amber-500 text-slate-950 font-bold";
            } else {
              pulseBadge = client.isPaused 
                ? "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400" 
                : "bg-emerald-500 text-white font-medium";
            }

            return (
              <div 
                key={client.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl shadow-sm transition-theme overflow-hidden flex flex-col justify-between ${borderStyle}`}
              >
                {/* Visual Header Toy Banner */}
                <div className={`p-4 bg-gradient-to-r ${bgHeaderStyle} text-white relative`}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-extrabold tracking-widest text-white/95">Brinquedo</span>
                      <h4 className="text-base sm:text-lg font-display font-black tracking-tight uppercase bg-white/15 dark:bg-black/20 px-2.5 py-1 rounded-xl border border-white/15 inline-flex items-center shadow-inner">
                        <span className="text-amber-300 mr-1 animate-pulse">⚡</span>
                        {toy?.name || "Sem Brinquedo"}
                      </h4>
                    </div>
                    {/* Time Alert status indicator tag */}
                    <span className={`text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider ${pulseBadge}`}>
                      {client.isPaused ? "⏸ PAUSADO" : alertMessage || "● Ativo"}
                    </span>
                  </div>

                  {/* Child's profile */}
                  <div className="mt-4 flex items-center space-x-3">
                    <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center text-xl shadow-inner font-bold border border-white/20 select-none">
                      {client.childName?.toLowerCase().includes("menino") 
                        ? "👦" 
                        : client.childName?.toLowerCase().includes("menina") 
                        ? "👧" 
                        : client.age <= 5 ? "👦" : client.age <= 10 ? "👧" : "🧒"}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-display font-medium text-base leading-tight truncate">{client.childName}</h3>
                      <p className="text-[11px] text-white/80 font-mono">
                        {client.age} anos {client.phone ? `• Tel: ${client.phone}` : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Live Timers Info Metrics row */}
                <div className="p-4 grid grid-cols-2 gap-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tempo Decorrido</span>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <Clock className={`h-4.5 w-4.5 ${client.isPaused ? "text-slate-400" : "text-emerald-500 animate-spin-slow"}`} />
                      <span className="text-xl font-mono font-black text-slate-800 dark:text-slate-100">
                        {formatDuration(durationSeconds)}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {client.pricingType === "free_time" ? "Minutos corridos" : `Meta: ${client.minuteQuota} min`}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valor Acumulado</span>
                    <span className="text-xl font-display font-black text-slate-800 dark:text-slate-100 block mt-0.5">
                      {formatCurrency(liveValue)}
                    </span>
                    <span className="text-[9px] text-indigo-500 font-mono font-bold uppercase tracking-wide block">
                      {ceilingMinutes} {ceilingMinutes === 1 ? "min cobrado" : "min cobrados"}
                    </span>
                  </div>
                </div>

                {/* Guardian Details footer info if exists */}
                {client.guardianName && (
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/60 text-[11px] text-slate-500 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-medium truncate flex items-center space-x-1">
                      <User className="h-3 w-3 text-slate-400" />
                      <span>Resp: <strong>{client.guardianName}</strong></span>
                    </span>
                    {client.phone && <span className="font-mono text-slate-400">{client.phone}</span>}
                  </div>
                )}

                {/* Operations Control buttons */}
                <div className="p-3 bg-white dark:bg-slate-900 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handlePauseToggle(client)}
                    className={`flex items-center justify-center space-x-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-theme ${
                      client.isPaused 
                        ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" 
                        : "bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                    }`}
                  >
                    {client.isPaused ? (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Continuar</span>
                      </>
                    ) : (
                      <>
                        <Pause className="h-3.5 w-3.5 fill-current" />
                        <span>Pausar</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => openCheckout(client)}
                    className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-theme shadow-sm hover:shadow"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Finalizar</span>
                  </button>

                  <button
                    onClick={() => setCancelingClientId(client.id)}
                    className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 rounded-xl text-xs font-semibold transition-theme cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Cancelar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Checkout Payment Drawer/Modal overlay */}
      {checkoutClientId && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transition-theme">
            
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wallet className="h-5 w-5" />
                <h3 className="font-display font-bold text-base">Fechamento de Conta</h3>
              </div>
              <button 
                onClick={() => setCheckoutClientId(null)}
                className="text-white/80 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              
              {/* Profile Details of checkout kid */}
              {(() => {
                const client = activeClients.find(c => c.id === checkoutClientId);
                if (!client) return null;
                const { ceilingMinutes, liveValue, toy } = getClientCurrentState(client);
                
                return (
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cliente</div>
                      <div className="font-display font-bold text-base text-slate-800 dark:text-slate-100">
                        {client.childName} <span className="text-xs font-normal text-slate-400">({client.age} anos)</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Brinquedo: <strong>{toy?.name}</strong> • Tempo total: <strong>{ceilingMinutes} minutos</strong>
                      </div>
                    </div>

                    {/* Set billing overrides */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Valor Cobrado (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={customValueOverride}
                        onChange={(e) => setCustomValueOverride(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-mono text-xl font-bold rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-theme"
                      />
                      <span className="text-[10px] text-slate-400 block">
                        Cálculo automático do sistema: <strong className="font-mono text-slate-600 dark:text-slate-300">{formatCurrency(liveValue)}</strong>
                      </span>
                    </div>

                    {/* Payment methods picker buttons */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Forma de Pagamento
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { name: "PIX", icon: Wallet, desc: "Transferência instantânea" },
                          { name: "Dinheiro", icon: Coins, desc: "Cédulas em caixa" },
                          { name: "Cartão", icon: CreditCard, desc: "Crédito ou Débito" },
                          { name: "Vale", icon: Tags, desc: "Cupom ou Convênio" }
                        ] as const).map((method) => {
                          const isSel = selectedPayment === method.name;
                          const IconComp = method.icon;
                          
                          return (
                            <button
                              key={method.name}
                              type="button"
                              onClick={() => setSelectedPayment(method.name)}
                              className={`p-3 border rounded-xl flex items-center space-x-2.5 text-left transition-theme ${
                                isSel
                                  ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20 text-blue-700 dark:text-blue-300 font-bold"
                                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              <IconComp className="h-4.5 w-4.5 text-slate-400 flex-shrink-0" />
                              <div className="overflow-hidden">
                                <div className="text-xs leading-none">{method.name}</div>
                                <span className="text-[9px] text-slate-400 font-normal truncate block mt-0.5">{method.desc}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Total billing checkout notice */}
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 p-3.5 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Total Pago</span>
                        <div className="font-display font-black text-2xl text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(parseFloat(customValueOverride) || 0)}
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-slate-400 font-mono">
                        PAGO VIA {selectedPayment.toUpperCase()}
                      </div>
                    </div>

                    {/* Action controls */}
                    <div className="flex space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setCheckoutClientId(null)}
                        className="flex-1 py-2.5 px-4 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 font-medium text-slate-700 dark:text-slate-300 rounded-xl text-xs transition-theme text-center"
                      >
                        Recusar
                      </button>
                      <button
                        type="button"
                        onClick={confirmCheckout}
                        className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold rounded-xl text-xs transition-theme shadow-md shadow-emerald-500/10"
                      >
                        <Check className="h-4 w-4 stroke-[2.5]" />
                        <span>Confirmar Pagamento</span>
                      </button>
                    </div>

                  </div>
                );
              })()}

            </div>

          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancelingClientId && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transition-theme">
            
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-4 text-white flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 animate-bounce" />
              <h3 className="font-display font-bold text-base">Confirmar Cancelamento</h3>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed">
                Tem certeza de que gostaria de cancelar o timer de{" "}
                <strong className="text-slate-800 dark:text-slate-100 font-bold">
                  {activeClients.find((c) => c.id === cancelingClientId)?.childName || "este cliente"}
                </strong>
                ?
              </p>
              <p className="text-xs text-rose-500 dark:text-rose-455 font-semibold bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-lg border border-rose-100/50 dark:border-rose-950/50">
                ⚠️ Esta ação removerá o cronômetro do cliente ativo sem registrar nada no faturamento. Esta ação não poderá ser desfeita!
              </p>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelingClientId(null)}
                  className="flex-1 py-2.5 px-4 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 font-medium text-slate-700 dark:text-slate-300 rounded-xl text-xs transition-theme text-center cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = cancelingClientId;
                    setCancelingClientId(null);
                    onCancel(id);
                  }}
                  className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-display font-bold rounded-xl text-xs transition-theme shadow-md shadow-rose-500/10 cursor-pointer text-center"
                >
                  Confirmar Cancelamento
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
