"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Receipt } from "lucide-react"

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

  // Pastikan hanya memproses aset yang sedang keluar/disewa
  const rentedItems = items.filter(i => i.rentedQuantity > 0)
  
  // Hitung total dari keseluruhan item yang dirental
  const grandTotal = rentedItems.reduce((acc, item) => {
    const rentPricePerItem = ((item.price || 0) * (item.rentPercentage || 0)) / 100
    return acc + (item.rentedQuantity * rentPricePerItem)
  }, 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="bg-emerald-950/50 hover:bg-emerald-900 text-emerald-400 px-3 py-1.5 rounded-md transition-colors border border-emerald-900 flex items-center justify-center shrink-0 text-sm font-medium gap-2 shadow-sm">
          <Receipt className="w-4 h-4" />
          <span className="hidden sm:inline">Rincian Rental</span>
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50 max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b border-zinc-800 pb-4">
          <DialogTitle className="flex items-center gap-2 text-emerald-400">
            <Receipt className="w-5 h-5" />
            Invoice / Rincian Rental Aktif
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
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
                  <div key={item.id} className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg flex justify-between items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-zinc-100 truncate">{item.name}</p>
                      <p className="text-xs text-zinc-500">{item.code}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-zinc-400 mb-0.5">
                        {item.rentedQuantity} Unit × {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(rentPricePerItem)}
                      </div>
                      <p className="font-bold text-sm text-emerald-400">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalItemRent)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        
        <div className="border-t border-zinc-800 pt-4 pb-2 mt-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-zinc-400">Total Nilai Sewa Aktif</p>
              <p className="text-xs text-zinc-500 mt-0.5">Dari {rentedItems.reduce((acc, i) => acc + i.rentedQuantity, 0)} Unit Aset</p>
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(grandTotal)}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}