"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createPackageTemplate } from "@/app/actions"
import { supabase } from "@/lib/supabase"
import { Trash2, Search, PackagePlus } from "lucide-react"

interface AddPackageDialogProps {
  items: {
    id: string
    name: string
    code: string
    quantity: number
    rentedQuantity: number
    maintenanceQuantity: number
    price?: number | null
    rentPercentage?: number | null
  }[]
}

export function AddPackageDialog({ items }: AddPackageDialogProps) {
  const [open, setOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [cart, setCart] = useState<any[]>([])
  const [packageName, setPackageName] = useState("")
  const [packageDesc, setPackageDesc] = useState("")

  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const ADMIN_EMAILS = ["mcaesarar@gmail.com"] 
      if (data.user?.email && ADMIN_EMAILS.includes(data.user.email.toLowerCase())) setIsAdmin(true)
    })
  }, [])

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const addToCart = (item: any) => {
    if (!cart.find(c => c.id === item.id)) {
      setCart([...cart, { ...item, qty: 1 }])
    }
    setSearchQuery("")
    setShowResults(false)
  }

  const updateQty = (id: string, newQty: number) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        const totalInventory = c.quantity + (c.rentedQuantity || 0) + (c.maintenanceQuantity || 0)
        return { ...c, qty: Math.min(Math.max(1, newQty), totalInventory) }
      }
      return c
    }))
  }

  const updateFootnote = (id: string, newFootnote: string) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        return { ...c, footnote: newFootnote }
      }
      return c
    }))
  }

  async function handleSubmit(formData: FormData) {
    setErrorMsg(null)
    if (cart.length === 0) {
      setErrorMsg("Belum ada barang yang dipilih.")
      return
    }
    if (!packageName) {
      setErrorMsg("Nama paket tidak boleh kosong.")
      return
    }
    
    formData.append("payload", JSON.stringify(cart.map(c => ({ id: c.id, qty: c.qty, name: c.name, code: c.code, price: c.price, rentPercentage: c.rentPercentage, footnote: c.footnote }))))
    const result = await createPackageTemplate(formData)
    
    if (result?.success === false) {
      setErrorMsg(result.error ?? "Terjadi kesalahan sistem.")
      return
    }
    setOpen(false)
    setCart([]) 
    setPackageName("")
    setPackageDesc("")
  }

  if (!isAdmin) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) { setErrorMsg(null); setCart([]); setPackageName(""); setPackageDesc(""); }}}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto shrink-0 bg-blue-950/50 border border-blue-900 text-blue-400 hover:bg-blue-900 hover:text-blue-50">
          <PackagePlus className="w-4 h-4 mr-2" /> Bikin Paket
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50 flex flex-col max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Buat Template Paket Rental</DialogTitle>
        </DialogHeader>
        {errorMsg && (
          <div className="bg-red-950/50 border border-red-900 text-red-400 text-sm p-3 rounded-md flex items-center gap-2">
            <span className="font-bold">Gagal:</span> {errorMsg}
          </div>
        )}

        <form action={handleSubmit} className="flex flex-col gap-4 pt-2 flex-1 overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
            <div className="space-y-2">
              <Label>Nama Paket</Label>
              <Input name="name" placeholder="Misal: Paket Panggung A" className="bg-zinc-900 border-zinc-800" value={packageName} onChange={e => setPackageName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi (Opsional)</Label>
              <Input name="description" placeholder="Keterangan paket..." className="bg-zinc-900 border-zinc-800" value={packageDesc} onChange={e => setPackageDesc(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2 shrink-0">
            <Label>Cari Aset Untuk Paket</Label>
            <div className="relative z-50">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input placeholder="Ketik nama atau kode aset..." className="pl-9 bg-zinc-900 border-zinc-800" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true) }} onFocus={() => setShowResults(true)} />
              {showResults && searchQuery && (
                <div className="absolute top-full mt-1 left-0 right-0 max-h-[150px] overflow-y-auto overflow-x-hidden bg-zinc-800 border border-zinc-700 rounded-md shadow-2xl z-50">
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => (
                    <div key={item.id} className="p-3 hover:bg-zinc-700 cursor-pointer border-b border-zinc-700/50 flex justify-between items-center" onClick={() => addToCart(item)}>
                      <div><p className="text-sm font-bold text-zinc-200">{item.name}</p><p className="text-xs text-zinc-400">{item.code}</p></div>
                    </div>
                  ))
                ) : (<div className="p-3 text-sm text-zinc-500 text-center">Aset tidak ditemukan.</div>)}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 flex-1 overflow-hidden">
            <Label className="shrink-0">Daftar Barang dalam Paket</Label>
            {cart.length === 0 ? (
              <div className="p-6 border border-dashed border-zinc-800 rounded-lg text-center text-zinc-500 text-sm shrink-0">Belum ada barang yang dipilih.</div>
            ) : (
              <div className="space-y-3 overflow-y-auto overflow-x-hidden pr-2 flex-1">
                {cart.map(item => {
                  const totalInventory = item.quantity + (item.rentedQuantity || 0) + (item.maintenanceQuantity || 0);
                  return (
                    <div key={item.id} className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 flex flex-col gap-2">
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex-1"><p className="text-sm font-bold text-zinc-100">{item.name}</p><p className="text-xs text-zinc-500">{item.code} | Max: {totalInventory}</p></div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Label className="text-xs">Qty:</Label>
                          <Input type="number" min="1" max={totalInventory} value={item.qty} onChange={(e) => updateQty(item.id, parseInt(e.target.value)||1)} className="w-16 h-7 text-xs bg-zinc-950 border-zinc-700 text-center" />
                        </div>
                        <button type="button" onClick={() => setCart(cart.filter(c => c.id !== item.id))} className="text-zinc-500 hover:text-red-400 p-1 bg-zinc-800 rounded shrink-0"><Trash2 className="w-4 h-4"/></button>
                      </div>
                      <Input placeholder="Catatan / Footnote (Opsional)" className="h-7 text-xs bg-zinc-950 border-zinc-800 text-zinc-300" value={item.footnote || ''} onChange={(e) => updateFootnote(item.id, e.target.value)} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <Button type="submit" disabled={cart.length === 0 || !packageName} className="w-full bg-blue-600 hover:bg-blue-700 text-white shrink-0 mt-2">Simpan Paket</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}