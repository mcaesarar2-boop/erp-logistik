"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MasterItem } from "../types";
import { createMasterCategory, updateMasterCategory } from "../actions/masterDataActions";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";

export interface MasterCategoryListProps {
  categories: MasterItem[];
  isDummyUser: boolean;
  onShowDemoWarning: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string | null) => void;
  onRequestDelete: (item: { id: string; name: string; type: "category" }) => void;
}

export function MasterCategoryList({
  categories,
  isDummyUser,
  onShowDemoWarning,
  onSuccess,
  onError,
  onRequestDelete,
}: MasterCategoryListProps) {
  const router = useRouter();
  const [newCatName, setNewCatName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isDummyUser) {
      onShowDemoWarning();
      return;
    }
    if (!newCatName.trim()) return;

    setIsLoading(true);
    onError(null);
    const res = await createMasterCategory(newCatName.trim());
    setIsLoading(false);

    if (res.success) {
      setNewCatName("");
      onSuccess("Kategori berhasil ditambahkan!");
      router.refresh();
    } else {
      onError(("error" in res && res.error) ? res.error : "Gagal menambahkan kategori.");
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (isDummyUser) {
      onShowDemoWarning();
      return;
    }
    if (!editingName.trim()) return;

    setIsLoading(true);
    onError(null);
    const res = await updateMasterCategory(id, editingName.trim());
    setIsLoading(false);

    if (res.success) {
      setEditingId(null);
      setEditingName("");
      onSuccess("Kategori & seluruh paket terkait berhasil diperbarui!");
      router.refresh();
    } else {
      onError(("error" in res && res.error) ? res.error : "Gagal mengubah nama kategori.");
    }
  };

  return (
    <div className="flex flex-col gap-3 flex-1 overflow-hidden pt-2">
      {/* Form Tambah Kategori */}
      <form onSubmit={handleAddCategory} className="flex gap-2 shrink-0">
        <Input
          placeholder="Nama kategori baru (misal: Sound System)..."
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          className="bg-zinc-900 border-zinc-800 text-xs h-9"
          disabled={isLoading}
        />
        <Button
          type="submit"
          disabled={isLoading || !newCatName.trim()}
          className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 mr-1" /> Tambah
            </>
          )}
        </Button>
      </form>

      <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 px-1 shrink-0">
        <span>💡 Mengubah/menghapus kategori otomatis diperbarui ke seluruh paket rental.</span>
      </div>

      {/* List Kategori */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 border border-zinc-800/80 rounded-lg p-2 bg-zinc-900/20">
        {categories.length > 0 ? (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors gap-2 text-xs"
            >
              {editingId === cat.id ? (
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleUpdateCategory(cat.id);
                      } else if (e.key === "Escape") {
                        setEditingId(null);
                      }
                    }}
                    autoFocus
                    className="h-7 text-xs bg-zinc-950 border-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateCategory(cat.id)}
                    disabled={isLoading}
                    className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer shrink-0"
                    title="Simpan Perubahan"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded cursor-pointer shrink-0"
                    title="Batal"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                    <span className="font-semibold text-zinc-200 truncate">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditingName(cat.name);
                        onError(null);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                      title="Edit Nama Kategori"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRequestDelete({ id: cat.id, name: cat.name, type: "category" })}
                      className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-zinc-500 text-xs">
            Belum ada kategori utama. Silakan tambahkan di atas.
          </div>
        )}
      </div>
    </div>
  );
}

