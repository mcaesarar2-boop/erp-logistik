"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import type { History } from "@/shared/types/common";

interface DeleteHistoryDialogProps {
  history: History | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteHistoryDialog({
  history,
  isOpen,
  isLoading,
  onClose,
  onConfirm,
}: DeleteHistoryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent aria-describedby={undefined} className="bg-zinc-950 border-zinc-800 text-zinc-50">
        <DialogTitle className="text-red-400">Hapus Riwayat Transaksi?</DialogTitle>
        <p className="text-sm text-zinc-400 mt-2">
          Apakah Anda yakin ingin menghapus catatan riwayat faktur{" "}
          <strong>&quot;{history?.description}&quot;</strong>? (Data barang di gudang tidak akan
          berubah, hanya menghilangkan catatannya saja).
        </p>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="h-10 border border-zinc-800 text-zinc-400 hover:bg-zinc-900 rounded-md cursor-pointer transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="h-10 bg-red-600 hover:bg-red-700 text-white rounded-md flex justify-center items-center cursor-pointer transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Hapus"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

