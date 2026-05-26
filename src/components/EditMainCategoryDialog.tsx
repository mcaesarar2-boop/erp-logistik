"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateCategory } from "@/app/actions"
import { Pencil } from "lucide-react"

interface EditMainCategoryDialogProps {
  category: { id: string; name: string }
}

export function EditMainCategoryDialog({ category }: EditMainCategoryDialogProps) {
  const [open, setOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setErrorMsg(null)
    const result = await updateCategory(category.id, formData)
    
    if (result?.success === false) {
      setErrorMsg(result.error ?? "Terjadi kesalahan.")
      return
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) setErrorMsg(null); }}>
      <DialogTrigger asChild>
        <button className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded-md transition-colors" title="Edit Kategori Utama">
          <Pencil className="w-3 h-3" />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50">
        <DialogHeader><DialogTitle>Edit Kategori Utama</DialogTitle></DialogHeader>
        {errorMsg && <div className="bg-red-950/50 border border-red-900 text-red-400 text-sm p-3 rounded-md mt-2">{errorMsg}</div>}
        <form action={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2"><Label>Nama Kategori Utama</Label><Input name="name" defaultValue={category.name} className="bg-zinc-900 border-zinc-800" required /></div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">Simpan Perubahan</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}