"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { deleteItemFull, reduceItemQuantity } from "../actions/inventoryActions";
import { DemoRestrictionDialog } from "@/shared/components/DemoRestrictionDialog";
import { DEMO_MESSAGES } from "@/shared/constants/permissions";
import { useAuthPermission } from "@/shared/hooks/useAuthPermission";

interface DeleteItemDialogProps {
  item: {
    id: string;
    name: string;
    quantity: number;
  };
}

export function DeleteItemDialog({ item }: DeleteItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"selection" | "partial" | "full">("selection");
  const { isDummyUser, showDemoWarning, setShowDemoWarning } = useAuthPermission();
  const [amount, setAmount] = useState<number | "">(1);

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      setMode("selection");
      setAmount(1);
    }
  }

  async function handlePartial() {
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }
    const safeAmount = Number(amount) || 1;
    if (safeAmount > 0 && safeAmount <= item.quantity) {
      await reduceItemQuantity(item.id, safeAmount);
      setOpen(false);
    }
  }

  async function handleFull() {
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }
    await deleteItemFull(item.id);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-950/30">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50">
        <DialogHeader>
          <DialogTitle>
            {mode === "selection" && "Opsi Penghapusan"}
            {mode === "partial" && "Kurangi Stok Aset"}
            {mode === "full" && "Peringatan Penghapusan"}
          </DialogTitle>
        </DialogHeader>

        {/* MODE 1: PILIHAN AWAL */}
        {mode === "selection" && (
          <div className="space-y-4 pt-4">
            <p className="text-sm text-zinc-400">Apa yang ingin Anda lakukan terhadap <strong>{item.name}</strong>?</p>
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={() => setMode("partial")} variant="outline" className="border-zinc-800 text-zinc-300 hover:bg-zinc-900">
                Kurangi Stok
              </Button>
              <Button onClick={() => setMode("full")} variant="destructive" className="bg-red-900/80 hover:bg-red-900 text-red-100">
                Hapus Permanen
              </Button>
            </div>
          </div>
        )}

        {/* MODE 2: JIKA PILIH KURANGI STOK */}
        {mode === "partial" && (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Jumlah yang dikurangi (Maks: {item.quantity})</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={amount}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d+$/.test(val)) {
                    setAmount(val === "" ? "" : Math.min(item.quantity, parseInt(val)));
                  }
                }}
                onBlur={() => {
                  if (amount === "" || Number(amount) < 1) setAmount(1);
                }}
                className="bg-zinc-900 border-zinc-800 text-center font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button variant="outline" onClick={() => setMode("selection")} className="w-full bg-transparent border-zinc-800 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900">
                Kembali
              </Button>
              <Button onClick={handlePartial} className="w-full bg-zinc-50 text-zinc-950 hover:bg-zinc-200">
                Konfirmasi
              </Button>
            </div>
          </div>
        )}

        {/* MODE 3: JIKA PILIH HAPUS PERMANEN */}
        {mode === "full" && (
          <div className="space-y-4 pt-4">
            <p className="text-sm text-red-400">Seluruh data <strong>{item.name}</strong> akan dihapus permanen dari sistem. Tindakan ini tidak bisa dibatalkan.</p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button variant="outline" onClick={() => setMode("selection")} className="w-full bg-transparent border-zinc-800 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900">
                Batal
              </Button>
              <Button onClick={handleFull} variant="destructive" className="w-full bg-red-600 hover:bg-red-700 text-white">
                Ya, Hapus Data
              </Button>
            </div>
          </div>
        )}

      </DialogContent>
      <DemoRestrictionDialog
        isOpen={showDemoWarning}
        onClose={() => setShowDemoWarning(false)}
        title={DEMO_MESSAGES.delete.title}
        message={DEMO_MESSAGES.delete.message}
      />
    </Dialog>
  );
}

