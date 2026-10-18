"use client";

import React, { useState, useMemo } from "react";
import { Plus, Mic, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatRupiah, formatSlotRange, getSlotRangeText } from "@/shared/lib/formatters";
import { EVENT_TIME_SLOTS } from "@/shared/constants/timeline";
import { addEventGuestStar } from "../../actions";
import type { EventGuestStarData, EventTimelineItemData } from "../../types";

interface AddGuestStarDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventDetailId: string;
  durationDays: number;
  timelineItems: EventTimelineItemData[];
  isDummyUser?: boolean;
  onShowDemoWarning?: () => void;
  onGuestStarAdded: (guestStar: EventGuestStarData, timelineItem?: EventTimelineItemData) => void;
}

export function AddGuestStarDialog({
  isOpen,
  onOpenChange,
  eventDetailId,
  durationDays,
  timelineItems,
  isDummyUser,
  onShowDemoWarning,
  onGuestStarAdded,
}: AddGuestStarDialogProps) {
  const [category, setCategory] = useState<string>("BAND");
  const [personnelCount, setPersonnelCount] = useState<number | "">(1);
  const [feePerDay, setFeePerDay] = useState<number | "">(0);
  const [gsDurationDays, setGsDurationDays] = useState<number | "">(1);
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [stageLocation, setStageLocation] = useState<string>("Main Stage");
  const [loading, setLoading] = useState(false);

  const calculatedTotalFee = useMemo(() => {
    const fee = Math.max(0, Number(feePerDay) || 0);
    const days = Math.max(1, Number(gsDurationDays) || 1);
    return fee * days;
  }, [feePerDay, gsDurationDays]);

  // Occupied slots mapping for dayNumber
  const occupiedMap = useMemo(() => {
    const map: { [slot: string]: EventTimelineItemData } = {};
    timelineItems.forEach(item => {
      if (item.dayNumber !== dayNumber) return;
      (item.slots || []).forEach(slot => {
        map[slot] = item;
      });
    });
    return map;
  }, [timelineItems, dayNumber]);

  const handleToggleSlot = (slot: string) => {
    if (occupiedMap[slot]) return;
    setSelectedSlots(prev => {
      if (prev.includes(slot)) {
        return prev.filter(s => s !== slot);
      } else {
        return [...prev, slot].sort();
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isDummyUser) {
      onShowDemoWarning?.();
      return;
    }
    const formData = new FormData(e.currentTarget);
    formData.set("category", category);
    formData.set("personnelCount", String(personnelCount || 1));
    formData.set("feePerDay", String(feePerDay || 0));
    formData.set("durationDays", String(gsDurationDays || durationDays || 1));
    formData.set("dayNumber", String(dayNumber || 1));
    formData.set("stageLocation", stageLocation || "Main Stage");
    formData.set("timelineSlots", JSON.stringify(selectedSlots));
    if (selectedSlots.length > 0) {
      formData.set("stageTime", formatSlotRange(selectedSlots));
    }

    setLoading(true);
    try {
      const res = await addEventGuestStar(eventDetailId, formData);
      if (res.success && res.data) {
        onGuestStarAdded(
          { ...(res.data as EventGuestStarData), riders: [] },
          (res as any).timelineItem as EventTimelineItemData | undefined
        );
        onOpenChange(false);
        setFeePerDay(0);
        setPersonnelCount(1);
        setSelectedSlots([]);
        setDayNumber(1);
        setStageLocation("Main Stage");
      } else {
        alert(res.error || "Gagal menambahkan Guest Star.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="whitespace-nowrap shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-purple-900/30 cursor-pointer"
        >
          <Plus className="w-4 h-4 shrink-0" /> Tambah Guest Star
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-2xl sm:max-w-3xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader className="pb-2 border-b border-zinc-800/80">
          <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2.5">
            <div className="p-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <Mic className="w-5 h-5 text-purple-400" />
            </div>
            Tambah Guest Star / Pengisi Acara
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {/* 1. Nama Artis / Band */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Nama Guest Star / Artis / Band <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Contoh: Sheila on 7 / Raisa / DJ Winky / MC Desta"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-purple-500 placeholder:text-zinc-600"
            />
          </div>

          {/* 2. Pilihan Jenis / Kategori Performer */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300">
              Kategori Performer <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: "BAND", label: "Grup Band", icon: "🎸", desc: "Formasi Musik Lengkap" },
                { id: "SOLO", label: "Penyanyi Solo", icon: "🎤", desc: "Vokalis / Soloist" },
                { id: "DJ", label: "Disc Jockey (DJ)", icon: "🎧", desc: "Electronic Music" },
                { id: "MC_HOST", label: "MC / Host", icon: "🎙️", desc: "Pembawa Acara" },
                { id: "DANCE_PERFORMER", label: "Dancer / Tari", icon: "💃", desc: "Koreografi / Seni" },
                { id: "LAINNYA", label: "Lain-lain", icon: "⭐", desc: "Pengisi Acara Lain" }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    category === cat.id
                      ? "bg-purple-950/70 border-purple-500 text-purple-200 ring-1 ring-purple-500/50 shadow-md"
                      : "bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/80"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-base">{cat.icon}</span>
                    <span className="text-xs font-bold leading-tight">{cat.label}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 leading-tight">{cat.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Jumlah Personil & Kontak Manajer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Jumlah Personil / Rombongan Kru <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                name="personnelCount"
                min="1"
                value={personnelCount}
                onChange={e => setPersonnelCount(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-zinc-500">Jumlah orang untuk alokasi konsumsi & ID Card</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Kontak Person / Manajer</label>
              <input
                type="text"
                name="contactPerson"
                placeholder="Contoh: Mas Anton (0812-3456-7890)"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* 4. Biaya Penampilan & Durasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-zinc-900/60 border border-purple-900/40 rounded-xl">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-purple-300">
                Fee / Honor per Hari (IDR) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                name="feePerDay"
                min="0"
                value={feePerDay}
                onChange={e => setFeePerDay(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-purple-300">
                Durasi Tampil (Hari) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                name="durationDays"
                min="1"
                value={gsDurationDays}
                onChange={e => setGsDurationDays(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-purple-500"
              />
            </div>

            <div className="sm:col-span-2 pt-1 border-t border-zinc-800/60">
              <p className="text-xs text-zinc-300">
                Total Honor: {gsDurationDays || 1} Hari × {formatRupiah(Number(feePerDay) || 0)} ={" "}
                <strong className="text-purple-400 font-bold">{formatRupiah(calculatedTotalFee)}</strong>
              </p>
            </div>
          </div>

          {/* 5. SISTEM TIMELINE TERPUSAT: CINEMA-SEAT BLOCKING JADWAL TAMPIL (30 MENIT) */}
          <div className="space-y-3 p-4 bg-zinc-900/60 border border-purple-900/50 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
              <div>
                <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-400" />
                  Booking Slot Jadwal Tampil (Timeline Terpusat)
                </label>
                <span className="text-[11px] text-zinc-400 block mt-0.5">
                  Pilih slot waktu tampil (kelipatan 30 menit). Slot terisi akan otomatis terkunci.
                </span>
              </div>

              {/* Pilihan Hari Penampilan */}
              <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
                <span className="text-[10px] text-zinc-400 font-semibold px-2 uppercase tracking-wider">Hari:</span>
                {Array.from({ length: durationDays || 1 }).map((_, idx) => {
                  const dNum = idx + 1;
                  const isCurrentDay = dayNumber === dNum;
                  return (
                    <button
                      key={dNum}
                      type="button"
                      onClick={() => {
                        setDayNumber(dNum);
                        setSelectedSlots([]);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        isCurrentDay
                          ? "bg-purple-600 text-white shadow-sm ring-1 ring-purple-400"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                      }`}
                    >
                      Hari {dNum}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lokasi Panggung & Catatan Singkat */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-400">Lokasi Panggung / Stage</label>
                <input
                  type="text"
                  value={stageLocation}
                  onChange={e => setStageLocation(e.target.value)}
                  placeholder="Contoh: Main Stage / Stage 2 / Hall A"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-purple-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-400">Catatan Khusus / Rider Cue</label>
                <input
                  type="text"
                  name="notes"
                  placeholder="Contoh: Ruang tunggu VIP, Soundcheck sore"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Legend Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-950/80 border border-emerald-500/50 inline-block"></span>
                  <span className="text-zinc-400">Tersedia (Bebas)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-purple-600 border border-purple-400 inline-block shadow-xs"></span>
                  <span className="text-zinc-300 font-medium">Terpilih</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-zinc-800 border border-zinc-700 inline-block opacity-60"></span>
                  <span className="text-zinc-500">Terkunci (Sudah Terisi)</span>
                </div>
              </div>
              {selectedSlots.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedSlots([])}
                  className="text-rose-400 hover:text-rose-300 font-semibold underline cursor-pointer text-[11px]"
                >
                  Reset Pilihan
                </button>
              )}
            </div>

            {/* Cinema-Seat Interactive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl">
              {EVENT_TIME_SLOTS.map(slot => {
                const occupied = occupiedMap[slot];
                const isSelected = selectedSlots.includes(slot);

                if (occupied) {
                  return (
                    <div
                      key={slot}
                      title={`🔒 Terkunci / Sudah Terisi:\n${occupied.title}\n(${occupied.startTime} - ${occupied.endTime} WIB)\nKategori: ${occupied.category}\nLokasi: ${occupied.stageLocation || 'Main Stage'}`}
                      className="p-2.5 rounded-xl bg-zinc-800/70 border border-zinc-700/50 text-zinc-500 text-center cursor-not-allowed select-none opacity-60 flex flex-col items-center justify-center min-h-[52px]"
                    >
                      <span className="text-xs font-mono font-bold leading-tight tracking-tight line-through text-zinc-400">
                        {getSlotRangeText(slot)}
                      </span>
                      <span className="text-[10px] text-zinc-500 truncate max-w-full px-1 mt-1 font-medium" title={occupied.title}>
                        🔒 {occupied.title}
                      </span>
                    </div>
                  );
                }

                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleToggleSlot(slot)}
                    className={`p-2.5 rounded-xl text-center cursor-pointer select-none transition-all flex flex-col items-center justify-center min-h-[52px] ${
                      isSelected
                        ? "bg-purple-600 border-2 border-purple-400 text-white font-bold shadow-md shadow-purple-900/50 scale-[1.02] ring-2 ring-purple-500/40"
                        : "bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-400"
                    }`}
                  >
                    <span className="text-xs font-mono font-bold leading-tight tracking-tight">
                      {getSlotRangeText(slot)}
                    </span>
                    <span className="text-[10px] opacity-85 mt-1 font-medium">
                      {isSelected ? "✓ Dipilih" : "Bebas"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Status Banner Pilihan Slot */}
            {selectedSlots.length > 0 ? (
              <div className="p-3 bg-purple-950/50 border border-purple-800/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-purple-200 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>
                    <strong>Hari ke-{dayNumber}</strong>: Pukul{" "}
                    <span className="text-white font-bold">{formatSlotRange(selectedSlots)} WIB</span>{" "}
                    <span className="text-purple-300 font-semibold">
                      ({selectedSlots.length} Slot / {selectedSlots.length * 30} Menit)
                    </span>
                  </span>
                </div>
                <span className="text-[10px] bg-purple-800/80 text-purple-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider self-start sm:self-auto">
                  Slot Siap Diblock
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-zinc-500 italic px-1">
                💡 Klik tombol waktu hijau di atas untuk mem-booking slot rundown artis ini secara eksklusif.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              {loading ? "Menyimpan..." : "Simpan Guest Star"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

