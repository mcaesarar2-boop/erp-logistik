"use client";

import { useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRupiah } from "@/shared/lib/formatters";
import type { CustomServiceItem } from "../types";

interface CustomServiceSectionProps {
  customItems: CustomServiceItem[];
  safeRentalDays: number;
  onAddCustomItem: (item: {
    name: string;
    qty: number | "";
    price: number | "";
    discount?: number | "";
  }) => void;
  onUpdateQty: (id: string, qty: any) => void;
  onUpdatePrice: (id: string, price: any) => void;
  onUpdateDiscount: (id: string, discount: any) => void;
  onUpdateFootnote: (id: string, footnote: string) => void;
  onRemove: (id: string) => void;
}

export function CustomServiceForm({
  onAddCustomItem,
}: {
  onAddCustomItem: (item: {
    name: string;
    qty: number | "";
    price: number | "";
    discount?: number | "";
  }) => void;
}) {
  const [customName, setCustomName] = useState("");
  const [customQty, setCustomQty] = useState<number | "">(1);
  const [customPrice, setCustomPrice] = useState<number | "">(0);

  const handleAdd = () => {
    if (!customName.trim()) return;
    onAddCustomItem({
      name: customName,
      qty: customQty,
      price: customPrice,
      discount: 0,
    });
    setCustomName("");
    setCustomQty(1);
    setCustomPrice(0);
  };

  return (
    <div className="space-y-2 shrink-0 bg-blue-950/20 p-3 rounded-lg border border-blue-900/50">
      <Label className="flex items-center gap-2 text-blue-400">
        <PlusCircle className="w-4 h-4" /> Layanan / Kebutuhan Tambahan
      </Label>
      <div className="flex flex-col gap-2 mt-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-blue-400/80">Nama Layanan Tambahan</Label>
          <Input
            placeholder="Misal: Kuli Angkut"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="bg-zinc-950 border-zinc-700 text-xs w-full h-9"
          />
        </div>
        <div className="flex gap-2">
          <div className="space-y-1 w-20">
            <Label className="text-[10px] text-blue-400/80">Qty</Label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Qty"
              value={customQty}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d+$/.test(val)) {
                  setCustomQty(val === "" ? "" : parseInt(val));
                }
              }}
              onBlur={() => {
                if (customQty === "" || Number(customQty) < 1) setCustomQty(1);
              }}
              className="bg-zinc-950 border-zinc-700 w-full text-xs h-9 text-center font-bold"
            />
          </div>
          <div className="space-y-1 flex-1">
            <Label className="text-[10px] text-blue-400/80">Harga / Hari</Label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Harga"
              value={customPrice}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d+$/.test(val)) {
                  setCustomPrice(val === "" ? "" : parseInt(val));
                }
              }}
              onBlur={() => {
                if (customPrice === "") setCustomPrice(0);
              }}
              className="bg-zinc-950 border-zinc-700 w-full text-xs h-9"
            />
          </div>
        </div>
        <Button
          type="button"
          onClick={handleAdd}
          disabled={!customName.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full h-9 text-xs mt-1"
        >
          Tambahkan ke Keranjang
        </Button>
      </div>
    </div>
  );
}

