"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ShoppingCart } from "lucide-react";
import Barcode from "react-barcode";
import { formatRupiah } from "@/shared/lib/formatters";
import type { Item } from "../types";

interface ItemDetailBarcodeDialogProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (item: Item) => void;
  onSelectImage?: (imageUrl: string) => void;
}

export function ItemDetailBarcodeDialog({
  item,
  isOpen,
  onClose,
  onAddToCart,
  onSelectImage,
}: ItemDetailBarcodeDialogProps) {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="bg-zinc-950 border-zinc-800 text-zinc-50 w-full max-w-xl sm:max-w-[600px] md:max-w-3xl max-h-[90vh] overflow-hidden overflow-x-hidden flex flex-col p-0"
      >
        <DialogTitle className="sr-only">Detail Aset</DialogTitle>
        <div className="relative h-48 sm:h-64 bg-zinc-900 border-b border-zinc-800 shrink-0">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => onSelectImage?.(item.imageUrl!)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-700">
              <span className="text-sm font-bold uppercase tracking-widest border border-zinc-800 px-4 py-2 rounded-full">
                No Image
              </span>
            </div>
          )}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {item.categories?.map((cat) => (
              <span
                key={cat.id}
                className="inline-flex items-center rounded-md bg-zinc-950/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300 ring-1 ring-inset ring-zinc-700/50 backdrop-blur-sm"
              >
                {cat.name}
              </span>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="flex flex-col gap-4 mb-4 border-b border-zinc-800/50 pb-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-100">{item.name}</h2>
              <p className="text-sm font-mono text-zinc-400">{item.code}</p>
            </div>

            {/* Visual Barcode CODE128 */}
            <div className="flex flex-col items-center justify-center bg-white py-3 px-6 sm:py-4 sm:px-8 rounded-md border border-zinc-200 select-none shadow-sm w-full sm:w-auto self-center mx-auto max-w-full overflow-x-hidden">
              <div className="flex flex-col items-center justify-center w-full max-w-full">
                <Barcode
                  value={item.code}
                  format="CODE128"
                  width={1.5}
                  height={50}
                  displayValue={true}
                  background="transparent"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Status Ketersediaan
                </p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center bg-emerald-950/20 border border-emerald-900/30 px-3 py-2 rounded-md">
                    <span className="text-sm text-zinc-300">Tersedia (Gudang)</span>
                    <span className="font-bold text-emerald-400">{item.quantity} Unit</span>
                  </div>
                  <div className="flex justify-between items-center bg-amber-950/20 border border-amber-900/30 px-3 py-2 rounded-md">
                    <span className="text-sm text-zinc-300">Sedang Keluar (Rental)</span>
                    <span className="font-bold text-amber-400">{item.rentedQuantity} Unit</span>
                  </div>
                  <div className="flex justify-between items-center bg-red-950/20 border border-red-900/30 px-3 py-2 rounded-md">
                    <span className="text-sm text-zinc-300">Maintenance (MT)</span>
                    <span className="font-bold text-red-400">{item.maintenanceQuantity} Unit</span>
                  </div>
                  <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-md mt-1">
                    <span className="text-sm font-bold text-zinc-100">Total Keseluruhan</span>
                    <span className="font-black text-zinc-50">
                      {item.quantity + item.rentedQuantity + item.maintenanceQuantity} Unit
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Informasi Valuasi & Harga
                </p>
                <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Harga Beli Satuan</span>
                    <span className="text-sm font-medium text-zinc-200">
                      {formatRupiah(item.price || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Persentase Sewa</span>
                    <span className="text-sm font-medium text-zinc-200">
                      {item.rentPercentage || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-zinc-800 mt-2">
                    <span className="text-sm font-bold text-zinc-300">Harga Sewa Satuan</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {formatRupiah(((item.price || 0) * (item.rentPercentage || 0)) / 100)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
                    <span className="text-sm font-bold text-zinc-300">Total Valuasi Aset</span>
                    <span className="text-sm font-bold text-blue-400">
                      {formatRupiah(
                        (item.quantity + item.rentedQuantity + item.maintenanceQuantity) *
                          (item.price || 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Deskripsi Aset
            </p>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-md p-3 text-sm text-zinc-300 min-h-[60px] whitespace-pre-wrap">
              {item.description || <span className="text-zinc-500 italic">Tidak ada deskripsi.</span>}
            </div>
          </div>

          {item.createdAt && (
            <p className="text-[10px] sm:text-xs text-zinc-500 mt-6 text-center">
              Ditambahkan ke sistem pada:{" "}
              {new Date(item.createdAt).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950 shrink-0 flex justify-end gap-2">
          {onAddToCart && (
            <button
              type="button"
              onClick={() => {
                onAddToCart(item);
                onClose();
              }}
              disabled={item.quantity <= 0}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 border shadow-sm ${
                item.quantity > 0
                  ? "bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 border-emerald-800 hover:text-emerald-300 cursor-pointer"
                  : "bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed opacity-50"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>+ Tambah ke Keranjang</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-md text-sm font-medium transition-colors border border-zinc-800 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

