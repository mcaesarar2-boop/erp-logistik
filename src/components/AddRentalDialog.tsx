"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addBulkRental, deletePackageTemplate, createHistory } from "@/app/actions"
import { supabase } from "@/lib/supabase"
import { Trash2, Search, ShoppingCart, PackageOpen, AlertCircle, Loader2, PlusCircle } from "lucide-react"

interface AddRentalDialogProps {
  items: {
    id: string
    name: string
    code: string
    quantity: number
    price?: number | null
    rentPercentage?: number | null
  }[]
  packages?: {
    id: string
    name: string
    description?: string | null
    payload: string
  }[]
}

export function AddRentalDialog({ items, packages = [] }: AddRentalDialogProps) {
  const [open, setOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [warningMsg, setWarningMsg] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [cart, setCart] = useState<any[]>([])
  const [selectedPackageId, setSelectedPackageId] = useState<string>("")
  const [isDeletingPkg, setIsDeletingPkg] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [discountPercentage, setDiscountPercentage] = useState<number>(0)
  const [discountDesc, setDiscountDesc] = useState<string>("")
  const [eventName, setEventName] = useState<string>("")
  const [rentalDays, setRentalDays] = useState<number>(1)
  
  const [customItems, setCustomItems] = useState<{id: string, name: string, qty: number, price: number, footnote: string}[]>([])
  const [customName, setCustomName] = useState("")
  const [customQty, setCustomQty] = useState<number>(1)
  const [customPrice, setCustomPrice] = useState<number>(0)

  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const ADMIN_EMAILS = ["mcaesarar@gmail.com"] 
      if (data.user?.email && ADMIN_EMAILS.includes(data.user.email.toLowerCase())) setIsAdmin(true)
    })
  }, [])

  // Custom Event Listener untuk menangkap aksi "Ke Keranjang" dari katalog paket
  useEffect(() => {
    const handleAddToCart = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.pkgId) {
        handleLoadPackage(customEvent.detail.pkgId);
      }
    };
    window.addEventListener('add-to-pos-cart', handleAddToCart);
    return () => window.removeEventListener('add-to-pos-cart', handleAddToCart);
  }, [packages, items, cart]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const addToCart = (item: any) => {
    if (item.quantity <= 0) return
    if (!cart.find(c => c.id === item.id)) {
      setCart([...cart, { ...item, qty: 1 }])
    }
    setSearchQuery("")
    setShowResults(false)
  }

  const handleLoadPackage = (pkgId: string) => {
    setSelectedPackageId(pkgId)
    setWarningMsg(null)
    setErrorMsg(null)
    
    if (!pkgId) return;
    
    const pkg = packages.find(p => p.id === pkgId);
    if (!pkg) return;

    try {
      const parsedPayload = JSON.parse(pkg.payload);
      let newCart = [...cart];
      let hasError = false;
      let errorDetails = "";

      for (const pItem of parsedPayload) {
        const realItem = items.find(i => i.id === pItem.id);
        if (!realItem) {
          hasError = true;
          errorDetails += `${pItem.name} tidak ditemukan. `;
          continue;
        }

        const availableQty = realItem.quantity;
        // Cek total kebutuhan (stok saat ini di keranjang + tambahan dari paket)
        const existingQtyInCart = newCart.find(c => c.id === realItem.id)?.qty || 0;
        const requiredQty = existingQtyInCart + pItem.qty;

        if (requiredQty > availableQty) {
          hasError = true;
          errorDetails += `${realItem.name} stok tidak cukup (Butuh ${requiredQty}, Ada ${availableQty}). `;
        }
      }

      if (hasError) {
        setErrorMsg(`Paket tidak dapat digunakan: ${errorDetails}`);
        setSelectedPackageId("");
        return;
      }

      parsedPayload.forEach((pItem: any) => {
        const realItem = items.find(i => i.id === pItem.id)!;
        const cartItemIndex = newCart.findIndex(c => c.id === realItem.id);
        
        if (cartItemIndex >= 0) {
          newCart[cartItemIndex].qty += pItem.qty; // Gabungkan / akumulasikan kuantitasnya
          newCart[cartItemIndex].footnote = pItem.footnote || newCart[cartItemIndex].footnote;
        } else {
          newCart.push({ ...realItem, qty: pItem.qty, footnote: pItem.footnote || "" });
        }
      });

      setCart(newCart);
    } catch (e) {
      setErrorMsg("Gagal memuat paket.");
      setSelectedPackageId("");
    }
  }

  const handleDeletePackage = async () => {
    if (!selectedPackageId || !confirm("Yakin ingin menghapus template paket ini?")) return;
    setIsDeletingPkg(true);
    await deletePackageTemplate(selectedPackageId);
    setIsDeletingPkg(false);
    setSelectedPackageId("");
    setWarningMsg(null);
  }

  const updateQty = (id: string, newQty: number) => {
    setCart(cart.map(c => c.id === id ? { ...c, qty: Math.min(Math.max(1, newQty), c.quantity) } : c))
  }

  const updateFootnote = (id: string, footnote: string) => {
    setCart(cart.map(c => c.id === id ? { ...c, footnote } : c))
  }

  const handleAddCustomItem = () => {
    if (!customName.trim()) return;
    setCustomItems([...customItems, {
      id: `custom-${Date.now()}`,
      name: customName,
      qty: customQty,
      price: customPrice,
      footnote: ""
    }])
    setCustomName("")
    setCustomQty(1)
    setCustomPrice(0)
  }

  const updateCustomQty = (id: string, newQty: number) => {
    setCustomItems(customItems.map(c => c.id === id ? { ...c, qty: Math.max(1, newQty) } : c))
  }

  const updateCustomPrice = (id: string, newPrice: number) => {
    setCustomItems(customItems.map(c => c.id === id ? { ...c, price: Math.max(0, newPrice) } : c))
  }

  const updateCustomFootnote = (id: string, newFootnote: string) => {
    setCustomItems(customItems.map(c => c.id === id ? { ...c, footnote: newFootnote } : c))
  }

  async function handleSubmit(formData: FormData) {
    setErrorMsg(null)
    setIsSubmitting(true)
    
    if (cart.length === 0 && customItems.length === 0) {
      setErrorMsg("Keranjang masih kosong.")
      setIsSubmitting(false)
      return
    }
    
    if (cart.length > 0) {
      formData.append("payload", JSON.stringify(cart.map(c => ({ id: c.id, qty: c.qty }))))
      const result = await addBulkRental(formData)
      
      if (result?.success === false) {
        setErrorMsg(result.error ?? "Terjadi kesalahan sistem.")
        setIsSubmitting(false)
        return
      }
    }

    // Tambahkan pencatatan riwayat transaksi
    const historyFormData = new FormData()
    historyFormData.append("type", "INVOICE_RENTAL")
    historyFormData.append("date", new Date().toISOString().split('T')[0])
    
    const totalQty = cart.reduce((acc: number, i: any) => acc + i.qty, 0)
    const totalCustomQty = customItems.reduce((acc: number, i: any) => acc + i.qty, 0)
    
    let historyDesc = `Invoice Rental (`
    if (totalQty > 0) historyDesc += `${totalQty} Aset`
    if (totalQty > 0 && totalCustomQty > 0) historyDesc += `, `
    if (totalCustomQty > 0) historyDesc += `${totalCustomQty} Layanan`
    historyDesc += `)`
    
    if (eventName.trim() !== "") {
      historyDesc = `Event: ${eventName.trim()} | ` + historyDesc
    }
    if (rentalDays > 1) {
      historyDesc += ` - ${rentalDays} Hari`
    }
    if (discountPercentage > 0) {
      historyDesc += ` - Diskon ${discountPercentage}%`
      if (discountDesc.trim() !== "") {
        historyDesc += ` (${discountDesc.trim()})`
      }
    }
    historyFormData.append("description", historyDesc)
    
    const historyPayload = [
      ...cart.map((c: any) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        qty: c.qty,
        returnedQty: 0,
        price: (((c.price || 0) * (c.rentPercentage || 0)) / 100) * rentalDays * (1 - (discountPercentage / 100)),
        footnote: c.footnote || ""
      })),
      ...customItems.map((c: any) => ({
        id: c.id,
        name: c.name,
        code: "LAYANAN",
        qty: c.qty,
        returnedQty: 0,
        price: c.price * rentalDays * (1 - (discountPercentage / 100)),
        footnote: c.footnote || "Layanan Tambahan"
      }))
    ]
    historyFormData.append("payload", JSON.stringify(historyPayload))
    await createHistory(historyFormData)

    setIsSubmitting(false)
    setOpen(false)
    setCart([]) // Reset state
    setSelectedPackageId("")
    setWarningMsg(null)
    setDiscountPercentage(0)
    setDiscountDesc("")
    setEventName("")
    setRentalDays(1)
    setCustomItems([])
    setCustomName("")
    setCustomQty(1)
    setCustomPrice(0)
  }

  const assetSubTotal = cart.reduce((acc, item) => acc + (item.qty * ((item.price || 0) * (item.rentPercentage || 0) / 100) * rentalDays), 0)
  const customSubTotal = customItems.reduce((acc, item) => acc + (item.qty * item.price * rentalDays), 0)
  const subTotal = assetSubTotal + customSubTotal
  const discountAmount = subTotal * (discountPercentage / 100)
  const grandTotal = subTotal - discountAmount

  if (!isAdmin) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) { setErrorMsg(null); setWarningMsg(null); }}}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto shrink-0 bg-emerald-600 border border-emerald-500 text-white hover:bg-emerald-500 shadow-lg hover:shadow-emerald-900/50 transition-all font-bold">
          <ShoppingCart className="w-4 h-4 mr-2" /> Keranjang Kasir
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50 flex flex-col max-w-[98vw] sm:max-w-[98vw] md:max-w-[98vw] lg:max-w-[98vw] w-full h-[98vh] max-h-[98vh] overflow-hidden p-3 sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle>Keranjang Rental & Point of Sale (POS)</DialogTitle>
        </DialogHeader>
        {errorMsg && (
          <div className="bg-red-950/50 border border-red-900 text-red-400 text-sm p-3 rounded-md flex items-center gap-2 shrink-0">
            <span className="font-bold">Gagal:</span> {errorMsg}
          </div>
        )}

        {warningMsg && (
          <div className="bg-amber-950/50 border border-amber-900 text-amber-400 text-xs p-3 rounded-md flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{warningMsg}</span>
          </div>
        )}

        <form action={handleSubmit} className="flex flex-col lg:flex-row gap-4 pt-2 flex-1 lg:min-h-0 overflow-y-auto lg:overflow-hidden">
          <div className="flex flex-col gap-4 w-full lg:w-[350px] xl:w-[400px] shrink-0 lg:overflow-y-auto pr-1 pb-2">
            <div className="space-y-2 shrink-0">
            <Label>Nama Event / Acara (Opsional)</Label>
            <Input placeholder="Misal: Konser Dewa 19" value={eventName} onChange={(e) => setEventName(e.target.value)} className="bg-zinc-900 border-zinc-800" />
          </div>

          {packages.length > 0 && (
            <div className="space-y-2 shrink-0 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
              <Label className="flex items-center gap-2"><PackageOpen className="w-4 h-4 text-emerald-500"/> Gunakan Template Paket</Label>
              <div className="flex gap-2">
                <select 
                  className="flex-1 bg-zinc-950 text-zinc-100 text-sm border border-zinc-700 rounded-md outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer p-2"
                  value={selectedPackageId}
                  onChange={(e) => handleLoadPackage(e.target.value)}
                >
                  <option value="">-- Pilih Paket (Opsional) --</option>
                  {packages.map(p => (
                    <option key={p.id} value={p.id}>{p.name} {p.description ? `- ${p.description}` : ''}</option>
                  ))}
                </select>
                {selectedPackageId && (
                  <Button type="button" variant="destructive" size="icon" onClick={handleDeletePackage} disabled={isDeletingPkg} className="shrink-0 h-auto px-3 border border-red-900 bg-red-950/50 text-red-400 hover:bg-red-900">
                    {isDeletingPkg ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2 shrink-0">
            <Label>Cari Aset Tersedia</Label>
            <div className="relative z-50">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input placeholder="Ketik nama atau kode aset..." className="pl-9 bg-zinc-900 border-zinc-800" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true) }} onFocus={() => setShowResults(true)} />
              {showResults && searchQuery && (
                <div className="absolute top-full mt-1 left-0 right-0 max-h-[150px] overflow-y-auto overflow-x-hidden bg-zinc-800 border border-zinc-700 rounded-md shadow-2xl z-50">
                {filteredItems.filter(i => i.quantity > 0).length > 0 ? (
                  filteredItems.filter(i => i.quantity > 0).map(item => (
                    <div key={item.id} className="p-3 hover:bg-zinc-700 cursor-pointer border-b border-zinc-700/50 flex justify-between items-center" onClick={() => addToCart(item)}>
                      <div><p className="text-sm font-bold text-zinc-200">{item.name}</p><p className="text-xs text-zinc-400">{item.code}</p></div>
                      <p className="text-xs font-medium text-emerald-400">Tersedia: {item.quantity}</p>
                    </div>
                  ))
                ) : (<div className="p-3 text-sm text-zinc-500 text-center">Aset tidak ditemukan / stok kosong.</div>)}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 shrink-0 bg-blue-950/20 p-3 rounded-lg border border-blue-900/50">
            <Label className="flex items-center gap-2 text-blue-400"><PlusCircle className="w-4 h-4"/> Layanan / Kebutuhan Tambahan</Label>
            <div className="flex flex-col gap-2 mt-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-blue-400/80">Nama Layanan Tambahan</Label>
                <Input placeholder="Misal: Kuli Angkut" value={customName} onChange={e => setCustomName(e.target.value)} className="bg-zinc-950 border-zinc-700 text-xs w-full h-9" />
              </div>
              <div className="flex gap-2">
                <div className="space-y-1 w-20">
                  <Label className="text-[10px] text-blue-400/80">Qty</Label>
                  <Input type="number" min="1" placeholder="Qty" value={customQty} onChange={e => setCustomQty(parseInt(e.target.value)||1)} className="bg-zinc-950 border-zinc-700 w-full text-xs h-9" />
                </div>
                <div className="space-y-1 flex-1">
                  <Label className="text-[10px] text-blue-400/80">Harga / Hari</Label>
                  <Input type="number" min="0" placeholder="Harga" value={customPrice} onChange={e => setCustomPrice(parseInt(e.target.value)||0)} className="bg-zinc-950 border-zinc-700 w-full text-xs h-9" />
                </div>
              </div>
              <Button type="button" onClick={handleAddCustomItem} disabled={!customName.trim()} className="bg-blue-600 hover:bg-blue-700 text-white w-full h-9 text-xs mt-1">Tambahkan ke Keranjang</Button>
            </div>
          </div>
          </div>

          <div className="flex flex-col gap-2 flex-1 min-h-0 bg-zinc-900/30 p-3 sm:p-4 rounded-xl border border-zinc-800">
            <div className="flex justify-between items-center shrink-0 border-b border-zinc-800 pb-2">
              <Label className="text-base text-zinc-100">Daftar Keranjang / Invoice</Label>
              {(cart.length > 0 || customItems.length > 0) && (
                <button 
                  type="button" 
                  onClick={() => {
                    if (window.confirm('Yakin ingin mengosongkan seluruh isi keranjang?')) {
                      setCart([]);
                      setCustomItems([]);
                      setSelectedPackageId("");
                      setEventName("");
                      setDiscountPercentage(0);
                      setDiscountDesc("");
                      setRentalDays(1);
                    }
                  }}
                  className="text-[10px] sm:text-xs text-red-400 hover:text-red-300 transition-colors font-medium"
                >
                  Kosongkan Keranjang
                </button>
              )}
            </div>
            {cart.length === 0 && customItems.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-6 border border-dashed border-zinc-800 rounded-lg text-center text-zinc-500 text-sm mt-2">Belum ada item di keranjang.</div>
            ) : (
              <div className="space-y-3 overflow-y-auto overflow-x-hidden pr-2 flex-1 min-h-[200px] lg:min-h-0 mt-2">
                {cart.map(item => (
                  <div key={item.id} className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div><p className="text-sm font-bold text-zinc-100">{item.name}</p><p className="text-xs text-zinc-500">{item.code} | Max: {item.quantity} Unit</p></div>
                      <button type="button" onClick={() => setCart(cart.filter(c => c.id !== item.id))} className="text-zinc-500 hover:text-red-400 p-1 bg-zinc-800 rounded shrink-0"><Trash2 className="w-4 h-4"/></button>
                    </div>
                    <div className="flex flex-col gap-2 mt-1 pt-2 border-t border-zinc-800/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Qty:</Label>
                          <Input type="number" min="1" max={item.quantity} value={item.qty} onChange={(e) => updateQty(item.id, parseInt(e.target.value)||1)} className="w-20 h-7 text-xs bg-zinc-950 border-zinc-700" />
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-zinc-500">Nilai Sewa</p>
                          <p className="text-sm font-bold text-emerald-400">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.qty * ((item.price || 0) * (item.rentPercentage || 0) / 100) * rentalDays)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs shrink-0 text-zinc-400">Catatan:</Label>
                        <Input type="text" placeholder="Catatan tambahan (opsional)..." value={item.footnote || ""} onChange={(e) => updateFootnote(item.id, e.target.value)} className="flex-1 h-7 text-xs bg-zinc-950 border-zinc-700" />
                      </div>
                    </div>
                  </div>
                ))}
                
                {customItems.map(item => (
                  <div key={item.id} className="bg-blue-950/20 p-3 rounded-lg border border-blue-900/50 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div><p className="text-sm font-bold text-zinc-100">{item.name}</p><p className="text-xs text-blue-400">Layanan Khusus / Kustom</p></div>
                      <button type="button" onClick={() => setCustomItems(customItems.filter(c => c.id !== item.id))} className="text-zinc-500 hover:text-red-400 p-1 bg-zinc-800 rounded shrink-0"><Trash2 className="w-4 h-4"/></button>
                    </div>
                    <div className="flex flex-col gap-2 mt-1 pt-2 border-t border-zinc-800/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Qty:</Label>
                          <Input type="number" min="1" value={item.qty} onChange={(e) => updateCustomQty(item.id, parseInt(e.target.value)||1)} className="w-16 h-7 text-xs bg-zinc-950 border-zinc-700" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Tarif/Hari:</Label>
                          <Input type="number" min="0" value={item.price} onChange={(e) => updateCustomPrice(item.id, parseInt(e.target.value)||0)} className="w-24 h-7 text-xs bg-zinc-950 border-zinc-700" />
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-zinc-500">Nilai Tambahan</p>
                          <p className="text-sm font-bold text-emerald-400">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.qty * item.price * rentalDays)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs shrink-0 text-zinc-400">Catatan:</Label>
                        <Input type="text" placeholder="Catatan tambahan (opsional)..." value={item.footnote || ""} onChange={(e) => updateCustomFootnote(item.id, e.target.value)} className="flex-1 h-7 text-xs bg-zinc-950 border-zinc-700" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Summary & Checkout Section */}
            {(cart.length > 0 || customItems.length > 0) && (
              <div className="mt-auto pt-4 border-t border-zinc-800 flex flex-col gap-3 shrink-0">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-zinc-400">Durasi (Hari)</Label>
                    <Input type="number" min="1" value={rentalDays} onChange={(e) => setRentalDays(Math.max(1, parseInt(e.target.value) || 1))} className="h-8 text-xs bg-zinc-950 border-zinc-700" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-zinc-400">Diskon (%)</Label>
                    <Input type="number" min="0" max="100" value={discountPercentage} onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)} className="h-8 text-xs bg-zinc-950 border-zinc-700" />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-[10px] text-zinc-400">Keterangan Diskon</Label>
                    <Input type="text" placeholder="Misal: Promo Tahunan" value={discountDesc} onChange={(e) => setDiscountDesc(e.target.value)} disabled={discountPercentage <= 0} className="h-8 text-xs bg-zinc-950 border-zinc-700" />
                  </div>
                </div>
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <div className="flex justify-between items-center text-sm text-zinc-400 mb-1">
                    <span>Subtotal:</span>
                    <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(subTotal)}</span>
                  </div>
                  {discountPercentage > 0 && (
                    <div className="flex justify-between items-center text-sm text-amber-400 mb-1">
                      <span>Diskon ({discountPercentage}%):</span>
                      <span>-{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-zinc-800/50 mt-1">
                    <span className="text-sm font-bold text-zinc-300">Total Tagihan:</span>
                    <span className="text-lg font-bold text-emerald-400">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(grandTotal)}</span>
                  </div>
                </div>
                <Button type="submit" disabled={(cart.length === 0 && customItems.length === 0) || isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold h-10 shrink-0">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {isSubmitting ? "Memproses..." : "Proses Sewa (Rental)"}
                </Button>
              </div>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}