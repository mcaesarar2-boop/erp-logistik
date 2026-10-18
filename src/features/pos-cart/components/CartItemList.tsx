"use client";

import { CartItemRow } from "./CartItemRow";
import type { CartItem } from "../types";

interface CartItemListProps {
  groupedCart: {
    categoryName: string;
    items: CartItem[];
  }[];
  safeRentalDays: number;
  onUpdateQty: (lineId: string, newQty: any) => void;
  onUpdateDiscount: (lineId: string, newDiscount: any) => void;
  onUpdateFootnote: (lineId: string, footnote: string) => void;
  onRemove: (lineId: string) => void;
}

export function CartItemList({
  groupedCart,
  safeRentalDays,
  onUpdateQty,
  onUpdateDiscount,
  onUpdateFootnote,
  onRemove,
}: CartItemListProps) {
  return (
    <div className="space-y-4">
      {groupedCart.map((group) => (
        <div key={group.categoryName} className="w-full">
          {/* Section Header Kategori Utama */}
          <div className="w-full flex items-center gap-2 pb-1.5 mb-2.5 border-b border-zinc-800">
            <span className="w-1.5 h-3.5 bg-emerald-500 rounded-full shrink-0" />
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              {group.categoryName}
            </h4>
            <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-full">
              {group.items.length} {group.items.length > 1 ? "items" : "item"}
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {group.items.map((item) => (
              <CartItemRow
                key={item.lineId || item.id}
                item={item}
                safeRentalDays={safeRentalDays}
                onUpdateQty={onUpdateQty}
                onUpdateDiscount={onUpdateDiscount}
                onUpdateFootnote={onUpdateFootnote}
                onRemove={onRemove}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

