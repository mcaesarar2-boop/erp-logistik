"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createCategory } from "@/app/actions"
import { Plus } from "lucide-react"

export function AddCategoryDialog() {
  const [open, setOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setErrorMsg(null)
    const result = await createCategory(formData)
    
    if (result?.success === false) {
      setErrorMsg(result.error)
      return
    }

    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) setErrorMsg(null)
    }}>
      <DialogTrigger asChild>
        <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 p-1.5 rounded-md transition-colors border border-zinc-700 flex items-center justify-center shrink-0" title="Tambah Label Baru">
          <Plus className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50">
        <DialogHeader>
          <DialogTitle>Tambah Label (Kategori) Baru</DialogTitle>
        </DialogHeader>
        {errorMsg && (
          <div className="bg-red-950/50 border border-red-900 text-red-400 text-sm p-3 rounded-md mt-2 flex items-center gap-2">
            <span className="font-bold">Peringatan:</span> {errorMsg}
          </div>
        )}
        <form action={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nama Label</Label>
            <Input name="name" placeholder="Contoh: Video, Truss, Kamera, dsb." className="bg-zinc-900 border-zinc-800" required />
          </div>
          <Button type="submit" className="w-full bg-zinc-50 text-zinc-950 hover:bg-zinc-200">
            Simpan Label Baru
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}