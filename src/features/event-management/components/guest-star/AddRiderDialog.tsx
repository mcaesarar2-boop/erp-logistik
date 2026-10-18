"use client";

import React, { useState, useMemo } from "react";
import { Sparkles, Package, Building2, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatRupiah } from "@/shared/lib/formatters";
import { addEventGuestStarRider } from "../../actions";
import type { EventGuestStarData, EventGuestStarRiderData, AvailableEventSummary } from "../../types";

interface AddRiderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  guestStar: EventGuestStarData | null;
  currentSelectedSummary?: AvailableEventSummary;
  isDummyUser?: boolean;
  onShowDemoWarning?: () => void;
  onRiderAdded: (guestStarId: string, rider: EventGuestStarRiderData) => void;
}

export function AddRiderDialog({
  isOpen,
  onOpenChange,
  guestStar,
  currentSelectedSummary,
  isDummyUser,
  onShowDemoWarning,
  onRiderAdded,
}: AddRiderDialogProps) {
  const [sourceType, setSourceType] = useState<"ERP_LOGISTIK" | "VENDOR_LUAR">("ERP_LOGISTIK");
  const [riderType, setRiderType] = useState<"TECHNICAL" | "HOSPITALITY">("TECHNICAL");
  const [selectedErpItemName, setSelectedErpItemName] = useState<string>("");
  const [customName, setCustomName] = useState<string>("");
  const [quantity, setQuantity] = useState<number | "">(1);
  const [unit, setUnit] = useState<string>("Unit");
  const [procurementType, setProcurementType] = useState<"SEWA" | "BELI">("SEWA");
  const [unitPrice, setUnitPrice] = useState<number | "">(0);
  const [rentalPricePerDay, setRentalPricePerDay] = useState<number | "">(0);
  const [rentalDays, setRentalDays] = useState<number | "">(1);
  const [loading, setLoading] = useState(false);

  const calculatedTotal = useMemo(() => {
    if (sourceType === "ERP_LOGISTIK") return 0;
    const q = Math.max(1, Number(quantity) || 1);
    if (procurementType === "BELI") {
      const price = Math.max(0, Number(unitPrice) || 0);
      return q * price;
    } else {
      const perDay = Math.max(0, Number(rentalPricePerDay) || 0);
      const days = Math.max(1, Number(rentalDays) || 1);
      return q * perDay * days;
    }
  }, [sourceType, quantity, procurementType, unitPrice, rentalPricePerDay, rentalDays]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isDummyUser) {
      onShowDemoWarning?.();
      return;
    }
    if (!guestStar) return;
    const finalName = sourceType === "ERP_LOGISTIK" ? selectedErpItemName : customName;
    if (!finalName) {
      alert("Pilih barang dari gudang ERP atau ketik nama riders.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("name", finalName);
    formData.set("sourceType", sourceType);
    formData.set("riderType", riderType);
    formData.set("quantity", String(quantity || 1));
    formData.set("unit", unit);
    formData.set("procurementType", sourceType === "ERP_LOGISTIK" ? "FREE_ERP" : procurementType);
    if (sourceType === "VENDOR_LUAR") {
      formData.set("unitPrice", String(unitPrice || 0));
      formData.set("rentalPricePerDay", String(rentalPricePerDay || 0));
      formData.set("rentalDays", String(rentalDays || 1));
    }

    setLoading(true);
    try {
      const res = await addEventGuestStarRider(guestStar.id, formData);
      if (res.success && res.data) {
        onRiderAdded(guestStar.id, res.data as EventGuestStarRiderData);
        onOpenChange(false);
        setCustomName("");
        setSelectedErpItemName("");
        setUnitPrice(0);
        setRentalPricePerDay(0);
        setRentalDays(1);
      } else {
        alert(res.error || "Gagal menambahkan item riders.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-xl sm:max-w-2xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader className="pb-2 border-b border-zinc-800/80">
          <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2.5">
            <div className="p-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <span>
              Tambah Kebutuhan Riders: <strong className="text-purple-300">{guestStar?.name}</strong>
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {/* 1. Pemilihan Sumber Pengadaan */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300">
              Sumber Pengadaan Alat / Riders <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setSourceType("ERP_LOGISTIK");
                  setRiderType("TECHNICAL");
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  sourceType === "ERP_LOGISTIK"
                    ? "bg-emerald-950/70 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/50 shadow-md"
                    : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold">Dari Alat Gudang ERP (On-Rented)</span>
                </div>
                <span className="text-[10px] text-zinc-400">
                  Otomatis ambil dari daftar sewa ERP aktif (Biaya Rp 0 / Tercover).
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType("VENDOR_LUAR")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  sourceType === "VENDOR_LUAR"
                    ? "bg-amber-950/70 border-amber-500 text-amber-200 ring-1 ring-amber-500/50 shadow-md"
                    : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold">Vendor Eksternal / Beli Baru</span>
                </div>
                <span className="text-[10px] text-zinc-400">
                  Sewa alat luar atau pengadaan hospitality terpisah.
                </span>
              </button>
            </div>
          </div>

          {/* 2. Form Input Berdasarkan Sumber */}
          {sourceType === "ERP_LOGISTIK" ? (
            <div className="space-y-3 p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl animate-in fade-in">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-emerald-300">
                  Pilih Alat dari Transaksi Gudang ERP Pusat <span className="text-rose-400">*</span>
                </label>
                <select
                  value={selectedErpItemName}
                  onChange={e => setSelectedErpItemName(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-emerald-700/60 text-zinc-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 cursor-pointer"
                >
                  <option value="">-- Pilih Alat dari On-Rented Event Ini --</option>
                  {(currentSelectedSummary?.payload || []).map((item: any, idx: number) => (
                    <option key={idx} value={item.name}>
                      {item.name} (Tersedia Qty: {item.qty})
                    </option>
                  ))}
                </select>
                {(currentSelectedSummary?.payload || []).length === 0 && (
                  <p className="text-[11px] text-rose-400 mt-1">
                    Belum ada data barang sewa ERP pada event ini. Silakan gunakan opsi Vendor Eksternal.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-emerald-300">Jumlah (Qty)</label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))}
                    required
                    className="w-full bg-zinc-950 border border-emerald-700/60 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-emerald-300">Satuan</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full bg-zinc-950 border border-emerald-700/60 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-950/60 border border-emerald-700/40 rounded-lg flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-200">
                  Item riders ini diambil langsung dari inventaris gudang ERP pusat yang sudah dipesan untuk event ini. <strong>Biaya Rp 0</strong> (tidak dihitung ganda karena sudah masuk di total sewa ERP).
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Nama Kebutuhan Riders <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  required
                  placeholder="Contoh: Keyboard Roland RD-2000 / Ampeg SVT Bass Amp / Buah Segar & Handuk"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500 placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Kategori Riders</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRiderType("TECHNICAL")}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      riderType === "TECHNICAL"
                        ? "bg-indigo-950/80 border-indigo-600 text-indigo-300 shadow-sm"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <span>Technical (Alat Musik / Panggung)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiderType("HOSPITALITY")}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      riderType === "HOSPITALITY"
                        ? "bg-emerald-950/80 border-emerald-600 text-emerald-300 shadow-sm"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <span>Hospitality (Ruang Ganti / Konsumsi)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Jumlah (Qty) <span className="text-rose-400">*</span></label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))}
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Satuan</label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Unit">Unit</option>
                    <option value="Set">Set</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Paket">Paket</option>
                    <option value="Box">Box / Porsi</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Tipe Pengadaan Vendor</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProcurementType("SEWA")}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      procurementType === "SEWA"
                        ? "bg-blue-950/80 border-blue-600 text-blue-300 shadow-sm"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <span>Sewa Vendor Luar (Harian)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProcurementType("BELI")}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      procurementType === "BELI"
                        ? "bg-amber-950/80 border-amber-600 text-amber-300 shadow-sm"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <span>Beli Langsung / Sekali Pakai</span>
                  </button>
                </div>
              </div>

              {procurementType === "SEWA" ? (
                <div className="space-y-3 p-3.5 bg-zinc-900/60 border border-blue-900/40 rounded-xl">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-blue-400">Harga Sewa / Hari <span className="text-rose-400">*</span></label>
                      <input
                        type="number"
                        min="0"
                        value={rentalPricePerDay}
                        onChange={e => setRentalPricePerDay(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
                        required
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-blue-400">Durasi Sewa (Hari) <span className="text-rose-400">*</span></label>
                      <input
                        type="number"
                        min="1"
                        value={rentalDays}
                        onChange={e => setRentalDays(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))}
                        required
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Kalkulasi: {quantity || 1} {unit} × {formatRupiah(Number(rentalPricePerDay) || 0)}/hari × {rentalDays || 1} Hari = <strong className="text-blue-400">{formatRupiah(calculatedTotal)}</strong>
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 p-3.5 bg-zinc-900/60 border border-amber-900/40 rounded-xl">
                  <label className="text-xs font-semibold text-amber-400">Harga Beli Satuan (IDR) <span className="text-rose-400">*</span></label>
                  <input
                    type="number"
                    min="0"
                    value={unitPrice}
                    onChange={e => setUnitPrice(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Kalkulasi: {quantity || 1} {unit} × {formatRupiah(Number(unitPrice) || 0)} = <strong className="text-amber-400">{formatRupiah(calculatedTotal)}</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Catatan Riders */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Catatan / Spesifikasi Teknis</label>
            <input
              type="text"
              name="notes"
              placeholder="Contoh: Wajib merk Roland atau Yamaha Motif, kabel jack 5m"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-purple-500"
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
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              {loading ? "Menyimpan..." : "Simpan Riders"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

