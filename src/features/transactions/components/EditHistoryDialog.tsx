"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import type { History } from "@/shared/types/common";

interface EditHistoryDialogProps {
  history: History | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function EditHistoryDialog({
  history,
  isOpen,
  isLoading,
  onClose,
  onSubmit,
}: EditHistoryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent aria-describedby={undefined} className="bg-zinc-950 border-zinc-800 text-zinc-50">
        <DialogTitle>Ubah Riwayat Transaksi</DialogTitle>
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Tanggal Faktur</label>
            <input
              type="date"
              name="date"
              defaultValue={
                history?.date ? new Date(history.date).toISOString().split("T")[0] : ""
              }
              className="w-full h-10 rounded-md bg-zinc-900 border border-zinc-800 px-3 text-sm text-zinc-100"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Catatan / Deskripsi</label>
            <input
              type="text"
              name="description"
              defaultValue={history?.description || ""}
              className="w-full h-10 rounded-md bg-zinc-900 border border-zinc-800 px-3 text-sm text-zinc-100"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-10 rounded-md font-medium flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Perubahan"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

