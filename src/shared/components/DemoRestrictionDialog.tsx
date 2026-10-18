"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export interface DemoRestrictionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
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
          <DialogTitle className="text-xl font-bold text-zinc-100">{title}</DialogTitle>
          <DialogDescription className="text-zinc-400 text-sm mt-2 text-center">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center mt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-200"
          >
            Mengerti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

