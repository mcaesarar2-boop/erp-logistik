"use client";

import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ItemThumbnail } from "@/shared/components/ItemThumbnail";
import { formatRupiah } from "@/shared/lib/formatters";
import type { CartItem } from "../types";

interface CartItemRowProps {
  item: CartItem;
  safeRentalDays: number;
  onUpdateQty: (lineId: string, newQty: any) => void;
  onUpdateDiscount: (lineId: string, newDiscount: any) => void;
  onUpdateFootnote: (lineId: string, footnote: string) => void;
  onRemove: (lineId: string) => void;
}

export function CartItemRow({
  item,
  safeRentalDays,
  onUpdateQty,
  onUpdateDiscount,
  onUpdateFootnote,
  onRemove,
}: CartItemRowProps) {
  const baseRentPerItem = ((item.price || 0) * (item.rentPercentage || 0)) / 100;
  const itemDiscount = Math.min(100, Math.max(0, Number(item.discount) || 0));
  const originalLineTotal = (Number(item.qty) || 1) * baseRentPerItem * safeRentalDays;
  const lineNetTotal = originalLineTotal * (1 - itemDiscount / 100);

  return (
    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 flex flex-col gap-2">
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <ItemThumbnail
            src={item.imageUrl}
            alt={item.name}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg shrink-0"
            iconClassName="w-5 h-5 text-zinc-500"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-zinc-100 truncate">{item.name}</p>
            <p className="text-xs text-zinc-500 font-mono">
              {item.code} | Max: {item.quantity} Unit
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(item.lineId)}
          className="text-zinc-500 hover:text-red-400 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded shrink-0 transition-colors"
          title="Hapus dari keranjang"
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
                    onUpdateQty(item.lineId, val === "" ? "" : parseInt(val));
                  }
                }}
                onBlur={() => {
                  if (item.qty === "" || Number(item.qty) < 1) onUpdateQty(item.lineId, 1);
                }}
                className="w-14 sm:w-16 h-8 text-xs bg-zinc-950 border-zinc-700 text-center font-bold"
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
                      item.lineId,
                      val === "" ? "" : Math.min(100, Math.max(0, parseInt(val)))
                    );
                  }
                }}
                onBlur={() => {
                  if (item.discount === "" || Number(item.discount) < 0)
                    onUpdateDiscount(item.lineId, 0);
                }}
                className="w-14 sm:w-16 h-8 text-xs bg-zinc-950 border-zinc-700 text-center font-bold"
              />
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-[10px] text-zinc-500">Nilai Sewa</p>
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
            onChange={(e) => onUpdateFootnote(item.lineId, e.target.value)}
            className="flex-1 h-8 text-xs bg-zinc-950 border-zinc-700"
          />
        </div>
      </div>
    </div>
  );
}

