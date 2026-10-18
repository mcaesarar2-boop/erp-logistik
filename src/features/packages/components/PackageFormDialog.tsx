"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPackageTemplate, updatePackageTemplate } from "../actions/packageActions";
import { Trash2, Search, PackagePlus, Pencil, X, Tag, Plus, Package } from "lucide-react";
import { DemoRestrictionDialog } from "@/shared/components/DemoRestrictionDialog";
import { DEMO_MESSAGES } from "@/shared/constants/permissions";
import { ItemThumbnail } from "@/shared/components/ItemThumbnail";
import { groupItemsByPrimaryCategory } from "@/lib/grouping";
import { DEFAULT_CATEGORIES, SUGGESTED_LABELS } from "@/shared/constants/defaults";
import { formatRupiah } from "@/shared/lib/formatters";
import { useAuthPermission } from "@/shared/hooks/useAuthPermission";
import { PackageTemplate } from "../types";

export interface PackageFormDialogProps {
  mode?: "create" | "edit";
  pkg?: PackageTemplate;
  items: {
    id: string;
    name: string;
    code: string;
    quantity: number;
    rentedQuantity: number;
    maintenanceQuantity: number;
    imageUrl?: string | null;
    price?: number | null;
    rentPercentage?: number | null;
  }[];
  masterCategories?: { id: string; name: string }[];
  masterLabels?: { id: string; name: string }[];
  trigger?: React.ReactNode;
}

