"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addBulkMaintenance } from "@/app/actions"
import { supabase } from "@/lib/supabase"
import { Trash2, Search, Wrench } from "lucide-react"
import { DemoRestrictionDialog } from "@/components/DemoRestrictionDialog"
import { isAdminEmail, isDemoEmail, DEMO_MESSAGES } from "@/lib/permissions"

interface AddMaintenanceDialogProps {
  items: { id: string; name: string; code: string; quantity: number }[]
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

  const updateQty = (id: string, newQty: number) => {
    setCart(cart.map(c => c.id === id ? { ...c, qty: Math.min(Math.max(1, newQty), c.quantity) } : c))
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
    
    formData.append("payload", JSON.stringify(cart.map(c => ({ id: c.id, qty: c.qty }))))
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
                        className="p-3 border-b border-zinc-800/50 hover:bg-zinc-850 cursor-pointer"
                      >
                        <p className="text-sm font-bold text-zinc-200">{item.name}</p>
                        <div className="flex justify-between mt-1">
                          <p className="text-xs text-zinc-400">{item.code}</p>
                          <p className="text-xs text-emerald-400 font-medium">Stok: {item.quantity}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-sm text-zinc-500 text-center">Barang tidak ditemukan.</div>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <Label className="mb-2 block shrink-0">Daftar Aset Yang Akan Dipelihara:</Label>
              {cart.length === 0 ? (
                <div className="p-6 border border-dashed border-zinc-800 rounded-lg text-center text-zinc-500 text-sm shrink-0">Belum ada aset yang dipilih.</div>
              ) : (
                <div className="space-y-3 overflow-y-auto overflow-x-hidden pr-2 flex-1">
                  {cart.map(item => (
                    <div key={item.id} className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-zinc-100">{item.name}</p>
                          <p className="text-xs text-zinc-500">{item.code} | Max: {item.quantity}</p>
                        </div>
                        <button type="button" onClick={() => setCart(cart.filter(c => c.id !== item.id))} className="text-zinc-500 hover:text-red-400 p-1 bg-zinc-800 rounded shrink-0"><Trash2 className="w-4 h-4"/></button>
                      </div>
                      <div className="flex items-center justify-between mt-1 pt-2 border-t border-zinc-800/50">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Qty:</Label>
                          <Input type="number" min="1" max={item.quantity} value={item.qty} onChange={(e) => updateQty(item.id, parseInt(e.target.value)||1)} className="w-20 h-7 text-xs bg-zinc-950 border-zinc-700 text-center" />
                        </div>
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