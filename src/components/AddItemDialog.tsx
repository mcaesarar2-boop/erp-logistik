"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createItem, addStockToExistingItem } from "@/app/actions"
import { supabase } from "@/lib/supabase"
import { Plus } from "lucide-react"
import { DemoRestrictionDialog } from "@/components/DemoRestrictionDialog"
import { isAdminEmail, isDemoEmail, DEMO_MESSAGES } from "@/lib/permissions"

interface AddItemDialogProps {
  items: { id: string; name: string; code: string; quantity: number }[]
  categories: { id: string; name: string }[]
}

export function AddItemDialog({ items, categories }: AddItemDialogProps) {
  const [open, setOpen] = useState(false)
  const [isExistingMode, setIsExistingMode] = useState(false)
  
  const [isAdmin, setIsAdmin] = useState(false)
  const [isDummyUser, setIsDummyUser] = useState(false)
  const [showDemoWarning, setShowDemoWarning] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setIsAdmin(isAdminEmail(data.user.email))
        setIsDummyUser(isDemoEmail(data.user.email))
      }
    })
  }, [])

  // STATE BARU UNTUK MENANGKAP ERROR
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItemId, setSelectedItemId] = useState("")
  const [showResults, setShowResults] = useState(false)

  // STATE UNTUK AUTO-SUGGEST ASET BARU
  const [newName, setNewName] = useState("")
  const [showNameResults, setShowNameResults] = useState(false)
  const [newCode, setNewCode] = useState("")
  const [showCodeResults, setShowCodeResults] = useState(false)

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // LOGIKA PENCARIAN REKOMENDASI NAMA & KODE (Max 5 item)
  const suggestedNames = Array.from(new Set(items.map(i => i.name)))
    .filter(name => name.toLowerCase().includes(newName.toLowerCase()) && name !== newName)
    .slice(0, 5)

  const suggestedCodes = Array.from(new Set(items.map(i => i.code)))
    .filter(code => code.toLowerCase().includes(newCode.toLowerCase()) && code !== newCode)
    .slice(0, 5)

  // FUNGSI CREATE YANG SUDAH DI-UPGRADE
  async function handleCreateNew(formData: FormData) {
    if (isDummyUser) {
      setShowDemoWarning(true)
      return
    }

    setErrorMsg(null) // Reset error setiap kali tombol simpan ditekan
    
    const result = await createItem(formData)
    
    // Jika dari server mengembalikan error (seperti duplikasi kode)
    if (result && !result.success) {
      if ("error" in result) {
        setErrorMsg(result.error ?? "Terjadi kesalahan pada sistem."); // Munculkan kotak merah
      }
      return; // Berhenti di sini, JANGAN tutup pop-up nya!
    }

    setOpen(false) // Tutup pop-up jika sukses 100%
    setNewName("") // Reset input form
    setNewCode("")
  }

  async function handleAddExisting(formData: FormData) {
    if (isDummyUser) {
      setShowDemoWarning(true)
      return
    }

    formData.append("itemId", selectedItemId)
    await addStockToExistingItem(formData)
    setSearchQuery("")
    setSelectedItemId("")
    setOpen(false)
  }

  // Jika bukan admin atau dummy user, jangan tampilkan tombol Tambah Barang sama sekali
  if (!isAdmin && !isDummyUser) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) {
          setErrorMsg(null) // Bersihkan error jika pop-up ditutup paksa
          setNewName("")
          setNewCode("")
        }
      }}>
        <DialogTrigger asChild>
          <Button className="w-full sm:w-auto shrink-0 bg-zinc-50 text-zinc-950 hover:bg-zinc-200">
            <Plus className="w-4 h-4 mr-2" /> Tambah Barang
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50 overflow-visible max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Form Penerimaan Barang</DialogTitle>
          </DialogHeader>

          {/* KOTAK PERINGATAN ERROR MERAH */}
          {errorMsg && (
            <div className="bg-red-950/50 border border-red-900 text-red-400 text-sm p-3 rounded-md mb-4 flex items-center gap-2">
              <span className="font-bold">Gagal:</span> {errorMsg}
            </div>
          )}

          {/* TOGGLE TAB MODE */}
          <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800 mb-6">
            <button 
              type="button"
              onClick={() => {
                setIsExistingMode(false)
                setErrorMsg(null)
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${!isExistingMode ? 'bg-zinc-800 text-zinc-50 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Aset Baru
            </button>
            <button 
              type="button"
              onClick={() => {
                setIsExistingMode(true)
                setErrorMsg(null)
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${isExistingMode ? 'bg-zinc-800 text-zinc-50 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Tambah Stok Aset Existing
            </button>
          </div>

          {/* FORM 1: BARANG BARU */}
          {!isExistingMode ? (
            <form action={handleCreateNew} className="space-y-4">
              <div className="space-y-2 relative">
                <Label>Nama Barang</Label>
                <Input 
                  name="name" 
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value)
                    setShowNameResults(true)
                  }}
                  onFocus={() => setShowNameResults(true)}
                  onBlur={() => setTimeout(() => setShowNameResults(false), 200)}
                  placeholder="Masukkan nama barang baru" 
                  className="bg-zinc-900 border-zinc-800" 
                  required 
                  autoComplete="off"
                />
                
                {/* AUTO SUGGEST NAMA */}
                {showNameResults && newName.trim().length > 0 && suggestedNames.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-900 border border-zinc-800 rounded-md shadow-lg max-h-40 overflow-y-auto z-50">
                    {suggestedNames.map((name, idx) => (
                      <div 
                        key={idx}
                        className="p-2.5 text-xs hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 cursor-pointer"
                        onMouseDown={() => setNewName(name)}
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 relative">
                <Label>Kode Barang (Opsional)</Label>
                <Input 
                  name="code" 
                  value={newCode}
                  onChange={(e) => {
                    setNewCode(e.target.value)
                    setShowCodeResults(true)
                  }}
                  onFocus={() => setShowCodeResults(true)}
                  onBlur={() => setTimeout(() => setShowCodeResults(false), 200)}
                  placeholder="Prefix otomatis jika dikosongkan" 
                  className="bg-zinc-900 border-zinc-800 uppercase" 
                  autoComplete="off"
                />

                {/* AUTO SUGGEST KODE */}
                {showCodeResults && newCode.trim().length > 0 && suggestedCodes.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-900 border border-zinc-800 rounded-md shadow-lg max-h-40 overflow-y-auto z-50">
                    {suggestedCodes.map((code, idx) => (
                      <div 
                        key={idx}
                        className="p-2.5 text-xs hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 cursor-pointer"
                        onMouseDown={() => setNewCode(code)}
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Pilih Label / Kategori (Bisa Pilih Lebih Dari 1)</Label>
                <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-3 rounded-lg border border-zinc-800 max-h-36 overflow-y-auto">
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center gap-2 text-sm text-zinc-300 hover:text-zinc-100 cursor-pointer">
                      <input type="checkbox" name="categories" value={cat.id} className="rounded border-zinc-700 bg-zinc-850 text-emerald-600 focus:ring-0 focus:ring-offset-0" />
                      {cat.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Deskripsi / Keterangan Barang</Label>
                <Input name="description" placeholder="Spesifikasi, kondisi awal, dll." className="bg-zinc-900 border-zinc-800" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Harga Beli Satuan (Rp)</Label>
                  <Input 
                    name="price" 
                    type="text" 
                    inputMode="numeric" 
                    pattern="[0-9]*" 
                    placeholder="1000000" 
                    onFocus={(e) => e.target.select()} 
                    className="bg-zinc-900 border-zinc-800" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Persentase Sewa/Hari (%)</Label>
                  <Input 
                    name="rentPercentage" 
                    type="text" 
                    inputMode="decimal" 
                    defaultValue="5.0" 
                    onFocus={(e) => e.target.select()} 
                    className="bg-zinc-900 border-zinc-800" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Jumlah Unit Awal (Unit Masuk)</Label>
                <Input 
                  name="quantity" 
                  type="text" 
                  inputMode="numeric" 
                  pattern="[0-9]*" 
                  placeholder="Masukkan jumlah unit" 
                  onFocus={(e) => e.target.select()} 
                  className="bg-zinc-900 border-zinc-800" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label>Gambar Aset (Foto Barang)</Label>
                <Input 
                  name="image" 
                  type="file" 
                  accept="image/*" 
                  className="bg-zinc-900 border-zinc-800 text-zinc-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer" 
                />
              </div>

              <Button type="submit" className="w-full bg-zinc-50 text-zinc-950 hover:bg-zinc-200">
                Simpan Barang Baru
              </Button>
            </form>
          ) : (
            /* FORM 2: TAMBAH STOK EXISTING */
            <form action={handleAddExisting} className="space-y-4">
              <div className="space-y-2 relative">
                <Label>Cari Aset Terdaftar</Label>
                <div className="relative">
                  <Input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowResults(true)
                    }}
                    onFocus={() => setShowResults(true)}
                    placeholder="Ketik nama atau kode barang..." 
                    className="bg-zinc-900 border-zinc-800" 
                  />
                  {selectedItemId && (
                    <span className="absolute right-3 top-2.5 text-xs bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/50">
                      Terpilih: {items.find(i => i.id === selectedItemId)?.name}
                    </span>
                  )}
                </div>

                {/* SUGGESTION LIST BOX */}
                {showResults && searchQuery && (
                  <div className="absolute left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-md shadow-lg max-h-52 overflow-y-auto z-50">
                    {filteredItems.length > 0 ? (
                      filteredItems.map(item => (
                        <div 
                          key={item.id}
                          className="p-3 border-b border-zinc-800/50 hover:bg-zinc-850 cursor-pointer"
                          onClick={() => {
                            setSelectedItemId(item.id)
                            setSearchQuery(item.name)
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
                <Input 
                  name="quantity" 
                  type="text" 
                  inputMode="numeric" 
                  pattern="[0-9]*" 
                  placeholder="Masukkan jumlah unit" 
                  onFocus={(e) => e.target.select()} 
                  className="bg-zinc-900 border-zinc-800" 
                  required 
                />
              </div>

              <Button type="submit" disabled={!selectedItemId} className="w-full bg-zinc-50 text-zinc-950 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed">
                Perbarui Stok Barang
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <DemoRestrictionDialog
        isOpen={showDemoWarning}
        onClose={() => setShowDemoWarning(false)}
        title={DEMO_MESSAGES.add.title}
        message="Akun yang sedang digunakan adalah akun demo dan bersifat read-only. Penambahan data inventaris baru dinonaktifkan pada akun ini."
      />
    </>
  )
}