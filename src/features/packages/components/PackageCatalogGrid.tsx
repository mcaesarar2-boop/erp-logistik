"use client";

import React, { useState } from "react";
import { PackageTemplate } from "../types";
import { Item } from "@/shared/types/common";
import { usePackageFilters } from "../hooks/usePackageFilters";
import { PackageFilterBar } from "./PackageFilterBar";
import { PackageCard } from "./PackageCard";
import { ManagePackageMasterDialog } from "@/features/master-data";
import { deletePackageTemplate } from "../actions/packageActions";
import { generateMarkdownPackage } from "@/shared/lib/markdownGenerators";
import { useAuthPermission } from "@/shared/hooks/useAuthPermission";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PackageSearch, Filter, X, Trash2, Loader2 } from "lucide-react";

export interface PackageCatalogGridProps {
  packages: PackageTemplate[];
  items: Item[];
  masterCategories?: { id: string; name: string }[];
  masterLabels?: { id: string; name: string }[];
  onAddToCart: (pkg: PackageTemplate) => void;
}

export function PackageCatalogGrid({
  packages,
  items,
  masterCategories = [],
  masterLabels = [],
  onAddToCart,
}: PackageCatalogGridProps) {
  const {
    selectedPkgCategory,
    setSelectedPkgCategory,
    selectedPkgLabels,
    setSelectedPkgLabels,
    pkgSearchQuery,
    setPkgSearchQuery,
    isLabelDropdownOpen,
    setIsLabelDropdownOpen,
    packageCategoryTabs,
    allAvailableLabels,
    filteredPackages,
    resetFilters,
    isFiltered,
  } = usePackageFilters(packages);

  const { isAdmin, isDummyUser } = useAuthPermission();

  const [copiedPackageId, setCopiedPackageId] = useState<string | null>(null);
  const [deletingPackage, setDeletingPackage] = useState<PackageTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleCopyPackage = (pkg: PackageTemplate) => {
    const text = generateMarkdownPackage(pkg, items);
    navigator.clipboard.writeText(text);
    setCopiedPackageId(pkg.id);
    setTimeout(() => setCopiedPackageId(null), 2500);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPackage) return;
    setIsDeleting(true);
    await deletePackageTemplate(deletingPackage.id);
    setIsDeleting(false);
    setDeletingPackage(null);
  };

  const handleToggleLabel = (label: string) => {
    if (selectedPkgLabels.includes(label)) {
      setSelectedPkgLabels(selectedPkgLabels.filter((l) => l !== label));
    } else {
      setSelectedPkgLabels([...selectedPkgLabels, label]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Katalog Paket */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <PackageSearch className="w-6 h-6 text-zinc-400" />
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Katalog Paket Rental</h2>
            <p className="text-xs text-zinc-400">
              Kelola dan telusuri template paket siap sewa berdasarkan kategori & grade.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <ManagePackageMasterDialog
            masterCategories={masterCategories}
            masterLabels={masterLabels}
          />
          <div className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
            <span>
              Total: <strong className="text-zinc-200">{packages.length}</strong> paket
            </span>
            {isFiltered && (
              <>
                <span className="text-zinc-600">|</span>
                <span className="text-blue-400 font-medium">
                  Filter: <strong>{filteredPackages.length}</strong> hasil
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <PackageFilterBar
        packages={packages}
        selectedCategory={selectedPkgCategory}
        onSelectCategory={setSelectedPkgCategory}
        selectedLabels={selectedPkgLabels}
        onToggleLabel={handleToggleLabel}
        onClearLabels={() => setSelectedPkgLabels([])}
        searchQuery={pkgSearchQuery}
        onSearchChange={setPkgSearchQuery}
        categoryTabs={packageCategoryTabs}
        allLabels={allAvailableLabels}
        isLabelDropdownOpen={isLabelDropdownOpen}
        onToggleLabelDropdown={() => setIsLabelDropdownOpen(!isLabelDropdownOpen)}
        onCloseLabelDropdown={() => setIsLabelDropdownOpen(false)}
        isFiltered={isFiltered}
        onResetAll={resetFilters}
      />

      {/* Grid Kartu Paket */}
      {filteredPackages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              items={items}
              masterCategories={masterCategories}
              masterLabels={masterLabels}
              isAdmin={isAdmin}
              isDummyUser={isDummyUser}
              copiedPackageId={copiedPackageId}
              onCopyPackage={handleCopyPackage}
              onDeletePackage={(p) => setDeletingPackage(p)}
              onAddToCart={onAddToCart}
              onSelectImage={(url) => setSelectedImage(url)}
            />
          ))}
        </div>
      ) : packages.length > 0 ? (
        <div className="text-center py-16 text-zinc-400 bg-zinc-900/20 rounded-xl border border-zinc-800 p-8 space-y-3">
          <Filter className="w-8 h-8 text-zinc-600 mx-auto" />
          <h3 className="text-base font-semibold text-zinc-300">Tidak ada paket yang cocok</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Tidak ada paket rental yang memenuhi kriteria filter kategori utama dan label yang Anda pilih.
          </p>
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-blue-400 rounded-lg text-xs font-semibold transition-colors mt-2 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="text-center py-16 text-zinc-500 bg-zinc-900/20 rounded-xl border border-zinc-800">
          Belum ada template paket yang dibuat. Silakan buat melalui tombol &quot;Bikin Paket&quot;.
        </div>
      )}

      {/* Modal Konfirmasi Hapus Paket */}
      <Dialog open={!!deletingPackage} onOpenChange={(open) => !open && setDeletingPackage(null)}>
        <DialogContent
          aria-describedby={undefined}
          className="bg-zinc-950 border-zinc-800 text-zinc-50 max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Konfirmasi Hapus Paket
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-400 mt-2">
            Apakah Anda yakin ingin menghapus template paket{" "}
            <strong>&quot;{deletingPackage?.name}&quot;</strong>? (Tindakan ini tidak bisa dibatalkan).
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingPackage(null)}
              className="bg-zinc-900 border-zinc-800 hover:bg-zinc-850 text-zinc-300"
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hapus Paket"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Preview Gambar */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent
          aria-describedby={undefined}
          className="bg-zinc-950 border-zinc-800 text-zinc-50 max-w-xl p-3 flex flex-col items-center justify-center"
        >
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Preview"
              className="max-h-[80vh] w-auto rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

