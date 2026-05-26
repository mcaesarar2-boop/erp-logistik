"use client"

import React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Receipt, Printer, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { createHistory } from "@/app/actions"

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

  // Pastikan hanya memproses aset yang sedang keluar/disewa
  const rentedItems = items.filter(i => i.rentedQuantity > 0)

  // Hitung total dari keseluruhan item yang dirental
  const grandTotal = rentedItems.reduce((acc, item) => {
    const rentPricePerItem = ((item.price || 0) * (item.rentPercentage || 0)) / 100
    return acc + (item.rentedQuantity * rentPricePerItem)
  }, 0)

  const handlePrintAndSave = async () => {
    setIsSaving(true)
    const formData = new FormData()
    formData.append("type", "INVOICE_RENTAL")
    formData.append("date", invoiceDate)
    formData.append("description", `Cetak Invoice Rental (${rentedItems.reduce((acc, i) => acc + i.rentedQuantity, 0)} Unit Aset)`)
    
    // Simpan snapshot nama, qty, dan harga pada waktu dicetak
    const payload = rentedItems.map(i => ({
      name: i.name, 
      code: i.code, 
      qty: i.rentedQuantity, 
      price: ((i.price || 0) * (i.rentPercentage || 0)) / 100
    }))
    formData.append("payload", JSON.stringify(payload))

    await createHistory(formData)
    setIsSaving(false)
    
    // Panggil fungsi print bawaan browser (Bisa simpan PDF)
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) setInvoiceDate(new Date().toISOString().split('T')[0]) }}>
      <DialogTrigger asChild>
        <button className="w-full sm:w-auto bg-emerald-950/50 hover:bg-emerald-900 text-emerald-400 px-3 py-1.5 rounded-md transition-colors border border-emerald-900 flex items-center justify-center shrink-0 text-sm font-medium gap-2 shadow-sm">
          <Receipt className="w-4 h-4" />
          <span className="inline">Rincian Rental</span>
        </button>
      </DialogTrigger>
      {/* Tambahkan class print agar dialog menutupi seluruh layar saat dicetak dengan background putih teks hitam */}
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50 max-w-2xl max-h-[90vh] overflow-hidden flex flex-col print:!absolute print:!top-0 print:!left-0 print:!translate-x-0 print:!translate-y-0 print:!w-full print:!h-auto print:!max-w-none print:!max-h-none print:!overflow-visible print:!bg-white print:!text-black print:!border-none print:!rounded-none print:!shadow-none print:z-[99999] print:!p-4 print:!block">
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
          {rentedItems.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
              Tidak ada aset yang sedang disewakan dalam daftar ini.
            </div>
          ) : (
            <div className="space-y-3">
              {rentedItems.map(item => {
                const rentPricePerItem = ((item.price || 0) * (item.rentPercentage || 0)) / 100;
                const totalItemRent = rentPricePerItem * item.rentedQuantity;
                return (
                  <div key={item.id} className="bg-zinc-900/50 print:bg-transparent border border-zinc-800 print:border-b print:border-zinc-300 print:border-x-0 print:border-t-0 p-3 rounded-lg print:rounded-none flex justify-between items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-zinc-100 print:text-black truncate">{item.name}</p>
                      <p className="text-xs text-zinc-500 print:text-zinc-600">{item.code}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-zinc-400 print:text-zinc-600 mb-0.5">
                        {item.rentedQuantity} Unit × {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(rentPricePerItem)}
                      </div>
                      <p className="font-bold text-sm text-emerald-400 print:text-black">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalItemRent)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        
        <div className="border-t border-zinc-800 print:border-zinc-300 pt-4 pb-2 mt-auto">
          <div className="bg-zinc-900 print:bg-transparent border border-zinc-800 print:border-none rounded-lg p-4 flex justify-between items-center mb-4">
            <div>
              <p className="text-sm font-medium text-zinc-400 print:text-zinc-600">Total Nilai Sewa Aktif</p>
              <p className="text-xs text-zinc-500 print:text-zinc-500 mt-0.5">Dari {rentedItems.reduce((acc, i) => acc + i.rentedQuantity, 0)} Unit Aset</p>
            </div>
            <p className="text-2xl font-bold text-emerald-400 print:text-black">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(grandTotal)}
            </p>
          </div>

          {/* Tombol Aksi (Print hidden) */}
          <div className="flex flex-col sm:flex-row gap-3 print:hidden">
            <button type="button" onClick={() => setOpen(false)} className="w-full sm:flex-1 bg-transparent hover:bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 rounded-lg font-medium text-sm transition-colors">Batal</button>
            <button type="button" onClick={handlePrintAndSave} disabled={rentedItems.length === 0 || isSaving} className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2.5 disabled:opacity-50">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin shrink-0" /> : <Printer className="w-5 h-5 shrink-0" />}
              Cetak PDF & Simpan Riwayat
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}