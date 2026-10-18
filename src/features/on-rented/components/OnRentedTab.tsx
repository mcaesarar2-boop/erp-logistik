"use client";

import { useMemo } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import { AddCategoryDialog, EditCategoryDialog, DeleteCategoryDialog, useBarcodeScanner, useInventoryFilter } from "@/features/inventory";
import { RentalInvoiceDialog } from "@/features/transactions";
import { ReturnRentalDialog } from "./ReturnRentalDialog";
import { SyncEventButton } from "./SyncEventButton";
import { ActiveEventCardList } from "./ActiveEventCardList";
import { FlatRentedItemTable } from "./FlatRentedItemTable";
import { useOnRentedEvents } from "../hooks/useOnRentedEvents";
import type { Item, Category, History } from "../types";

interface OnRentedTabProps {
  items: Item[];
  categories: Category[];
  histories: History[];
  isAdmin: boolean;
  isDummyUser: boolean;
  onNavigateToEvents?: () => void;
  onAddToCart?: (item: Item) => void;
  onTriggerDemoWarning?: (action: "add" | "edit" | "delete" | "batch") => void;
}

export function OnRentedTab({
  items,
  categories,
  histories,
  isAdmin,
  isDummyUser,
  onNavigateToEvents,
  onAddToCart,
  onTriggerDemoWarning,
}: OnRentedTabProps) {
  // Inventory filter hook specifically for rented layer
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
    itemsToDisplay,
  } = useInventoryFilter({ items, categories, initialLayer: "rented" });

  // On-rented events hook
  const {
    activeEvents,
    isSyncing,
    syncToastMsg,
    handleSyncData,
    copiedEventId,
    handleCopyEvent,
  } = useOnRentedEvents({
    histories,
    items,
    isDummyUser,
    onTriggerDemoWarning,
  });

  const { barcodeQuery, setBarcodeQuery, inputRef, handleKeyDown } = useBarcodeScanner({
    onScan: (scannedCode) => {
      setSearchQuery(scannedCode);
    },
  });

  const currentCategoryObj = categories.find((c) => c.id === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-zinc-100">
          Barang Sedang Keluar (Rented)
        </h2>

        <div className="flex items-center gap-3 bg-zinc-900/50 p-2 px-3 rounded-lg border border-zinc-800 shadow-sm flex-wrap">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Cari barang atau label..."
            className="bg-transparent border-none outline-none text-sm text-zinc-100 placeholder:text-zinc-600 w-32 focus:w-48 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="w-px h-4 bg-zinc-700 mx-1" />

          {/* Input Barcode Scanner */}
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

          {/* Select Category */}
          <select
            id="categoryFilterRented"
            className="bg-zinc-950 text-zinc-100 text-sm border border-zinc-700 rounded-md outline-none focus:ring-1 focus:ring-zinc-500 cursor-pointer p-1.5 max-w-[140px] truncate"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">-- Semua Label --</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <div className="w-px h-4 bg-zinc-700 mx-1" />

          {/* Select Sort */}
          <ArrowUpDown className="w-4 h-4 text-zinc-500 hidden sm:block" />
          <select
            className="bg-zinc-950 text-zinc-100 text-sm border border-zinc-700 rounded-md outline-none focus:ring-1 focus:ring-zinc-500 cursor-pointer p-1.5"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
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

          {(isAdmin || isDummyUser) && selectedCategory !== "ALL" && currentCategoryObj && (
            <>
              <EditCategoryDialog category={currentCategoryObj} />
              <DeleteCategoryDialog category={currentCategoryObj} />
            </>
          )}

          <div className="w-px h-4 bg-zinc-700 mx-1 hidden sm:block" />
          <SyncEventButton
            isSyncing={isSyncing}
            onSync={handleSyncData}
            syncToastMsg={syncToastMsg}
          />
          <ReturnRentalDialog items={itemsToDisplay} />
          <RentalInvoiceDialog items={itemsToDisplay} />
        </div>
      </div>

      {/* Daftar Event / Acara Aktif */}
      <ActiveEventCardList
        activeEvents={activeEvents}
        items={items}
        isAdmin={isAdmin}
        isDummyUser={isDummyUser}
        copiedEventId={copiedEventId}
        onCopyEvent={handleCopyEvent}
        onNavigateToEvents={onNavigateToEvents}
      />

      {/* Akumulasi Seluruh Barang Keluar (Flat List) */}
      <FlatRentedItemTable
        items={itemsToDisplay}
        categories={categories}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        isAdmin={isAdmin}
        isDummyUser={isDummyUser}
        onAddToCart={onAddToCart}
      />
    </div>
  );
}