export function CustomServiceList({
  customItems,
  safeRentalDays,
  onUpdateQty,
  onUpdatePrice,
  onUpdateDiscount,
  onUpdateFootnote,
  onRemove,
}: {
  customItems: CustomServiceItem[];
  safeRentalDays: number;
  onUpdateQty: (id: string, qty: any) => void;
  onUpdatePrice: (id: string, price: any) => void;
  onUpdateDiscount: (id: string, discount: any) => void;
  onUpdateFootnote: (id: string, footnote: string) => void;
  onRemove: (id: string) => void;
}) {
  if (customItems.length === 0) return null;

  return (
    <div className="w-full">
      {/* Section Header Layanan Tambahan */}
      <div className="w-full flex items-center gap-2 pb-1.5 mb-2.5 border-b border-blue-900/80">
        <span className="w-1.5 h-3.5 bg-blue-500 rounded-full shrink-0" />
        <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider">
          LAYANAN TAMBAHAN
        </h4>
        <span className="text-[10px] font-semibold text-blue-400 bg-blue-950/80 border border-blue-800/50 px-1.5 py-0.5 rounded-full">
          {customItems.length} {customItems.length > 1 ? "layanan" : "layanan"}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {customItems.map((item) => {
          const basePrice = Number(item.price) || 0;
          const itemDiscount = Math.min(100, Math.max(0, Number(item.discount) || 0));
          const originalLineTotal = (Number(item.qty) || 1) * basePrice * safeRentalDays;
          const lineNetTotal = originalLineTotal * (1 - itemDiscount / 100);

          return (
            <div
              key={item.lineId || item.id}
              className="bg-blue-950/20 p-3 rounded-lg border border-blue-900/50 flex flex-col gap-2"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center shrink-0 text-blue-400">
                    <PlusCircle className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-zinc-100 truncate">{item.name}</p>
                    <p className="text-xs text-blue-400">Layanan Khusus / Kustom</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(item.lineId || item.id)}
                  className="text-zinc-500 hover:text-red-400 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded shrink-0 transition-colors"
                  title="Hapus layanan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-2 mt-1 pt-2 border-t border-zinc-800/50">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs shrink-0">Qty:</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={item.qty}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || /^\d+$/.test(val)) {
                            onUpdateQty(item.id, val === "" ? "" : parseInt(val));
                          }
                        }}
                        onBlur={() => {
                          if (item.qty === "" || Number(item.qty) < 1) onUpdateQty(item.id, 1);
                        }}
                        className="w-14 sm:w-16 h-8 text-xs bg-zinc-950 border-zinc-700 text-center font-bold"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Label className="text-xs shrink-0">Tarif/Hari:</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={item.price}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || /^\d+$/.test(val)) {
                            onUpdatePrice(item.id, val === "" ? "" : parseInt(val));
                          }
                        }}
                        onBlur={() => {
                          if (item.price === "") onUpdatePrice(item.id, 0);
                        }}
                        className="w-16 sm:w-20 h-8 text-xs bg-zinc-950 border-zinc-700"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Label className="text-xs shrink-0">Disc(%):</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={item.discount ?? 0}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || /^\d+$/.test(val)) {
                            onUpdateDiscount(
                              item.id,
                              val === "" ? "" : Math.min(100, Math.max(0, parseInt(val)))
                            );
                          }
                        }}
                        onBlur={() => {
                          if (item.discount === "" || Number(item.discount) < 0)
                            onUpdateDiscount(item.id, 0);
                        }}
                        className="w-14 sm:w-16 h-8 text-xs bg-zinc-950 border-zinc-700 text-center font-bold"
                      />
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-zinc-500">Nilai Tambahan</p>
                    {itemDiscount === 100 ? (
                      <div className="flex flex-col items-end">
                        <span className="text-[11px] line-through text-zinc-500">
                          {formatRupiah(originalLineTotal)}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs sm:text-sm font-bold text-emerald-400">Rp 0</span>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1 py-0.2 rounded font-bold">
                            FREE / BONUS (Diskon 100%)
                          </span>
                        </div>
                      </div>
                    ) : itemDiscount > 0 ? (
                      <div className="flex flex-col items-end">
                        <span className="text-[11px] line-through text-zinc-500">
                          {formatRupiah(originalLineTotal)}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs sm:text-sm font-bold text-emerald-400">
                            {formatRupiah(lineNetTotal)}
                          </span>
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded font-bold">
                            -{itemDiscount}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm font-bold text-emerald-400">
                        {formatRupiah(lineNetTotal)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-xs shrink-0 text-zinc-400">Catatan:</Label>
                  <Input
                    type="text"
                    placeholder="Catatan tambahan (opsional)..."
                    value={item.footnote || ""}
                    onChange={(e) => onUpdateFootnote(item.id, e.target.value)}
                    className="flex-1 h-8 text-xs bg-zinc-950 border-zinc-700"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

