export type UserRole = "Admin" | "Atendente" | "Operador";

export interface Toy {
  id: string;
  name: string;
  valuePerMinute: number;
  color: string; // Tailind class-friendly color name (e.g., 'emerald', 'indigo', 'amber')
  icon: string;  // Lucide icon name (e.g., 'Dice6', 'Infinity', 'Flame', 'Sparkles')
  capacityLimit: number;
}

export type PricingType = "10_min" | "15_min" | "20_min" | "30_min" | "free_time";

export interface PricingConfig {
  valuePerMinute: number;
  pack10: number; // custom values
  pack15: number;
  pack20: number;
  pack30: number;
}

export interface ActiveClient {
  id: string;
  childName: string;
  age: number;
  guardianName?: string;
  phone?: string;
  toyId: string;
  pricingType: PricingType;
  minuteQuota?: number; // minutes contract (e.g. 10, 15, 20, 30) - if free time, undefined
  
  // Timer attributes
  startTime: number; // millisecond timestamp of current segment start
  elapsedMs: number; // time accumulated in previous running segments
  isPaused: boolean;
  status: "em_andamento" | "pausado" | "finalizado" | "cancelado";
  
  // Financial calculation (updated live)
  currentDurationMinutes: number;
  currentValue: number;
  createdAt: number; // total start timestamp
}

export interface HistoryEntry {
  id: string;
  childName: string;
  age: number;
  guardianName?: string;
  phone?: string;
  toyName: string;
  pricingType: PricingType;
  entryTime: number; // timestamp
  exitTime: number;  // timestamp
  totalDurationMinutes: number;
  valueCharged: number;
  paymentMethod: "PIX" | "Dinheiro" | "Cartão" | "Vale";
  staffEmail: string;
  dateStr: string; // YYYY-MM-DD
}

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: number;
  password?: string;
}
