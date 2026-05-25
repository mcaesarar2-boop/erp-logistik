"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createItem, addStockToExistingItem } from "@/app/actions"
import { supabase } from "@/lib/supabase"

interface AddItemDialogProps {
  items: { id: string; name: string; code: string; quantity: number }[]
  categories: { id: string; name: string }[]
}

export function AddItemDialog({ items, categories }: AddItemDialogProps) {
  const [open, setOpen] = useState(false)
  const [isExistingMode, setIsExistingMode] = useState(false)
  
  // CEK ADMIN CLIENT SIDE
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const ADMIN_EMAILS = ["mcaesarar@gmail.com"] // Ganti jika email admin berubah
      if (data.user?.email && ADMIN_EMAILS.includes(data.user.email.toLowerCase())) {
        setIsAdmin(true)
      }
    })
  }, [])

  // STATE BARU UNTUK MENANGKAP ERROR
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItemId, setSelectedItemId] = useState("")
  const [showResults, setShowResults] = useState(false)

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // FUNGSI CREATE YANG SUDAH DI-UPGRADE
  async function handleCreateNew(formData: FormData) {
    setErrorMsg(null) // Reset error setiap kali tombol simpan ditekan
    
    const result = await createItem(formData)
    
    // Jika dari server mengembalikan error (seperti duplikasi kode)
    if (result?.success === false) {
      setErrorMsg(result.error ?? "Terjadi kesalahan pada sistem.") // Munculkan kotak merah
      return // Berhenti di sini, JANGAN tutup pop-up nya!
    }

    setOpen(false) // Tutup pop-up jika sukses 100%
  }

  async function handleAddExisting(formData: FormData) {
    formData.append("itemId", selectedItemId)
    await addStockToExistingItem(formData)
    setSearchQuery("")
    setSelectedItemId("")
    setOpen(false)
  }

  // Jika bukan admin, jangan tampilkan tombol Tambah Barang sama sekali
  if (!isAdmin) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) setErrorMsg(null) // Bersihkan error jika pop-up ditutup paksa
    }}>
      <DialogTrigger asChild>
        <Button className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200">
          + Tambah Barang
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50 overflow-visible max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Form Penerimaan Barang</DialogTitle>
        </DialogHeader>

        {/* KOTAK PERINGATAN ERROR MERAH */}
        {errorMsg && (
          <div className="bg-red-950/50 border border-red-900 text-red-400 text-sm p-3 rounded-md mt-2 flex items-center gap-2">
            <span className="font-bold">Peringatan:</span> {errorMsg}
          </div>
        )}

        <div className="flex bg-zinc-900 p-1 rounded-md mt-2">
          <button
            className={`flex-1 text-sm py-1.5 rounded-sm transition-all font-medium ${!isExistingMode ? 'bg-zinc-800 text-zinc-50 shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
            onClick={() => { setIsExistingMode(false); setErrorMsg(null); }}
          >
            Aset Baru
          </button>
          <button
            className={`flex-1 text-sm py-1.5 rounded-sm transition-all font-medium ${isExistingMode ? 'bg-zinc-800 text-zinc-50 shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
            onClick={() => { setIsExistingMode(true); setErrorMsg(null); }}
          >
            Tambah Stok Lama
          </button>
        </div>

        {!isExistingMode ? (
          <form key="form-baru" action={handleCreateNew} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nama Barang</Label>
              <Input name="name" placeholder="Contoh: Pioneer DJM-V10" className="bg-zinc-900 border-zinc-800" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kode Aset</Label>
                <Input name="code" placeholder="DJ-MIX-001" className="bg-zinc-900 border-zinc-800" required />
              </div>
              <div className="space-y-2">
                <Label>Kuantitas Awal</Label>
                <Input name="quantity" type="number" min="1" placeholder="1" className="bg-zinc-900 border-zinc-800" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Harga Beli Satuan (Rp)</Label>
                <Input name="price" type="number" min="0" placeholder="0" className="bg-zinc-900 border-zinc-800" required />
              </div>
              <div className="space-y-2">
                <Label>Persentase Sewa (%)</Label>
                <Input name="rentPercentage" type="number" min="0" step="0.1" placeholder="Contoh: 1.5" className="bg-zinc-900 border-zinc-800" required />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Foto Barang (Opsional)</Label>
              <Input name="image" type="file" accept="image/*" className="bg-zinc-900 border-zinc-800 text-zinc-400 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 cursor-pointer" />
            </div>

            <div className="space-y-2">
              <Label>Label / Kategori (Pilih minimal 1)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 bg-zinc-900 p-3 rounded-md border border-zinc-800 max-h-32 overflow-y-auto">
                {categories.map(cat => (
                  <label key={cat.id} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="categories" 
                      value={cat.id} 
                      className="rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500" 
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Input name="description" placeholder="Keterangan singkat" className="bg-zinc-900 border-zinc-800" />
            </div>
            <Button type="submit" className="w-full bg-zinc-50 text-zinc-950 hover:bg-zinc-200">
              Simpan Aset Baru
            </Button>
          </form>
        ) : (
          /* FORM STOK LAMA */
          <form key="form-lama" action={handleAddExisting} className="space-y-4 pt-2">
            <div className="space-y-2 relative">
              <Label>Cari Barang (Ketik Nama / Kode)</Label>
              <Input 
                placeholder="Mulai ketik pencarian..." 
                className="bg-zinc-900 border-zinc-800"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedItemId("")
                  setShowResults(true)
                }}
                onFocus={() => setShowResults(true)}
              />
              <input type="hidden" name="itemId_validator" value={selectedItemId} required />

              {showResults && searchQuery && (
                <div className="absolute top-[65px] left-0 right-0 max-h-[150px] overflow-y-auto bg-zinc-800 border border-zinc-700 rounded-md shadow-2xl z-50">
                  {filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                      <div 
                        key={item.id} 
                        className="p-3 hover:bg-zinc-700 cursor-pointer border-b border-zinc-700/50 last:border-0"
                        onClick={() => {
                          setSearchQuery(`${item.name} (${item.code})`)
                          setSelectedItemId(item.id)
                          setShowResults(false)
                        }}
                      >
                        <p className="text-sm font-bold text-zinc-200">{item.name}</p>
                        <div className="flex justify-between mt-1">
                          <p className="text-xs text-zinc-400">{item.code}</p>
                          <p className="text-xs text-emerald-400 font-medium">Sisa: {item.quantity}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-sm text-zinc-500 text-center">
                      Barang tidak ditemukan.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <Label>Jumlah Tambahan (Unit Masuk)</Label>
              <Input name="quantity" type="number" min="1" placeholder="Masukkan jumlah unit" className="bg-zinc-900 border-zinc-800" required />
            </div>

            <Button type="submit" disabled={!selectedItemId} className="w-full bg-zinc-50 text-zinc-950 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed">
              Perbarui Stok Barang
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}