"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"

interface DemoRestrictionDialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message?: string
}

export function DemoRestrictionDialog({
  isOpen,
  onClose,
  title = "Mode Demo",
  message = "Akun yang sedang digunakan adalah akun demo dan bersifat read-only. Perubahan terhadap data tidak tersedia pada akun ini."
}: DemoRestrictionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50 max-w-md">
        <DialogHeader className="flex flex-col items-center text-center pt-4">
          <div className="bg-amber-950/40 p-3 rounded-full border border-amber-900/50 mb-3 text-amber-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <DialogTitle className="text-xl font-bold text-zinc-50">{title}</DialogTitle>
          <DialogDescription className="text-sm text-zinc-400 mt-2 max-w-sm text-center">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center pt-4 border-t border-zinc-900 mt-4">
          <Button onClick={onClose} className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 px-8 font-medium">
            Mengerti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
