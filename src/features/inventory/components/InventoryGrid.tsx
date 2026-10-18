"use client";

import React, { useState } from "react";
import { Eye, ShoppingCart } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatRupiah } from "@/shared/lib/formatters";
import { AddToPackageDialog } from "@/features/packages";
import { EditItemDialog } from "./EditItemDialog";
import { DeleteItemDialog } from "./DeleteItemDialog";
import { ItemDetailBarcodeDialog } from "./ItemDetailBarcodeDialog";
import { InventoryFilterBar } from "./InventoryFilterBar";
import { useInventoryFilter } from "../hooks/useInventoryFilter";
import type { Item, Category } from "../types";

interface InventoryGridProps {
  items: Item[];
  categories: Category[];
  packages?: any[];
  isAdmin: boolean;
  isDummyUser: boolean;
  onAddToCart?: (item: Item) => void;
  onTriggerDemoWarning?: (action: "add" | "edit" | "delete" | "batch") => void;
}

export function InventoryGrid({
  items,
  categories,
  packages = [],
  isAdmin,
  isDummyUser,
  onAddToCart,
  onTriggerDemoWarning,
}: InventoryGridProps) {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    currentItems,
    totalPages,
    totalItems,
  } = useInventoryFilter({ items, categories, initialLayer: "all_items" });

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedItemDetail, setSelectedItemDetail] = useState<Item | null>(null);

  const handleCartClick = (item: Item) => {
    if (item.quantity <= 0) return;
    onAddToCart?.(item);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-zinc-100">Semua Barang</h2>
        
        <InventoryFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
          categories={categories}
          isAdmin={isAdmin}
          isDummyUser={isDummyUser}
          onTriggerDemoWarning={onTriggerDemoWarning}
          showBatchButton={true}
        />
      </div>

      {/* Render Grid Data Barang */}
      {currentItems.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {currentItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60 transition-all flex flex-col min-h-[250px] sm:min-h-[320px] overflow-hidden shadow-lg"
              >
                <div className="h-32 sm:h-48 w-full bg-zinc-950/50 relative group overflow-hidden border-b border-zinc-800">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      onClick={() => setSelectedImage(item.imageUrl!)}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 cursor-pointer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700">
                      <span className="text-xs font-bold uppercase tracking-widest border border-zinc-800 px-3 py-1 rounded-full">
                        No Image
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1 max-w-[70%]">
                    {item.categories?.map((cat) => (
                      <span
                        key={cat.id}
                        className="inline-flex items-center rounded-md bg-zinc-950/80 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-300 ring-1 ring-inset ring-zinc-700/50 backdrop-blur-sm"
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col gap-1 items-end">
                    {item.quantity > 0 && (
                      <span className="text-[8px] sm:text-[10px] font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded tracking-wider shadow-lg backdrop-blur-md bg-emerald-950/80 text-emerald-400 ring-1 ring-emerald-500/30">
                        <span className="hidden sm:inline">Tersedia: </span>
                        {item.quantity}
                      </span>
                    )}
                    {item.rentedQuantity > 0 && (
                      <span className="text-[8px] sm:text-[10px] font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded tracking-wider shadow-lg backdrop-blur-md bg-amber-950/80 text-amber-400 ring-1 ring-amber-500/30">
                        <span className="hidden sm:inline">Keluar: </span>
                        {item.rentedQuantity}
                      </span>
                    )}
                    {item.maintenanceQuantity > 0 && (
                      <span className="text-[8px] sm:text-[10px] font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded tracking-wider shadow-lg backdrop-blur-md bg-red-950/80 text-red-400 ring-1 ring-red-500/30">
                        MT: {item.maintenanceQuantity}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 sm:p-5 flex flex-col flex-1">
                  <h2
                    className="text-base sm:text-xl font-bold truncate text-zinc-100 cursor-pointer hover:text-blue-400 transition-colors"
                    onClick={() => setSelectedItemDetail(item)}
                    title="Lihat Detail"
                  >
                    {item.name}
                  </h2>
                  <p className="text-xs sm:text-sm font-mono text-zinc-500 mb-2 sm:mb-3">{item.code}</p>
                  <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2 mb-2 hidden sm:block">
                    {item.description || "Tidak ada deskripsi."}
                  </p>

                  {item.createdAt ? (
                    <p className="text-[9px] sm:text-[11px] text-zinc-500 mb-2 sm:mb-4 font-medium hidden sm:block">
                      Ditambahkan:{" "}
                      {new Date(item.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  ) : (
                    <div className="mb-2 sm:mb-4 hidden sm:block" />
                  )}

                  <div className="bg-zinc-950/50 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 border border-zinc-800/50">
                    <p className="text-[10px] sm:text-xs font-semibold text-zinc-400 border-b border-zinc-800/50 pb-1 mb-1.5 sm:mb-2">
                      Valuasi Item
                    </p>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[9px] sm:text-[11px] text-zinc-500">Satuan</p>
                      <p className="text-[10px] sm:text-xs font-medium text-zinc-300">
                        {formatRupiah(item.price || 0)}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mb-1 hidden sm:flex">
                      <p className="text-[9px] sm:text-[11px] text-zinc-500">Total</p>
                      <p className="text-[10px] sm:text-xs font-bold text-blue-400">
                        {formatRupiah(
                          (item.quantity + item.rentedQuantity + item.maintenanceQuantity) * (item.price || 0)
                        )}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-1 sm:mt-0">
                      <p className="text-[9px] sm:text-[11px] text-zinc-500">
                        Sewa <span className="hidden sm:inline">({item.rentPercentage || 0}%)</span>
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-emerald-400">
                        {formatRupiah(((item.price || 0) * (item.rentPercentage || 0)) / 100)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row justify-between items-start sm:items-end border-t border-zinc-800/50 pt-3 sm:pt-4 mt-auto gap-3 sm:gap-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setSelectedItemDetail(item)}
                        className="flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors border border-zinc-700 shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" /> <span className="inline">Detail</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCartClick(item)}
                        disabled={item.quantity <= 0}
                        title={
                          item.quantity > 0
                            ? `Tambah ${item.name} ke Keranjang Kasir`
                            : "Stok gudang tidak tersedia"
                        }
                        className={`flex items-center justify-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors border shadow-sm ${
                          item.quantity > 0
                            ? "bg-emerald-950/50 hover:bg-emerald-900/80 text-emerald-400 border-emerald-800/80 hover:text-emerald-300 cursor-pointer"
                            : "bg-zinc-900/40 text-zinc-600 border-zinc-800/40 cursor-not-allowed opacity-40"
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span className="inline">Keranjang</span>
                      </button>
                      {(isAdmin || isDummyUser) && (
                        <>
                          <EditItemDialog item={item} allCategories={categories} />
                          <DeleteItemDialog item={item} />
                          <AddToPackageDialog item={item} packages={packages} />
                        </>
                      )}
                    </div>
                    <div className="flex items-center sm:block w-full justify-between sm:text-right">
                      <p className="text-[10px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider block sm:hidden">
                        Total Unit:
                      </p>
                      <div className="flex flex-col items-end">
                        <p className="text-xl sm:text-3xl font-black leading-none text-zinc-50">
                          {item.quantity + item.rentedQuantity + item.maintenanceQuantity}
                        </p>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-1 hidden sm:block">
                          Total Unit
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 border-t border-zinc-800 pt-6">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span>Menampilkan</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-100 outline-none focus:ring-1 focus:ring-zinc-500 cursor-pointer"
              >
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
                <option value={50}>50</option>
              </select>
              <span>dari {totalItems} aset</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sebelumnya
              </button>
              <span className="text-sm text-zinc-400 px-2 font-medium">
                Halaman {currentPage} dari {totalPages || 1}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-16 text-zinc-500 bg-zinc-900/20 rounded-xl border border-zinc-800">
          Tidak ada barang yang ditemukan pada tab dan label ini.
        </div>
      )}

      {/* POPUP PREVIEW FOTO */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent
          aria-describedby={undefined}
          className="bg-zinc-950/95 border-zinc-800 p-2 rounded-2xl shadow-2xl max-w-4xl flex justify-center items-center"
        >
          <DialogTitle className="sr-only">Preview Foto Aset</DialogTitle>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Preview"
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* POPUP DETAIL ASET */}
      <ItemDetailBarcodeDialog
        item={selectedItemDetail}
        isOpen={!!selectedItemDetail}
        onClose={() => setSelectedItemDetail(null)}
        onAddToCart={(item) => {
          handleCartClick(item);
          setSelectedItemDetail(null);
        }}
        onSelectImage={(url) => setSelectedImage(url)}
      />
    </div>
  );
}

