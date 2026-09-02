"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  createMasterCategory, 
  updateMasterCategory, 
  deleteMasterCategory, 
  createMasterLabel, 
  updateMasterLabel, 
  deleteMasterLabel 
} from "@/app/actions"
import { useRouter } from "next/navigation"
import { Settings, Tag, Layers, Plus, Pencil, Trash2, Check, X, Loader2, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { isDemoEmail, isAdminEmail, DEMO_MESSAGES } from "@/lib/permissions"
import { DemoRestrictionDialog } from "@/components/DemoRestrictionDialog"

export type MasterItem = {
  id: string
  name: string
}

interface ManagePackageMasterDialogProps {
  masterCategories: MasterItem[]
  masterLabels: MasterItem[]
  trigger?: React.ReactNode
}

export function ManagePackageMasterDialog({ 
  masterCategories, 
  masterLabels, 
  trigger 
}: ManagePackageMasterDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'category' | 'label'>('category')
  
  // Input Tambah
  const [newCatName, setNewCatName] = useState("")
  const [newLabelName, setNewLabelName] = useState("")

  // Inline Editing
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  // Confirmation Delete
  const [deletingItem, setDeletingItem] = useState<{ id: string; name: string; type: 'category' | 'label' } | null>(null)

  // Status & Error
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Permissions
  const [isAdmin, setIsAdmin] = useState(false)
  const [isDummyUser, setIsDummyUser] = useState(false)
  const [showDemoWarning, setShowDemoWarning] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setIsAdmin(isAdminEmail(data.user.email))
        setIsDummyUser(isDemoEmail(data.user.email))
      }
    })
  }, [])

  const notifySuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 2500)
  }

  // --- HANDLER KATEGORI ---
  const handleAddCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (isDummyUser) { setShowDemoWarning(true); return; }
    if (!newCatName.trim()) return

    setIsLoading(true)
    setErrorMsg(null)
    const res = await createMasterCategory(newCatName.trim())
    setIsLoading(false)

    if (res.success) {
      setNewCatName("")
      notifySuccess("Kategori berhasil ditambahkan!")
      router.refresh()
    } else {
      setErrorMsg("error" in res ? res.error : "Gagal menambahkan kategori.")
    }
  }

  const handleUpdateCategory = async (id: string) => {
    if (isDummyUser) { setShowDemoWarning(true); return; }
    if (!editingName.trim()) return

    setIsLoading(true)
    setErrorMsg(null)
    const res = await updateMasterCategory(id, editingName.trim())
    setIsLoading(false)

    if (res.success) {
      setEditingId(null)
      setEditingName("")
      notifySuccess("Kategori & seluruh paket terkait berhasil diperbarui!")
      router.refresh()
    } else {
      setErrorMsg("error" in res ? res.error : "Gagal mengubah nama kategori.")
    }
  }

  const handleDeleteCategory = async () => {
    if (!deletingItem) return
    if (isDummyUser) { setShowDemoWarning(true); return; }

    setIsLoading(true)
    setErrorMsg(null)
    const res = await deleteMasterCategory(deletingItem.id)
    setIsLoading(false)

    if (res.success) {
      setDeletingItem(null)
      notifySuccess("Kategori berhasil dihapus dan dilepas dari paket!")
      router.refresh()
    } else {
      setErrorMsg("error" in res ? res.error : "Gagal menghapus kategori.")
    }
  }

  // --- HANDLER LABEL ---
  const handleAddLabel = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (isDummyUser) { setShowDemoWarning(true); return; }
    if (!newLabelName.trim()) return

    setIsLoading(true)
    setErrorMsg(null)
    const res = await createMasterLabel(newLabelName.trim())
    setIsLoading(false)

    if (res.success) {
      setNewLabelName("")
      notifySuccess("Label berhasil ditambahkan!")
      router.refresh()
    } else {
      setErrorMsg("error" in res ? res.error : "Gagal menambahkan label.")
    }
  }

  const handleUpdateLabel = async (id: string) => {
    if (isDummyUser) { setShowDemoWarning(true); return; }
    if (!editingName.trim()) return

    setIsLoading(true)
    setErrorMsg(null)
    const res = await updateMasterLabel(id, editingName.trim())
    setIsLoading(false)

    if (res.success) {
      setEditingId(null)
      setEditingName("")
      notifySuccess("Label & seluruh paket terkait berhasil diperbarui!")
      router.refresh()
    } else {
      setErrorMsg("error" in res ? res.error : "Gagal mengubah nama label.")
    }
  }

  const handleDeleteLabel = async () => {
    if (!deletingItem) return
    if (isDummyUser) { setShowDemoWarning(true); return; }

    setIsLoading(true)
    setErrorMsg(null)
    const res = await deleteMasterLabel(deletingItem.id)
    setIsLoading(false)

    if (res.success) {
      setDeletingItem(null)
      notifySuccess("Label berhasil dihapus dan dibersihkan dari paket!")
      router.refresh()
    } else {
      setErrorMsg("error" in res ? res.error : "Gagal menghapus label.")
    }
  }

  if (!isAdmin && !isDummyUser) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) {
          setErrorMsg(null)
          setSuccessMsg(null)
          setEditingId(null)
          setDeletingItem(null)
        }
      }}>
        <DialogTrigger asChild>
          {trigger || (
            <Button 
              variant="outline"
              size="sm"
              className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 flex items-center gap-1.5 shrink-0"
              title="Kelola Master Kategori & Label Paket"
            >
              <Settings className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Kelola Master</span>
            </Button>
          )}
        </DialogTrigger>

        <DialogContent aria-describedby={undefined} className="bg-zinc-950 border-zinc-800 text-zinc-50 max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-zinc-100">
              <Settings className="w-5 h-5 text-blue-400" /> Kelola Master Kategori & Label Paket
            </DialogTitle>
          </DialogHeader>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="bg-red-950/60 border border-red-900 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2 shrink-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-950/60 border border-emerald-900 text-emerald-400 text-xs p-2.5 rounded-lg flex items-center gap-2 shrink-0 animate-in fade-in duration-150">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Tabs Navigation */}
          <div className="flex border-b border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={() => { setActiveTab('category'); setErrorMsg(null); setEditingId(null); }}
              className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'category'
                  ? "border-blue-500 text-blue-400 bg-blue-950/20"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Kategori Utama ({masterCategories.length})</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('label'); setErrorMsg(null); setEditingId(null); }}
              className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'label'
                  ? "border-blue-500 text-blue-400 bg-blue-950/20"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Label / Grade ({masterLabels.length})</span>
            </button>
          </div>

          {/* Tab 1: Kategori Utama */}
          {activeTab === 'category' && (
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
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Plus className="w-3.5 h-3.5 mr-1" /> Tambah</>}
                </Button>
              </form>

              <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 px-1 shrink-0">
                <span>💡 Mengubah/menghapus kategori otomatis diperbarui ke seluruh paket rental.</span>
              </div>

              {/* List Kategori */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 border border-zinc-800/80 rounded-lg p-2 bg-zinc-900/20">
                {masterCategories.length > 0 ? (
                  masterCategories.map((cat) => (
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
                                setEditingId(cat.id)
                                setEditingName(cat.name)
                                setErrorMsg(null)
                              }}
                              className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                              title="Edit Nama Kategori"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingItem({ id: cat.id, name: cat.name, type: 'category' })}
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
          )}

          {/* Tab 2: Label / Grade */}
          {activeTab === 'label' && (
            <div className="flex flex-col gap-3 flex-1 overflow-hidden pt-2">
              {/* Form Tambah Label */}
              <form onSubmit={handleAddLabel} className="flex gap-2 shrink-0">
                <Input
                  placeholder="Nama label baru (misal: Concert, Festival)..."
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-xs h-9"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !newLabelName.trim()}
                  className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Plus className="w-3.5 h-3.5 mr-1" /> Tambah</>}
                </Button>
              </form>

              <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 px-1 shrink-0">
                <span>💡 Mengubah/menghapus label otomatis di-cascade ke seluruh array label paket rental.</span>
              </div>

              {/* List Label */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 border border-zinc-800/80 rounded-lg p-2 bg-zinc-900/20">
                {masterLabels.length > 0 ? (
                  masterLabels.map((lbl) => (
                    <div
                      key={lbl.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors gap-2 text-xs"
                    >
                      {editingId === lbl.id ? (
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleUpdateLabel(lbl.id);
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
                            onClick={() => handleUpdateLabel(lbl.id)}
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
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60 truncate">
                              {lbl.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(lbl.id)
                                setEditingName(lbl.name)
                                setErrorMsg(null)
                              }}
                              className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                              title="Edit Nama Label"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingItem({ id: lbl.id, name: lbl.name, type: 'label' })}
                              className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                              title="Hapus Label"
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
                    Belum ada label/grade. Silakan tambahkan di atas.
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal for Delete */}
      <Dialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <DialogContent aria-describedby={undefined} className="bg-zinc-950 border-zinc-800 text-zinc-50 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Hapus {deletingItem?.type === 'category' ? 'Kategori' : 'Label'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-sm text-zinc-300">
            <p>
              Apakah Anda yakin ingin menghapus {deletingItem?.type === 'category' ? 'kategori' : 'label'}{" "}
              <strong className="text-white">"{deletingItem?.name}"</strong>?
            </p>
            <p className="text-xs text-zinc-500">
              {deletingItem?.type === 'category'
                ? "Kategori ini akan dilepas dari seluruh paket yang menggunakannya."
                : "Label ini akan otomatis dibersihkan dari daftar tag seluruh paket."}
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingItem(null)}
              disabled={isLoading}
              className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={deletingItem?.type === 'category' ? handleDeleteCategory : handleDeleteLabel}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Hapus"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DemoRestrictionDialog
        isOpen={showDemoWarning}
        onClose={() => setShowDemoWarning(false)}
        title={DEMO_MESSAGES.edit.title}
        message="Akun ini adalah akun demo. Pengelolaan Master Data Kategori dan Label dinonaktifkan."
      />
    </>
  )
}
