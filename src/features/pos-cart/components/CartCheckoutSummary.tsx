"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRupiah } from "@/shared/lib/formatters";

interface CartCheckoutSummaryProps {
  rentalDays: number | "";
  onRentalDaysChange: (val: number | "") => void;
  discountPercentage: number | "";
  onDiscountPercentageChange: (val: number | "") => void;
  discountDesc: string;
  onDiscountDescChange: (val: string) => void;
  subTotal: number;
  discountAmount: number;
  grandTotal: number;
  isSubmitting: boolean;
  isDisabled: boolean;
}

export function CartCheckoutSummary({
  rentalDays,
  onRentalDaysChange,
  discountPercentage,
  onDiscountPercentageChange,
  discountDesc,
  onDiscountDescChange,
  subTotal,
  discountAmount,
  grandTotal,
  isSubmitting,
  isDisabled,
}: CartCheckoutSummaryProps) {
  return (
    <div className="mt-auto pt-4 border-t border-zinc-800 flex flex-col gap-3 shrink-0">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] text-zinc-400">Durasi (Hari)</Label>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={rentalDays}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || /^\d+$/.test(val)) {
                onRentalDaysChange(val === "" ? "" : parseInt(val));
              }
            }}
            onBlur={() => {
              if (rentalDays === "" || Number(rentalDays) < 1) onRentalDaysChange(1);
            }}
            className="h-8 text-xs bg-zinc-950 border-zinc-700 text-center font-bold"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-zinc-400">Diskon (%)</Label>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={discountPercentage}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || /^\d+$/.test(val)) {
                onDiscountPercentageChange(
                  val === "" ? "" : Math.min(100, parseInt(val))
                );
              }
            }}
            onBlur={() => {
              if (discountPercentage === "" || Number(discountPercentage) < 0)
                onDiscountPercentageChange(0);
            }}
            className="h-8 text-xs bg-zinc-950 border-zinc-700 text-center font-bold"
          />
        </div>
        <div className="space-y-1 col-span-2">
          <Label className="text-[10px] text-zinc-400">Keterangan Diskon</Label>
          <Input
            type="text"
            placeholder="Misal: Promo Tahunan"
            value={discountDesc}
            onChange={(e) => onDiscountDescChange(e.target.value)}
            disabled={Number(discountPercentage) <= 0}
            className="h-8 text-xs bg-zinc-950 border-zinc-700"
          />
        </div>
      </div>

      <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
        <div className="flex justify-between items-center text-sm text-zinc-400 mb-1">
          <span>Subtotal:</span>
          <span>{formatRupiah(subTotal)}</span>
        </div>
        {Number(discountPercentage) > 0 && (
          <div className="flex justify-between items-center text-sm text-amber-400 mb-1">
            <span>Diskon ({discountPercentage}%):</span>
            <span>-{formatRupiah(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-2 border-t border-zinc-800/50 mt-1">
          <span className="text-sm font-bold text-zinc-300">Total Tagihan:</span>
          <span className="text-lg font-bold text-emerald-400">{formatRupiah(grandTotal)}</span>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isDisabled || isSubmitting}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold h-10 shrink-0"
      >
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        {isSubmitting ? "Memproses..." : "Proses Sewa (Rental)"}
      </Button>
    </div>
  );
}

