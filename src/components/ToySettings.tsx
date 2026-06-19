import React, { useState } from "react";
import { Toy, PricingConfig, StaffUser, UserRole } from "../types";
import { formatCurrency } from "../utils";
import { 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  RotateCcw, 
  Dice6, 
  Flame, 
  Compass, 
  Smile, 
  Timer, 
  Tag, 
  Coins, 
  ShieldAlert,
  Info,
  Users,
  UserCheck,
  Mail,
  Lock
} from "lucide-react";

interface ToySettingsProps {
  toys: Toy[];
  pricingConfig: PricingConfig;
  onUpdatePricing: (pricing: PricingConfig) => void;
  onAddToy: (toy: Omit<Toy, "id">) => void;
  onUpdateToy: (toy: Toy) => void;
  onDeleteToy: (id: string) => void;
  staffList: StaffUser[];
  onAddStaff: (newStaff: { name: string; email: string; password?: string; role: UserRole }) => void;
  onDeleteStaff: (id: string) => void;
  onUpdateStaffPassword: (id: string, newPassword: string) => void;
  currentStaffUser: { name: string; role: UserRole; email: string } | null;
}

export default function ToySettings({
  toys,
  pricingConfig,
  onUpdatePricing,
  onAddToy,
  onUpdateToy,
  onDeleteToy,
  staffList = [],
  onAddStaff,
  onDeleteStaff,
  onUpdateStaffPassword,
  currentStaffUser
}: ToySettingsProps) {
  // Staff registration states
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRole, setStaffRole] = useState<UserRole>("Atendente");

  // Inline staff password edit states
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState("");

  // Pricing tab state
  const [minRateInput, setMinRateInput] = useState(pricingConfig.valuePerMinute.toString());
  const [pack10Input, setPack10Input] = useState(pricingConfig.pack10.toString());
  const [pack15Input, setPack15Input] = useState(pricingConfig.pack15.toString());
  const [pack20Input, setPack20Input] = useState(pricingConfig.pack20.toString());
  const [pack30Input, setPack30Input] = useState(pricingConfig.pack30.toString());

  // Edit toy modal / states
  const [editingToyId, setEditingToyId] = useState<string | null>(null);
  const [toyNameInput, setToyNameInput] = useState("");
  const [toyRateInput, setToyRateInput] = useState("");
  const [toyCapacityInput, setToyCapacityInput] = useState("");
  const [toyColor, setToyColor] = useState("blue");
  const [toyIcon, setToyIcon] = useState("Smile");

  // Add new toy state triggers
  const [isAddingNew, setIsAddingNew] = useState(false);

  const colorsList = ["blue", "indigo", "rose", "amber", "emerald", "teal", "violet"];
  const iconsList = ["Smile", "Dice6", "Flame", "Compass", "Timer", "Tag"];

  // Handle saving general global pricing tables
  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePricing({
      valuePerMinute: parseFloat(minRateInput) || 0.5,
      pack10: parseFloat(pack10Input) || 5.0,
      pack15: parseFloat(pack15Input) || 7.5,
      pack20: parseFloat(pack20Input) || 10.0,
      pack30: parseFloat(pack30Input) || 15.0
    });
    alert("Tabela de preços atualizada com sucesso!");
  };

  // Start editing single toy fields
  const startEditingToy = (toy: Toy) => {
    setEditingToyId(toy.id);
    setToyNameInput(toy.name);
    setToyRateInput(toy.valuePerMinute.toString());
    setToyCapacityInput(toy.capacityLimit.toString());
    setToyColor(toy.color);
    setToyIcon(toy.icon);
    setIsAddingNew(false);
  };

  const handleSaveToyEdit = () => {
    if (!toyNameInput.trim()) return;
    
    if (editingToyId) {
      onUpdateToy({
        id: editingToyId,
        name: toyNameInput.trim(),
        valuePerMinute: parseFloat(toyRateInput) || 0.5,
        capacityLimit: parseInt(toyCapacityInput) || 15,
        color: toyColor,
        icon: toyIcon
      });
      setEditingToyId(null);
    } else if (isAddingNew) {
      onAddToy({
        name: toyNameInput.trim(),
        valuePerMinute: parseFloat(toyRateInput) || 0.5,
        capacityLimit: parseInt(toyCapacityInput) || 15,
        color: toyColor,
        icon: toyIcon
      });
      setIsAddingNew(false);
    }

    // Reset fields
    setToyNameInput("");
    setToyRateInput("");
    setToyCapacityInput("");
    setToyColor("blue");
    setToyIcon("Smile");
  };

  const handleCancelToyEdit = () => {
    setEditingToyId(null);
    setIsAddingNew(false);
    setToyNameInput("");
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffEmail.trim() || !staffPassword.trim()) {
      alert("Por favor, preencha todos os campos do operador!");
      return;
    }
    
    // Check if email already exists
    const emailExists = staffList.some(
      (u) => u.email.toLowerCase().trim() === staffEmail.toLowerCase().trim()
    );
    if (emailExists) {
      alert("Erro: Este e-mail já está cadastrado no sistema!");
      return;
    }

    onAddStaff({
      name: staffName.trim(),
      email: staffEmail.toLowerCase().trim(),
      password: staffPassword,
      role: staffRole
    });

    // Reset fields
    setStaffName("");
    setStaffEmail("");
    setStaffPassword("");
    setStaffRole("Atendente");
    alert("Operador cadastrado com sucesso no banco de dados!");
  };

  return (
    <div className="space-y-8 animate-fade-in no-print">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
          <Settings className="h-5 w-5 text-indigo-500" />
          <span>Configurações do Parquinho</span>
        </h2>
        <p className="text-xs text-slate-500">Defina o cadastro de brinquedos, taxas por minuto e pacotes de tempo contratado.</p>
      </div>

      {/* Grid: Global Rates & Toy Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Global Pricing Tables */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-theme">
          <div className="flex items-center space-x-2 border-b border-slate-150 dark:border-slate-800 pb-3 mb-4">
            <Coins className="h-4.5 w-4.5 text-blue-600" />
            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100">
              Taxa Base & Pacotes de Tempo
            </h3>
          </div>

          <form onSubmit={handleSavePricing} className="space-y-4">
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 dark:text-slate-400">
                Valor padrão por minuto (R$) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={minRateInput}
                onChange={(e) => setMinRateInput(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-100 transition-theme"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Pacote 10 min (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={pack10Input}
                  onChange={(e) => setPack10Input(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Pacote 15 min (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={pack15Input}
                  onChange={(e) => setPack15Input(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Pacote 20 min (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={pack20Input}
                  onChange={(e) => setPack20Input(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Pacote 30 min (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={pack30Input}
                  onChange={(e) => setPack30Input(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-theme cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Salvar Tabela de Preços</span>
              </button>
            </div>
          </form>

          <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl flex items-start space-x-2 text-slate-500 text-xs">
            <Info className="h-4.5 w-4.5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <span>ℹ Cálculo de excedente:</span>
              <p className="mt-0.5 font-normal text-slate-450 leading-relaxed">
                As frações de minuto excedentes do tempo livre ou de pacotes encerrados são cobradas linearmente utilizando a taxa base por minuto configurada no brinquedo.
              </p>
            </div>
          </div>
        </div>

        {/* Toys configuration manager list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-theme space-y-4">
          <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Dice6 className="h-4.5 w-4.5 text-indigo-500" />
              <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100">
                Cadastro de Brinquedos ({toys.length})
              </h3>
            </div>
            
            {!editingToyId && !isAddingNew && (
              <button
                onClick={() => {
                  setIsAddingNew(true);
                  setEditingToyId(null);
                  setToyNameInput("");
                  setToyRateInput(pricingConfig.valuePerMinute.toString());
                  setToyCapacityInput("15");
                  setToyColor("blue");
                  setToyIcon("Smile");
                }}
                className="flex items-center space-x-1 py-1 px-2 text-xs bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-semibold rounded-lg transition-theme cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Novo Brinquedo</span>
              </button>
            )}
          </div>

          {/* Add/Edit dynamic component inline overlay inside settings list */}
          {(editingToyId || isAddingNew) && (
            <div className="p-4 border border-indigo-200 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-950/20 rounded-xl space-y-4 animate-fade-in">
              <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
                {isAddingNew ? "➕ Cadastrar Novo Brinquedo" : "✏ Editar Atributos do Brinquedo"}
              </h4>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Nome do Brinquedo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Piscina de Bolinhas"
                    value={toyNameInput}
                    onChange={(e) => setToyNameInput(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Taxa Minuto (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.50"
                    value={toyRateInput}
                    onChange={(e) => setToyRateInput(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Lotação Máxima</label>
                  <input
                    type="number"
                    placeholder="15"
                    value={toyCapacityInput}
                    onChange={(e) => setToyCapacityInput(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Color Selector */}
                <div className="col-span-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Cor Temática</span>
                  <div className="flex flex-wrap gap-1.5">
                    {colorsList.map((c) => {
                      const colorsMap: Record<string, string> = {
                        blue: "bg-blue-500",
                        indigo: "bg-indigo-500",
                        rose: "bg-rose-500",
                        amber: "bg-amber-500",
                        emerald: "bg-emerald-500",
                        teal: "bg-teal-500",
                        violet: "bg-violet-500"
                      };
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setToyColor(c)}
                          className={`h-6 w-6 rounded-full flex items-center justify-center p-0.5 border border-white cursor-pointer ${colorsMap[c]} ${toyColor === c ? "ring-2 ring-slate-800 dark:ring-white scale-110" : "scale-100 opacity-80"}`}
                        >
                          {toyColor === c && <div className="h-1.5 w-1.5 bg-white rounded-full"></div>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Icon Selector list */}
                <div className="col-span-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Categoria de Ícone</span>
                  <div className="flex flex-wrap gap-2 text-slate-500">
                    {iconsList.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setToyIcon(ic)}
                        className={`px-2.5 py-1.5 border rounded-lg text-xs flex items-center space-x-1.5 transition-theme bg-white dark:bg-slate-950 ${toyIcon === ic ? "border-indigo-600 text-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/20" : "border-slate-200 dark:border-slate-800 hover:border-slate-350"}`}
                      >
                        <span className="text-[10px]">{ic}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelToyEdit}
                  className="flex-1 py-1.5 px-3 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveToyEdit}
                  className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  Salvar Brinquedo
                </button>
              </div>
            </div>
          )}

          {/* Table display list of registered toys */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {toys.map((toy) => (
              <div
                key={toy.id}
                className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-display font-bold text-slate-800 dark:text-slate-100">{toy.name}</span>
                    <span className={`h-2.5 w-2.5 rounded-full bg-${toy.color}-500`} style={{
                      backgroundColor: toy.color === 'rose' ? '#f43f5e' 
                        : toy.color === 'amber' ? '#f59e0b' 
                        : toy.color === 'emerald' ? '#10b981' 
                        : toy.color === 'teal' ? '#14b8a6' 
                        : toy.color === 'indigo' ? '#6366f1' 
                        : toy.color === 'violet' ? '#8b5cf6' 
                        : '#3b82f6'
                    }}></span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    Lotação: <strong>{toy.capacityLimit} kids</strong> • Taxa: <strong>{formatCurrency(toy.valuePerMinute)}/min</strong> • Ícone: {toy.icon}
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => startEditingToy(toy)}
                    className="p-1 px-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-xs"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Tem certeza que deseja apagar o brinquedo "${toy.name}"?`)) {
                        onDeleteToy(toy.id);
                      }
                    }}
                    className="p-1 px-2 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg text-xs"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}

            {toys.length === 0 && (
              <p className="text-xs text-slate-400 py-6 text-center italic">Não há brinquedos cadastrados.</p>
            )}
          </div>

        </div>

      </div>

      {/* Team Management Portal Container (Responsive Board) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-theme mt-6">
        <div className="flex items-center space-x-2 border-b border-slate-150 dark:border-slate-800 pb-3 mb-4">
          <Users className="h-4.5 w-4.5 text-indigo-500" />
          <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100">
            Controle de Equipe de Operação
          </h3>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Registration form */}
          <div className="xl:col-span-1 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-850 space-y-4">
            <h4 className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest block mb-1">
              Cadastrar Novo Operador
            </h4>
            
            <form onSubmit={handleSaveStaff} className="space-y-3.5">
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pedro Santos"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">E-mail (Login)</label>
                <input
                  type="email"
                  required
                  placeholder="pedro@parquinho.com"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Senha de Acesso</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: senha123"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Cargo / Role</label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as UserRole)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <option value="Atendente">Atendente (Cadastro de timers e checkout)</option>
                  <option value="Operador">Apoio (Operação de timers e monitoramento)</option>
                  <option value="Admin">Administrador (Controle total de finanças/equipes)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Salvar Operador de Equipe
              </button>
            </form>
          </div>

          {/* List of active team members */}
          <div className="xl:col-span-2 space-y-3">
            <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block header pb-1">
              Operadores Cadastrados ({staffList.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
              {staffList.map((operator) => {
                const isFirstAdmin = operator.id === "first_admin";
                const isSelf = currentStaffUser?.email === operator.email;
                
                return (
                  <div 
                    key={operator.id} 
                    className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-slate-800 dark:text-slate-100 text-xs flex items-center space-x-1.5">
                          <span>{operator.name}</span>
                          {isSelf && (
                            <span className="px-1 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded text-[8px] font-mono">Eu</span>
                          )}
                        </div>

                        {operator.role === "Admin" ? (
                          <span className="px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-150 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-[8px] font-bold uppercase rounded">Administrador</span>
                        ) : operator.role === "Atendente" ? (
                          <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-150 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-[8px] font-bold uppercase rounded">Atendente</span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-150 dark:border-blue-900 text-blue-700 dark:text-blue-400 text-[8px] font-bold uppercase rounded">Apoio (Operador)</span>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-400 mt-1 font-mono">{operator.email}</div>
                      {editingStaffId === operator.id ? (
                        <div className="text-[10px] text-slate-450 mt-1.5 bg-white dark:bg-slate-900 p-1 px-2 border border-slate-100 dark:border-slate-850 rounded flex items-center space-x-1">
                          <span className="shrink-0 font-semibold text-indigo-600 dark:text-indigo-400">Nova Senha:</span>
                          <input
                            type="text"
                            value={tempPassword}
                            onChange={(e) => setTempPassword(e.target.value)}
                            className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-800 dark:text-slate-100 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!tempPassword.trim()) {
                                alert("A senha não pode estar em branco!");
                                return;
                              }
                              onUpdateStaffPassword(operator.id, tempPassword.trim());
                              setEditingStaffId(null);
                            }}
                            className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-bold cursor-pointer transition-theme"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingStaffId(null)}
                            className="px-1.5 py-0.5 bg-slate-500 hover:bg-slate-600 text-white rounded text-[9px] cursor-pointer transition-theme"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-450 mt-1.5 bg-white dark:bg-slate-900 p-1 px-2 border border-slate-100 dark:border-slate-850 rounded flex items-center justify-between">
                          <span>
                            Chave Senha: <strong className="font-mono text-indigo-500 dark:text-indigo-400">{operator.password}</strong>
                          </span>
                          {currentStaffUser?.role === "Admin" && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStaffId(operator.id);
                                setTempPassword(operator.password);
                              }}
                              className="text-[9px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline font-bold transition-theme cursor-pointer"
                            >
                              Alterar
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-850 flex justify-between items-center text-[9px] text-[#9CA3AF]">
                      <span>Criado: {new Date(operator.createdAt || Date.now()).toLocaleDateString("pt-BR")}</span>
                      {isFirstAdmin ? (
                        <span className="text-amber-500 font-bold lowercase italic">primeiro admin</span>
                      ) : (
                        <button
                          onClick={() => {
                            if (isSelf) {
                              alert("Não é possível remover seu próprio usuário logado!");
                              return;
                            }
                            if (confirm(`Tem certeza que deseja remover o funcionário "${operator.name}"?`)) {
                              onDeleteStaff(operator.id);
                            }
                          }}
                          type="button"
                          className="text-rose-600 hover:text-white hover:bg-rose-600 rounded p-0.5 px-1.5 border border-rose-200 dark:border-rose-900"
                        >
                          Revogar Acesso
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
