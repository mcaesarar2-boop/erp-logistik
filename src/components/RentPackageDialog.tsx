"use client"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { addBulkRental, createHistory } from "@/app/actions"
import { supabase } from "@/lib/supabase"
import { ShoppingCart, Loader2, AlertCircle, Trash2 } from "lucide-react"
import { DemoRestrictionDialog } from "@/components/DemoRestrictionDialog"
import { isAdminEmail, isDemoEmail, DEMO_MESSAGES } from "@/lib/permissions"
import { ItemThumbnail } from "@/components/ItemThumbnail"
import { groupItemsByPrimaryCategory } from "@/lib/grouping"

interface RentPackageDialogProps {
  pkg: {
    id: string
    name: string
    payload: string
  }
  items: {
    id: string
    name: string
    code: string
    quantity: number
    imageUrl?: string | null
    price?: number | null
    rentPercentage?: number | null
  }[]
}

export function RentPackageDialog({ pkg, items }: RentPackageDialogProps) {
  const [open, setOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [discountPercentage, setDiscountPercentage] = useState<number | "">(0)
  const [discountDesc, setDiscountDesc] = useState<string>("")
  const [eventName, setEventName] = useState<string>("")
  const [rentalDays, setRentalDays] = useState<number | "">(1)
  const [cart, setCart] = useState<any[]>([])

  const [isAdmin, setIsAdmin] = useState(false)
  const [isDummyUser, setIsDummyUser] = useState(false)
  const [showDemoWarning, setShowDemoWarning] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setIsAdmin(isAdminEmail(data.user.email))
        setIsDummyUser(isDemoEmail(data.user.email))
      }
    })
  }, [])

  useEffect(() => {
    if (open) {
      const payloadData = pkg.payload ? JSON.parse(pkg.payload) : [];
      setCart(payloadData.map((pItem: any) => {
        const realItem = items.find(i => i.id === pItem.id);
        return {
          ...pItem,
          price: realItem?.price || 0,
          rentPercentage: realItem?.rentPercentage || 0,
          quantity: realItem?.quantity || 0,
          realName: realItem?.name || pItem.name,
        };
      }));
    } else {
      setCart([]);
      setRentalDays(1);
      setErrorMsg(null);
      setDiscountPercentage(0);
      setDiscountDesc("");
      setEventName("");
    }
  }, [open, pkg, items]);

  const updateQty = (id: string, newQty: any) => {
    setCart(cart.map(c => c.id === id ? { ...c, qty: newQty === "" ? "" : Math.max(1, parseInt(newQty) || 0) } : c))
  }

  const updateFootnote = (id: string, footnote: string) => {
    setCart(cart.map(c => c.id === id ? { ...c, footnote } : c))
  }

  const removeItem = (id: string) => {
    setCart(cart.filter(c => c.id !== id))
  }

  // Memeriksa apakah stok seluruh barang di dalam paket tersedia
  let isAvailable = true;
  let unavailableReason = "";
  for (const pItem of cart) {
    const realItem = items.find(i => i.id === pItem.id);
    if (!realItem) {
      isAvailable = false;
      unavailableReason = `Barang "${pItem.realName || pItem.name}" sudah dihapus dari sistem.`;
      break;
    }
    const itemQty = Number(pItem.qty) || 1;
    if (realItem.quantity < itemQty) {
      isAvailable = false;
      unavailableReason = `Stok "${realItem.name}" tidak cukup (Sisa: ${realItem.quantity}, Butuh: ${itemQty}).`;
      break;
    }
  }

  const safeRentalDays = Number(rentalDays) || 1;
  const safeDiscountPercentage = Number(discountPercentage) || 0;

  const subTotal = cart.reduce((acc: number, pItem: any) => {
    const rentPrice = ((pItem.price || 0) * (pItem.rentPercentage || 0)) / 100;
    return acc + (rentPrice * (Number(pItem.qty) || 1) * safeRentalDays);
  }, 0);

  const discountAmount = subTotal * (safeDiscountPercentage / 100);
  const grandTotal = subTotal - discountAmount;

  async function handleSubmit(formData: FormData) {
    if (isDummyUser) {
      setShowDemoWarning(true)
      return
    }

    setErrorMsg(null)
    setIsSubmitting(true)
    
    formData.append("payload", JSON.stringify(cart.map((c: any) => ({ id: c.id, qty: Number(c.qty) || 1 }))))
    const result = await addBulkRental(formData)
    
    if (result?.success === false) {
      setIsSubmitting(false)
      setErrorMsg(result.error ?? "Terjadi kesalahan sistem saat proses sewa.")
      return
    }

    const historyFormData = new FormData()
    historyFormData.append("type", "INVOICE_RENTAL")
    historyFormData.append("date", new Date().toISOString().split('T')[0])
    
    const safeDays = Number(rentalDays) || 1
    const safeDisc = Number(discountPercentage) || 0
    const totalQty = cart.reduce((acc: number, i: any) => acc + (Number(i.qty) || 1), 0)
    let historyDesc = `Rental Paket: ${pkg.name} (${totalQty} Unit Aset)`
    if (eventName.trim() !== "") {
      historyDesc = `Event: ${eventName.trim()} | ` + historyDesc
    }
    if (safeDays > 1) {
      historyDesc += ` - ${safeDays} Hari`
    }
    if (safeDisc > 0) {
      historyDesc += ` - Diskon ${safeDisc}%`
      if (discountDesc.trim() !== "") {
        historyDesc += ` (${discountDesc.trim()})`
      }
    }
    historyFormData.append("description", historyDesc)
    
    const historyPayload = cart.map((pItem: any) => {
      const rentPricePerItem = ((pItem.price || 0) * (pItem.rentPercentage || 0)) / 100;
      const realItem = items.find(i => i.id === pItem.id || i.code === pItem.code);
      return {
        id: pItem.id,
        name: pItem.name,
        code: pItem.code,
        qty: Number(pItem.qty) || 1,
        returnedQty: 0,
        imageUrl: realItem?.imageUrl || pItem.imageUrl || null,
        price: rentPricePerItem * safeDays * (1 - (safeDisc / 100)),
        footnote: pItem.footnote
      }
    })
    historyFormData.append("payload", JSON.stringify(historyPayload))
    await createHistory(historyFormData)

    setIsSubmitting(false)
    setOpen(false)
  }

  if (!isAdmin && !isDummyUser) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) setErrorMsg(null); }}>
      <DialogTrigger asChild>
        <Button className="w-full bg-emerald-600 border border-emerald-500 text-white hover:bg-emerald-500 shadow-md font-semibold text-xs flex items-center justify-center gap-1.5 h-8">
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Sewa Paket Langsung</span>
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="bg-zinc-950 border-zinc-800 text-zinc-50 max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0 border-b border-zinc-800 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <span>Sewa Paket:</span>
            <span className="text-emerald-400 font-bold">{pkg.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        {errorMsg && <div className="bg-red-950/50 border border-red-900 text-red-400 text-sm p-3 rounded-md flex items-center gap-2 shrink-0 my-2"><span className="font-bold">Gagal:</span> {errorMsg}</div>}
        {!isAvailable && <div className="bg-red-950/50 border border-red-900 text-red-400 text-xs p-3 rounded-md flex items-center gap-2 shrink-0 mb-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{unavailableReason}</span></div>}

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-2">
          <div className="space-y-2">
            <Label>Nama Event / Acara (Opsional)</Label>
            <Input type="text" placeholder="Misal: Konser Musik Akbar" value={eventName} onChange={(e) => setEventName(e.target.value)} className="bg-zinc-900 border-zinc-800" />
          </div>

          <div>
            <p className="text-sm text-zinc-400 mb-4">Rincian aset yang akan dikeluarkan dari gudang:</p>
            <div className="space-y-4">
              {groupItemsByPrimaryCategory(cart, items).map(group => (
                <div key={group.categoryName} className="w-full">
                  <div className="w-full flex items-center gap-2 pb-1.5 mb-2.5 border-b border-zinc-800">
                    <span className="w-1.5 h-3.5 bg-blue-500 rounded-full shrink-0"></span>
                    <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                      {group.categoryName}
                    </h4>
                    <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-950 border border-zinc-800 px-1.5 py-0.5 rounded-full">
                      {group.items.length} {group.items.length > 1 ? "items" : "item"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {group.items.map((pItem: any, idx: number) => {
                      const itemQty = Number(pItem.qty) || 1;
                      const isEnough = pItem.quantity >= itemQty;
                      const rentPricePerItem = ((pItem.price || 0) * (pItem.rentPercentage || 0)) / 100;
                      const realItem = items.find(i => i.id === pItem.id || i.code === pItem.code);
                      return (
                        <div key={idx} className={`flex flex-col gap-2 p-3 rounded-lg border ${isEnough ? 'bg-zinc-950 border-zinc-800/50' : 'bg-red-950/20 border-red-900/50'}`}>
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <ItemThumbnail src={realItem?.imageUrl || pItem.imageUrl} alt={pItem.realName} className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg shrink-0" iconClassName="w-5 h-5 text-zinc-500" />
                              <div className="min-w-0 flex-1">
                                <p className={`text-sm font-bold truncate ${isEnough ? 'text-zinc-200' : 'text-red-400'}`}>{pItem.realName}</p>
                                <p className="text-xs text-zinc-500 font-mono">{pItem.code} | Max: {pItem.quantity} Unit</p>
                              </div>
                            </div>
                            <button type="button" onClick={() => removeItem(pItem.id)} className="text-zinc-500 hover:text-red-400 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded shrink-0 transition-colors" title="Hapus dari paket"><Trash2 className="w-4 h-4"/></button>
                          </div>
                          <div className="flex flex-col gap-2 mt-1 pt-2 border-t border-zinc-800/50">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Label className="text-xs shrink-0">Qty:</Label>
                                <Input 
                                  type="text" 
                                  inputMode="numeric" 
                                  pattern="[0-9]*" 
                                  value={pItem.qty} 
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "" || /^\d+$/.test(val)) {
                                      updateQty(pItem.id, val === "" ? "" : parseInt(val));
                                    }
                                  }} 
                                  onBlur={() => {
                                    if (pItem.qty === "" || Number(pItem.qty) < 1) updateQty(pItem.id, 1);
                                  }}
                                  className="w-16 sm:w-20 h-8 text-xs bg-zinc-900 border-zinc-700 text-center font-bold" 
                                />
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[10px] text-zinc-500">Nilai Sewa</p>
                                <p className="text-xs sm:text-sm font-bold text-emerald-400">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(rentPricePerItem * (Number(pItem.qty) || 1) * safeRentalDays)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs shrink-0 text-zinc-400">Catatan:</Label>
                              <Input type="text" placeholder="Catatan tambahan (opsional)..." value={pItem.footnote || ""} onChange={(e) => updateFootnote(pItem.id, e.target.value)} className="flex-1 h-8 text-xs bg-zinc-900 border-zinc-700" />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-800 pt-4 shrink-0">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 mb-4 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <Label className="text-zinc-300">Durasi Rental (Hari)</Label>
              <Input 
                type="text" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                value={rentalDays} 
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d+$/.test(val)) {
                    setRentalDays(val === "" ? "" : parseInt(val));
                  }
                }} 
                onBlur={() => {
                  if (rentalDays === "" || Number(rentalDays) < 1) setRentalDays(1);
                }}
                className="w-20 h-8 text-center font-bold text-xs bg-zinc-900 border-zinc-700" 
              />
            </div>
            <div className="flex justify-between items-center text-sm text-zinc-400">
              <span>Subtotal:</span>
              <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(subTotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-300">Diskon Keseluruhan (%)</span>
              <Input 
                type="text" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                value={discountPercentage} 
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d+$/.test(val)) {
                    setDiscountPercentage(val === "" ? "" : Math.min(100, parseInt(val)));
                  }
                }} 
                onBlur={() => {
                  if (discountPercentage === "" || Number(discountPercentage) < 0) setDiscountPercentage(0);
                }}
                className="w-20 h-8 text-center font-bold text-xs bg-zinc-900 border-zinc-700" 
              />
            </div>
            {Number(discountPercentage) > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-300">Keterangan Diskon</span>
                  <Input type="text" placeholder="Misal: Promo Event Tahunan" value={discountDesc} onChange={(e) => setDiscountDesc(e.target.value)} className="w-48 h-8 text-xs bg-zinc-900 border-zinc-700" />
                </div>
                <div className="flex justify-between items-center text-sm text-amber-400">
                  <span>Potongan Diskon:</span>
                  <span>-{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(discountAmount)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-zinc-800/50 mt-1">
              <span className="text-sm font-bold text-zinc-300">Total Harga Sewa:</span>
              <span className="text-xl font-bold text-emerald-400">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(grandTotal)}</span>
            </div>
          </div>
          <form action={handleSubmit}>
            <Button type="submit" disabled={!isAvailable || isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 text-base font-bold">{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Proses Sewa (Rental)"}</Button>
          </form>
        </div>
      </DialogContent>
      <DemoRestrictionDialog
        isOpen={showDemoWarning}
        onClose={() => setShowDemoWarning(false)}
        title={DEMO_MESSAGES.rental.title}
        message="Akun yang sedang digunakan adalah akun demo dan bersifat read-only. Pembuatan transaksi rental dinonaktifkan pada akun ini."
      />
    </Dialog>
  )
}
