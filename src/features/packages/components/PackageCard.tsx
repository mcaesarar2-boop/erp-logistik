"use client";

import React from "react";
import { PackageTemplate } from "../types";
import { Item } from "@/shared/types/common";
import { formatRupiah } from "@/shared/lib/formatters";
import { groupItemsByPrimaryCategory } from "@/lib/grouping";
import { EditPackageDialog } from "./EditPackageDialog";
import { PrintPackageDialog } from "./PrintPackageDialog";
import { Trash2, Copy, Check, ShoppingCart } from "lucide-react";

export interface PackageCardProps {
  pkg: PackageTemplate;
  items: Item[];
  masterCategories?: { id: string; name: string }[];
  masterLabels?: { id: string; name: string }[];
  isAdmin: boolean;
  isDummyUser: boolean;
  copiedPackageId: string | null;
  onCopyPackage: (pkg: PackageTemplate) => void;
  onDeletePackage: (pkg: PackageTemplate) => void;
  onAddToCart: (pkg: PackageTemplate) => void;
  onSelectImage?: (imgUrl: string) => void;
}

export function PackageCard({
  pkg,
  items,
  masterCategories = [],
  masterLabels = [],
  isAdmin,
  isDummyUser,
  copiedPackageId,
  onCopyPackage,
  onDeletePackage,
  onAddToCart,
  onSelectImage,
}: PackageCardProps) {
  const payloadData: any[] = pkg.payload ? JSON.parse(pkg.payload) : [];

  const totalPackageRent = payloadData.reduce((acc: number, pItem: any) => {
    const itemDetail = items.find((i) => i.id === pItem.id);
    if (!itemDetail) return acc;
    const rentPrice = ((itemDetail.price || 0) * (itemDetail.rentPercentage || 0)) / 100;
    const discount =
      typeof pItem.discount === "number" ? Math.max(0, Math.min(100, pItem.discount)) : 0;
    const netRentPrice = rentPrice * (1 - discount / 100);
    return acc + netRentPrice * pItem.qty;
  }, 0);

  const packageItems = payloadData
    .map((pItem: any) => {
      const itemDetail = items.find((i) => i.id === pItem.id);
      if (!itemDetail) return null;
      return {
        ...itemDetail,
        lineId: pItem.lineId,
        pkgQty: pItem.qty,
        pkgFootnote: pItem.footnote,
        pkgDiscount: typeof pItem.discount === "number" ? pItem.discount : 0,
      };
    })
    .filter((item): item is NonNullable<typeof item> => !!item);

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col relative group hover:border-zinc-700/80 transition-colors">
      {/* Header Kartu */}
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-blue-400 mb-1 line-clamp-2">{pkg.name}</h3>

          {/* Barisan Badge Kategori Utama & Label Grade */}
          <div className="flex flex-wrap items-center gap-1.5 my-2">
            {pkg.kategoriUtama ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-600 text-white shadow-sm shadow-blue-900/50 tracking-wide uppercase">
                {pkg.kategoriUtama}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800/80 text-zinc-500 border border-zinc-700/40">
                Tanpa Kategori
              </span>
            )}

            {Array.isArray(pkg.labelGrade) &&
              pkg.labelGrade.length > 0 &&
              pkg.labelGrade.map((lbl, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-900 text-zinc-300 border border-zinc-700/60"
                >
                  {lbl}
                </span>
              ))}
          </div>

          <p className="text-xs text-zinc-500 line-clamp-2">
            {pkg.description || "Tidak ada deskripsi paket."}
          </p>
        </div>

        {(isAdmin || isDummyUser) && (
          <div className="flex gap-2 shrink-0 md:opacity-0 opacity-100 group-hover:opacity-100 transition-opacity z-10">
            <EditPackageDialog
              pkg={pkg}
              items={items}
              masterCategories={masterCategories}
              masterLabels={masterLabels}
            />
            <button
              onClick={() => onDeletePackage(pkg)}
              className="p-2 bg-red-950/50 hover:bg-red-900 text-red-400 rounded-md transition-colors shadow-sm cursor-pointer"
              title="Hapus Paket"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Rincian Item Paket */}
      <div className="bg-zinc-950/50 rounded-lg p-2.5 border border-zinc-800/50 max-h-44 overflow-y-auto mb-4 space-y-3">
        {groupItemsByPrimaryCategory(packageItems, items).map((group) => (
          <div key={group.categoryName} className="w-full">
            <div className="w-full flex items-center gap-1.5 pb-1 mb-1.5 border-b border-zinc-800/80">
              <span className="w-1.5 h-3 bg-blue-500 rounded-full shrink-0"></span>
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">
                {group.categoryName}
              </span>
              <span className="text-[9px] font-medium text-zinc-500 bg-zinc-900 px-1.5 py-0.2 rounded-full border border-zinc-800">
                {group.items.length}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              {group.items.map((item: any, idx: number) => {
                const lineId = item.lineId;
                const pkgItemData = payloadData.find((p: any) =>
                  lineId ? p.lineId === lineId : p.id === item.id
                );
                const qty = item.pkgQty ?? pkgItemData?.qty ?? 0;
                const footnote = item.pkgFootnote ?? pkgItemData?.footnote;
                const discount = item.pkgDiscount ?? pkgItemData?.discount ?? 0;
                const rentPrice = ((item.price || 0) * (item.rentPercentage || 0)) / 100;
                const itemImage =
                  item.imageUrl ||
                  pkgItemData?.imageUrl ||
                  items.find((i) => i.id === item.id)?.imageUrl;

                return (
                  <div
                    key={lineId || `${item.id}-${idx}`}
                    className="flex justify-between items-start text-xs py-1 border-b border-zinc-850/40 last:border-0 gap-2"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {itemImage ? (
                        <div
                          className="w-7 h-7 rounded border border-zinc-700 overflow-hidden shrink-0 cursor-pointer hover:opacity-75 transition-opacity"
                          onClick={() => onSelectImage && onSelectImage(itemImage)}
                          title="Lihat Foto"
                        >
                          <img src={itemImage} className="w-full h-full object-cover" alt="thumb" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded border border-zinc-800 bg-zinc-900 shrink-0 flex items-center justify-center text-[8px] text-zinc-600">
                          N/A
                        </div>
                      )}
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-zinc-300 truncate font-medium">{item.name}</span>
                          {discount === 100 ? (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-1.5 py-0.2 rounded">
                              FREE / Bonus
                            </span>
                          ) : discount > 0 ? (
                            <span className="text-[9px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-1.5 py-0.2 rounded">
                              Disc {discount}%
                            </span>
                          ) : null}
                        </div>
                        {footnote && (
                          <span
                            className="text-[10px] text-zinc-500 italic truncate"
                            title={footnote}
                          >
                            {footnote}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded text-[11px] mt-0.5">
                        {qty} Unit
                      </span>
                      {discount > 0 ? (
                        <span className="text-[10px] text-zinc-500 line-through mt-0.5">
                          {formatRupiah(rentPrice * qty)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Kartu */}
      <div className="mt-auto pt-4 border-t border-zinc-800 flex justify-between items-center">
        <div>
          <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
            Total Harga Sewa
          </span>
          <span className="text-lg font-bold text-emerald-400 leading-none">
            {formatRupiah(totalPackageRent)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => onCopyPackage(pkg)}
              className={`p-2 rounded-md transition-all shadow-sm cursor-pointer ${
                copiedPackageId === pkg.id
                  ? "bg-blue-950/80 border border-blue-700 text-blue-400"
                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              }`}
              title="Salin Data Paket (Markdown)"
            >
              {copiedPackageId === pkg.id ? (
                <Check className="w-4 h-4 text-blue-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            {copiedPackageId === pkg.id && (
              <div className="absolute -bottom-8 right-0 bg-blue-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-30 animate-in fade-in zoom-in-95 duration-150">
                Tersalin!
              </div>
            )}
          </div>
          <PrintPackageDialog pkg={pkg} items={items} />
          <button
            onClick={() => onAddToCart(pkg)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Ke Keranjang</span>
          </button>
        </div>
      </div>
    </div>
  );
}

