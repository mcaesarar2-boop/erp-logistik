"use client";

import React, { useState } from "react";
import { Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatSlotRange, getSlotRangeText } from "@/shared/lib/formatters";
import { EVENT_TIME_SLOTS } from "@/shared/constants/timeline";
import { addEventTimelineItem } from "../../actions";
import type { EventTimelineItemData } from "../../types";

interface AddAgendaDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventDetailId: string;
  durationDays: number;
  initialDayNumber?: number;
  initialSlots?: string[];
  timelineItems: EventTimelineItemData[];
  isDummyUser?: boolean;
  onShowDemoWarning?: () => void;
  onAgendaAdded: (item: EventTimelineItemData) => void;
}

export function AddAgendaDialog({
  isOpen,
  onOpenChange,
  eventDetailId,
  durationDays,
  initialDayNumber = 1,
  initialSlots = [],
  timelineItems,
  isDummyUser,
  onShowDemoWarning,
  onAgendaAdded,
}: AddAgendaDialogProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("SOUNDCHECK");
  const [dayNumber, setDayNumber] = useState(initialDayNumber);
  const [selectedSlots, setSelectedSlots] = useState<string[]>(initialSlots);
  const [stageLocation, setStageLocation] = useState("Main Stage");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync initial day number & slots when opening
  React.useEffect(() => {
    if (isOpen) {
      setDayNumber(initialDayNumber);
      setSelectedSlots(initialSlots);
    }
  }, [isOpen, initialDayNumber, initialSlots]);

  const occupiedMap = React.useMemo(() => {
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
    if (selectedSlots.length === 0) {
      alert("Pilih minimal 1 slot waktu (30 menit).");
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("title", title);
    formData.set("category", category);
    formData.set("dayNumber", String(dayNumber || 1));
    formData.set("stageLocation", stageLocation || "Main Stage");
    formData.set("notes", notes || "");
    formData.set("slots", JSON.stringify(selectedSlots));

    setLoading(true);
    try {
      const res = await addEventTimelineItem(eventDetailId, formData);
      if (res.success && res.data) {
        onAgendaAdded(res.data as EventTimelineItemData);
        onOpenChange(false);
        setTitle("");
        setNotes("");
        setSelectedSlots([]);
      } else {
        alert(res.error || "Gagal menambahkan agenda timeline.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-2xl sm:max-w-3xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader className="pb-2 border-b border-zinc-800/80">
          <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
              <Clock className="w-5 h-5 text-indigo-400" />
            </div>
            Tambah Agenda Rundown Acara
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {/* 1. Nama Agenda */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Nama Agenda / Sesi Acara <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder="Contoh: Soundcheck Artis Utama / Briefing Kru Pagi / Open Gate Utama"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500 placeholder:text-zinc-600"
            />
          </div>

          {/* 2. Kategori Agenda */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300">
              Kategori Agenda <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: "SOUNDCHECK", label: "Soundcheck / GR", icon: "🔊" },
                { id: "BRIEFING", label: "Briefing Kru", icon: "📋" },
                { id: "GATE_OPEN", label: "Open Gate / Registrasi", icon: "🚪" },
                { id: "BREAK", label: "Break / Ishoma", icon: "☕" },
                { id: "PERFORMANCE", label: "Special Show", icon: "🎤" },
                { id: "OTHER", label: "Agenda Umum", icon: "⚙️" }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                    category === cat.id
                      ? "bg-indigo-950/70 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/50 shadow-md"
                      : "bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/80"
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="text-xs font-bold leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Panggung & Hari */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Hari ke-</label>
              <select
                value={dayNumber}
                onChange={e => {
                  setDayNumber(Number(e.target.value));
                  setSelectedSlots([]);
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500 cursor-pointer"
              >
                {Array.from({ length: durationDays || 1 }).map((_, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    Hari ke-{idx + 1}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Lokasi / Panggung</label>
              <input
                type="text"
                value={stageLocation}
                onChange={e => setStageLocation(e.target.value)}
                placeholder="Contoh: Main Stage / Front Gate / Area VIP"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* 4. Cinema-Seat Slot Picker */}
          <div className="space-y-2.5 p-3.5 bg-zinc-900/60 border border-indigo-900/40 rounded-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Pilih Slot Waktu (Hari ke-{dayNumber})
              </label>
              {selectedSlots.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedSlots([])}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline cursor-pointer"
                >
                  Reset Pilihan
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl">
              {EVENT_TIME_SLOTS.map(slot => {
                const occupied = occupiedMap[slot];
                const isSelected = selectedSlots.includes(slot);

                if (occupied) {
                  return (
                    <div
                      key={slot}
                      title={`🔒 Terkunci:\n${occupied.title}\n(${occupied.startTime} - ${occupied.endTime} WIB)\nKategori: ${occupied.category}`}
                      className="p-2.5 rounded-xl bg-zinc-800/70 border border-zinc-700/50 text-zinc-500 text-center cursor-not-allowed select-none opacity-60 flex flex-col items-center justify-center min-h-[52px]"
                    >
                      <span className="text-xs font-mono font-bold leading-tight tracking-tight line-through text-zinc-400">
                        {getSlotRangeText(slot)}
                      </span>
                      <span className="text-[10px] text-zinc-500 truncate max-w-full px-1 mt-1 font-medium">🔒 {occupied.title}</span>
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
                        ? "bg-indigo-600 border-2 border-indigo-400 text-white font-bold shadow-md shadow-indigo-900/50 scale-[1.02] ring-2 ring-indigo-500/40"
                        : "bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-400"
                    }`}
                  >
                    <span className="text-xs font-mono font-bold leading-tight tracking-tight">
                      {getSlotRangeText(slot)}
                    </span>
                    <span className="text-[10px] opacity-85 mt-1 font-medium">{isSelected ? "✓ Dipilih" : "Bebas"}</span>
                  </button>
                );
              })}
            </div>

            {selectedSlots.length > 0 ? (
              <div className="p-2.5 bg-indigo-950/50 border border-indigo-800/60 rounded-xl text-xs text-indigo-200">
                <span>
                  Terpilih: <strong>Hari ke-{dayNumber}</strong>, Pukul{" "}
                  <span className="text-white font-bold">{formatSlotRange(selectedSlots)} WIB</span>{" "}
                  ({selectedSlots.length} Slot / {selectedSlots.length * 30} Menit)
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-zinc-400 italic">Pilih satu atau lebih slot waktu untuk memblock jadwal.</p>
            )}
          </div>

          {/* 5. Catatan */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Catatan Khusus</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Contoh: Sound engineer wajib standby, mik wireless 4 buah"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
            />
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              {loading ? "Menyimpan..." : "Simpan Agenda"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

