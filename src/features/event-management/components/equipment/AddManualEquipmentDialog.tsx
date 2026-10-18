"use client";

import React, { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatRupiah } from "@/shared/lib/formatters";
import { addEventManualEquipment } from "../../actions";
import type { EventManualEquipmentData } from "../../types";

interface AddManualEquipmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventDetailId: string;
  isDummyUser?: boolean;
  onShowDemoWarning?: () => void;
  onEquipmentAdded: (equip: EventManualEquipmentData) => void;
}

export function AddManualEquipmentDialog({
  isOpen,
  onOpenChange,
  eventDetailId,
  isDummyUser,
  onShowDemoWarning,
  onEquipmentAdded,
}: AddManualEquipmentDialogProps) {
  const [procurementType, setProcurementType] = useState<"BELI" | "SEWA">("BELI");
  const [qty, setQty] = useState<number | "">(1);
  const [unitPrice, setUnitPrice] = useState<number | "">(0);
  const [rentalPricePerDay, setRentalPricePerDay] = useState<number | "">(0);
  const [rentalDays, setRentalDays] = useState<number | "">(1);
  const [loading, setLoading] = useState(false);

  const calculatedTotal = useMemo(() => {
    const q = Math.max(1, Number(qty) || 1);
    if (procurementType === "BELI") {
      const price = Math.max(0, Number(unitPrice) || 0);
      return q * price;
    } else {
      const perDay = Math.max(0, Number(rentalPricePerDay) || 0);
      const days = Math.max(1, Number(rentalDays) || 1);
      return q * perDay * days;
    }
  }, [procurementType, qty, unitPrice, rentalPricePerDay, rentalDays]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isDummyUser) {
      onShowDemoWarning?.();
      return;
    }
    const formData = new FormData(e.currentTarget);
    formData.set("procurementType", procurementType);

    setLoading(true);
    try {
      const res = await addEventManualEquipment(eventDetailId, formData);
      if (res.success && res.data) {
        onEquipmentAdded(res.data as EventManualEquipmentData);
        onOpenChange(false);
        setQty(1);
        setUnitPrice(0);
        setRentalPricePerDay(0);
        setRentalDays(1);
      } else {
        alert(res.error || "Gagal menambahkan peralatan manual.");
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
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Input Alat Tambahan
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Input Peralatan Manual Non-Gudang</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Nama Barang / Peralatan</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Contoh: Kabel Roll 50m / Gaffer Tape"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Kategori</label>
              <select
                name="category"
                defaultValue="Audio"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="Audio">Audio / Sound</option>
                <option value="Lighting">Lighting</option>
                <option value="Stage">Stage & Rigging</option>
                <option value="Kabel">Kabel & Power</option>
                <option value="Tools">Tools & Aksesoris</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Qty (Jumlah Unit)</label>
              <input
                type="number"
                name="quantity"
                min="1"
                value={qty}
                onChange={e => setQty(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Radio Pilihan Tipe Pengadaan */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Tipe Pengadaan</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setProcurementType("BELI")}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  procurementType === "BELI"
                    ? "bg-emerald-950/80 border-emerald-600 text-emerald-300"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span>Beli (Aset Baru)</span>
              </button>
              <button
                type="button"
                onClick={() => setProcurementType("SEWA")}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  procurementType === "SEWA"
                    ? "bg-blue-950/80 border-blue-600 text-blue-300"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span>Sewa (Vendor Luar)</span>
              </button>
            </div>
          </div>

          {/* INPUT DINAMIS SESUAI TIPE */}
          {procurementType === "BELI" ? (
            <div className="space-y-1.5 p-3 bg-zinc-900/60 border border-emerald-900/40 rounded-xl animate-in fade-in">
              <label className="text-xs font-medium text-emerald-400">Harga Beli Satuan (IDR)</label>
              <input
                type="number"
                name="unitPrice"
                min="0"
                value={unitPrice}
                onChange={e => setUnitPrice(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Rumus: Qty ({qty || 1}) × Harga Beli = <strong className="text-emerald-400">{formatRupiah(calculatedTotal)}</strong>
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-3 bg-zinc-900/60 border border-blue-900/40 rounded-xl animate-in fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-blue-400">Harga Sewa / Hari</label>
                  <input
                    type="number"
                    name="rentalPricePerDay"
                    min="0"
                    value={rentalPricePerDay}
                    onChange={e => setRentalPricePerDay(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-blue-400">Durasi Sewa (Hari)</label>
                  <input
                    type="number"
                    name="rentalDays"
                    min="1"
                    value={rentalDays}
                    onChange={e => setRentalDays(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <p className="text-[11px] text-zinc-500">
                Rumus: Qty ({qty || 1}) × Sewa/Hari ({formatRupiah(Number(rentalPricePerDay) || 0)}) × {rentalDays || 1} Hari = <strong className="text-blue-400">{formatRupiah(calculatedTotal)}</strong>
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Catatan Tambahan</label>
            <input
              type="text"
              name="notes"
              placeholder="Contoh: Beli di Glodok / Sewa dari Vendor B"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              {loading ? "Menyimpan..." : "Simpan Barang"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

