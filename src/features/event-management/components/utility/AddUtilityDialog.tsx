"use client";

import React, { useState, useMemo } from "react";
import { Plus, Coffee } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatRupiah } from "@/shared/lib/formatters";
import { addEventUtility } from "../../actions";
import type { EventUtilityData } from "../../types";

interface AddUtilityDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventDetailId: string;
  isDummyUser?: boolean;
  onShowDemoWarning?: () => void;
  onUtilityAdded: (util: EventUtilityData) => void;
}

export function AddUtilityDialog({
  isOpen,
  onOpenChange,
  eventDetailId,
  isDummyUser,
  onShowDemoWarning,
  onUtilityAdded,
}: AddUtilityDialogProps) {
  const [category, setCategory] = useState<string>("Konsumsi");
  const [procurementType, setProcurementType] = useState<"BELI" | "SEWA">("BELI");
  const [qty, setQty] = useState<number | "">(1);
  const [unit, setUnit] = useState<string>("Porsi");
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
    formData.set("category", category);
    formData.set("procurementType", procurementType);
    formData.set("unit", unit);

    setLoading(true);
    try {
      const res = await addEventUtility(eventDetailId, formData);
      if (res.success && res.data) {
        onUtilityAdded(res.data as EventUtilityData);
        onOpenChange(false);
        setQty(1);
        setUnitPrice(0);
        setRentalPricePerDay(0);
        setRentalDays(1);
      } else {
        alert(res.error || "Gagal menambahkan kebutuhan utilitas.");
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
          className="whitespace-nowrap shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-amber-900/30 cursor-pointer"
        >
          <Plus className="w-4 h-4 shrink-0" /> Tambah Kebutuhan Utilitas
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-xl sm:max-w-2xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader className="pb-2 border-b border-zinc-800/80">
          <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <Coffee className="w-5 h-5 text-amber-400" />
            </div>
            Tambah Kebutuhan Utilitas Event
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {/* 1. Nama Kebutuhan */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Nama Kebutuhan / Pengadaan <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Contoh: Nasi Box Kru Siang & Malam / Hotel Aston 3 Kamar / Bensin Genset"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500 placeholder:text-zinc-600"
            />
          </div>

          {/* 2. Pilihan Jenis Kategori Utilitas */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300">
              Jenis / Kategori Utilitas <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: "Konsumsi", label: "Konsumsi", icon: "🍱", desc: "Makan & Minum" },
                { id: "Akomodasi", label: "Akomodasi", icon: "🏨", desc: "Hotel & Kamar" },
                { id: "Transportasi", label: "Transportasi", icon: "🚐", desc: "Mobil & BBM" },
                { id: "Kelistrikan & BBM", label: "Listrik & BBM", icon: "⚡", desc: "Genset & Daya" },
                { id: "Komunikasi & IT", label: "Komunikasi", icon: "📻", desc: "HT & Internet" },
                { id: "Medis & Keselamatan", label: "Medis & P3K", icon: "🩺", desc: "Obat & Tim Medis" },
                { id: "Kebersihan & Sanitasi", label: "Kebersihan", icon: "🧹", desc: "Janitor & Sampah" },
                { id: "Lainnya", label: "Lain-lain", icon: "📦", desc: "Operasional Lain" }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    category === cat.id
                      ? "bg-amber-950/70 border-amber-500 text-amber-200 ring-1 ring-amber-500/50 shadow-md shadow-amber-950/50"
                      : "bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/80 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-base shrink-0">{cat.icon}</span>
                    <span className="text-xs font-bold leading-tight whitespace-nowrap">{cat.label}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 leading-tight whitespace-nowrap">{cat.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Jumlah & Satuan */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">
                Jumlah (Qty) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                min="1"
                value={qty}
                onChange={e => setQty(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Satuan</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="Porsi">Porsi / Box</option>
                <option value="Kamar">Kamar / Kamar-Malam</option>
                <option value="Unit">Unit / Buah</option>
                <option value="Liter">Liter (BBM)</option>
                <option value="Hari">Hari</option>
                <option value="Paket">Paket</option>
                <option value="Pcs">Pcs</option>
                <option value="Orang">Orang / Kru</option>
              </select>
            </div>
          </div>

          {/* 4. Tipe Pengadaan (Beli vs Sewa) */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Tipe Biaya / Pengadaan</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setProcurementType("BELI")}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  procurementType === "BELI"
                    ? "bg-amber-950/80 border-amber-600 text-amber-300 shadow-sm"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span>Beli / Biaya Langsung</span>
              </button>
              <button
                type="button"
                onClick={() => setProcurementType("SEWA")}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  procurementType === "SEWA"
                    ? "bg-blue-950/80 border-blue-600 text-blue-300 shadow-sm"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span>Sewa (Harian / Durasi)</span>
              </button>
            </div>
          </div>

          {/* 5. Input Dinamis Sesuai Tipe */}
          {procurementType === "BELI" ? (
            <div className="space-y-1.5 p-3.5 bg-zinc-900/60 border border-amber-900/40 rounded-xl animate-in fade-in">
              <label className="text-xs font-medium text-amber-400">
                Harga Satuan (IDR per {unit}) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                name="unitPrice"
                min="0"
                value={unitPrice}
                onChange={e => setUnitPrice(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Kalkulasi: {qty || 1} {unit} × {formatRupiah(Number(unitPrice) || 0)} = <strong className="text-amber-400">{formatRupiah(calculatedTotal)}</strong>
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-3.5 bg-zinc-900/60 border border-blue-900/40 rounded-xl animate-in fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-blue-400">
                    Harga Sewa / Hari <span className="text-rose-400">*</span>
                  </label>
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
                  <label className="text-xs font-medium text-blue-400">
                    Durasi Sewa (Hari) <span className="text-rose-400">*</span>
                  </label>
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
              <p className="text-[11px] text-zinc-400">
                Kalkulasi: {qty || 1} {unit} × {formatRupiah(Number(rentalPricePerDay) || 0)}/hari × {rentalDays || 1} Hari = <strong className="text-blue-400">{formatRupiah(calculatedTotal)}</strong>
              </p>
            </div>
          )}

          {/* 6. Catatan */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Catatan / Keterangan</label>
            <input
              type="text"
              name="notes"
              placeholder="Contoh: Menu ayam bakar + es teh, pengiriman jam 11:30"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500"
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
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              {loading ? "Menyimpan..." : "Simpan Utilitas"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

