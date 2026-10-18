"use client";

import React, { useState, useEffect } from "react";
import { Edit3 } from "lucide-react";
import { updateEventDetail } from "../../actions";
import type { EventDetailData } from "../../types";

interface EditEventInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  eventDetail: EventDetailData;
  isDummyUser?: boolean;
  onShowDemoWarning?: () => void;
  onUpdated: (updated: EventDetailData) => void;
}

export function EditEventInfoDialog({
  isOpen,
  onClose,
  eventDetail,
  isDummyUser,
  onShowDemoWarning,
  onUpdated,
}: EditEventInfoDialogProps) {
  const [durationDays, setDurationDays] = useState<number>(1);
  const [clientBudget, setClientBudget] = useState<number>(0);
  const [eventNotes, setEventNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (eventDetail) {
      setDurationDays(eventDetail.durationDays || 1);
      setClientBudget(eventDetail.clientBudget || 0);
      setEventNotes(eventDetail.notes || "");
    }
  }, [eventDetail]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (isDummyUser) {
      onShowDemoWarning?.();
      return;
    }
    setLoading(true);
    try {
      const res = await updateEventDetail(eventDetail.id, {
        durationDays,
        clientBudget,
        notes: eventNotes,
      });
      if (res.success && res.data) {
        onUpdated({ ...eventDetail, ...(res.data as any) });
        onClose();
      } else {
        alert(res.error || "Gagal memperbarui informasi event.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-blue-900/50 rounded-xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-blue-400" /> Ubah Parameter Dasar Event
        </h4>
        <span className="text-xs text-zinc-500 font-mono">ID: {eventDetail.id}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">Durasi Acara (Hari)</label>
          <input
            type="number"
            min="1"
            value={durationDays}
            onChange={e => setDurationDays(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">Budget Klien (IDR)</label>
          <input
            type="number"
            min="0"
            value={clientBudget}
            onChange={e => setClientBudget(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">Catatan Tambahan Event</label>
          <input
            type="text"
            value={eventNotes}
            onChange={e => setEventNotes(e.target.value)}
            placeholder="Misal: Lokasi Lapangan Gasibu, loading h-1"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </div>
  );
}

