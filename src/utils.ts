import { Toy, PricingConfig, ActiveClient } from "./types";

// Play beautiful digital synth alarms for alerts
export function playAlertSound(type: "warning" | "danger") {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (type === "warning") {
      // Pleasant alert: dual gentle ping
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } else {
      // Danger alert: rapid triplet alarming beep
      const frequencies = [880, 880, 880];
      frequencies.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + index * 0.15);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + index * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + index * 0.15 + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + index * 0.15);
        osc.stop(audioCtx.currentTime + index * 0.15 + 0.12);
      });
    }
  } catch (error) {
    console.warn("Audio context not supported or not activated by user interaction yet.", error);
  }
}

// Trigger device vibration
export function triggerVibration(type: "warning" | "danger") {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    if (type === "warning") {
      navigator.vibrate([200, 100, 200]);
    } else {
      navigator.vibrate([400, 150, 400, 150, 400]);
    }
  }
}

// Helper: Calculate price based on duration and pricing table
export function calculateClientValue(
  durationMinutes: number,
  toy: Toy | undefined,
  pricing: PricingConfig,
  pricingType: string
): number {
  const customPerMinute = toy ? toy.valuePerMinute : pricing.valuePerMinute;
  
  switch (pricingType) {
    case "10_min":
      if (durationMinutes <= 10) return pricing.pack10;
      // Overtime charges per extra minute
      return pricing.pack10 + Math.max(0, durationMinutes - 10) * customPerMinute;
      
    case "15_min":
      if (durationMinutes <= 15) return pricing.pack15;
      return pricing.pack15 + Math.max(0, durationMinutes - 15) * customPerMinute;
      
    case "20_min":
      if (durationMinutes <= 20) return pricing.pack20;
      return pricing.pack20 + Math.max(0, durationMinutes - 20) * customPerMinute;
      
    case "30_min":
      if (durationMinutes <= 30) return pricing.pack30;
      return pricing.pack30 + Math.max(0, durationMinutes - 30) * customPerMinute;
      
    case "free_time":
    default:
      // Linear minutes charge
      return durationMinutes * customPerMinute;
  }
}

// Format duration: return simple minutes:seconds string or hour:min:sec
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (num: number) => num.toString().padStart(2, "0");
  
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

// Format currency standard Real
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Format date-time
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }) + " @ " + new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  });
}

// CSV Export Utility
export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(item => 
    headers.map(header => {
      let val = item[header];
      if (typeof val === "string") {
        val = val.replace(/"/g, '""');
        return `"${val}"`;
      }
      return val;
    }).join(",")
  );
  
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// TSV/Excel Export Utility (Saves as .xls compatible tab delimited table)
export function exportToExcel(data: any[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(item => 
    headers.map(header => item[header] ?? "").join("\t")
  );
  
  const excelContent = [headers.join("\t"), ...rows].join("\n");
  const blob = new Blob([excelContent], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
