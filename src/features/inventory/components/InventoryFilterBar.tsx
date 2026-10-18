"use client";

import React, { useState } from "react";
import { Search, ArrowUpDown, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AddCategoryDialog } from "./AddCategoryDialog";
import { EditCategoryDialog } from "./EditCategoryDialog";
import { DeleteCategoryDialog } from "./DeleteCategoryDialog";
import { batchRegenerateCodes } from "../actions/inventoryActions";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";
import type { Category, SortOption } from "../types";

interface InventoryFilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
  sortBy: SortOption;
  onSortChange: (val: SortOption) => void;
  categories: Category[];
  isAdmin: boolean;
  isDummyUser: boolean;
  onTriggerDemoWarning?: (action: "add" | "edit" | "delete" | "batch") => void;
  showBatchButton?: boolean;
}

export function InventoryFilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  categories,
  isAdmin,
  isDummyUser,
  onTriggerDemoWarning,
  showBatchButton = true,
}: InventoryFilterBarProps) {
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [isBatchLoading, setIsBatchLoading] = useState(false);

  const { barcodeQuery, setBarcodeQuery, inputRef, handleKeyDown } = useBarcodeScanner({
    onScan: (scannedCode) => {
      onSearchChange(scannedCode);
    },
  });

  const currentCategoryObj = categories.find((c) => c.id === selectedCategory);

  const handleBatchRegenerate = async () => {
    if (isDummyUser) {
      setShowBatchDialog(false);
      onTriggerDemoWarning?.("batch");
      return;
    }
    setIsBatchLoading(true);
    try {
      const res = await batchRegenerateCodes();
      if (res && res.success) {
        setShowBatchDialog(false);
      } else if (res && "error" in res) {
        alert(res.error ?? "Gagal memperbarui kode masal.");
      }
    } finally {
      setIsBatchLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 bg-zinc-900/50 p-2 px-3 rounded-lg border border-zinc-800 shadow-sm flex-wrap">
        <Search className="w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Cari barang atau label..."
          className="bg-transparent border-none outline-none text-sm text-zinc-100 placeholder:text-zinc-600 w-32 focus:w-48 transition-all"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <div className="w-px h-4 bg-zinc-700 mx-1" />

        {/* --- INPUT BARCODE SCANNER --- */}
        <div
          className="flex items-center gap-2 bg-zinc-950 px-2 py-1 rounded border border-zinc-700 focus-within:border-emerald-500/50 transition-colors"
          title="Arahkan kursor ke sini untuk menggunakan Barcode Scanner fisik"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 text-emerald-500"
          >
            <path d="M3 5v14" />
            <path d="M8 5v14" />
            <path d="M12 5v14" />
            <path d="M17 5v14" />
            <path d="M21 5v14" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Scan Barcode..."
            className="bg-transparent border-none outline-none text-sm text-emerald-400 placeholder:text-zinc-600 w-28 focus:w-36 transition-all font-mono"
            value={barcodeQuery}
            onChange={(e) => setBarcodeQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="w-px h-4 bg-zinc-700 mx-1 hidden sm:block" />

        {/* Dropdown Kategori */}
        <select
          id="categoryFilter"
          className="bg-zinc-950 text-zinc-100 text-sm border border-zinc-700 rounded-md outline-none focus:ring-1 focus:ring-zinc-500 cursor-pointer p-1.5 max-w-[140px] truncate"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="ALL">-- Semua Label --</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <div className="w-px h-4 bg-zinc-700 mx-1" />

        {/* Dropdown Pengurutan (Sort) */}
        <ArrowUpDown className="w-4 h-4 text-zinc-500 hidden sm:block" />
        <select
          className="bg-zinc-950 text-zinc-100 text-sm border border-zinc-700 rounded-md outline-none focus:ring-1 focus:ring-zinc-500 cursor-pointer p-1.5"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
        >
          <option value="name_asc">Abjad (A-Z)</option>
          <option value="name_desc">Abjad (Z-A)</option>
          <option value="qty_highest">Terbanyak</option>
          <option value="qty_lowest">Paling Sedikit</option>
          <option value="date_modified_desc">Terbaru Diubah</option>
          <option value="date_modified_asc">Terlama Diubah</option>
          <option value="price_highest">Harga Tertinggi</option>
          <option value="price_lowest">Harga Terendah</option>
        </select>

        {(isAdmin || isDummyUser) && <AddCategoryDialog />}

        {/* Tombol Aksi Kategori hanya muncul jika filter bukan 'ALL' */}
        {(isAdmin || isDummyUser) && selectedCategory !== "ALL" && currentCategoryObj && (
          <>
            <EditCategoryDialog category={currentCategoryObj} />
            <DeleteCategoryDialog category={currentCategoryObj} />
          </>
        )}

        {/* Tombol Batch Rapikan Kode */}
        {(isAdmin || isDummyUser) && showBatchButton && (
          <>
            <div className="w-px h-4 bg-zinc-700 mx-1 hidden sm:block" />
            <button
              onClick={() => setShowBatchDialog(true)}
              className="flex items-center gap-2 bg-indigo-950/50 text-indigo-400 hover:bg-indigo-900 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border border-indigo-900 shadow-sm whitespace-nowrap"
            >
              Rapikan Semua Kode
            </button>
          </>
        )}
      </div>

      {/* POPUP BATCH REGENERATE KODE */}
      <Dialog open={showBatchDialog} onOpenChange={(open) => !open && setShowBatchDialog(false)}>
        <DialogContent aria-describedby={undefined} className="bg-zinc-950 border-zinc-800 text-zinc-50">
          <DialogTitle className="text-indigo-400">Format Ulang Semua Kode Aset?</DialogTitle>
          <p className="text-sm text-zinc-400 mt-2">
            Tindakan ini akan <strong>mengubah seluruh kode aset saat ini</strong> secara otomatis
            menggunakan format baru (Contoh: <code>AUD-BCL-001</code>) berdasarkan label yang
            terpasang pada masing-masing barang.
          </p>
          <div className="bg-amber-950/50 border border-amber-900/50 p-3 rounded-md mt-4">
            <p className="text-sm text-amber-400 font-medium">Perhatian:</p>
            <p className="text-xs text-amber-500/80 mt-1">
              Jika Anda sudah mencetak label barcode/QR fisik menggunakan kode lama, fisik label
              tersebut tidak akan sinkron lagi dengan sistem setelah proses ini. Pastikan Anda siap
              mencetak ulang label jika diperlukan.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <button
              onClick={() => setShowBatchDialog(false)}
              className="h-10 border border-zinc-800 text-zinc-400 hover:bg-zinc-900 rounded-md"
            >
              Batal
            </button>
            <button
              onClick={handleBatchRegenerate}
              disabled={isBatchLoading}
              className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md flex justify-center items-center"
            >
              {isBatchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Format Ulang"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

