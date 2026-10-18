"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createStandaloneEventWorkspace } from "../actions";
import type { EventDetailData } from "../types";

interface CreateStandaloneEventDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isDummyUser?: boolean;
  onShowDemoWarning?: () => void;
  onCreated: (event: EventDetailData) => void;
}

export function CreateStandaloneEventDialog({
  isOpen,
  onOpenChange,
  isDummyUser,
  onShowDemoWarning,
  onCreated,
}: CreateStandaloneEventDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isDummyUser) {
      onShowDemoWarning?.();
      return;
    }
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("eventName") as string) || "Event Baru";
    const days = Math.max(1, parseInt(formData.get("durationDays") as string) || 1);
    const budget = Math.max(0, parseFloat(formData.get("clientBudget") as string) || 0);

    setLoading(true);
    try {
      const res = await createStandaloneEventWorkspace(name, days, budget);
      if (res.success && res.data) {
        onCreated(res.data as EventDetailData);
        onOpenChange(false);
      } else {
        alert(res.error || "Gagal membuat workspace event.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Inisialisasi Workspace Event Mandiri</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Nama Acara / Event</label>
            <input
              type="text"
              name="eventName"
              required
              placeholder="Contoh: Konser Rock Merdeka 2026"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Durasi (Jumlah Hari)</label>
              <input
                type="number"
                name="durationDays"
                min="1"
                defaultValue={1}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Budget Klien (IDR)</label>
              <input
                type="number"
                name="clientBudget"
                min="0"
                defaultValue={0}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              {loading ? "Menyimpan..." : "Buat Workspace"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

