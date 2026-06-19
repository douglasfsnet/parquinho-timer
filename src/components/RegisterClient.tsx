import React, { useState, useEffect } from "react";
import { Toy, PricingConfig, PricingType, ActiveClient } from "../types";
import { formatCurrency, calculateClientValue } from "../utils";
import { Baby, Phone, User, Clock, AlertTriangle, ShieldAlert, Sparkles, Check } from "lucide-react";

interface RegisterClientProps {
  toys: Toy[];
  activeClients: ActiveClient[];
  pricingConfig: PricingConfig;
  onRegister: (clientData: Omit<ActiveClient, "id" | "startTime" | "elapsedMs" | "isPaused" | "status" | "currentDurationMinutes" | "currentValue" | "createdAt">) => void;
  onClose: () => void;
}

export default function RegisterClient({
  toys,
  activeClients,
  pricingConfig,
  onRegister,
  onClose
}: RegisterClientProps) {
  const [childName, setChildName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [guardianName, setGuardianName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedToyId, setSelectedToyId] = useState("");
  const [pricingType, setPricingType] = useState<PricingType>("10_min");
  const [braceletNumber, setBraceletNumber] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [gender, setGender] = useState<"Menino" | "Menina">("Menino");
  const [showDetailedFields, setShowDetailedFields] = useState(false);

  // Set default selected toy on load
  useEffect(() => {
    if (toys.length > 0 && !selectedToyId) {
      setSelectedToyId(toys[0].id);
    }
  }, [toys, selectedToyId]);

  const selectedToy = toys.find(t => t.id === selectedToyId);
  
  // Calculate current capacity and if full
  const activeCountForToy = activeClients.filter(
    c => c.toyId === selectedToyId && c.status !== "finalizado" && c.status !== "cancelado"
  ).length;

  const isFull = selectedToy ? activeCountForToy >= selectedToy.capacityLimit : false;

  // Compute live price preview based on pricing structure
  const getSelectedMinutes = (): number => {
    switch (pricingType) {
      case "10_min": return 10;
      case "15_min": return 15;
      case "20_min": return 20;
      case "30_min": return 30;
      default: return 1; // display per minute base
    }
  };

  const currentRate = selectedToy ? selectedToy.valuePerMinute : pricingConfig.valuePerMinute;
  const estimatedPrice = calculateClientValue(getSelectedMinutes(), selectedToy, pricingConfig, pricingType);

  // Auto-generate bracelet number helper
  const handleRandomBracelet = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    setBraceletNumber(`P-${num}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showDetailedFields && !childName.trim()) return;
    if (!selectedToyId) return;
    if (isFull) {
      alert(`O brinquedo "${selectedToy?.name}" atingiu a capacidade máxima de ${selectedToy?.capacityLimit} crianças!`);
      return;
    }

    const finalName = showDetailedFields 
      ? childName.trim() 
      : (braceletNumber ? `${gender} #${braceletNumber}` : gender);

    onRegister({
      childName: finalName,
      age: showDetailedFields ? (Number(age) || 5) : 5,
      guardianName: showDetailedFields ? (guardianName.trim() || undefined) : undefined,
      phone: showDetailedFields ? (phone.trim() || undefined) : undefined,
      toyId: selectedToyId,
      pricingType,
      minuteQuota: pricingType !== "free_time" ? getSelectedMinutes() : undefined
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setChildName("");
      setAge("");
      setGuardianName("");
      setPhone("");
      setBraceletNumber("");
      onClose();
    }, 1200);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden max-w-xl mx-auto transition-theme animate-fade-in w-full">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between text-white">
        <div className="flex items-center space-x-2">
          <Baby className="h-5 w-5 sm:h-6 sm:w-6" />
          <h2 className="text-lg sm:text-xl font-display font-bold tracking-tight">Novo Registro de Criança</h2>
        </div>
        <button 
          onClick={onClose}
          type="button" 
          className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg text-sm transition-theme"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-200 dark:border-emerald-800/30 animate-bounce">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>
            <h3 className="text-xl font-display font-medium text-slate-800 dark:text-slate-100">Criança Registrada!</h3>
            <p className="text-sm text-slate-500 text-center">O cronômetro já está pronto para iniciar na lista ativa.</p>
          </div>
        ) : (
          <>
            {/* Selection between Dynamic Quick/Gender mode and Detailed Custom mode */}
            {!showDetailedFields ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 dark:text-slate-400 text-center">
                  Gênero da Criança <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Menino Button Card */}
                  <button
                    type="button"
                    onClick={() => setGender("Menino")}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                      gender === "Menino"
                        ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/10 scale-[1.02] shadow-sm"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <span className="text-4xl mb-1.5 filter drop-shadow-sm">👦</span>
                    <span className="font-display font-black text-sm uppercase tracking-wide">Menino</span>
                  </button>

                  {/* Menina Button Card */}
                  <button
                    type="button"
                    onClick={() => setGender("Menina")}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                      gender === "Menina"
                        ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-400 text-rose-600 dark:text-rose-300 ring-2 ring-rose-400/10 scale-[1.02] shadow-sm"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <span className="text-4xl mb-1.5 filter drop-shadow-sm">👧</span>
                    <span className="font-display font-black text-sm uppercase tracking-wide">Menina</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Child Info - Detailed Inputs */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 animate-fade-in">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 dark:text-slate-400">
                      Nome da Criança <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                      <input
                        type="text"
                        required={showDetailedFields}
                        placeholder="Ex: Maria Clara"
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-900 focus:outline-none text-slate-800 dark:text-slate-100 text-sm transition-theme"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 dark:text-slate-400">
                      Idade <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="17"
                      required={showDetailedFields}
                      placeholder="Anos"
                      value={age}
                      onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-900 focus:outline-none text-slate-800 dark:text-slate-100 text-sm transition-theme"
                    />
                  </div>
                </div>

                {/* Guardian & Phone - Detailed Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 dark:text-slate-400">
                      Responsável <span className="text-slate-400 text-[10px]">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Ana Silva"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-900 focus:outline-none text-slate-800 dark:text-slate-100 text-sm transition-theme"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 dark:text-slate-400">
                      Telefone <span className="text-slate-400 text-[10px]">(Opcional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-900 focus:outline-none text-slate-800 dark:text-slate-100 text-sm transition-theme"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Toggle Switch between Detailed or Simplified mode */}
            <div className="flex justify-center py-1">
              <button
                type="button"
                onClick={() => setShowDetailedFields(!showDetailedFields)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-theme flex items-center space-x-1.5 py-1.5 px-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-full border border-indigo-100 dark:border-indigo-900/30"
              >
                {showDetailedFields ? (
                  <span>⚡ Usar Preenchimento Rápido (Menino / Menina)</span>
                ) : (
                  <span>+ Adicionar Detalhes (Nome, Idade, Responsável...)</span>
                )}
              </button>
            </div>

            {/* Bracelet Simulation & Quick QR ID */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">Nº de Controle da Pulseira</span>
                <span className="text-[10px] text-slate-400 block mt-0.5 sm:mt-0">Identificação física por etiqueta ou pulseira</span>
              </div>
              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <input
                  type="text"
                  placeholder="Nº da Pulseira"
                  value={braceletNumber}
                  onChange={(e) => setBraceletNumber(e.target.value)}
                  className="w-24 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-center rounded-lg font-mono font-bold focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={handleRandomBracelet}
                  className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-lg text-xs font-medium transition-theme border border-blue-200/50 dark:border-blue-200/50"
                >
                  Gerar
                </button>
              </div>
            </div>

            {/* Toy Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 dark:text-slate-400">
                Escolha do Brinquedo <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {toys.map((toy) => {
                  const currentToyActiveCount = activeClients.filter(
                    c => c.toyId === toy.id && c.status !== "finalizado" && c.status !== "cancelado"
                  ).length;
                  const toyFull = currentToyActiveCount >= toy.capacityLimit;
                  const isSelected = selectedToyId === toy.id;

                  // Define dynamic background colors
                  const borderClass = isSelected 
                    ? "border-blue-500 ring-2 ring-blue-500 dark:ring-blue-900" 
                    : toyFull 
                      ? "border-rose-200 dark:border-rose-950 bg-rose-50/50 dark:bg-rose-950/10"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-950";

                  return (
                    <button
                      key={toy.id}
                      type="button"
                      onClick={() => setSelectedToyId(toy.id)}
                      className={`relative flex flex-col items-center justify-between p-2.5 sm:p-3 border rounded-xl text-center cursor-pointer transition-theme text-xs min-h-[5.5rem] ${borderClass}`}
                    >
                      {toyFull && (
                        <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white p-0.5 rounded-full z-10 animate-pulse">
                          <ShieldAlert className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <span className="font-display font-medium text-slate-800 dark:text-slate-100 text-ellipsis overflow-hidden whitespace-nowrap w-full text-[11px] sm:text-xs">
                        {toy.name}
                      </span>
                      <div className="flex flex-col items-center mt-1">
                        <span className={`text-[10px] font-mono ${toyFull ? "text-rose-600 dark:text-rose-400 font-bold" : "text-slate-500"}`}>
                          {currentToyActiveCount} / {toy.capacityLimit} c.
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          {formatCurrency(toy.valuePerMinute)}/m
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedToy && (
                <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs flex justify-between items-center text-slate-500 border border-slate-100 dark:border-slate-900">
                  <span>Capacidade para <strong>{selectedToy.name}</strong>:</span>
                  <div className="flex items-center space-x-1.5">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      isFull 
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300" 
                        : (activeCountForToy / selectedToy.capacityLimit) > 0.8
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300"
                    }`}>
                      {isFull ? "LOTADO" : `${activeCountForToy} / ${selectedToy.capacityLimit}`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Time Quota packages */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 dark:text-slate-400">
                Tempo Contratado
              </label>
              <div className="grid grid-cols-3 min-[480px]:grid-cols-5 gap-1.5">
                {(["10_min", "15_min", "20_min", "30_min", "free_time"] as PricingType[]).map((type) => {
                  const isSelected = pricingType === type;
                  const label = type === "free_time" ? "Livre" : type.replace("_min", " min");
                  
                  // Package values lookup helper
                  let packVal = 0;
                  if (type === "10_min") packVal = pricingConfig.pack10;
                  else if (type === "15_min") packVal = pricingConfig.pack15;
                  else if (type === "20_min") packVal = pricingConfig.pack20;
                  else if (type === "30_min") packVal = pricingConfig.pack30;

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPricingType(type)}
                      className={`py-2 px-1 text-center font-display border rounded-xl text-xs transition-theme ${
                        isSelected
                          ? "bg-blue-600 border-blue-600 text-white font-semibold"
                          : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-bold">{label}</div>
                      <div className={`text-[9px] mt-0.5 ${isSelected ? "text-white/90" : "text-slate-400"}`}>
                        {type === "free_time" ? "Minutos" : formatCurrency(packVal)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pricing Preview Summary banner */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950 dark:to-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Valor Estimado</span>
                <span className="font-display text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {formatCurrency(estimatedPrice)}
                </span>
              </div>
              <div className="text-right text-xs text-slate-500">
                <span className="flex items-center space-x-1 justify-end text-blue-600 dark:text-blue-400 font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {pricingType === "free_time" ? "Cobrado p/ minuto" : `${getSelectedMinutes()} minutos`}
                  </span>
                </span>
                <span className="block mt-0.5 text-[10px] text-slate-400">
                  Taxa brinquedo: {formatCurrency(currentRate)}/m
                </span>
              </div>
            </div>

            {/* Error notifications or Block list warnings */}
            {isFull && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start space-x-2 text-rose-700 dark:text-rose-300 text-xs">
                <AlertTriangle className="h-4.5 w-4.5 mt-0.5 flex-shrink-0 animate-pulse text-rose-500" />
                <div>
                  <span className="font-bold">Capacidade Máxima Atingida!</span>
                  <p className="mt-0.5 opacity-90">Não é possível registrar. Adicione as crianças a outro brinquedo ou aguarde a saída de algum cliente.</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 font-medium text-slate-700 dark:text-slate-300 rounded-xl text-sm transition-theme text-center"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={isFull || (showDetailedFields && !childName.trim())}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 sm:py-2.5 px-3 sm:px-4 font-display font-medium rounded-xl text-sm text-white transition-theme ${
                  isFull || (showDetailedFields && !childName.trim())
                    ? "bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-60 text-slate-500"
                    : "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10 hover:shadow-blue-500/20"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Registrar Criança</span>
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
