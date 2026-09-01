"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { updateItem } from "@/app/actions"
import { DemoRestrictionDialog } from "@/components/DemoRestrictionDialog"
import { isDemoEmail, DEMO_MESSAGES } from "@/lib/permissions"

// Definisikan tipe data item yang diterima komponen (tambahkan imageUrl)
interface EditItemDialogProps {
  item: {
    id: string
    name: string
    code: string
    description?: string | null
    imageUrl?: string | null // <--- TAMBAHKAN INI
    status: string
    quantity: number
    rentedQuantity: number
    maintenanceQuantity: number
    price?: number | null
    rentPercentage?: number | null
    categories: { id: string; name: string }[]
  }
  allCategories: { id: string; name: string }[]
}

export function EditItemDialog({ item, allCategories }: EditItemDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDummyUser, setIsDummyUser] = useState(false)
  const [showDemoWarning, setShowDemoWarning] = useState(false)

  const [available, setAvailable] = useState<number | "">(item.quantity || 0)
  const [rented, setRented] = useState<number | "">(item.rentedQuantity || 0)
  const [maintenance, setMaintenance] = useState<number | "">(item.maintenanceQuantity || 0)

  const totalStockOriginal = (item.quantity || 0) + (item.rentedQuantity || 0) + (item.maintenanceQuantity || 0)

  // --- LOGIKA AUTOMISASI DISTRIBUSI STOK ---
  const handleAvailableChange = (rawVal: any) => {
    if (rawVal === "") {
      setAvailable("");
      return;
    }
    let val = parseInt(rawVal) || 0;
    if (val < 0) val = 0;
    if (val > totalStockOriginal) val = totalStockOriginal;
    
    const currentMaint = Number(maintenance) || 0;
    const excess = totalStockOriginal - val - currentMaint;
    if (excess >= 0) {
      setRented(excess);
      setAvailable(totalStockOriginal - excess - currentMaint);
    } else {
      setRented(0);
      setMaintenance(totalStockOriginal - val);
      setAvailable(val);
    }
  }

  const handleRentedChange = (rawVal: any) => {
    if (rawVal === "") {
      setRented("");
      return;
    }
    let val = parseInt(rawVal) || 0;
    if (val < 0) val = 0;
    const currentMaint = Number(maintenance) || 0;
    if (val + currentMaint > totalStockOriginal) {
      val = totalStockOriginal - currentMaint;
    }
    setRented(val);
    setAvailable(totalStockOriginal - val - currentMaint);
  }

  const handleMaintenanceChange = (rawVal: any) => {
    if (rawVal === "") {
      setMaintenance("");
      return;
    }
    let val = parseInt(rawVal) || 0;
    if (rawVal < 0) val = 0;
    const currentRented = Number(rented) || 0;
    if (val + currentRented > totalStockOriginal) {
      val = totalStockOriginal - currentRented;
    }
    setMaintenance(val);
    setAvailable(totalStockOriginal - currentRented - val);
  }

  // Reset form saat dialog dibuka
  useEffect(() => {
    if (open) {
      setAvailable(item.quantity || 0)
      setRented(item.rentedQuantity || 0)
      setMaintenance(item.maintenanceQuantity || 0)

      supabase.auth.getUser().then(({ data }) => {
        setIsDummyUser(isDemoEmail(data.user?.email))
      })
    }
  }, [open, item])

  async function handleSubmit(formData: FormData) {
    if (isDummyUser) {
      setShowDemoWarning(true)
      return
    }
    formData.append("quantity", (Number(available) || 0).toString());
    formData.append("rentedQuantity", (Number(rented) || 0).toString());
    formData.append("maintenanceQuantity", (Number(maintenance) || 0).toString());
    // Jalankan server action dengan mengikat ID item terkait
    await updateItem(item.id, formData)
    setOpen(false) 
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-zinc-800 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900 text-xs h-7 px-3">
          Edit Aset
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Ubah Informasi Aset</DialogTitle>
        </DialogHeader>
        
        <form action={handleSubmit} className="space-y-4 pt-4">
          
          {/* --- BAGIAN FOTO (Paling Atas agar terlihat jelas) --- */}
          <div className="space-y-2 border-b border-zinc-800 pb-4 mb-4">
            <Label>Foto Aset Saat Ini</Label>
            <div className="flex items-center gap-4 mt-2">
              <div className="h-20 w-20 rounded-md border border-zinc-800 bg-zinc-900 flex items-center justify-center overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] text-zinc-600 font-bold uppercase">No Image</span>
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="edit-image" className="text-xs text-zinc-400">Ganti Foto (Opsional)</Label>
                <Input 
                    id="edit-image"
                    name="image" 
                    type="file" 
                    accept="image/*" 
                    className="bg-zinc-900 border-zinc-800 text-zinc-400 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 cursor-pointer text-xs h-9" 
                />
              </div>
            </div>
          </div>
          {/* ----------------------------------------------------- */}

          <div className="space-y-2">
            <Label>Nama Barang</Label>
            <Input name="name" defaultValue={item.name} className="bg-zinc-900 border-zinc-800" required />
          </div>
          
          <div className="space-y-2">
            <Label>Kode Aset</Label>
            <Input name="code" defaultValue={item.code} className="bg-zinc-900 border-zinc-800" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Harga Beli Satuan (Rp)</Label>
              <Input 
                name="price" 
                type="text" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                defaultValue={item.price || 0} 
                onFocus={(e) => e.target.select()} 
                className="bg-zinc-900 border-zinc-800" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Persentase Sewa (%)</Label>
              <Input 
                name="rentPercentage" 
                type="text" 
                inputMode="decimal" 
                defaultValue={item.rentPercentage || 0} 
                onFocus={(e) => e.target.select()} 
                className="bg-zinc-900 border-zinc-800" 
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Label / Kategori (Pilih minimal 1)</Label>
            <div className="grid grid-cols-2 gap-2 mt-2 bg-zinc-900 p-3 rounded-md border border-zinc-800 max-h-32 overflow-y-auto">
              {allCategories.map(cat => (
                <label key={cat.id} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="categories" 
                    value={cat.id}
                    defaultChecked={item.categories?.some(c => c.id === cat.id)}
                    className="rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500" 
                  />
                  {cat.name}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3 border-y border-zinc-800 py-4 my-4">
            <Label className="text-zinc-300 font-bold">Distribusi Stok (Total: {totalStockOriginal} Unit)</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-emerald-400">🟢 Tersedia</Label>
                <Input 
                  type="text" 
                  inputMode="numeric" 
                  pattern="[0-9]*" 
                  value={available} 
                  onFocus={(e) => e.target.select()} 
                  onChange={e => {
                    const val = e.target.value;
                    if (val === "" || /^\d+$/.test(val)) {
                      handleAvailableChange(val);
                    }
                  }} 
                  onBlur={() => {
                    if (available === "" || Number(available) < 0) handleAvailableChange(0);
                  }}
                  className="bg-emerald-950/20 border-emerald-900/50 text-emerald-400 font-bold text-center" 
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-amber-400">🟡 Rented</Label>
                <Input 
                  type="text" 
                  inputMode="numeric" 
                  pattern="[0-9]*" 
                  value={rented} 
                  onFocus={(e) => e.target.select()} 
                  onChange={e => {
                    const val = e.target.value;
                    if (val === "" || /^\d+$/.test(val)) {
                      handleRentedChange(val);
                    }
                  }} 
                  onBlur={() => {
                    if (rented === "" || Number(rented) < 0) handleRentedChange(0);
                  }}
                  className="bg-amber-950/20 border-amber-900/50 text-amber-400 font-bold text-center" 
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-red-400">🔴 Maint.</Label>
                <Input 
                  type="text" 
                  inputMode="numeric" 
                  pattern="[0-9]*" 
                  value={maintenance} 
                  onFocus={(e) => e.target.select()} 
                  onChange={e => {
                    const val = e.target.value;
                    if (val === "" || /^\d+$/.test(val)) {
                      handleMaintenanceChange(val);
                    }
                  }} 
                  onBlur={() => {
                    if (maintenance === "" || Number(maintenance) < 0) handleMaintenanceChange(0);
                  }}
                  className="bg-red-950/20 border-red-900/50 text-red-400 font-bold text-center" 
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Deskripsi</Label>
            <Input name="description" defaultValue={item.description || ""} className="bg-zinc-900 border-zinc-800" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full border-zinc-800 text-zinc-400 hover:bg-zinc-900">
              Batal
            </Button>
            <Button type="submit" className="w-full bg-zinc-50 text-zinc-950 hover:bg-zinc-200">
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </DialogContent>
      <DemoRestrictionDialog
        isOpen={showDemoWarning}
        onClose={() => setShowDemoWarning(false)}
        title={DEMO_MESSAGES.edit.title}
        message={DEMO_MESSAGES.edit.message}
      />
    </Dialog>
  )
}