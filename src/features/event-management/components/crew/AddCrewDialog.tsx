"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { addEventCrew } from "../../actions";
import type { EventCrewData } from "../../types";

interface AddCrewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventDetailId: string;
  isDummyUser?: boolean;
  onShowDemoWarning?: () => void;
  onCrewAdded: (crew: EventCrewData) => void;
}

export function AddCrewDialog({
  isOpen,
  onOpenChange,
  eventDetailId,
  isDummyUser,
  onShowDemoWarning,
  onCrewAdded,
}: AddCrewDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isDummyUser) {
      onShowDemoWarning?.();
      return;
    }
    const formData = new FormData(e.currentTarget);
    setLoading(true);
    try {
      const res = await addEventCrew(eventDetailId, formData);
      if (res.success && res.data) {
        onCrewAdded(res.data as EventCrewData);
        onOpenChange(false);
      } else {
        alert(res.error || "Gagal menambahkan kru.");
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
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tambah Kru
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Tambah Kru / Petugas Lapangan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Nama Personil / Tim</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Contoh: Budi Santoso / Tim Audio FoH"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Divisi</label>
              <select
                name="division"
                defaultValue="Audio"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Audio">Audio / Sound</option>
                <option value="Lighting">Lighting</option>
                <option value="Stage">Stage & Rigging</option>
                <option value="Runner">Runner / Lapangan</option>
                <option value="Dokumentasi">Dokumentasi & Media</option>
                <option value="Multimedia">Multimedia / LED</option>
                <option value="Keamanan">Keamanan & Crowd Control</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Jumlah Orang</label>
              <input
                type="number"
                name="memberCount"
                min="1"
                defaultValue={1}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Total Fee / Honor (IDR)</label>
            <input
              type="number"
              name="fee"
              min="0"
              defaultValue={0}
              placeholder="Nominal honor"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Catatan Tugas / Posisi</label>
            <input
              type="text"
              name="notes"
              placeholder="Contoh: Standby FoH & Soundcheck"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              {loading ? "Menyimpan..." : "Simpan Kru"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

