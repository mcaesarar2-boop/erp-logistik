"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createCategory } from "@/app/actions"
import { Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { DemoRestrictionDialog } from "@/components/DemoRestrictionDialog"
import { isDemoEmail, DEMO_MESSAGES } from "@/lib/permissions"

export function AddCategoryDialog() {
  const [open, setOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isDummyUser, setIsDummyUser] = useState(false)
  const [showDemoWarning, setShowDemoWarning] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsDummyUser(isDemoEmail(data.user?.email))
    })
  }, [])

  async function handleSubmit(formData: FormData) {
    if (isDummyUser) {
      setShowDemoWarning(true)
      return
    }

    setErrorMsg(null)
    const result = await createCategory(formData)
    
    if (result && !result.success) {
      if ("error" in result) {
        setErrorMsg(result.error ?? "Terjadi kesalahan saat menambah label.");
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
      <DemoRestrictionDialog
        isOpen={showDemoWarning}
        onClose={() => setShowDemoWarning(false)}
        title={DEMO_MESSAGES.add.title}
        message="Akun yang sedang digunakan adalah akun demo dan bersifat read-only. Penambahan label/kategori baru dinonaktifkan pada akun ini."
      />
    </Dialog>
  )
}