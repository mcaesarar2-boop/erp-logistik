"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateCategory } from "@/app/actions"
import { Pencil } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { DemoRestrictionDialog } from "@/components/DemoRestrictionDialog"
import { isDemoEmail, DEMO_MESSAGES } from "@/lib/permissions"

interface EditCategoryDialogProps {
  category: { id: string; name: string }
}

export function EditCategoryDialog({ category }: EditCategoryDialogProps) {
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
    const result = await updateCategory(category.id, formData)
    
    if (result && !result.success) {
      if ("error" in result) {
        setErrorMsg(result.error ?? "Terjadi kesalahan saat memperbarui label.");
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
        <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 p-1.5 rounded-md transition-colors border border-zinc-700 flex items-center justify-center shrink-0" title="Edit Label">
          <Pencil className="w-4 h-4 text-amber-400" />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50">
        <DialogHeader>
          <DialogTitle>Edit Label</DialogTitle>
        </DialogHeader>
        {errorMsg && (
          <div className="bg-red-950/50 border border-red-900 text-red-400 text-sm p-3 rounded-md mt-2 flex items-center gap-2">
            <span className="font-bold">Peringatan:</span> {errorMsg}
          </div>
        )}
        <form action={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nama Label</Label>
            <Input name="name" defaultValue={category.name} className="bg-zinc-900 border-zinc-800" required />
          </div>
          <Button type="submit" className="w-full bg-zinc-50 text-zinc-950 hover:bg-zinc-200">
            Simpan Perubahan
          </Button>
        </form>
      </DialogContent>
      <DemoRestrictionDialog
        isOpen={showDemoWarning}
        onClose={() => setShowDemoWarning(false)}
        title={DEMO_MESSAGES.edit.title}
        message="Akun ini disediakan untuk tujuan demonstrasi. Perubahan terhadap data label dinonaktifkan."
      />
    </Dialog>
  )
}