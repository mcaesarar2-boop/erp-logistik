"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addBulkMaintenance } from "@/app/actions"
import { supabase } from "@/lib/supabase"
import { Trash2, Search, Wrench } from "lucide-react"
import { DemoRestrictionDialog } from "@/components/DemoRestrictionDialog"
import { isAdminEmail, isDemoEmail, DEMO_MESSAGES } from "@/lib/permissions"
import { ItemThumbnail } from "@/components/ItemThumbnail"
import { groupItemsByPrimaryCategory } from "@/lib/grouping"

interface AddMaintenanceDialogProps {
  items: { id: string; name: string; code: string; quantity: number; imageUrl?: string | null }[]
}

export function AddMaintenanceDialog({ items }: AddMaintenanceDialogProps) {
  const [open, setOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [cart, setCart] = useState<any[]>([])
  const [isDummyUser, setIsDummyUser] = useState(false)
  const [showDemoWarning, setShowDemoWarning] = useState(false)

  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setIsAdmin(isAdminEmail(data.user.email))
        setIsDummyUser(isDemoEmail(data.user.email))
      }
    })
  }, [])

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const addToCart = (item: any) => {
    if (item.quantity <= 0) return
    if (!cart.find(c => c.id === item.id)) setCart([...cart, { ...item, qty: 1 }])
    setSearchQuery("")
    setShowResults(false)
  }

  const updateQty = (id: string, newQty: any) => {
    setCart(cart.map(c => c.id === id ? { ...c, qty: newQty === "" ? "" : Math.min(Math.max(1, parseInt(newQty) || 0), c.quantity) } : c))
  }

  async function handleSubmit(formData: FormData) {
    if (isDummyUser) {
      setShowDemoWarning(true)
      return
    }

    setErrorMsg(null)
    if (cart.length === 0) {
      setErrorMsg("Belum ada aset yang dipilih.")
      return
    }
    
    formData.append("payload", JSON.stringify(cart.map(c => ({ id: c.id, qty: Number(c.qty) || 1 }))))
    const result = await addBulkMaintenance(formData)
    
    if (result && !result.success) {
      if ("error" in result) {
        setErrorMsg(result.error ?? "Terjadi kesalahan sistem.");
      }
      return;
    }
    setOpen(false)
    setCart([])
  }

  if (!isAdmin && !isDummyUser) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) { setErrorMsg(null); setCart([]); }}}>
        <DialogTrigger asChild>
          <Button className="w-full sm:w-auto shrink-0 bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-850">
            <Wrench className="w-4 h-4 mr-2" /> Pemeliharaan
          </Button>
        </DialogTrigger>
        <DialogContent aria-describedby={undefined} className="bg-zinc-950 border-zinc-800 text-zinc-50 flex flex-col max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-zinc-100">
              <Wrench className="w-5 h-5" /> Form Pemeliharaan (Maintenance)
            </DialogTitle>
          </DialogHeader>

          {errorMsg && (
            <div className="bg-red-950/50 border border-red-900 text-red-400 text-sm p-3 rounded-md mb-4 flex items-center gap-2 shrink-0">
              <span className="font-bold">Gagal:</span> {errorMsg}
            </div>
          )}

          <form action={handleSubmit} className="flex-1 flex flex-col overflow-hidden gap-4">
            <div className="space-y-2 shrink-0 relative">
              <Label>Cari Aset Gudang</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Ketik nama atau kode barang..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
                  onFocus={() => setShowResults(true)}
                  className="bg-zinc-900 border-zinc-800"
                />
                <Search className="w-4 h-4 text-zinc-500 absolute right-3 top-3" />
              </div>

              {showResults && searchQuery && (
                <div className="absolute left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-md shadow-lg max-h-48 overflow-y-auto z-50">
                  {filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                      <div
                        key={item.id}
                        onClick={() => addToCart(item)}
                        className="p-2.5 border-b border-zinc-800/50 hover:bg-zinc-800 cursor-pointer flex justify-between items-center gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <ItemThumbnail src={item.imageUrl} alt={item.name} className="w-9 h-9 sm:w-10 sm:h-10 rounded-md" iconClassName="w-4 h-4 text-zinc-500" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-zinc-200 truncate">{item.name}</p>
                            <p className="text-xs text-zinc-400 font-mono">{item.code}</p>
                          </div>
                        </div>
                        <p className="text-xs text-emerald-400 font-semibold shrink-0">Stok: {item.quantity}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-sm text-zinc-500 text-center">Barang tidak ditemukan.</div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2 flex-1 overflow-hidden">
              <div className="flex justify-between items-center">
                <Label>Daftar Aset Yang Akan Dipelihara (Masuk Maintenance)</Label>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-[10px] sm:text-xs text-red-400 hover:text-red-300 transition-colors font-medium"
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
                        <span className="w-1.5 h-3.5 bg-red-500 rounded-full shrink-0"></span>
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
                                  <p className="text-xs text-zinc-500 font-mono">{item.code} | Max: {item.quantity}</p>
                                </div>
                              </div>
                              <button type="button" onClick={() => setCart(cart.filter(c => c.id !== item.id))} className="text-zinc-500 hover:text-red-400 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded shrink-0 transition-colors"><Trash2 className="w-4 h-4"/></button>
                            </div>
                            <div className="flex items-center justify-between mt-1 pt-2 border-t border-zinc-800/50">
                              <div className="flex items-center gap-2">
                                <Label className="text-xs shrink-0">Qty:</Label>
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
                                  className="w-16 sm:w-20 h-8 text-xs bg-zinc-950 border-zinc-700 text-center font-bold" 
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button type="submit" disabled={cart.length === 0} className="w-full bg-red-600 hover:bg-red-700 text-white shrink-0 mt-2">Proses Pemeliharaan</Button>
          </form>
        </DialogContent>
      </Dialog>
      <DemoRestrictionDialog
        isOpen={showDemoWarning}
        onClose={() => setShowDemoWarning(false)}
        title={DEMO_MESSAGES.maintenance.title}
        message="Akun yang sedang digunakan adalah akun demo dan bersifat read-only. Pencatatan pemeliharaan aset dinonaktifkan pada akun ini."
      />
    </>
  )
}