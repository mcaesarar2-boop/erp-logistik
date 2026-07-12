"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { deleteCategory } from "@/app/actions"
import { Trash2 } from "lucide-react"

interface DeleteCategoryDialogProps {
  category: { id: string; name: string }
}

export function DeleteCategoryDialog({ category }: DeleteCategoryDialogProps) {
  const [open, setOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleDelete() {
    setErrorMsg(null)
    const result = await deleteCategory(category.id)
    
    if (result && !result.success) {
      if ("error" in result) {
        setErrorMsg(result.error ?? "Terjadi kesalahan saat menghapus label.");
      }
      return;
    }

    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) setErrorMsg(null)
    }}>
      <DialogTrigger asChild>
        <button className="bg-zinc-800 hover:bg-red-950/50 text-zinc-100 p-1.5 rounded-md transition-colors border border-zinc-700 flex items-center justify-center shrink-0" title="Hapus Label">
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50">
        <DialogHeader>
          <DialogTitle>Peringatan Penghapusan Label</DialogTitle>
        </DialogHeader>
        {errorMsg && (
          <div className="bg-red-950/50 border border-red-900 text-red-400 text-sm p-3 rounded-md mt-2 flex items-center gap-2">
            <span className="font-bold">Error:</span> {errorMsg}
          </div>
        )}
        <div className="space-y-4 pt-4">
          <p className="text-sm text-zinc-400">Apakah Anda yakin ingin menghapus label <strong>{category.name}</strong> secara permanen?</p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} className="w-full bg-transparent border-zinc-800 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900">Batal</Button>
            <Button onClick={handleDelete} variant="destructive" className="w-full bg-red-600 hover:bg-red-700 text-white">Ya, Hapus Label</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}