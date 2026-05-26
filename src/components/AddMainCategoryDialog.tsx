"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createMainCategory } from "@/app/actions"
import { Plus } from "lucide-react"

export function AddMainCategoryDialog() {
  const [open, setOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setErrorMsg(null)
    const result = await createMainCategory(formData)
    
    if (result?.success === false) {
      setErrorMsg(result.error ?? "Terjadi kesalahan.")
      return
    }

    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) setErrorMsg(null); }}>
      <DialogTrigger asChild>
        <Button className="bg-blue-950/50 border border-blue-900 text-blue-400 hover:bg-blue-900 hover:text-blue-50 px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tambah Kategori Utama
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50">
        <DialogHeader><DialogTitle>Tambah Kategori Utama Baru</DialogTitle></DialogHeader>
        {errorMsg && <div className="bg-red-950/50 border border-red-900 text-red-400 text-sm p-3 rounded-md mt-2"><strong>Gagal:</strong> {errorMsg}</div>}
        <form action={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2"><Label>Nama Kategori Utama</Label><Input name="name" placeholder="Contoh: PA System, Backline..." className="bg-zinc-900 border-zinc-800" required /></div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">Simpan Kategori Utama</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}