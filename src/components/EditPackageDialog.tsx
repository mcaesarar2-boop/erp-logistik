"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updatePackageTemplate } from "@/app/actions"
import { supabase } from "@/lib/supabase"
import { Trash2, Search, Pencil, X, Plus, Package } from "lucide-react"
import { DemoRestrictionDialog } from "@/components/DemoRestrictionDialog"
import { isAdminEmail, isDemoEmail, DEMO_MESSAGES } from "@/lib/permissions"
import { ItemThumbnail } from "@/components/ItemThumbnail"
import { groupItemsByPrimaryCategory } from "@/lib/grouping"

const DEFAULT_CATEGORIES = ['Audio', 'Lighting', 'Video', 'Stage', 'Backline'];
const SUGGESTED_LABELS = ['Concert', 'Festival', 'Corporate', 'Grade A', 'Grade B', 'Outdoor', 'Indoor', 'Wedding'];

interface EditPackageDialogProps {
  pkg: {
    id: string
    name: string
    description: string | null
    payload: string
    kategoriUtama?: string | null
    labelGrade?: string[]
  }
  items: {
    id: string
    name: string
    code: string
    quantity: number
    rentedQuantity: number
    maintenanceQuantity: number
    imageUrl?: string | null
    price?: number | null
    rentPercentage?: number | null
  }[]
  masterCategories?: { id: string; name: string }[]
  masterLabels?: { id: string; name: string }[]
}

