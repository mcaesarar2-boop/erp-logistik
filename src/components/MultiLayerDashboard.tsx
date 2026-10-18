"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { ShoppingCart } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { HighlightOverview } from "@/features/highlight";
import { usePosCart } from "@/features/pos-cart";
import { DemoRestrictionDialog } from "@/shared/components/DemoRestrictionDialog";
import { useAuthPermission } from "@/shared/hooks/useAuthPermission";
import type { Item, Category, History, PackageTemplate } from "@/shared/types/common";

// Minimal dark-mode loading skeleton for code-split tabs
function TabLoadingSkeleton({ label }: { label: string }) {
  return (
    <div className="w-full py-20 flex flex-col items-center justify-center space-y-3 animate-pulse">
      <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-emerald-500 animate-spin" />
      <span className="text-xs font-medium text-zinc-400">
        Memuat modul {label}...
      </span>
    </div>
  );
}

// Lazy-loaded tab components via next/dynamic for initial bundle reduction
const InventoryGrid = dynamic(
  () => import("@/features/inventory").then((mod) => mod.InventoryGrid),
  { loading: () => <TabLoadingSkeleton label="Inventaris Aset" />, ssr: false }
);

const OnRentedTab = dynamic(
  () => import("@/features/on-rented").then((mod) => mod.OnRentedTab),
  { loading: () => <TabLoadingSkeleton label="Barang Keluar & Event" />, ssr: false }
);

const MaintenanceTable = dynamic(
  () => import("@/features/maintenance").then((mod) => mod.MaintenanceTable),
  { loading: () => <TabLoadingSkeleton label="Pemeliharaan" />, ssr: false }
);

const TransactionHistoryTable = dynamic(
  () => import("@/features/transactions").then((mod) => mod.TransactionHistoryTable),
  { loading: () => <TabLoadingSkeleton label="Riwayat Transaksi" />, ssr: false }
);

const PackageCatalogGrid = dynamic(
  () => import("@/features/packages").then((mod) => mod.PackageCatalogGrid),
  { loading: () => <TabLoadingSkeleton label="Katalog Paket" />, ssr: false }
);

const EventManagementTab = dynamic(
  () => import("@/features/event-management").then((mod) => mod.EventManagementTab),
  { loading: () => <TabLoadingSkeleton label="Event Management" />, ssr: false }
);

interface MultiLayerDashboardProps {
  items: Item[];
  categories: Category[];
  histories: History[];
  packages: PackageTemplate[];
  masterCategories?: { id: string; name: string }[];
  masterLabels?: { id: string; name: string }[];
  initialEventDetails?: any[];
}

