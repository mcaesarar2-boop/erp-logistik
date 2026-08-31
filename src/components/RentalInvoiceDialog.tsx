"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Receipt, Printer, Loader2, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createHistory } from "@/app/actions"
import { supabase } from "@/lib/supabase"
import { DemoRestrictionDialog } from "@/components/DemoRestrictionDialog"
import { isDemoEmail, DEMO_MESSAGES } from "@/lib/permissions"

interface Item {
  id: string;
  code: string;
  name: string;
  rentedQuantity: number;
  price?: number | null;
  rentPercentage?: number | null;
}

interface RentalInvoiceDialogProps {
  items: Item[]
}

export function RentalInvoiceDialog({ items }: RentalInvoiceDialogProps) {
  const [open, setOpen] = useState(false)
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [isSaving, setIsSaving] = useState(false)
  const [discountPercentage, setDiscountPercentage] = useState<number>(0)
  const [discountDesc, setDiscountDesc] = useState<string>("")
  const [rentalDays, setRentalDays] = useState<number>(1)
  const [cart, setCart] = useState<any[]>([])
  const [isDummyUser, setIsDummyUser] = useState(false)
  const [showDemoWarning, setShowDemoWarning] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsDummyUser(isDemoEmail(data.user?.email))
    })
  }, [])

  useEffect(() => {
    if (open) {
      setCart(items.filter(i => i.rentedQuantity > 0).map(i => ({ ...i, qty: i.rentedQuantity, footnote: "" })))
    } else {
      setCart([])
      setRentalDays(1)
      setDiscountPercentage(0)
      setDiscountDesc("")
      setInvoiceDate(new Date().toISOString().split('T')[0])
    }
  }, [open, items])

  const updateQty = (id: string, newQty: number) => {
    setCart(cart.map(c => c.id === id ? { ...c, qty: Math.min(Math.max(1, newQty), c.rentedQuantity) } : c))
  }

  const updateFootnote = (id: string, footnote: string) => {
    setCart(cart.map(c => c.id === id ? { ...c, footnote } : c))
  }

  const removeItem = (id: string) => {
    setCart(cart.filter(c => c.id !== id))
  }

  const subTotal = cart.reduce((acc, item) => {
    const rentPricePerItem = ((item.price || 0) * (item.rentPercentage || 0)) / 100
    return acc + (item.qty * rentPricePerItem * rentalDays)
  }, 0)

  const discountAmount = subTotal * (discountPercentage / 100)
  const grandTotal = subTotal - discountAmount

  const handlePrintAndSave = async () => {
    if (isDummyUser) {
      setShowDemoWarning(true)
      return
    }

    setIsSaving(true)
    const formData = new FormData()
    formData.append("type", "INVOICE_RENTAL")
    formData.append("date", invoiceDate)
    
    let historyDesc = `Cetak Invoice Rental (${cart.reduce((acc, i) => acc + i.qty, 0)} Unit Aset)`
    if (rentalDays > 1) {
      historyDesc += ` - ${rentalDays} Hari`
    }
    if (discountPercentage > 0) {
      historyDesc += ` - Diskon ${discountPercentage}%`
      if (discountDesc.trim() !== "") {
        historyDesc += ` (${discountDesc.trim()})`
      }
    }
    formData.append("description", historyDesc)
    
    // Simpan snapshot nama, qty, dan harga pada waktu dicetak
    const payload = cart.map(i => ({
      name: i.name, 
      code: i.code, 
      qty: i.qty, 
      price: (((i.price || 0) * (i.rentPercentage || 0)) / 100) * rentalDays * (1 - (discountPercentage / 100)),
      footnote: i.footnote || ""
    }))
    formData.append("payload", JSON.stringify(payload))

    await createHistory(formData)
    setIsSaving(false)
    
    // Panggil fungsi print bawaan browser (Bisa simpan PDF)
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full sm:w-auto bg-emerald-950/50 hover:bg-emerald-900 text-emerald-400 px-3 py-1.5 rounded-md transition-colors border border-emerald-900 flex items-center justify-center shrink-0 text-sm font-medium gap-2 shadow-sm">
          <Receipt className="w-4 h-4" />
          <span className="inline">Rincian Rental</span>
        </button>
      </DialogTrigger>
      {/* Tambahkan class print agar dialog menutupi seluruh layar saat dicetak dengan background putih teks hitam */}
      <DialogContent aria-describedby={undefined} className="bg-zinc-950 border-zinc-800 text-zinc-50 max-w-2xl max-h-[90vh] overflow-hidden flex flex-col print:!absolute print:!top-0 print:!left-0 print:!translate-x-0 print:!translate-y-0 print:!w-full print:!h-auto print:!max-w-none print:!max-h-none print:!overflow-visible print:!bg-white print:!text-black print:!border-none print:!rounded-none print:!shadow-none print:z-[99999] print:!p-4 print:!block">
        <DialogHeader className="border-b border-zinc-800 print:border-zinc-300 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <DialogTitle className="flex items-center gap-2 text-emerald-400 print:text-black text-2xl font-bold">
              <Receipt className="w-6 h-6 print:hidden" />
              INVOICE RENTAL
            </DialogTitle>
            <p className="text-sm text-zinc-500 print:text-zinc-600 mt-1">Sistem ERP Logistik Enterprise</p>
          </div>
          
          {/* Input Tanggal (Hanya muncul di UI, tidak ikut ter-print) */}
          <div className="flex items-center gap-2 print:hidden bg-zinc-900 p-1.5 rounded-lg border border-zinc-800">
            <span className="text-xs text-zinc-400 pl-2">Tanggal:</span>
            <Input 
              type="date" 
              value={invoiceDate} 
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="h-8 text-xs bg-zinc-950 border-zinc-800 text-zinc-100"
            />
          </div>
          
          {/* Tanggal khusus print (Teks statis di kertas PDF) */}
          <div className="hidden print:block text-right">
            <p className="text-sm font-bold">Tanggal Cetak</p>
            <p className="text-sm">{new Date(invoiceDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2 print:overflow-visible">
          {cart.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
              Tidak ada aset yang sedang disewakan dalam daftar ini.
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => {
                const rentPricePerItem = ((item.price || 0) * (item.rentPercentage || 0)) / 100;
                // Diskon belum diterapkan di list ini, hanya di subtotal & total
                const totalItemRent = rentPricePerItem * item.qty * rentalDays;
                return (
                  <div key={item.id} className="bg-zinc-900/50 print:bg-transparent border border-zinc-800 print:border-b print:border-zinc-300 print:border-x-0 print:border-t-0 p-3 rounded-lg print:rounded-none flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-zinc-100 print:text-black truncate">{item.name}</p>
                        <p className="text-xs text-zinc-500 print:text-zinc-600">{item.code} <span className="print:hidden">| Sedang Keluar: {item.rentedQuantity} Unit</span></p>
                        {item.footnote && <p className="text-xs text-zinc-500 print:text-zinc-500 italic mt-0.5 print:block hidden">{item.footnote}</p>}
                      </div>
                      <button type="button" onClick={() => removeItem(item.id)} className="print:hidden text-zinc-500 hover:text-red-400 p-1 bg-zinc-800 rounded shrink-0"><Trash2 className="w-4 h-4"/></button>
                    </div>
                    
                    <div className="flex flex-col gap-2 mt-1 pt-2 border-t border-zinc-800/50 print:border-none print:pt-0 print:mt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 print:hidden">
                          <Label className="text-xs">Qty:</Label>
                          <Input type="number" min="1" max={item.rentedQuantity} value={item.qty} onChange={(e) => updateQty(item.id, parseInt(e.target.value)||1)} className="w-20 h-7 text-xs bg-zinc-950 border-zinc-700" />
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs text-zinc-400 print:text-zinc-600 mb-0.5 hidden print:block">
                            {item.qty} Unit × {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(rentPricePerItem)}
                          </div>
                          <p className="text-[10px] text-zinc-500 print:hidden">Nilai Sewa</p>
                          <p className="font-bold text-sm text-emerald-400 print:text-black">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalItemRent)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 print:hidden">
                        <Label className="text-xs shrink-0 text-zinc-400">Catatan:</Label>
                        <Input type="text" placeholder="Catatan tambahan (opsional)..." value={item.footnote || ""} onChange={(e) => updateFootnote(item.id, e.target.value)} className="flex-1 h-7 text-xs bg-zinc-950 border-zinc-700" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        
        <div className="border-t border-zinc-800 print:border-zinc-300 pt-4 pb-2 mt-auto">
          <div className="bg-zinc-900 print:bg-transparent border border-zinc-800 print:border-none rounded-lg p-4 flex flex-col gap-2 mb-4">
            <div className="flex justify-between items-center print:hidden">
              <Label className="text-zinc-300">Durasi Rental (Hari)</Label>
              <Input type="number" min="1" value={rentalDays} onChange={(e) => setRentalDays(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 h-8 text-right text-xs bg-zinc-950 border-zinc-800" />
            </div>
            <div className="flex justify-between items-center text-sm text-zinc-400 print:text-zinc-600">
              <span>Subtotal (Dari {cart.reduce((acc, i) => acc + i.qty, 0)} Unit Aset):</span>
              <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(subTotal)}</span>
            </div>
            
            <div className="flex justify-between items-center print:hidden">
              <Label className="text-zinc-300">Diskon Keseluruhan (%)</Label>
              <Input type="number" min="0" max="100" value={discountPercentage} onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)} className="w-20 h-8 text-right text-xs bg-zinc-950 border-zinc-800" />
            </div>
            {discountPercentage > 0 && (
              <>
                <div className="flex justify-between items-center print:hidden">
                  <Label className="text-zinc-300">Keterangan Diskon</Label>
                  <Input type="text" placeholder="Misal: Promo Event Tahunan" value={discountDesc} onChange={(e) => setDiscountDesc(e.target.value)} className="w-48 h-8 text-xs bg-zinc-950 border-zinc-800" />
                </div>
                <div className="flex justify-between items-center text-sm text-amber-400 print:text-black">
                  <span>Potongan Diskon ({discountPercentage}%){discountDesc.trim() !== "" ? ` - ${discountDesc}` : ""}</span>
                  <span>-{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(discountAmount)}</span>
                </div>
              </>
            )}
            
            <div className="flex justify-between items-center pt-2 border-t border-zinc-800/50 print:border-zinc-300 mt-1">
              <p className="text-sm font-bold text-zinc-300 print:text-black">Total Nilai Sewa Aktif</p>
              <p className="text-2xl font-bold text-emerald-400 print:text-black">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(grandTotal)}
              </p>
            </div>
          </div>

          {/* Tombol Aksi (Print hidden) */}
          <div className="flex flex-col sm:flex-row gap-3 print:hidden">
            <button type="button" onClick={() => setOpen(false)} className="w-full sm:flex-1 bg-transparent hover:bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 rounded-lg font-medium text-sm transition-colors">Batal</button>
            <button type="button" onClick={handlePrintAndSave} disabled={cart.length === 0 || isSaving} className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2.5 disabled:opacity-50">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin shrink-0" /> : <Printer className="w-5 h-5 shrink-0" />}
              Cetak PDF & Simpan Riwayat
            </button>
          </div>
        </div>
      </DialogContent>
      <DemoRestrictionDialog
        isOpen={showDemoWarning}
        onClose={() => setShowDemoWarning(false)}
        title={DEMO_MESSAGES.rental.title}
        message="Akun yang sedang digunakan adalah akun demo dan bersifat read-only. Penyimpanan riwayat invoice rental dinonaktifkan pada akun ini."
      />
    </Dialog>
  )
}