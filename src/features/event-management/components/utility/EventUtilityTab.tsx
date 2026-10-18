"use client";

import React, { useState, useMemo } from "react";
import { Coffee, Plus, Trash2, Utensils, Building2, Truck, Zap, Radio, HeartPulse, Wrench, Boxes } from "lucide-react";
import { formatRupiah } from "@/shared/lib/formatters";
import { AddUtilityDialog } from "./AddUtilityDialog";
import { deleteEventUtility } from "../../actions";
import type { EventDetailData, EventUtilityData, BudgetingStats } from "../../types";

interface EventUtilityTabProps {
  eventDetail: EventDetailData | null;
  budgetingStats: BudgetingStats;
  isDummyUser?: boolean;
  onShowDemoWarning?: () => void;
  onUpdateEventDetail: (updater: (prev: EventDetailData | null) => EventDetailData | null) => void;
}

export function EventUtilityTab({
  eventDetail,
  budgetingStats,
  isDummyUser,
  onShowDemoWarning,
  onUpdateEventDetail,
}: EventUtilityTabProps) {
  const [isUtilityDialogOpen, setIsUtilityDialogOpen] = useState(false);

  // Group utilities by category
  const groupedUtilities = useMemo(() => {
    const groups: { [key: string]: EventUtilityData[] } = {};
    const utils = eventDetail?.utilities || [];
    utils.forEach(u => {
      const cat = u.category?.trim() || "Lainnya";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(u);
    });
    return groups;
  }, [eventDetail?.utilities]);

  const handleDeleteUtility = async (utilityId: string) => {
    if (isDummyUser) {
      onShowDemoWarning?.();
      return;
    }
    const res = await deleteEventUtility(utilityId);
    if (res.success) {
      onUpdateEventDetail(prev => prev ? {
        ...prev,
        utilities: (prev.utilities || []).filter(u => u.id !== utilityId)
      } : null);
    }
  };

  const getCategoryIcon = (category: string) => {
    const catLower = category.toLowerCase();
    if (catLower.includes("konsumsi") || catLower.includes("makan") || catLower.includes("catering")) {
      return <Utensils className="w-4 h-4 text-amber-400" />;
    }
    if (catLower.includes("akomodasi") || catLower.includes("hotel") || catLower.includes("penginapan")) {
      return <Building2 className="w-4 h-4 text-blue-400" />;
    }
    if (catLower.includes("transport") || catLower.includes("kendaraan") || catLower.includes("mobil")) {
      return <Truck className="w-4 h-4 text-emerald-400" />;
    }
    if (catLower.includes("listrik") || catLower.includes("bbm") || catLower.includes("genset") || catLower.includes("daya")) {
      return <Zap className="w-4 h-4 text-yellow-400" />;
    }
    if (catLower.includes("komunikasi") || catLower.includes("ht") || catLower.includes("internet") || catLower.includes("wifi")) {
      return <Radio className="w-4 h-4 text-purple-400" />;
    }
    if (catLower.includes("medis") || catLower.includes("p3k") || catLower.includes("kesehatan")) {
      return <HeartPulse className="w-4 h-4 text-rose-400" />;
    }
    if (catLower.includes("tools") || catLower.includes("teknis") || catLower.includes("alat")) {
      return <Wrench className="w-4 h-4 text-cyan-400" />;
    }
    return <Boxes className="w-4 h-4 text-indigo-400" />;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Header Sub-Tab Utility */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-zinc-100 flex items-center gap-2">
              <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 shrink-0" /> Management Utility Event
            </h3>
            <span className="bg-amber-950/80 border border-amber-700/60 text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
              Per Kategori
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Kelola dan pantau seluruh kebutuhan utilitas acara seperti konsumsi, akomodasi, transportasi, kelistrikan/BBM, dan komunikasi secara terstruktur per kategori.
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <div className="bg-zinc-900/80 border border-zinc-800/80 px-3.5 py-2 rounded-xl text-right shrink-0">
            <span className="text-[11px] text-zinc-400 block whitespace-nowrap">Total Pengeluaran Utilitas</span>
            <span className="text-base sm:text-lg font-black text-amber-400 whitespace-nowrap">
              {formatRupiah(budgetingStats.utilityTotal)}
            </span>
          </div>

          <AddUtilityDialog
            isOpen={isUtilityDialogOpen}
            onOpenChange={setIsUtilityDialogOpen}
            eventDetailId={eventDetail?.id || ""}
            isDummyUser={isDummyUser}
            onShowDemoWarning={onShowDemoWarning}
            onUtilityAdded={(newUtil) => {
              onUpdateEventDetail(prev => prev ? {
                ...prev,
                utilities: [...(prev.utilities || []), newUtil]
              } : null);
            }}
          />
        </div>
      </div>

      {/* Ringkasan Pill / Badges Kategori Utilitas */}
      {Object.keys(groupedUtilities).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Object.entries(groupedUtilities).map(([catName, utils]) => {
            const subtotal = utils.reduce((a, b) => a + b.totalCost, 0);
            return (
              <div
                key={catName}
                className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between hover:border-zinc-700 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-zinc-800/80 rounded-lg shrink-0">
                    {getCategoryIcon(catName)}
                  </div>
                  <span className="text-xs font-bold text-zinc-200 leading-tight whitespace-nowrap">{catName}</span>
                </div>
                <div className="flex items-baseline justify-between gap-2 border-t border-zinc-800/40 pt-2">
                  <span className="text-[11px] text-zinc-400 whitespace-nowrap">{utils.length} Kebutuhan</span>
                  <span className="text-sm font-black text-amber-400 whitespace-nowrap">
                    {formatRupiah(subtotal)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RENDER LAPORAN / UI GROUPED PER KATEGORI */}
      {Object.keys(groupedUtilities).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedUtilities).map(([catName, utils]) => {
            const categoryTotal = utils.reduce((acc, cur) => acc + (Number(cur.totalCost) || 0), 0);

            return (
              <div
                key={catName}
                className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm"
              >
                {/* Header Kategori */}
                <div className="bg-zinc-950/70 border-b border-zinc-800 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg shrink-0">
                      {getCategoryIcon(catName)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                        <span>Kategori: {catName}</span>
                        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                          {utils.length} Kebutuhan
                        </span>
                      </h4>
                      <span className="text-[11px] text-zinc-500">
                        Rincian pengeluaran pos {catName.toLowerCase()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 uppercase block font-semibold whitespace-nowrap">Subtotal Kategori</span>
                    <span className="text-base font-black text-amber-400 whitespace-nowrap">
                      {formatRupiah(categoryTotal)}
                    </span>
                  </div>
                </div>

                {/* Tabel Item dalam Kategori Ini */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-950/40 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80">
                      <tr>
                        <th className="py-3 px-4 whitespace-nowrap">Nama Kebutuhan</th>
                        <th className="py-3 px-4 text-center whitespace-nowrap">Tipe Biaya</th>
                        <th className="py-3 px-4 text-center whitespace-nowrap">Jumlah / Qty</th>
                        <th className="py-3 px-4 whitespace-nowrap">Kalkulasi Rincian</th>
                        <th className="py-3 px-4 text-right whitespace-nowrap">Subtotal Biaya</th>
                        <th className="py-3 px-4 text-center whitespace-nowrap">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40">
                      {utils.map(item => (
                        <tr key={item.id} className="hover:bg-zinc-800/20 transition-colors">
                          {/* Nama & Catatan */}
                          <td className="py-3.5 px-4 min-w-[200px]">
                            <span className="font-semibold text-zinc-100 block">{item.name}</span>
                            {item.notes && (
                              <span className="text-[11px] text-zinc-400 italic block mt-0.5" title={item.notes}>
                                {item.notes}
                              </span>
                            )}
                          </td>

                          {/* Tipe Badge */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                              item.procurementType === "BELI"
                                ? "bg-amber-950/80 border border-amber-800 text-amber-300"
                                : "bg-blue-950/80 border border-blue-800 text-blue-300"
                            }`}>
                              {item.procurementType}
                            </span>
                          </td>

                          {/* Qty & Satuan */}
                          <td className="py-3.5 px-4 text-center font-bold text-zinc-200 whitespace-nowrap">
                            {item.quantity} {item.unit || "pcs"}
                          </td>

                          {/* Kalkulasi Rincian */}
                          <td className="py-3.5 px-4 text-xs text-zinc-300 font-mono whitespace-nowrap">
                            {item.procurementType === "BELI" ? (
                              <span>{item.quantity} {item.unit || "pcs"} × {formatRupiah(item.unitPrice)}</span>
                            ) : (
                              <span>{item.quantity} {item.unit || "pcs"} × {formatRupiah(item.rentalPricePerDay)}/hari × {item.rentalDays} Hari</span>
                            )}
                          </td>

                          {/* Subtotal Biaya */}
                          <td className="py-3.5 px-4 text-right font-black text-amber-400 whitespace-nowrap">
                            {formatRupiah(item.totalCost)}
                          </td>

                          {/* Aksi Hapus */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleDeleteUtility(item.id)}
                              className="p-1.5 hover:bg-rose-950/80 hover:text-rose-400 text-zinc-500 rounded-md transition-colors cursor-pointer"
                              title="Hapus Kebutuhan Utilitas"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-zinc-950/60 border-t border-zinc-800/80 text-xs font-bold">
                      <tr>
                        <td colSpan={3} className="py-2.5 px-4 text-zinc-400 whitespace-nowrap">
                          Subtotal Kategori {catName}: {utils.length} Kebutuhan
                        </td>
                        <td className="py-2.5 px-4 text-right text-zinc-400 whitespace-nowrap">
                          Total Pos:
                        </td>
                        <td className="py-2.5 px-4 text-right text-sm font-black text-amber-400 whitespace-nowrap">
                          {formatRupiah(categoryTotal)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl p-8 space-y-3">
          <Coffee className="w-10 h-10 text-amber-500/60 mx-auto" />
          <h4 className="text-base font-bold text-zinc-300">Belum Ada Kebutuhan Utilitas Tercatat</h4>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Kelola akomodasi hotel, konsumsi kru, transportasi, bensin genset, atau kebutuhan utilitas lainnya secara terstruktur per kategori.
          </p>
          <button
            type="button"
            onClick={() => setIsUtilityDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-colors mt-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah Utilitas Pertama
          </button>
        </div>
      )}
    </div>
  );
}

