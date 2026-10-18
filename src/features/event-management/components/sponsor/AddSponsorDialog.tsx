"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { addEventSponsor } from "../../actions";
import type { EventSponsorData } from "../../types";

interface AddSponsorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventDetailId: string;
  isDummyUser?: boolean;
  onShowDemoWarning?: () => void;
  onSponsorAdded: (sponsor: EventSponsorData) => void;
}

export function AddSponsorDialog({
  isOpen,
  onOpenChange,
  eventDetailId,
  isDummyUser,
  onShowDemoWarning,
  onSponsorAdded,
}: AddSponsorDialogProps) {
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
      const res = await addEventSponsor(eventDetailId, formData);
      if (res.success && res.data) {
        onSponsorAdded(res.data as EventSponsorData);
        onOpenChange(false);
      } else {
        alert(res.error || "Gagal menambahkan sponsor.");
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
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tambah Sponsor
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Pencatatan Sponsor Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Nama Sponsor / Perusahaan</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Contoh: Bank BCA / PT Sumber Berkah"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Bentuk Dukungan</label>
              <select
                name="supportType"
                defaultValue="DANA"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="DANA">Dukungan Dana (Cash)</option>
                <option value="BARANG">Barang / In-Kind</option>
                <option value="MEDIA">Media Partner</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Status</label>
              <select
                name="status"
                defaultValue="CONFIRMED"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="CONFIRMED">Confirmed / Masuk</option>
                <option value="PENDING">Pending / Verifikasi</option>
                <option value="PROPOSAL">Proposal / Negosiasi</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Nominal Dana / Estimasi Nilai (IDR)</label>
            <input
              type="number"
              name="amount"
              min="0"
              defaultValue={0}
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Catatan / Kontrak</label>
            <input
              type="text"
              name="notes"
              placeholder="Contoh: Logo di backdrop & 500 pcs lanyard"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500"
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
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              {loading ? "Menyimpan..." : "Simpan Sponsor"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

