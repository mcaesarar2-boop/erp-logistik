"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MasterItem, MasterTabType } from "../types";
import { deleteMasterCategory, deleteMasterLabel } from "../actions/masterDataActions";
import { useRouter } from "next/navigation";
import { Settings, Tag, Layers, Trash2, Check, X, Loader2, AlertCircle } from "lucide-react";
import { useAuthPermission } from "@/shared/hooks/useAuthPermission";
import { DEMO_MESSAGES } from "@/shared/constants/permissions";
import { DemoRestrictionDialog } from "@/shared/components/DemoRestrictionDialog";
import { MasterCategoryList } from "./MasterCategoryList";
import { MasterLabelList } from "./MasterLabelList";

export interface ManagePackageMasterDialogProps {
  masterCategories: MasterItem[];
  masterLabels: MasterItem[];
  trigger?: React.ReactNode;
}

export function ManagePackageMasterDialog({
  masterCategories,
  masterLabels,
  trigger,
}: ManagePackageMasterDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<MasterTabType>("category");

  // Confirmation Delete
  const [deletingItem, setDeletingItem] = useState<{
    id: string;
    name: string;
    type: "category" | "label";
  } | null>(null);

  // Status & Error
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Permissions
  const { isAdmin, isDummyUser, showDemoWarning, setShowDemoWarning } = useAuthPermission();

  const notifySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const res =
      deletingItem.type === "category"
        ? await deleteMasterCategory(deletingItem.id)
        : await deleteMasterLabel(deletingItem.id);

    setIsLoading(false);

    if (res.success) {
      const labelText = deletingItem.type === "category" ? "Kategori" : "Label";
      notifySuccess(`${labelText} berhasil dihapus dan diperbarui di paket!`);
      setDeletingItem(null);
      router.refresh();
    } else {
      setErrorMsg(("error" in res && res.error) ? res.error : "Gagal menghapus data master.");
    }
  };

  if (!isAdmin && !isDummyUser) return null;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setErrorMsg(null);
            setSuccessMsg(null);
            setDeletingItem(null);
          }
        }}
      >
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

        <DialogContent
          aria-describedby={undefined}
          className="bg-zinc-950 border-zinc-800 text-zinc-50 max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        >
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
              onClick={() => {
                setActiveTab("category");
                setErrorMsg(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "category"
                  ? "border-blue-500 text-blue-400 bg-blue-950/20"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Kategori Utama ({masterCategories.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("label");
                setErrorMsg(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "label"
                  ? "border-blue-500 text-blue-400 bg-blue-950/20"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Label / Grade ({masterLabels.length})</span>
            </button>
          </div>

          {/* Tab 1: Kategori Utama */}
          {activeTab === "category" && (
            <MasterCategoryList
              categories={masterCategories}
              isDummyUser={isDummyUser}
              onShowDemoWarning={() => setShowDemoWarning(true)}
              onSuccess={notifySuccess}
              onError={setErrorMsg}
              onRequestDelete={(item) => setDeletingItem(item)}
            />
          )}

          {/* Tab 2: Label / Grade */}
          {activeTab === "label" && (
            <MasterLabelList
              labels={masterLabels}
              isDummyUser={isDummyUser}
              onShowDemoWarning={() => setShowDemoWarning(true)}
              onSuccess={notifySuccess}
              onError={setErrorMsg}
              onRequestDelete={(item) => setDeletingItem(item)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal Delete */}
      {deletingItem && (
        <Dialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
          <DialogContent
            aria-describedby={undefined}
            className="bg-zinc-950 border-zinc-800 text-zinc-50 max-w-sm"
          >
            <DialogHeader>
              <DialogTitle className="text-red-400 flex items-center gap-2 text-base">
                <Trash2 className="w-4 h-4" /> Konfirmasi Hapus{" "}
                {deletingItem.type === "category" ? "Kategori" : "Label"}
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 text-xs text-zinc-400 space-y-2">
              <p>
                Apakah Anda yakin ingin menghapus{" "}
                <span className="font-bold text-zinc-100">&quot;{deletingItem.name}&quot;</span>?
              </p>
              <p className="text-[11px] text-zinc-500">
                {deletingItem.type === "category"
                  ? "Kategori ini akan dilepas dari seluruh paket rental terkait."
                  : "Label ini akan dibersihkan dari daftar label paket terkait."}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingItem(null)}
                className="bg-zinc-900 border-zinc-800 text-zinc-300 text-xs"
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleDeleteItem}
                className="bg-red-600 hover:bg-red-700 text-white text-xs"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Hapus Permanen"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Larangan Demo */}
      <DemoRestrictionDialog
        isOpen={showDemoWarning}
        onClose={() => setShowDemoWarning(false)}
        title={DEMO_MESSAGES.masterData.title}
        message="Akun yang sedang digunakan adalah akun demo dan bersifat read-only. Perubahan master data (kategori/label) dinonaktifkan."
      />
    </>
  );
}

