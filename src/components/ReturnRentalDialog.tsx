"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { returnBulkRental } from "@/app/actions"
import { supabase } from "@/lib/supabase"
import { Trash2, Search, Undo2 } from "lucide-react"
import { DemoRestrictionDialog } from "@/components/DemoRestrictionDialog"
import { isAdminEmail, isDemoEmail, DEMO_MESSAGES } from "@/lib/permissions"
import { ItemThumbnail } from "@/components/ItemThumbnail"
import { groupItemsByPrimaryCategory } from "@/lib/grouping"

interface ReturnRentalDialogProps {
  items: {
    id: string
    name: string
    code: string
    rentedQuantity: number
    imageUrl?: string | null
  }[]
  activeEvent?: any
}

export function ReturnRentalDialog({ items, activeEvent }: ReturnRentalDialogProps) {
  const [open, setOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [cart, setCart] = useState<any[]>([])
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

  // Tentukan item apa saja yang bisa dikembalikan (Jika activeEvent ada, batasi ke event tersebut)
  const rentableItems = useMemo(() => {
    return activeEvent ? (() => {
      const payload = JSON.parse(activeEvent.payload || "[]");
      return payload
        .filter((p: any) => (p.qty - (p.returnedQty || 0)) > 0 && p.code !== "LAYANAN" && !(p.id && p.id.startsWith("custom-")))
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
  }, [items, activeEvent]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return [];
    return rentableItems.filter((item: any) => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rentableItems, searchQuery]);

  const addToCart = (item: any) => {
    if (item.rentedQuantity <= 0) return
    if (!cart.find(c => c.id === item.id)) {
      setCart([...cart, { ...item, qty: item.rentedQuantity }]) // Default kembalikan semua
    }
    setSearchQuery("")
    setShowResults(false)
  }

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      e.preventDefault(); // Mencegah form submit jika input ada di dalam form
      const scannedItem = rentableItems.find((item: any) => 
        item.code.toLowerCase() === searchQuery.trim().toLowerCase()
      );
      if (scannedItem) {
        addToCart(scannedItem);
        setSearchQuery(''); // Bersihkan input setelah "scan"
        setErrorMsg(null); // Bersihkan pesan error jika ada
      } else {
        setErrorMsg(`Aset dengan kode "${searchQuery}" tidak ditemukan atau tidak sedang disewa.`);
      }
    }
  };

  const addAllToCart = () => {
    setCart(rentableItems.map((item: any) => ({ ...item, qty: item.rentedQuantity })))
    setSearchQuery("")
    setShowResults(false)
  }

  const updateQty = (id: string, newQty: any) => {
    setCart(cart.map(c => c.id === id ? { ...c, qty: newQty === "" ? "" : Math.min(Math.max(1, parseInt(newQty) || 0), c.rentedQuantity) } : c))
  }

  async function handleSubmit(formData: FormData) {
    if (isDummyUser) {
      setShowDemoWarning(true)
      return
    }

    setErrorMsg(null)
    if (cart.length === 0) {
      setErrorMsg("Belum ada barang yang dipilih untuk dikembalikan.")
      return
    }
    
    formData.append("payload", JSON.stringify(cart.map(c => ({ id: c.id, qty: Number(c.qty) || 1 }))))
    
    // Jika ada activeEvent, update history payload agar mencatat sisa pengembalian
    if (activeEvent) {
      formData.append("historyId", activeEvent.id);
      const currentPayload = JSON.parse(activeEvent.payload || "[]");
      const newPayload = currentPayload.map((p: any) => {
        const returnedItem = cart.find(c => c.id === p.id || c.code === p.code);
        if (returnedItem) {
          const newReturnedQty = (p.returnedQty || 0) + (Number(returnedItem.qty) || 1);
          return { ...p, returnedQty: newReturnedQty };
        }
        return p;
      });
      formData.append("historyPayload", JSON.stringify(newPayload));
      
      // Cek otomatis apakah semua barang pada event ini sudah dikembalikan?
      // (Abaikan layanan tambahan/custom yang memang tidak dikembalikan ke gudang)
      const isAllReturned = newPayload
        .filter((p: any) => p.code !== "LAYANAN" && !(p.id && p.id.startsWith("custom-")))
        .every((p: any) => (p.returnedQty || 0) >= p.qty);
        
      if (isAllReturned) {
        formData.append("historyDesc", activeEvent.description + " [SELESAI]");
      }
    }

    const result = await returnBulkRental(formData)
    
    if (result && !result.success) {
      if ("error" in result) {
        setErrorMsg(result.error ?? "Terjadi kesalahan sistem.");
      }
      return;
    }
    setOpen(false)
    setCart([]) // Reset state
  }

  if (!isAdmin && !isDummyUser) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) { setErrorMsg(null); setCart([]); }}}>
      <DialogTrigger asChild>
        <button className="w-full sm:w-auto bg-blue-950/50 hover:bg-blue-900 text-blue-400 px-3 py-1.5 rounded-md transition-colors border border-blue-900 flex items-center justify-center shrink-0 text-sm font-medium gap-2 shadow-sm">
          <Undo2 className="w-4 h-4" />
          <span className="inline">{activeEvent ? "Kembalikan Event Ini" : "Kembalikan Aset"}</span>
        </button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="bg-zinc-950 border-zinc-800 text-zinc-50 flex flex-col max-h-[90vh] overflow-hidden">
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
              <p className="text-xs text-zinc-500 italic">
                (Ketik kode aset lalu tekan Enter untuk "scan")
              </p>
            </div>
            <div className="relative z-50">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input 
                placeholder="Ketik nama atau kode aset..." 
                className="pl-9 bg-zinc-900 border-zinc-800 focus:ring-blue-500" 
                value={searchQuery} 
                onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true) }} 
                onFocus={() => setShowResults(true)} 
                onKeyDown={handleBarcodeScan}
              />
              {showResults && searchQuery && (
                <div className="absolute top-full mt-1 left-0 right-0 max-h-[180px] overflow-y-auto overflow-x-hidden bg-zinc-800 border border-zinc-700 rounded-md shadow-2xl z-50">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item: any) => (
                    <div key={item.id} className="p-2.5 hover:bg-zinc-700 cursor-pointer border-b border-zinc-700/50 flex justify-between items-center gap-3" onClick={() => addToCart(item)}>
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <ItemThumbnail src={item.imageUrl} alt={item.name} className="w-9 h-9 sm:w-10 sm:h-10 rounded-md" iconClassName="w-4 h-4 text-zinc-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-zinc-200 truncate">{item.name}</p>
                          <p className="text-xs text-zinc-400 font-mono">{item.code}</p>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-amber-400 shrink-0">Sedang Keluar: {item.rentedQuantity}</p>
                    </div>
                  ))
                ) : (<div className="p-3 text-sm text-zinc-500 text-center">Aset tidak ditemukan / tidak sedang disewa.</div>)}
                </div>
              )}
            </div>
            
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
              <div className="space-y-4 overflow-y-auto overflow-x-hidden pr-2 flex-1">
                {groupItemsByPrimaryCategory(cart, items).map(group => (
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
                      {group.items.map(item => (
                        <div key={item.id} className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 flex flex-col gap-2">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <ItemThumbnail src={item.imageUrl} alt={item.name} className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg shrink-0" iconClassName="w-5 h-5 text-zinc-500" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-zinc-100 truncate">{item.name}</p>
                                <p className="text-xs text-zinc-500 font-mono">{item.code} | Sedang Keluar: {item.rentedQuantity} Unit</p>
                              </div>
                            </div>
                            <button type="button" onClick={() => setCart(cart.filter(c => c.id !== item.id))} className="text-zinc-500 hover:text-red-400 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded shrink-0 transition-colors" title="Hapus dari daftar"><Trash2 className="w-4 h-4"/></button>
                          </div>
                          <div className="flex items-center justify-between mt-1 pt-2 border-t border-zinc-800/50">
                            <div className="flex items-center gap-2 bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-700">
                              <Label className="text-xs shrink-0 text-blue-400 font-medium">Jumlah Kembali:</Label>
                              <Input 
                                type="text" 
                                inputMode="numeric" 
                                pattern="[0-9]*" 
                                value={item.qty} 
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === "" || /^\d+$/.test(val)) {
                                    updateQty(item.id, val === "" ? "" : parseInt(val));
                                  }
                                }} 
                                onBlur={() => {
                                  if (item.qty === "" || Number(item.qty) < 1) updateQty(item.id, 1);
                                }}
                                className="w-16 sm:w-20 h-7 text-xs bg-zinc-900 border-zinc-700 text-center font-bold text-zinc-100" 
                              />
                              <span className="text-xs text-zinc-400">Unit</span>
                            </div>
                            <p className="text-[11px] text-zinc-500">Maks: {item.rentedQuantity} Unit</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button type="submit" disabled={cart.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white shrink-0 mt-2">Konfirmasi</Button>
        </form>
      </DialogContent>
      <DemoRestrictionDialog
        isOpen={showDemoWarning}
        onClose={() => setShowDemoWarning(false)}
        title={DEMO_MESSAGES.returnRental.title}
        message="Akun yang sedang digunakan adalah akun demo dan bersifat read-only. Proses pengembalian aset sewa dinonaktifkan pada akun ini."
      />
    </Dialog>
  )
}