export function EditPackageDialog({ pkg, items, masterCategories = [], masterLabels = [] }: EditPackageDialogProps) {
  const [open, setOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [cart, setCart] = useState<any[]>([])
  const [packageName, setPackageName] = useState("")
  const [packageDesc, setPackageDesc] = useState("")
  const [kategoriUtama, setKategoriUtama] = useState("")
  const [labelGrade, setLabelGrade] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  const categoriesList = masterCategories.length > 0 ? masterCategories.map(c => c.name) : DEFAULT_CATEGORIES;
  const suggestedLabelsList = masterLabels.length > 0 ? masterLabels.map(l => l.name) : SUGGESTED_LABELS;

  const [isDummyUser, setIsDummyUser] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showDemoWarning, setShowDemoWarning] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setIsAdmin(isAdminEmail(data.user.email))
        setIsDummyUser(isDemoEmail(data.user.email))
      }
    })
  }, [])

  // Muat data awal ketika dialog terbuka
  useEffect(() => {
    if (open) {
      setPackageName(pkg.name)
      setPackageDesc(pkg.description || "")
      setKategoriUtama(pkg.kategoriUtama || "")
      setLabelGrade(Array.isArray(pkg.labelGrade) ? pkg.labelGrade : [])
      setTagInput("")
      try {
        const parsed = JSON.parse(pkg.payload)
        const mappedCart = parsed.map((pItem: any) => {
          const realItem = items.find(i => i.id === pItem.id)
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
          }
        })
        setCart(mappedCart)
      } catch (e) {
        setCart([])
      }
    }
  }, [open, pkg, items])

  const handleAddLabel = (val?: string) => {
    const text = (val ?? tagInput).trim()
    if (!text) return
    if (!labelGrade.includes(text)) {
      setLabelGrade([...labelGrade, text])
    }
    if (!val) setTagInput("")
  }

  const handleRemoveLabel = (labelToRemove: string) => {
    setLabelGrade(labelGrade.filter(l => l !== labelToRemove))
  }

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const addToCart = (item: any) => {
    const totalInventory = (item.quantity || 0) + (item.rentedQuantity || 0) + (item.maintenanceQuantity || 0)
    const currentAccumulatedQty = cart
      .filter(c => c.id === item.id)
      .reduce((acc, c) => acc + (Number(c.qty) || 1), 0)

    if (totalInventory > 0 && currentAccumulatedQty >= totalInventory) {
      alert(`Stok inventaris untuk "${item.name}" sudah mencapai batas maksimum (${totalInventory} Unit).`)
      return
    }

    // MULTI-ADD: Buat baris mandiri baru dengan lineId tanpa auto-merge
    const newLine = {
      lineId: crypto.randomUUID(),
      ...item,
      qty: 1,
      discount: 0,
      footnote: "",
    }
    setCart(prev => [...prev, newLine])
    setSearchQuery("")
    setShowResults(false)
  }

  const updateQty = (lineId: string, newQty: any) => {
    const targetItem = cart.find(c => c.lineId === lineId)
    if (!targetItem) return

    const totalInventory = (targetItem.quantity || 0) + (targetItem.rentedQuantity || 0) + (targetItem.maintenanceQuantity || 0)
    const otherLinesQty = cart
      .filter(c => c.id === targetItem.id && c.lineId !== lineId)
      .reduce((sum, c) => sum + (Number(c.qty) || 1), 0)
    const maxAllowed = Math.max(1, totalInventory - otherLinesQty)

    setCart(cart.map(c => {
      if (c.lineId === lineId) {
        return { ...c, qty: newQty === "" ? "" : Math.min(Math.max(1, parseInt(newQty) || 0), maxAllowed) }
      }
      return c
    }))
  }

  const updateDiscount = (lineId: string, newDiscount: any) => {
    setCart(cart.map(c => {
      if (c.lineId === lineId) {
        return {
          ...c,
          discount: newDiscount === "" ? "" : Math.min(100, Math.max(0, parseInt(newDiscount) || 0))
        }
      }
      return c
    }))
  }

  const updateFootnote = (lineId: string, newFootnote: string) => {
    setCart(cart.map(c => {
      if (c.lineId === lineId) {
        return { ...c, footnote: newFootnote }
      }
      return c
    }))
  }

  async function handleSubmit(formData: FormData) {
    if (isDummyUser) {
      setShowDemoWarning(true)
      return
    }

    setErrorMsg(null)
    if (cart.length === 0) {
      setErrorMsg("Belum ada barang yang dipilih.")
      return
    }
    if (!packageName.trim()) {
      setErrorMsg("Nama paket tidak boleh kosong.")
      return
    }
    
    formData.append("kategoriUtama", kategoriUtama)
    formData.append("labelGrade", JSON.stringify(labelGrade))
    formData.append("payload", JSON.stringify(cart.map(c => ({
      lineId: c.lineId || crypto.randomUUID(),
      id: c.id,
      qty: Number(c.qty) || 1,
      discount: Math.min(100, Math.max(0, Number(c.discount) || 0)),
      name: c.name,
      code: c.code,
      imageUrl: c.imageUrl || items.find(i => i.id === c.id)?.imageUrl || null,
      price: c.price,
      rentPercentage: c.rentPercentage,
      footnote: c.footnote || ""
    }))))
    const result = await updatePackageTemplate(pkg.id, formData)
    
    if (result && !result.success) {
      if ("error" in result) {
        setErrorMsg(result.error ?? "Terjadi kesalahan sistem.");
      }
      return;
    }
    setOpen(false)
  }

  if (!isAdmin && !isDummyUser) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) { setErrorMsg(null); }}}>
      <DialogTrigger asChild>
        <button className="p-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded-md transition-colors shadow-sm" title="Edit Paket">
          <Pencil className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50 flex flex-col w-[95vw] sm:w-[90vw] max-w-5xl sm:max-w-5xl lg:max-w-6xl h-[92vh] max-h-[92vh] overflow-hidden p-4 sm:p-5">
        <DialogHeader className="shrink-0 pb-2.5 border-b border-zinc-800">
          <DialogTitle className="text-base sm:text-lg font-bold">Edit Template Paket Rental</DialogTitle>
        </DialogHeader>
        {errorMsg && (
          <div className="bg-red-950/50 border border-red-900 text-red-400 text-sm p-3 rounded-md flex items-center gap-2 shrink-0 mt-2">
            <span className="font-bold">Gagal:</span> {errorMsg}
          </div>
        )}

        <form action={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-y-auto lg:overflow-hidden pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 h-full">
            {/* Kolom Kiri: Metadata & Pencarian Aset (lg:col-span-5) */}
            <div className="lg:col-span-5 flex flex-col gap-3.5 overflow-y-visible lg:overflow-y-auto pr-0 lg:pr-2 min-h-0 h-full">
              <div className="space-y-1.5">
                <Label>Nama Paket</Label>
                <Input name="name" placeholder="Misal: Paket Panggung A" className="bg-zinc-900 border-zinc-800" value={packageName} onChange={e => setPackageName(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <Label>Deskripsi (Opsional)</Label>
                <Input name="description" placeholder="Keterangan paket..." className="bg-zinc-900 border-zinc-800" value={packageDesc} onChange={e => setPackageDesc(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editKategoriUtama">Kategori Utama</Label>
                <select
                  id="editKategoriUtama"
                  name="kategoriUtama"
                  value={kategoriUtama}
                  onChange={e => setKategoriUtama(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1 text-sm shadow-sm transition-colors text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                >
                  <option value="">-- Pilih Kategori Utama (Opsional) --</option>
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Label / Grade</Label>
                  <span className="text-[10px] text-zinc-500">Tekan Enter untuk menambah</span>
                </div>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="Misal: Concert, Grade A..."
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddLabel();
                      }
                    }}
                    className="bg-zinc-900 border-zinc-800 text-xs h-8"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddLabel()}
                    className="h-8 px-2.5 bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 shrink-0 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Tambah
                  </Button>
                </div>

                {/* Preset rekomendasi & Tag aktif dengan max-h-40 overflow-y-auto */}
                <div className="max-h-40 overflow-y-auto space-y-2 p-2 bg-zinc-900/60 rounded-lg border border-zinc-800">
                  <div className="flex flex-wrap gap-1 items-center">
                    {suggestedLabelsList.map(preset => {
                      const isSelected = labelGrade.includes(preset);
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => isSelected ? handleRemoveLabel(preset) : handleAddLabel(preset)}
                          className={`text-[10px] px-1.5 py-0.5 rounded border transition-all ${
                            isSelected
                              ? "bg-blue-600/30 border-blue-500 text-blue-300 font-medium"
                              : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                          }`}
                        >
                          {isSelected ? `✓ ${preset}` : `+ ${preset}`}
                        </button>
                      );
                    })}
                  </div>

                  {labelGrade.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1.5 border-t border-zinc-800">
                      {labelGrade.map(lbl => (
                        <span
                          key={lbl}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-950/70 border border-blue-800 text-blue-300"
                        >
                          {lbl}
                          <button
                            type="button"
                            onClick={() => handleRemoveLabel(lbl)}
                            className="hover:text-red-400 transition-colors"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Cari Aset Tambahan */}
              <div className="space-y-1.5 relative">
                <Label>Cari Aset Tambahan</Label>
                <div className="relative z-40">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input 
                    placeholder="Ketik nama atau kode aset..." 
                    className="pl-9 bg-zinc-900 border-zinc-800" 
                    value={searchQuery} 
                    onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true) }} 
                    onFocus={() => setShowResults(true)} 
                  />
                  {showResults && searchQuery && (
                    <div className="absolute top-full mt-1 left-0 right-0 max-h-[220px] overflow-y-auto overflow-x-hidden bg-zinc-800 border border-zinc-700 rounded-md shadow-2xl z-50">
                      {filteredItems.length > 0 ? (
                        filteredItems.map(item => (
                          <div 
                            key={item.id} 
                            className="p-2.5 hover:bg-zinc-700 cursor-pointer border-b border-zinc-700/50 flex justify-between items-center gap-3" 
                            onClick={() => addToCart(item)}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <ItemThumbnail src={item.imageUrl} alt={item.name} className="w-9 h-9 sm:w-10 sm:h-10 rounded-md" iconClassName="w-4 h-4 text-zinc-500" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-zinc-200 truncate">{item.name}</p>
                                <p className="text-xs text-zinc-400 font-mono">{item.code}</p>
                              </div>
                            </div>
                            <Button type="button" size="sm" variant="ghost" className="text-xs text-blue-400 hover:text-blue-300">
                              <Plus className="w-3.5 h-3.5 mr-1" /> Tambah
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-sm text-zinc-500 text-center">Aset tidak ditemukan.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Kolom Kanan (lg:col-span-7 flex flex-col): Bagian Daftar Barang dalam Paket */}
            <div className="lg:col-span-7 flex flex-col min-h-0 h-full flex-1 justify-between">
              <div className="flex items-center justify-between pb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-bold text-zinc-200">Daftar Barang dalam Paket</Label>
                  <span className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-semibold">
                    {cart.reduce((sum, c) => sum + (Number(c.qty) || 1), 0)} Unit ({cart.length} Baris)
                  </span>
                </div>
                {cart.length > 0 && (
                  <button 
                    type="button" 
                    onClick={() => setCart([])} 
                    className="text-xs text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Kosongkan List
                  </button>
                )}
              </div>

              {/* Area Scroll List Barang */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-3">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 border border-dashed border-zinc-800 rounded-xl text-center text-zinc-500 min-h-[160px]">
                    <Package className="w-10 h-10 text-zinc-600 mb-2 stroke-1" />
                    <p className="text-sm font-medium">Belum ada barang dalam paket ini.</p>
                    <p className="text-xs text-zinc-600 mt-1">Cari aset di kolom kiri dan klik untuk menambahkannya.</p>
                  </div>
                ) : (
                  groupItemsByPrimaryCategory(cart, items).map(group => (
                    <div key={group.categoryName} className="w-full">
                      {/* Section Header Kategori Utama */}
                      <div className="w-full flex items-center gap-2 pb-1.5 mb-2.5 border-b border-zinc-800">
                        <span className="w-1.5 h-3.5 bg-blue-500 rounded-full shrink-0"></span>
                        <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                          {group.categoryName}
                        </h4>
                        <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-full">
                          {group.items.length} {group.items.length > 1 ? "items" : "item"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2.5">
                        {group.items.map(item => {
                          const totalInventory = (item.quantity || 0) + (item.rentedQuantity || 0) + (item.maintenanceQuantity || 0);
                          const baseRentPerItem = ((item.price || 0) * (item.rentPercentage || 0)) / 100;
                          const itemDiscount = Math.min(100, Math.max(0, Number(item.discount) || 0));
                          const originalLineTotal = (Number(item.qty) || 1) * baseRentPerItem;
                          const lineNetTotal = originalLineTotal * (1 - (itemDiscount / 100));

                          return (
                            <div key={item.lineId || item.id} className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 flex flex-col gap-2">
                              <div className="flex justify-between items-start gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <ItemThumbnail src={item.imageUrl || items.find(i => i.id === item.id)?.imageUrl} alt={item.name} className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg shrink-0" iconClassName="w-5 h-5 text-zinc-500" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-zinc-100 truncate">{item.name}</p>
                                    <p className="text-xs text-zinc-500 font-mono">{item.code} | Max: {totalInventory}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-end">
                                  <div className="flex items-center gap-1">
                                    <Label className="text-xs">Qty:</Label>
                                    <Input 
                                      type="text" 
                                      inputMode="numeric" 
                                      pattern="[0-9]*" 
                                      value={item.qty} 
                                      onFocus={(e) => e.target.select()}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "" || /^\d+$/.test(val)) {
                                          updateQty(item.lineId, val === "" ? "" : parseInt(val));
                                        }
                                      }} 
                                      onBlur={() => {
                                        if (item.qty === "" || Number(item.qty) < 1) updateQty(item.lineId, 1);
                                      }}
                                      className="w-14 sm:w-16 h-8 text-xs bg-zinc-950 border-zinc-700 text-center font-bold" 
                                    />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Label className="text-xs">Disc(%):</Label>
                                    <Input 
                                      type="text" 
                                      inputMode="numeric" 
                                      pattern="[0-9]*" 
                                      value={item.discount ?? 0} 
                                      onFocus={(e) => e.target.select()}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "" || /^\d+$/.test(val)) {
                                          updateDiscount(item.lineId, val === "" ? "" : Math.min(100, Math.max(0, parseInt(val))));
                                        }
                                      }} 
                                      onBlur={() => {
                                        if (item.discount === "" || Number(item.discount) < 0) updateDiscount(item.lineId, 0);
                                      }}
                                      className="w-14 sm:w-16 h-8 text-xs bg-zinc-950 border-zinc-700 text-center font-bold" 
                                    />
                                  </div>
                                  <button type="button" onClick={() => setCart(cart.filter(c => c.lineId !== item.lineId))} className="text-zinc-500 hover:text-red-400 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded shrink-0 transition-colors cursor-pointer" title="Hapus dari paket"><Trash2 className="w-4 h-4"/></button>
                                </div>
                              </div>

                              <div className="flex justify-between items-center text-xs px-1 pt-1 border-t border-zinc-800/40 flex-wrap gap-1">
                                <span className="text-[11px] text-zinc-400">Nilai Sewa:</span>
                                {itemDiscount === 100 ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] line-through text-zinc-500">
                                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(originalLineTotal)}
                                    </span>
                                    <span className="font-bold text-emerald-400">Rp 0</span>
                                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">
                                      FREE / BONUS (Diskon 100%)
                                    </span>
                                  </div>
                                ) : itemDiscount > 0 ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] line-through text-zinc-500">
                                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(originalLineTotal)}
                                    </span>
                                    <span className="font-bold text-emerald-400">
                                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(lineNetTotal)}
                                    </span>
                                    <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded font-bold">
                                      -{itemDiscount}%
                                    </span>
                                  </div>
                                ) : (
                                  <span className="font-bold text-emerald-400">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(lineNetTotal)}
                                  </span>
                                )}
                              </div>

                              <Input placeholder="Catatan / Footnote (Opsional)" className="h-8 text-xs bg-zinc-950 border-zinc-800 text-zinc-300" value={item.footnote || ''} onChange={(e) => updateFootnote(item.lineId, e.target.value)} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Kolom Kanan: Total & Tombol Submit */}
              <div className="mt-3 pt-3 border-t border-zinc-800 flex flex-col gap-2 shrink-0">
                {cart.length > 0 && (
                  <div className="flex justify-between items-center px-4 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-lg">
                    <span className="text-xs sm:text-sm text-zinc-400 font-medium">Total Harga Sewa Bersih Paket:</span>
                    <span className="text-base sm:text-lg font-bold text-emerald-400">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
                        cart.reduce((acc, c) => {
                          const baseRent = ((c.price || 0) * (c.rentPercentage || 0)) / 100;
                          const disc = Math.min(100, Math.max(0, Number(c.discount) || 0));
                          return acc + (baseRent * (Number(c.qty) || 1) * (1 - (disc / 100)));
                        }, 0)
                      )}
                    </span>
                  </div>
                )}
                <Button 
                  type="submit" 
                  disabled={cart.length === 0 || !packageName.trim()} 
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 shadow-md shadow-amber-950/40 cursor-pointer"
                >
                  Simpan Perubahan Paket
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
      <DemoRestrictionDialog
        isOpen={showDemoWarning}
        onClose={() => setShowDemoWarning(false)}
        title={DEMO_MESSAGES.edit.title}
        message="Akun ini disediakan untuk tujuan demonstrasi. Perubahan terhadap data template paket dinonaktifkan."
      />
    </Dialog>
  )
}