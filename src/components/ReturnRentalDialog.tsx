"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { returnBulkRental } from "@/app/actions"
import { supabase } from "@/lib/supabase"
import { Trash2, Search, Undo2 } from "lucide-react"

interface ReturnRentalDialogProps {
  items: {
    id: string
    name: string
    code: string
    rentedQuantity: number
  }[]
  activeEvent?: any
}

export function ReturnRentalDialog({ items, activeEvent }: ReturnRentalDialogProps) {
  const [open, setOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [cart, setCart] = useState<any[]>([])

  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const ADMIN_EMAILS = ["mcaesarar@gmail.com"] 
      if (data.user?.email && ADMIN_EMAILS.includes(data.user.email.toLowerCase())) setIsAdmin(true)
    })
  }, [])

  // Tentukan item apa saja yang bisa dikembalikan (Jika activeEvent ada, batasi ke event tersebut)
  const rentableItems = activeEvent ? (() => {
    const payload = JSON.parse(activeEvent.payload || "[]");
    return payload
      .filter((p: any) => (p.qty - (p.returnedQty || 0)) > 0)
      .map((p: any) => {
        const realItem = items.find(i => i.id === p.id || i.code === p.code);
        return {
          ...p,
          id: p.id || realItem?.id,
          name: p.name || realItem?.name,
          code: p.code || realItem?.code,
          rentedQuantity: Math.min((p.qty - (p.returnedQty || 0)), realItem?.rentedQuantity || 0) // Tidak bisa kembali lebih dari yang riil di gudang
        }
      })
      .filter((p: any) => p.id && p.rentedQuantity > 0);
  })() : items.filter(i => i.rentedQuantity > 0);

  const filteredItems = rentableItems.filter((item: any) => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const addToCart = (item: any) => {
    if (item.rentedQuantity <= 0) return
    if (!cart.find(c => c.id === item.id)) {
      setCart([...cart, { ...item, qty: item.rentedQuantity }]) // Default kembalikan semua
    }
    setSearchQuery("")
    setShowResults(false)
  }

  const addAllToCart = () => {
    setCart(rentableItems.map((item: any) => ({ ...item, qty: item.rentedQuantity })))
    setSearchQuery("")
    setShowResults(false)
  }

  const updateQty = (id: string, newQty: number) => {
    setCart(cart.map(c => c.id === id ? { ...c, qty: Math.min(Math.max(1, newQty), c.rentedQuantity) } : c))
  }

  async function handleSubmit(formData: FormData) {
    setErrorMsg(null)
    if (cart.length === 0) {
      setErrorMsg("Belum ada barang yang dipilih untuk dikembalikan.")
      return
    }
    
    formData.append("payload", JSON.stringify(cart.map(c => ({ id: c.id, qty: c.qty }))))
    
    // Jika ada activeEvent, update history payload agar mencatat sisa pengembalian
    if (activeEvent) {
      formData.append("historyId", activeEvent.id);
      const currentPayload = JSON.parse(activeEvent.payload || "[]");
      const newPayload = currentPayload.map((p: any) => {
        const returnedItem = cart.find(c => c.id === p.id || c.code === p.code);
        if (returnedItem) {
          return { ...p, returnedQty: (p.returnedQty || 0) + returnedItem.qty };
        }
        return p;
      });
      formData.append("historyPayload", JSON.stringify(newPayload));
      
      // Cek otomatis apakah semua barang pada event ini sudah dikembalikan?
      const isAllReturned = newPayload.every((p: any) => (p.returnedQty || 0) >= p.qty);
      if (isAllReturned) {
        formData.append("historyDesc", activeEvent.description + " [SELESAI]");
      }
    }

    const result = await returnBulkRental(formData)
    
    if (result?.success === false) {
      setErrorMsg(result.error ?? "Terjadi kesalahan sistem.")
      return
    }
    setOpen(false)
    setCart([]) // Reset state
  }

  if (!isAdmin) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) { setErrorMsg(null); setCart([]); }}}>
      <DialogTrigger asChild>
        <button className="w-full sm:w-auto bg-blue-950/50 hover:bg-blue-900 text-blue-400 px-3 py-1.5 rounded-md transition-colors border border-blue-900 flex items-center justify-center shrink-0 text-sm font-medium gap-2 shadow-sm">
          <Undo2 className="w-4 h-4" />
          <span className="inline">{activeEvent ? "Kembalikan Event Ini" : "Kembalikan Aset"}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50 flex flex-col max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-400">
            <Undo2 className="w-5 h-5" /> {activeEvent ? "Pengembalian Aset Event" : "Form Pengembalian Aset (Rental)"}
          </DialogTitle>
        </DialogHeader>
        {errorMsg && (
          <div className="bg-red-950/50 border border-red-900 text-red-400 text-sm p-3 rounded-md flex items-center gap-2">
            <span className="font-bold">Gagal:</span> {errorMsg}
          </div>
        )}

        <form action={handleSubmit} className="flex flex-col gap-4 pt-2 flex-1 overflow-hidden">
          <div className="space-y-2 shrink-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
              <Label>{activeEvent ? "Daftar Aset di Event Ini" : "Cari Aset yang Sedang Disewa"}</Label>
              {rentableItems.length > 0 && (
                <button 
                  type="button" 
                  onClick={addAllToCart}
                  className="text-[10px] sm:text-xs bg-blue-950/50 hover:bg-blue-900 text-blue-400 px-2 py-1 rounded border border-blue-900 transition-colors font-medium self-start sm:self-auto"
                >
                  Pilih Semua Sekaligus
                </button>
              )}
            </div>
            <div className="relative z-50">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input placeholder="Ketik nama atau kode aset..." className="pl-9 bg-zinc-900 border-zinc-800 focus:ring-blue-500" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true) }} onFocus={() => setShowResults(true)} />
              {showResults && searchQuery && (
                <div className="absolute top-full mt-1 left-0 right-0 max-h-[150px] overflow-y-auto overflow-x-hidden bg-zinc-800 border border-zinc-700 rounded-md shadow-2xl z-50">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item: any) => (
                    <div key={item.id} className="p-3 hover:bg-zinc-700 cursor-pointer border-b border-zinc-700/50 flex justify-between items-center" onClick={() => addToCart(item)}>
                      <div><p className="text-sm font-bold text-zinc-200">{item.name}</p><p className="text-xs text-zinc-400">{item.code}</p></div>
                      <p className="text-xs font-medium text-amber-400">Sedang Keluar: {item.rentedQuantity}</p>
                    </div>
                  ))
                ) : (<div className="p-3 text-sm text-zinc-500 text-center">Aset tidak ditemukan / tidak sedang disewa.</div>)}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 flex-1 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
              <Label>Daftar Aset yang Dikembalikan (Masuk Gudang)</Label>
              {cart.length > 0 && (
                <button 
                  type="button" 
                  onClick={() => setCart([])}
                  className="text-[10px] sm:text-xs text-red-400 hover:text-red-300 transition-colors font-medium self-start sm:self-auto"
                >
                  Kosongkan Daftar
                </button>
              )}
            </div>
            {cart.length === 0 ? (
              <div className="p-6 border border-dashed border-zinc-800 rounded-lg text-center text-zinc-500 text-sm shrink-0">Belum ada barang yang dipilih.</div>
            ) : (
              <div className="space-y-3 overflow-y-auto overflow-x-hidden pr-2 flex-1">
                {cart.map(item => (
                  <div key={item.id} className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-100 truncate">{item.name}</p>
                        <p className="text-xs text-zinc-500">{item.code} | Sedang Keluar: {item.rentedQuantity} Unit</p>
                      </div>
                      <button type="button" onClick={() => setCart(cart.filter(c => c.id !== item.id))} className="text-zinc-500 hover:text-red-400 p-1 bg-zinc-800 rounded shrink-0"><Trash2 className="w-4 h-4"/></button>
                    </div>
                    <div className="flex items-center justify-between mt-1 pt-2 border-t border-zinc-800/50">
                      <div className="flex items-center gap-2 bg-zinc-950 px-2 py-1 rounded-md border border-zinc-700">
                        <Label className="text-xs text-zinc-400">Kembali:</Label>
                        <Input type="number" min="1" max={item.rentedQuantity} value={item.qty} onChange={(e) => updateQty(item.id, parseInt(e.target.value)||1)} className="w-20 h-7 text-xs bg-transparent border-none p-0 text-center focus-visible:ring-0" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button type="submit" disabled={cart.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white shrink-0 mt-2">Konfirmasi</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}