"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { addBulkRental, createHistory } from "@/app/actions"
import { supabase } from "@/lib/supabase"
import { ShoppingCart, Loader2, AlertCircle } from "lucide-react"

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
    price?: number | null
    rentPercentage?: number | null
  }[]
}

export function RentPackageDialog({ pkg, items }: RentPackageDialogProps) {
  const [open, setOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [discountPercentage, setDiscountPercentage] = useState<number>(0)
  const [discountDesc, setDiscountDesc] = useState<string>("")

  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const ADMIN_EMAILS = ["mcaesarar@gmail.com"] 
      if (data.user?.email && ADMIN_EMAILS.includes(data.user.email.toLowerCase())) setIsAdmin(true)
    })
  }, [])

  const payloadData = pkg.payload ? JSON.parse(pkg.payload) : [];

  // Memeriksa apakah stok seluruh barang di dalam paket tersedia
  let isAvailable = true;
  let unavailableReason = "";
  for (const pItem of payloadData) {
    const realItem = items.find(i => i.id === pItem.id);
    if (!realItem) {
      isAvailable = false;
      unavailableReason = `Barang "${pItem.name}" sudah dihapus dari sistem.`;
      break;
    }
    if (realItem.quantity < pItem.qty) {
      isAvailable = false;
      unavailableReason = `Stok "${realItem.name}" tidak cukup (Sisa: ${realItem.quantity}, Butuh: ${pItem.qty}).`;
      break;
    }
  }

  const subTotal = payloadData.reduce((acc: number, pItem: any) => {
    const itemDetail = items.find(i => i.id === pItem.id);
    if (!itemDetail) return acc;
    const rentPrice = ((itemDetail.price || 0) * (itemDetail.rentPercentage || 0)) / 100;
    return acc + (rentPrice * pItem.qty);
  }, 0);

  const discountAmount = subTotal * (discountPercentage / 100);
  const grandTotal = subTotal - discountAmount;

  async function handleSubmit(formData: FormData) {
    setErrorMsg(null)
    setIsSubmitting(true)
    
    // Buat format payload yang sesuai untuk dirental
    formData.append("payload", JSON.stringify(payloadData.map((c: any) => ({ id: c.id, qty: c.qty }))))
    const result = await addBulkRental(formData)
    
    if (result?.success === false) {
      setIsSubmitting(false)
      setErrorMsg(result.error ?? "Terjadi kesalahan sistem saat proses sewa.")
      return
    }

    // Tambahkan pencatatan riwayat (history)
    const historyFormData = new FormData()
    historyFormData.append("type", "INVOICE_RENTAL")
    historyFormData.append("date", new Date().toISOString().split('T')[0])
    
    const totalQty = payloadData.reduce((acc: number, i: any) => acc + i.qty, 0)
    let historyDesc = `Rental Paket: ${pkg.name} (${totalQty} Unit Aset)`
    if (discountPercentage > 0) {
      historyDesc += ` - Diskon ${discountPercentage}%`
      if (discountDesc.trim() !== "") {
        historyDesc += ` (${discountDesc.trim()})`
      }
    }
    historyFormData.append("description", historyDesc)
    
    const historyPayload = payloadData.map((pItem: any) => {
      const itemDetail = items.find(i => i.id === pItem.id);
      const rentPricePerItem = itemDetail ? ((itemDetail.price || 0) * (itemDetail.rentPercentage || 0)) / 100 : 0;
      return {
        name: pItem.name,
        code: pItem.code,
        qty: pItem.qty,
        price: rentPricePerItem * (1 - (discountPercentage / 100))
      }
    })
    historyFormData.append("payload", JSON.stringify(historyPayload))
    await createHistory(historyFormData)

    setIsSubmitting(false)
    setOpen(false)
  }

  if (!isAdmin) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) { setErrorMsg(null); setDiscountPercentage(0); setDiscountDesc(""); } }}>
      <DialogTrigger asChild>
        <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center shadow-md hover:shadow-emerald-900/50">
          <ShoppingCart className="w-4 h-4 mr-2" /> Sewa
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50 flex flex-col max-h-[90vh] overflow-hidden">
        <DialogHeader><DialogTitle>Konfirmasi Sewa Paket</DialogTitle></DialogHeader>
        
        {errorMsg && <div className="bg-red-950/50 border border-red-900 text-red-400 text-sm p-3 rounded-md flex items-center gap-2"><span className="font-bold">Gagal:</span> {errorMsg}</div>}
        {!isAvailable && <div className="bg-red-950/50 border border-red-900 text-red-400 text-sm p-3 rounded-md flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span><strong className="block mb-0.5">Tidak bisa disewa:</strong> {unavailableReason}</span></div>}

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 pt-2">
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
            <h3 className="font-bold text-lg text-blue-400 mb-1">{pkg.name}</h3>
            <p className="text-sm text-zinc-400 mb-4">Rincian aset yang akan dikeluarkan dari gudang:</p>
            <div className="space-y-2">
              {payloadData.map((pItem: any, idx: number) => {
                const realItem = items.find(i => i.id === pItem.id);
                const isEnough = realItem ? realItem.quantity >= pItem.qty : false;
                const rentPricePerItem = realItem ? ((realItem.price || 0) * (realItem.rentPercentage || 0)) / 100 : 0;
                return (
                  <div key={idx} className={`flex justify-between items-center p-3 rounded-lg border ${isEnough ? 'bg-zinc-950 border-zinc-800/50' : 'bg-red-950/20 border-red-900/50'}`}>
                    <div className="min-w-0 flex-1"><p className={`text-sm font-bold truncate ${isEnough ? 'text-zinc-200' : 'text-red-400'}`}>{pItem.name}</p><p className="text-xs text-zinc-500">{pItem.code} {realItem && !isEnough && `(Sisa: ${realItem.quantity})`}</p></div>
                    <div className="text-right shrink-0"><p className="text-xs text-zinc-400">{pItem.qty} Unit × {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(rentPricePerItem)}</p></div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-800 pt-4 shrink-0">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 mb-4 flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm text-zinc-400">
              <span>Subtotal:</span>
              <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(subTotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-300">Diskon Keseluruhan (%)</span>
              <Input type="number" min="0" max="100" value={discountPercentage} onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)} className="w-20 h-8 text-right text-xs bg-zinc-900 border-zinc-700" />
            </div>
            {discountPercentage > 0 && (
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
    </Dialog>
  )
}