export default function MultiLayerDashboard({
  items,
  categories,
  histories,
  packages,
  masterCategories = [],
  masterLabels = [],
  initialEventDetails = [],
}: MultiLayerDashboardProps) {
  const [activeLayer, setActiveLayer] = useState<
    "home" | "all_items" | "rented" | "maintenance" | "history" | "packages" | "events"
  >("home");

  const [addingToCartPkg, setAddingToCartPkg] = useState<PackageTemplate | null>(null);
  const [cartSuccessMsg, setCartSuccessMsg] = useState(false);
  const [addedItemName, setAddedItemName] = useState<string | null>(null);

  // POS Cart Context
  const { setExternalAddItem, setExternalPkgId } = usePosCart();

  // Auth permissions
  const { isAdmin, isDummyUser, demoModalOpen, setDemoModalOpen, demoModalContent, triggerDemoWarning } =
    useAuthPermission();

  // Handler Tambah Item ke POS Keranjang Kasir via Context
  const handleAddItemToCart = (item: Item) => {
    if (item.quantity <= 0) return;
    setExternalAddItem(item);
    setAddedItemName(item.name);
    setCartSuccessMsg(true);
  };

  const TABS = [
    { id: "home", label: "Home (Highlight)" },
    { id: "all_items", label: "All Items" },
    { id: "rented", label: "On Rented" },
    { id: "maintenance", label: "Maintenance" },
    { id: "history", label: "Riwayat Transaksi" },
    { id: "packages", label: "Katalog Paket" },
    { id: "events", label: "Event Management" },
  ] as const;

  return (
    <div className="w-full">
      {/* Navigasi Tabs */}
      <div className="border-b border-zinc-800 mb-6">
        <nav className="flex gap-4 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveLayer(tab.id)}
              className={`py-3 px-4 whitespace-nowrap font-semibold text-sm transition-colors cursor-pointer ${
                activeLayer === tab.id
                  ? "border-b-2 border-zinc-100 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300 border-b-2 border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Layer 1: Home (Highlight) - Loaded directly without lazy delay */}
      {activeLayer === "home" && <HighlightOverview items={items} />}

      {/* Layer 2: All Items (Inventaris Utama) */}
      {activeLayer === "all_items" && (
        <InventoryGrid
          items={items}
          categories={categories}
          packages={packages}
          isAdmin={isAdmin}
          isDummyUser={isDummyUser}
          onAddToCart={handleAddItemToCart}
          onTriggerDemoWarning={triggerDemoWarning}
        />
      )}

      {/* Layer 3: On Rented (Barang Keluar & Event Aktif) */}
      {activeLayer === "rented" && (
        <OnRentedTab
          items={items}
          categories={categories}
          histories={histories}
          isAdmin={isAdmin}
          isDummyUser={isDummyUser}
          onNavigateToEvents={() => setActiveLayer("events")}
          onAddToCart={handleAddItemToCart}
          onTriggerDemoWarning={triggerDemoWarning}
        />
      )}

      {/* Layer 4: Maintenance */}
      {activeLayer === "maintenance" && (
        <MaintenanceTable items={items} categories={categories} />
      )}

      {/* Layer 5: Riwayat Transaksi */}
      {activeLayer === "history" && (
        <TransactionHistoryTable histories={histories} items={items} isAdmin={isAdmin} />
      )}

      {/* Layer 6: Katalog Paket */}
      {activeLayer === "packages" && (
        <PackageCatalogGrid
          packages={packages}
          items={items}
          masterCategories={masterCategories}
          masterLabels={masterLabels}
          onAddToCart={(pkg) => setAddingToCartPkg(pkg)}
        />
      )}

      {/* Layer 7: Event Management Workspace */}
      {activeLayer === "events" && (
        <EventManagementTab
          histories={histories}
          items={items}
          initialEventDetails={initialEventDetails}
        />
      )}

      {/* KOTAK POPUP KONFIRMASI KE KERANJANG DARI PAKET */}
      <Dialog open={!!addingToCartPkg} onOpenChange={(open) => !open && setAddingToCartPkg(null)}>
        <DialogContent aria-describedby={undefined} className="bg-zinc-950 border-zinc-800 text-zinc-50">
          <DialogTitle className="text-emerald-400 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Masukkan ke Keranjang?
          </DialogTitle>
          <p className="text-sm text-zinc-400 mt-2">
            Apakah Anda yakin ingin memasukkan seluruh aset dari paket <strong>&quot;{addingToCartPkg?.name}&quot;</strong> ke Keranjang Kasir?
          </p>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <button
              onClick={() => setAddingToCartPkg(null)}
              className="h-10 border border-zinc-800 text-zinc-400 hover:bg-zinc-900 rounded-md transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={() => {
                if (addingToCartPkg) {
                  setExternalPkgId(addingToCartPkg.id);
                  setAddingToCartPkg(null);
                  setCartSuccessMsg(true);
                }
              }}
              className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex justify-center items-center transition-colors font-medium cursor-pointer"
            >
              Ya, Masukkan
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* KOTAK POPUP SUKSES MASUK KERANJANG */}
      <Dialog
        open={cartSuccessMsg}
        onOpenChange={(open) => {
          setCartSuccessMsg(open);
          if (!open) setAddedItemName(null);
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          className="bg-zinc-950 border-zinc-800 text-zinc-50 sm:max-w-sm flex flex-col items-center justify-center p-6 text-center"
        >
          <DialogTitle className="sr-only">Sukses</DialogTitle>
          <div className="w-12 h-12 rounded-full bg-emerald-950/50 flex items-center justify-center mb-2 border border-emerald-900">
            <ShoppingCart className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-zinc-100">Berhasil Ditambahkan!</h3>
          <p className="text-sm text-zinc-400 mt-2">
            {addedItemName ? (
              <span>
                Aset <strong>&quot;{addedItemName}&quot;</strong> telah dimasukkan ke Keranjang Kasir.
              </span>
            ) : (
              <span>Seluruh aset telah dimasukkan ke Keranjang Kasir.</span>
            )}{" "}
            Silakan buka <strong>Keranjang Kasir</strong> di bagian atas untuk meninjau dan memproses sewa.
          </p>
          <button
            onClick={() => {
              setCartSuccessMsg(false);
              setAddedItemName(null);
            }}
            className="mt-6 w-full h-10 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-md border border-zinc-800 transition-colors font-medium cursor-pointer"
          >
            Tutup
          </button>
        </DialogContent>
      </Dialog>

      {/* MODAL RESTRIKSI AKUN DEMO */}
      <DemoRestrictionDialog
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        title={demoModalContent.title}
        message={demoModalContent.message}
      />
    </div>
  );
}