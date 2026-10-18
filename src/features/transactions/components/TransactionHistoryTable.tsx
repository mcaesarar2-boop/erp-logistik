"use client";

import { useMemo } from "react";
import {
  History as HistoryIcon,
  Calendar,
  Copy,
  Check,
  Printer,
  Pencil,
  Trash2,
} from "lucide-react";
import { formatRupiah } from "@/shared/lib/formatters";
import { groupItemsByPrimaryCategory } from "@/shared/lib/grouping";
import { useAuthPermission } from "@/shared/hooks/useAuthPermission";
import { DemoRestrictionDialog } from "@/shared/components/DemoRestrictionDialog";
import { DEMO_MESSAGES } from "@/shared/constants/permissions";
import { ReprintInvoiceDialog } from "./ReprintInvoiceDialog";
import { EditHistoryDialog } from "./EditHistoryDialog";
import { DeleteHistoryDialog } from "./DeleteHistoryDialog";
import { useTransactionHistory } from "../hooks/useTransactionHistory";
import type { History, Item } from "@/shared/types/common";

interface TransactionHistoryTableProps {
  histories: History[];
  items: Item[];
  isAdmin?: boolean;
}

export function TransactionHistoryTable({
  histories,
  items,
  isAdmin: propIsAdmin,
}: TransactionHistoryTableProps) {
  const { isAdmin: authIsAdmin, isDummyUser } = useAuthPermission();
  const isAdmin = propIsAdmin !== undefined ? propIsAdmin : authIsAdmin;

  const {
    copiedHistoryId,
    editingHistory,
    setEditingHistory,
    deletingHistory,
    setDeletingHistory,
    isActionLoading,
    handleCopyInvoice,
    handleUpdateHistory,
    handleDeleteHistory,
    showDemoWarning,
    setShowDemoWarning,
  } = useTransactionHistory(items);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <HistoryIcon className="w-6 h-6 text-zinc-400" />
        <h2 className="text-xl font-bold text-zinc-100">Catatan Riwayat & Invoice</h2>
      </div>

      {histories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {histories.map((hist) => {
            const payloadData = hist.payload ? JSON.parse(hist.payload) : [];
            const totalTagihan = payloadData.reduce(
              (acc: number, cur: any) => acc + cur.price * cur.qty,
              0
            );

            return (
              <div
                key={hist.id}
                className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 shadow-sm relative group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                      <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="truncate">
                        {new Date(hist.date).toLocaleDateString("id-ID", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-zinc-100 mb-1 line-clamp-2">
                      {hist.description}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 md:opacity-0 opacity-100 group-hover:opacity-100 transition-opacity z-10">
                    {/* Tombol Copy Clipboard */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => handleCopyInvoice(hist)}
                        className={`p-2 rounded-md transition-all shadow-sm cursor-pointer ${
                          copiedHistoryId === hist.id
                            ? "bg-emerald-950/80 border border-emerald-700 text-emerald-400"
                            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                        }`}
                        title="Salin Data Invoice (Markdown)"
                      >
                        {copiedHistoryId === hist.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      {copiedHistoryId === hist.id && (
                        <div className="absolute -bottom-8 right-0 bg-emerald-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-30 animate-in fade-in zoom-in-95 duration-150">
                          Invoice disalin!
                        </div>
                      )}
                    </div>

                    {/* Tombol Cetak Ulang hanya muncul untuk tipe Invoice Rental */}
                    {hist.type === "INVOICE_RENTAL" && (
                      <ReprintInvoiceDialog history={hist}>
                        <button
                          type="button"
                          className="p-2 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 rounded-md transition-colors shadow-sm cursor-pointer"
                          title="Cetak Ulang Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </ReprintInvoiceDialog>
                    )}

                    {(isAdmin || isDummyUser) && (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingHistory(hist)}
                          className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors shadow-sm cursor-pointer"
                          title="Ubah Catatan"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingHistory(hist)}
                          className="p-2 bg-red-950/50 hover:bg-red-900 text-red-400 rounded-md transition-colors shadow-sm cursor-pointer"
                          title="Hapus Riwayat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 bg-zinc-950/50 rounded-lg p-2.5 border border-zinc-800/50 max-h-36 overflow-y-auto space-y-3">
                  {groupItemsByPrimaryCategory(payloadData, items).map((group) => (
                    <div key={group.categoryName} className="w-full">
                      <div className="w-full flex items-center gap-1.5 pb-1 mb-1.5 border-b border-zinc-800/80">
                        <span className="w-1.5 h-3 bg-emerald-500 rounded-full shrink-0"></span>
                        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                          {group.categoryName}
                        </span>
                        <span className="text-[9px] font-medium text-zinc-500 bg-zinc-900 px-1.5 py-0.2 rounded-full border border-zinc-800">
                          {group.items.length}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {group.items.map((d: any, idx: number) => (
                          <div
                            key={d.lineId || idx}
                            className="flex justify-between items-start text-xs py-1 border-b border-zinc-850/40 last:border-0 gap-2"
                          >
                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-zinc-300 truncate font-medium">
                                  {d.name} <span className="text-zinc-600 font-mono">({d.code})</span>
                                </span>
                                {d.discount === 100 ? (
                                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-1.5 py-0.2 rounded">
                                    FREE / Bonus
                                  </span>
                                ) : d.discount > 0 ? (
                                  <span className="text-[9px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-1.5 py-0.2 rounded">
                                    Disc {d.discount}%
                                  </span>
                                ) : null}
                              </div>
                              {d.footnote && (
                                <span
                                  className="text-[10px] text-zinc-500 italic truncate"
                                  title={d.footnote}
                                >
                                  {d.footnote}
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-emerald-400 shrink-0 mt-0.5 text-[11px]">
                              {d.qty} Unit × {formatRupiah(d.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-between items-center">
                  <span className="text-xs text-zinc-500">
                    Tercatat: {new Date(hist.createdAt).toLocaleTimeString("id-ID")}
                  </span>
                  <span className="text-sm font-bold text-zinc-100">
                    Total: <span className="text-emerald-400">{formatRupiah(totalTagihan)}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-zinc-500 bg-zinc-900/20 rounded-xl border border-zinc-800">
          Belum ada catatan riwayat transaksi.
        </div>
      )}

      {/* Edit History Dialog Modal */}
      <EditHistoryDialog
        history={editingHistory}
        isOpen={!!editingHistory}
        isLoading={isActionLoading}
        onClose={() => setEditingHistory(null)}
        onSubmit={handleUpdateHistory}
      />

      {/* Delete History Dialog Modal */}
      <DeleteHistoryDialog
        history={deletingHistory}
        isOpen={!!deletingHistory}
        isLoading={isActionLoading}
        onClose={() => setDeletingHistory(null)}
        onConfirm={handleDeleteHistory}
      />

      {/* Demo Warning Dialog */}
      <DemoRestrictionDialog
        isOpen={showDemoWarning}
        onClose={() => setShowDemoWarning(false)}
        title={DEMO_MESSAGES.default.title}
        message="Akun yang sedang digunakan adalah akun demo dan bersifat read-only. Perubahan riwayat transaksi dinonaktifkan pada akun ini."
      />
    </div>
  );
}

