"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Receipt, Printer } from "lucide-react"

// Ini adalah struktur dari payload yang tersimpan di riwayat
interface PayloadItem {
  name: string;
  code: string;
  qty: number;
  price: number; // Ini adalah harga sewa final per item
  footnote?: string;
}

interface History {
  id: string;
  type: string;
  date: Date | string;
  description: string | null;
  payload: string | null;
  createdAt: Date | string;
}

interface ReprintInvoiceDialogProps {
  history: History;
  children: React.ReactNode; // Untuk menerima tombol pemicu
}

export function ReprintInvoiceDialog({ history, children }: ReprintInvoiceDialogProps) {
  const [open, setOpen] = useState(false)

  // Parse payload dari catatan riwayat
  const invoiceItems: PayloadItem[] = history.payload ? JSON.parse(history.payload) : []
  
  let discountPercentage = 0
  let discountDesc = ""

  if (history.description) {
    // Cerdas mem-parsing deskripsi diskon yang tercatat di server tanpa membebani database
    const discountMatch = history.description.match(/- Diskon (\d+(?:\.\d+)?)%(?:\s*\((.*?)\))?/);
    if (discountMatch) {
      discountPercentage = parseFloat(discountMatch[1]);
      if (discountMatch[2]) {
        discountDesc = discountMatch[2];
      }
    }
  }

  // Hitung grand total dari payload yang sudah tersimpan
  const grandTotal = invoiceItems.reduce((acc, item) => {
    return acc + (item.qty * item.price)
  }, 0)

  let subTotal = grandTotal;
  let discountAmount = 0;
  if (discountPercentage > 0 && discountPercentage < 100) {
    subTotal = grandTotal / (1 - (discountPercentage / 100));
    discountAmount = subTotal - grandTotal;
  }

  const handlePrint = () => {
    // Cukup panggil fungsi print bawaan browser
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      {/* Styling untuk print sama persis dengan dialog invoice asli */}
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50 max-w-2xl max-h-[90vh] overflow-hidden flex flex-col print:!absolute print:!top-0 print:!left-0 print:!translate-x-0 print:!translate-y-0 print:!w-full print:!h-auto print:!max-w-none print:!max-h-none print:!overflow-visible print:!bg-white print:!text-black print:!border-none print:!rounded-none print:!shadow-none print:z-[99999] print:!p-4 print:!block">
        <DialogHeader className="border-b border-zinc-800 print:border-zinc-300 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <DialogTitle className="flex items-center gap-2 text-emerald-400 print:text-black text-2xl font-bold">
              <Receipt className="w-6 h-6 print:hidden" />
              CETAK ULANG INVOICE
            </DialogTitle>
            <p className="text-sm text-zinc-500 print:text-zinc-600 mt-1">Sistem ERP Logistik Enterprise</p>
            {history.description && (
              <p className="text-sm font-medium text-amber-400 print:text-black mt-2">{history.description}</p>
            )}
          </div>
          
          {/* Tampilkan tanggal statis dari catatan riwayat */}
          <div className="text-right">
            <p className="text-sm font-bold print:hidden text-zinc-400">Tanggal Invoice Asli</p>
            <p className="text-sm font-bold hidden print:block">Tanggal Cetak</p>
            <p className="text-sm text-zinc-100 print:text-black">{new Date(history.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2 print:overflow-visible">
          {invoiceItems.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
              Tidak ada data item pada riwayat ini.
            </div>
          ) : (
            <div className="space-y-3">
              {invoiceItems.map((item, index) => {
                // Kalkulasi mundur (reconstruct) untuk mendapatkan harga aslinya sebelum didiskon di kertas Invoice
                const originalPricePerItem = (discountPercentage > 0 && discountPercentage < 100) ? item.price / (1 - (discountPercentage / 100)) : item.price;
                return (
                  <div key={index} className="bg-zinc-900/50 print:bg-transparent border border-zinc-800 print:border-b print:border-zinc-300 print:border-x-0 print:border-t-0 p-3 rounded-lg print:rounded-none flex justify-between items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-zinc-100 print:text-black truncate">{item.name}</p>
                      <p className="text-xs text-zinc-500 print:text-zinc-600">{item.code}</p>
                      {item.footnote && (
                        <p className="text-xs text-zinc-500 print:text-zinc-500 italic mt-0.5">{item.footnote}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-zinc-400 print:text-zinc-600 mb-0.5">
                        {item.qty} Unit × {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(originalPricePerItem)}
                      </div>
                      <p className="font-bold text-sm text-emerald-400 print:text-black">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(originalPricePerItem * item.qty)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        
        <div className="border-t border-zinc-800 print:border-zinc-300 pt-4 pb-2 mt-auto">
          <div className="bg-zinc-900 print:bg-transparent border border-zinc-800 print:border-none rounded-lg p-4 flex flex-col gap-2 mb-4">
            <div className="flex justify-between items-center text-sm text-zinc-400 print:text-zinc-600">
              <span>Subtotal (Dari {invoiceItems.reduce((acc, i) => acc + i.qty, 0)} Unit Aset):</span>
              <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(subTotal)}</span>
            </div>
            
            {discountPercentage > 0 && (
              <div className="flex justify-between items-center text-sm text-amber-400 print:text-black">
                <span>Potongan Diskon ({discountPercentage}%){discountDesc.trim() !== "" ? ` - ${discountDesc}` : ""}</span>
                <span>-{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-zinc-800/50 print:border-zinc-300 mt-1">
              <p className="text-sm font-bold text-zinc-300 print:text-black">Total Nilai Sewa</p>
              <p className="text-2xl font-bold text-emerald-400 print:text-black">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(grandTotal)}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 print:hidden">
            <button type="button" onClick={() => setOpen(false)} className="w-full sm:flex-1 bg-transparent hover:bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 rounded-lg font-medium text-sm transition-colors">Batal</button>
            <button type="button" onClick={handlePrint} disabled={invoiceItems.length === 0} className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2.5 disabled:opacity-50">
              <Printer className="w-5 h-5 shrink-0" />
              Cetak PDF
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}