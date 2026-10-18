/**
 * Shared Formatters untuk mata uang Rupiah, tanggal lokal Indonesia,
 * dan slot waktu timeline.
 */

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/**
 * Memformat angka ke format Rupiah (contoh: Rp 1.500.000)
 */
export function formatRupiah(amount: number | null | undefined): string {
  return rupiahFormatter.format(amount || 0);
}

/**
 * Memformat tanggal ke format lokal Indonesia (contoh: Senin, 18 Oktober 2026)
 */
export function formatDateID(
  date: Date | string | null | undefined,
  includeWeekday: boolean = true
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(includeWeekday ? { weekday: "long" } : {}),
  };

  return d.toLocaleDateString("id-ID", options);
}

/**
 * Menghitung dan memformat rentang waktu dari array slot 30 menit
 * Contoh: ["08:00", "08:30"] -> "08:00 - 09:00 WIB (60 Menit)"
 */
export function formatSlotRange(slots: string[]): string {
  if (!slots || slots.length === 0) return "";
  const sorted = [...slots].sort();
  const startTime = sorted[0];
  const lastSlot = sorted[sorted.length - 1];
  const [lastH, lastM] = lastSlot.split(":").map(Number);
  let endH = lastH;
  let endM = lastM + 30;
  if (endM >= 60) {
    endH = (endH + 1) % 24;
    endM = endM - 60;
  }
  const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  const totalMinutes = sorted.length * 30;
  return `${startTime} - ${endTime} WIB (${totalMinutes} Menit)`;
}

/**
 * Mendapatkan rentang waktu untuk single slot 30 menit
 * Contoh: "08:00" -> "08:00 - 08:30"
 */
export function getSlotRangeText(slot: string): string {
  if (!slot) return "";
  const [lastH, lastM] = slot.split(":").map(Number);
  let endH = lastH;
  let endM = lastM + 30;
  if (endM >= 60) {
    endH = (endH + 1) % 24;
    endM = endM - 60;
  }
  return `${slot} - ${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

