"use client"

import React, { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Printer, Package } from "lucide-react"
import { groupItemsByPrimaryCategory } from "@/lib/grouping"

interface PrintPackageDialogProps {
  pkg: {
    id: string
    name: string
    description: string | null
    payload: string
  }
  items: {
    id: string;
    [key: string]: any;
  }[]
}

export function PrintPackageDialog({ pkg, items }: PrintPackageDialogProps) {
  const [open, setOpen] = useState(false)
  
  const payloadData = pkg.payload ? JSON.parse(pkg.payload) : []
  
  const packageItems = useMemo(() => {
    return payloadData.map((pItem: any) => {
      const itemDetail = items.find((i: any) => i.id === pItem.id)
      const rentPricePerItem = itemDetail ? ((itemDetail.price || 0) * (itemDetail.rentPercentage || 0)) / 100 : 0
      return {
        ...pItem,
        imageUrl: itemDetail?.imageUrl || pItem.imageUrl || null,
        categories: itemDetail?.categories || pItem.categories,
        labels: itemDetail?.labels || pItem.labels,
        rentPricePerItem,
        totalRent: rentPricePerItem * pItem.qty
      }
    })
  }, [payloadData, items])

  const groupedPackageItems = useMemo(() => {
    return groupItemsByPrimaryCategory(packageItems, items);
  }, [packageItems, items]);

  const grandTotal = packageItems.reduce((acc: number, item: any) => acc + item.totalRent, 0)
  const totalUnits = packageItems.reduce((acc: number, item: any) => acc + item.qty, 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="bg-zinc-800 hover:bg-zinc-700 text-blue-400 px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center shadow-md hover:shadow-zinc-900/50">
          <Printer className="w-4 h-4 mr-2" /> Cetak PDF
        </button>
      </DialogTrigger>
      
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50 max-w-2xl max-h-[90vh] overflow-hidden flex flex-col print:!absolute print:!top-0 print:!left-0 print:!translate-x-0 print:!translate-y-0 print:!w-full print:!h-auto print:!max-w-none print:!max-h-none print:!overflow-visible print:!bg-white print:!text-black print:!border-none print:!rounded-none print:!shadow-none print:z-[99999] print:!p-4 print:!block">
        <DialogHeader className="border-b border-zinc-800 print:border-zinc-300 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <DialogTitle className="flex items-center gap-2 text-blue-400 print:text-black text-2xl font-bold">
              <Package className="w-6 h-6 print:hidden" />
              KATALOG PAKET RENTAL
            </DialogTitle>
            <p className="text-sm text-zinc-500 print:text-zinc-600 mt-1">{pkg.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold print:hidden text-zinc-400">Tanggal Cetak</p>
            <p className="text-sm font-bold hidden print:block">Tanggal Cetak</p>
            <p className="text-sm text-zinc-100 print:text-black">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2 print:overflow-visible">
          {pkg.description && (
            <div className="text-sm text-zinc-300 print:text-black mb-4 pb-4 border-b border-zinc-800 print:border-zinc-300">
              <strong>Deskripsi:</strong> {pkg.description}
            </div>
          )}
          {packageItems.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
              Tidak ada aset di dalam paket ini.
            </div>
          ) : (
            <div className="space-y-4">
              {groupedPackageItems.map(group => (
                <div key={group.categoryName} className="w-full">
                  {/* Section Header Kategori Utama */}
                  <div className="w-full flex items-center gap-2 pb-1.5 mb-2.5 border-b border-zinc-800 print:border-zinc-300">
                    <span className="w-1.5 h-3.5 bg-blue-500 print:bg-black rounded-full shrink-0"></span>
                    <h4 className="text-xs font-bold text-zinc-200 print:text-black uppercase tracking-wider">
                      {group.categoryName}
                    </h4>
                    <span className="text-[10px] font-semibold text-zinc-400 print:text-zinc-600 bg-zinc-900 print:bg-zinc-100 border border-zinc-800 print:border-zinc-300 px-1.5 py-0.5 rounded-full">
                      {group.items.length} {group.items.length > 1 ? "items" : "item"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {group.items.map((item: any, index: number) => (
                      <div key={index} className="bg-zinc-900/50 print:bg-transparent border border-zinc-800 print:border-b print:border-zinc-300 print:border-x-0 print:border-t-0 p-3 rounded-lg print:rounded-none flex justify-between items-center gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-zinc-100 print:text-black truncate">{item.name}</p>
                          <p className="text-xs text-zinc-500 print:text-zinc-600 font-mono">{item.code}</p>
                          {item.footnote && (
                            <p className="text-xs text-zinc-500 print:text-zinc-500 italic mt-0.5">{item.footnote}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs text-zinc-400 print:text-zinc-600 mb-0.5">
                            {item.qty} Unit × {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.rentPricePerItem)}
                          </div>
                          <p className="font-bold text-sm text-blue-400 print:text-black">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.totalRent)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="border-t border-zinc-800 print:border-zinc-300 pt-4 pb-2 mt-auto">
          <div className="bg-zinc-900 print:bg-transparent border border-zinc-800 print:border-none rounded-lg p-4 flex justify-between items-center mb-4">
            <div>
              <p className="text-sm font-medium text-zinc-400 print:text-zinc-600">Total Harga Sewa Paket</p>
              <p className="text-xs text-zinc-500 print:text-zinc-500 mt-0.5">Dari {totalUnits} Unit Aset</p>
            </div>
            <p className="text-2xl font-bold text-blue-400 print:text-black">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(grandTotal)}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 print:hidden">
            <button type="button" onClick={() => setOpen(false)} className="w-full sm:flex-1 bg-transparent hover:bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 rounded-lg font-medium text-sm transition-colors">Tutup</button>
            <button type="button" onClick={() => window.print()} disabled={packageItems.length === 0} className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2.5 disabled:opacity-50">
              <Printer className="w-5 h-5 shrink-0" />
              Cetak PDF
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}