export function PackageFormDialog({
  mode = "create",
  pkg,
  items,
  masterCategories = [],
  masterLabels = [],
  trigger,
}: PackageFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [packageName, setPackageName] = useState("");
  const [packageDesc, setPackageDesc] = useState("");
  const [kategoriUtama, setKategoriUtama] = useState("");
  const [labelGrade, setLabelGrade] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const categoriesList = masterCategories.length > 0 ? masterCategories.map((c) => c.name) : DEFAULT_CATEGORIES;
  const suggestedLabelsList = masterLabels.length > 0 ? masterLabels.map((l) => l.name) : SUGGESTED_LABELS;

  const { isDummyUser, isAdmin, showDemoWarning, setShowDemoWarning } = useAuthPermission();

  // Muat data awal jika mode edit
  useEffect(() => {
    if (open) {
      if (mode === "edit" && pkg) {
        setPackageName(pkg.name);
        setPackageDesc(pkg.description || "");
        setKategoriUtama(pkg.kategoriUtama || "");
        setLabelGrade(Array.isArray(pkg.labelGrade) ? pkg.labelGrade : []);
        setTagInput("");
        try {
          const parsed = JSON.parse(pkg.payload);
          const mappedCart = parsed.map((pItem: any) => {
            const realItem = items.find((i) => i.id === pItem.id);
            return {
              ...realItem,
              ...pItem,
              name: realItem?.name || pItem.name,
              code: realItem?.code || pItem.code,
              price: realItem?.price ?? pItem.price,
              rentPercentage: realItem?.rentPercentage ?? pItem.rentPercentage,
              imageUrl: realItem?.imageUrl || pItem.imageUrl || null,
              lineId: pItem.lineId || crypto.randomUUID(),
              discount: Math.min(100, Math.max(0, Number(pItem.discount) || 0)),
              quantity: realItem?.quantity || 0,
              rentedQuantity: realItem?.rentedQuantity || 0,
              maintenanceQuantity: realItem?.maintenanceQuantity || 0,
            };
          });
          setCart(mappedCart);
        } catch {
          setCart([]);
        }
      } else {
        // Mode create: reset form
        setPackageName("");
        setPackageDesc("");
        setKategoriUtama("");
        setLabelGrade([]);
        setTagInput("");
        setCart([]);
      }
    }
  }, [open, mode, pkg, items]);

  const handleAddLabel = (val?: string) => {
    const text = (val ?? tagInput).trim();
    if (!text) return;
    if (!labelGrade.includes(text)) {
      setLabelGrade([...labelGrade, text]);
    }
    if (!val) setTagInput("");
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    setLabelGrade(labelGrade.filter((l) => l !== labelToRemove));
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery) return [];
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const addToCart = (item: any) => {
    const totalInventory = item.quantity + (item.rentedQuantity || 0) + (item.maintenanceQuantity || 0);
    const currentAccumulatedQty = cart
      .filter((c) => c.id === item.id)
      .reduce((acc, c) => acc + (Number(c.qty) || 1), 0);

    if (totalInventory > 0 && currentAccumulatedQty >= totalInventory) {
      alert(`Stok inventaris untuk "${item.name}" sudah mencapai batas maksimum (${totalInventory} Unit).`);
      return;
    }

    // MULTI-ADD: Tambah baris baru independen dengan lineId mandiri
    const newLine = {
      lineId: crypto.randomUUID(),
      ...item,
      qty: 1,
      discount: 0,
      footnote: "",
    };
    setCart((prev) => [...prev, newLine]);
    setSearchQuery("");
    setShowResults(false);
  };

  const updateQty = (lineId: string, newQty: any) => {
    const targetItem = cart.find((c) => c.lineId === lineId);
    if (!targetItem) return;

    const totalInventory =
      targetItem.quantity + (targetItem.rentedQuantity || 0) + (targetItem.maintenanceQuantity || 0);
    const otherLinesQty = cart
      .filter((c) => c.id === targetItem.id && c.lineId !== lineId)
      .reduce((acc, c) => acc + (Number(c.qty) || 1), 0);
    const maxAllowedForThisLine = Math.max(1, totalInventory - otherLinesQty);

    setCart(
      cart.map((c) => {
        if (c.lineId !== lineId) return c;
        if (newQty === "") return { ...c, qty: "" };
        const parsed = parseInt(newQty) || 0;
        return {
          ...c,
          qty: Math.min(Math.max(1, parsed), maxAllowedForThisLine),
        };
      })
    );
  };

  const updateDiscount = (lineId: string, discValue: any) => {
    setCart(
      cart.map((c) => {
        if (c.lineId !== lineId) return c;
        if (discValue === "") return { ...c, discount: "" };
        const parsed = Math.min(100, Math.max(0, parseInt(discValue) || 0));
        return { ...c, discount: parsed };
      })
    );
  };

  const updateFootnote = (lineId: string, footnote: string) => {
    setCart(cart.map((c) => (c.lineId === lineId ? { ...c, footnote } : c)));
  };

  const estimatedTotal = useMemo(() => {
    return cart.reduce((acc, c) => {
      const unitRent = ((c.price || 0) * (c.rentPercentage || 0)) / 100;
      const discount = typeof c.discount === "number" ? Math.max(0, Math.min(100, c.discount)) : 0;
      const netRent = unitRent * (1 - discount / 100);
      const qty = Number(c.qty) || 0;
      return acc + netRent * qty;
    }, 0);
  }, [cart]);

  async function handleSubmit(formData: FormData) {
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }

    setErrorMsg(null);
    if (cart.length === 0) {
      setErrorMsg("Daftar barang dalam paket masih kosong.");
      return;
    }

    formData.set("name", packageName);
    formData.set("description", packageDesc);
    formData.set("kategoriUtama", kategoriUtama);
    formData.set("labelGrade", JSON.stringify(labelGrade));
    formData.set(
      "payload",
      JSON.stringify(
        cart.map((c) => ({
          lineId: c.lineId,
          id: c.id,
          name: c.name,
          code: c.code,
          qty: Number(c.qty) || 1,
          price: c.price,
          rentPercentage: c.rentPercentage,
          discount: typeof c.discount === "number" ? c.discount : 0,
          footnote: c.footnote || "",
          imageUrl: c.imageUrl || null,
        }))
      )
    );

    const result =
      mode === "edit" && pkg
        ? await updatePackageTemplate(pkg.id, formData)
        : await createPackageTemplate(formData);

    if (result && !result.success) {
      if ("error" in result) {
        setErrorMsg(result.error ?? "Terjadi kesalahan sistem.");
      }
      return;
    }
    setOpen(false);
  }

  if (!isAdmin && !isDummyUser) return null;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setErrorMsg(null);
            setSearchQuery("");
            setShowResults(false);
          }
        }}
      >
        <DialogTrigger asChild>
          {trigger || (
            mode === "edit" ? (
              <button
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors shadow-sm cursor-pointer"
                title="Edit Paket"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Button className="w-full sm:w-auto shrink-0 bg-blue-600 hover:bg-blue-700 text-white">
                <PackagePlus className="w-4 h-4 mr-2" /> Bikin Paket
              </Button>
            )
          )}
        </DialogTrigger>

        <DialogContent
          aria-describedby={undefined}
          className="bg-zinc-950 border-zinc-800 text-zinc-50 flex flex-col max-h-[92vh] max-w-4xl p-0 overflow-hidden"
        >
          {/* Header Dialog */}
          <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between shrink-0">
            <DialogHeader className="p-0 space-y-0.5">
              <DialogTitle className="flex items-center gap-2 text-zinc-100 text-base sm:text-lg">
                <Package className="w-5 h-5 text-blue-500" />
                {mode === "edit" ? "Edit Template Paket Rental" : "Buat Template Paket Rental Baru"}
              </DialogTitle>
              <p className="text-xs text-zinc-400">
                {mode === "edit"
                  ? "Perbarui susunan aset, diskon per item, atau label paket."
                  : "Susun bundel aset siap sewa lengkap dengan kategori, label/grade, dan diskon item."}
              </p>
            </DialogHeader>
          </div>

          {errorMsg && (
            <div className="mx-4 sm:mx-5 mt-3 bg-red-950/60 border border-red-900 text-red-400 text-xs p-3 rounded-md flex items-center gap-2 shrink-0">
              <span className="font-bold">Gagal:</span> {errorMsg}
            </div>
          )}

          {/* Form Content 2 Kolom */}
          <form action={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 overflow-y-auto divide-y md:divide-y-0 md:divide-x divide-zinc-800">
              {/* Kolom Kiri: Metadata Paket (5 Kolom) */}
              <div className="md:col-span-5 p-4 sm:p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-300">
                    Nama Paket <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    type="text"
                    placeholder="Contoh: Sound System Panggung Utama 10.000W"
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    required
                    className="bg-zinc-900 border-zinc-800 text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-300">Deskripsi Paket</Label>
                  <textarea
                    rows={2}
                    placeholder="Keterangan singkat peruntukan paket..."
                    value={packageDesc}
                    onChange={(e) => setPackageDesc(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 resize-none"
                  />
                </div>

                {/* Dropdown Kategori Utama */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-blue-400" /> Kategori Utama
                  </Label>
                  <select
                    value={kategoriUtama}
                    onChange={(e) => setKategoriUtama(e.target.value)}
                    className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded-md px-2.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                  >
                    <option value="">-- Pilih Kategori Utama --</option>
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Input Label / Grade */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-300">Label / Grade Paket</Label>
                  <div className="flex gap-1.5">
                    <Input
                      type="text"
                      placeholder="Ketik label baru..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddLabel();
                        }
                      }}
                      className="bg-zinc-900 border-zinc-800 text-xs h-8 flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAddLabel()}
                      className="h-8 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Saran Label Cepat */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {suggestedLabelsList.map((sug) => {
                      const isSelected = labelGrade.includes(sug);
                      return (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => (isSelected ? handleRemoveLabel(sug) : handleAddLabel(sug))}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                            isSelected
                              ? "bg-blue-600 border-blue-500 text-white font-semibold"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          {isSelected ? `✓ ${sug}` : `+ ${sug}`}
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Selected Labels */}
                  {labelGrade.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {labelGrade.map((lbl) => (
                        <span
                          key={lbl}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-950/80 border border-blue-800 text-blue-300"
                        >
                          {lbl}
                          <button
                            type="button"
                            onClick={() => handleRemoveLabel(lbl)}
                            className="hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cari & Tambah Aset Gudang */}
                <div className="space-y-1.5 pt-2 border-t border-zinc-800/80 relative">
                  <Label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                    <span>Cari & Tambah Aset Gudang</span>
                    <span className="text-[10px] text-zinc-500 font-normal">Bisa tambah multi-baris</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Ketik nama / kode barang..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowResults(true);
                      }}
                      onFocus={() => setShowResults(true)}
                      className="bg-zinc-900 border-zinc-800 text-xs h-9 pr-8"
                    />
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-3" />
                  </div>

                  {showResults && searchQuery && (
                    <div className="absolute left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-md shadow-2xl max-h-48 overflow-y-auto z-50">
                      {filteredItems.length > 0 ? (
                        filteredItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => addToCart(item)}
                            className="p-2 border-b border-zinc-800/60 hover:bg-zinc-800 cursor-pointer flex justify-between items-center gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <ItemThumbnail
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-7 h-7 rounded shrink-0"
                                iconClassName="w-3.5 h-3.5 text-zinc-500"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-zinc-200 truncate">{item.name}</p>
                                <p className="text-[10px] text-zinc-400 font-mono">{item.code}</p>
                              </div>
                            </div>
                            <span className="text-[10px] bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded font-semibold shrink-0">
                              + Tambah
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-xs text-zinc-500 text-center">Barang tidak ditemukan.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Kolom Kanan: Rincian Isi Bundel Paket (7 Kolom) */}
              <div className="md:col-span-7 p-4 sm:p-5 flex flex-col justify-between overflow-hidden bg-zinc-950/40">
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[58vh]">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <Label className="text-xs font-bold text-zinc-200">
                      Rincian Bundel Paket ({cart.length} Baris)
                    </Label>
                    {cart.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCart([])}
                        className="text-[11px] text-red-400 hover:text-red-300 font-medium cursor-pointer"
                      >
                        Kosongkan
                      </button>
                    )}
                  </div>

                  {cart.length === 0 ? (
                    <div className="p-8 border border-dashed border-zinc-800 rounded-lg text-center text-zinc-500 text-xs">
                      Belum ada aset yang dimasukkan ke dalam paket.
                      <br />
                      Gunakan kotak pencarian di sebelah kiri untuk menambahkan.
                    </div>
                  ) : (
                    groupItemsByPrimaryCategory(cart, items).map((group) => (
                      <div key={group.categoryName} className="space-y-2">
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="w-1.5 h-3 bg-blue-500 rounded-full shrink-0"></span>
                          <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">
                            {group.categoryName}
                          </span>
                          <span className="text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.2 rounded-full">
                            {group.items.length}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {group.items.map((item: any) => {
                            const unitRent = ((item.price || 0) * (item.rentPercentage || 0)) / 100;
                            const discount =
                              typeof item.discount === "number"
                                ? Math.max(0, Math.min(100, item.discount))
                                : 0;
                            const netRent = unitRent * (1 - discount / 100);
                            const totalLineRent = netRent * (Number(item.qty) || 0);

                            return (
                              <div
                                key={item.lineId}
                                className="bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800 space-y-2 text-xs"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <ItemThumbnail
                                      src={item.imageUrl}
                                      alt={item.name}
                                      className="w-9 h-9 rounded shrink-0"
                                      iconClassName="w-4 h-4 text-zinc-500"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p className="font-bold text-zinc-100 truncate">{item.name}</p>
                                      <p className="text-[10px] text-zinc-500 font-mono">{item.code}</p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setCart(cart.filter((c) => c.lineId !== item.lineId))}
                                    className="p-1 text-zinc-500 hover:text-red-400 rounded transition-colors"
                                    title="Hapus baris ini"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-12 gap-2 items-center pt-1 border-t border-zinc-800/60">
                                  {/* Qty */}
                                  <div className="col-span-3 flex items-center gap-1">
                                    <Label className="text-[10px] text-zinc-400">Qty:</Label>
                                    <Input
                                      type="text"
                                      inputMode="numeric"
                                      value={item.qty}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === "" || /^\d+$/.test(v)) updateQty(item.lineId, v);
                                      }}
                                      className="h-7 text-xs bg-zinc-950 border-zinc-800 text-center font-bold px-1"
                                    />
                                  </div>

                                  {/* Diskon */}
                                  <div className="col-span-4 flex items-center gap-1">
                                    <Label className="text-[10px] text-zinc-400">Disc:</Label>
                                    <div className="relative flex-1">
                                      <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={item.discount}
                                        onChange={(e) => {
                                          const v = e.target.value;
                                          if (v === "" || /^\d+$/.test(v)) updateDiscount(item.lineId, v);
                                        }}
                                        className="h-7 text-xs bg-zinc-950 border-zinc-800 text-center font-bold pr-4 px-1"
                                      />
                                      <span className="text-[10px] text-zinc-500 absolute right-1.5 top-1.5 pointer-events-none">
                                        %
                                      </span>
                                    </div>
                                  </div>

                                  {/* Subtotal Baris */}
                                  <div className="col-span-5 text-right">
                                    <p className="text-[11px] font-bold text-emerald-400">
                                      {formatRupiah(totalLineRent)}
                                    </p>
                                    {discount > 0 && (
                                      <p className="text-[9px] text-zinc-500 line-through">
                                        {formatRupiah(unitRent * (Number(item.qty) || 0))}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Footnote / Catatan Item */}
                                <Input
                                  type="text"
                                  placeholder="Catatan tambahan item ini (opsional)..."
                                  value={item.footnote || ""}
                                  onChange={(e) => updateFootnote(item.lineId, e.target.value)}
                                  className="h-6 text-[10px] bg-zinc-950/70 border-zinc-850 px-2 text-zinc-300 placeholder:text-zinc-600"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Ringkasan & Submit */}
                <div className="pt-3 border-t border-zinc-800 mt-3 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Estimasi Total Harga Sewa Paket:</span>
                    <span className="text-base font-bold text-emerald-400">
                      {formatRupiah(estimatedTotal)}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setOpen(false)}
                      className="bg-zinc-900 border-zinc-800 text-zinc-300 text-xs"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={cart.length === 0 || !packageName.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5"
                    >
                      {mode === "edit" ? "Simpan Perubahan Paket" : "Simpan Paket Rental"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DemoRestrictionDialog
        isOpen={showDemoWarning}
        onClose={() => setShowDemoWarning(false)}
        title={DEMO_MESSAGES.rental.title}
        message="Akun yang sedang digunakan adalah akun demo dan bersifat read-only. Pembuatan atau pengeditan paket dinonaktifkan."
      />
    </>
  );
}

