"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { addEventVendor } from "../../actions";
import type { EventVendorData } from "../../types";

interface AddVendorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventDetailId: string;
  isDummyUser?: boolean;
  onShowDemoWarning?: () => void;
  onVendorAdded: (vendor: EventVendorData) => void;
}

export function AddVendorDialog({
  isOpen,
  onOpenChange,
  eventDetailId,
  isDummyUser,
  onShowDemoWarning,
  onVendorAdded,
}: AddVendorDialogProps) {
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
      const res = await addEventVendor(eventDetailId, formData);
      if (res.success && res.data) {
        onVendorAdded(res.data as EventVendorData);
        onOpenChange(false);
      } else {
        alert(res.error || "Gagal menambahkan vendor.");
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
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tambah Vendor Eksternal
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Tambah Vendor Eksternal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Nama Vendor / Perusahaan</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Contoh: Catering Bu Sari / PT Mega Genset"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Kategori Pekerjaan</label>
              <input
                type="text"
                name="category"
                required
                placeholder="Misal: Konsumsi / Kelistrikan"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Estimasi Biaya (IDR)</label>
              <input
                type="number"
                name="cost"
                min="0"
                defaultValue={0}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Catatan Pekerjaan</label>
            <input
              type="text"
              name="notes"
              placeholder="Contoh: 150 porsi makan siang kru"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              {loading ? "Menyimpan..." : "Simpan Vendor"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

