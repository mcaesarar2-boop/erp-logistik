"use client";

import React from "react";
import { TrendingUp, TrendingDown, Package, ShoppingBag, Coffee, Users, Building2, Mic } from "lucide-react";
import { formatRupiah } from "@/shared/lib/formatters";
import { BudgetSummaryCards } from "./BudgetSummaryCards";
import type { EventDetailData, AvailableEventSummary, BudgetingStats } from "../../types";

interface EventBudgetingTabProps {
  eventDetail: EventDetailData | null;
  budgetingStats: BudgetingStats;
  currentSelectedSummary?: AvailableEventSummary;
}

export function EventBudgetingTab({
  eventDetail,
  budgetingStats,
  currentSelectedSummary,
}: EventBudgetingTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Top 4 KPI Cards */}
      <BudgetSummaryCards
        budgetingStats={budgetingStats}
        currentSelectedSummary={currentSelectedSummary}
      />

      {/* Breakdown Komparasi Lengkap (Pemasukan vs Pengeluaran) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Rincian Pemasukan */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="font-bold text-zinc-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" /> Sumber Pemasukan Acara
            </h3>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-0.5 rounded-full">
              Total: {formatRupiah(budgetingStats.totalPemasukan)}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-zinc-950/50 border border-zinc-800 rounded-xl">
              <div>
                <span className="font-semibold text-zinc-200 block text-sm">Budget Alokasi Klien</span>
                <span className="text-xs text-zinc-500">Anggaran resmi dari penyelenggara / klien</span>
              </div>
              <span className="text-base font-bold text-zinc-100">
                {formatRupiah(budgetingStats.clientBudget)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-zinc-950/50 border border-zinc-800 rounded-xl">
              <div>
                <span className="font-semibold text-zinc-200 block text-sm">Dana Sponsor (Confirmed)</span>
                <span className="text-xs text-zinc-500">
                  Total dari {eventDetail?.sponsors?.filter(s => s.status === "CONFIRMED").length || 0} sponsor terverifikasi
                </span>
              </div>
              <span className="text-base font-bold text-emerald-400">
                {formatRupiah(budgetingStats.confirmedSponsorsTotal)}
              </span>
            </div>

            {budgetingStats.pendingSponsorsTotal > 0 && (
              <div className="flex items-center justify-between p-3.5 bg-amber-950/10 border border-amber-900/30 rounded-xl">
                <div>
                  <span className="font-semibold text-amber-300 block text-sm">Potensi Sponsor (Pending/Proposal)</span>
                  <span className="text-xs text-zinc-500">Belum masuk dalam kalkulasi realisasi</span>
                </div>
                <span className="text-sm font-semibold text-amber-400 italic">
                  +{formatRupiah(budgetingStats.pendingSponsorsTotal)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Rincian Pengeluaran */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="font-bold text-zinc-100 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-400" /> Rincian Pos Pengeluaran
            </h3>
            <span className="text-xs font-bold text-rose-400 bg-rose-950/60 border border-rose-800/50 px-2.5 py-0.5 rounded-full">
              Total: {formatRupiah(budgetingStats.grandTotalPengeluaran)}
            </span>
          </div>

          <div className="space-y-3">
            {/* 1. Baris Ringkasan ERP Pusat (Sesuai Syarat No 4: Tanpa Rincian List Barang) */}
            <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-indigo-950/40 to-zinc-950/60 border border-indigo-800/50 rounded-xl">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-indigo-900/60 border border-indigo-700/60 flex items-center justify-center shrink-0 text-indigo-300">
                  <Package className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-100 text-sm truncate">
                      Tagihan ERP Pusat: {currentSelectedSummary?.title || "Sewa Alat Gudang"}
                    </span>
                    <span className="text-[10px] bg-indigo-900/60 text-indigo-300 px-1.5 py-0.5 rounded font-mono shrink-0">
                      auto-synced
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400 block truncate">
                    Nilai total sewa gudang ({currentSelectedSummary?.durationDays || 1} Hari acara)
                  </span>
                </div>
              </div>
              <span className="text-base font-black text-amber-400 shrink-0 ml-3">
                {formatRupiah(budgetingStats.erpCost)}
              </span>
            </div>

            {/* 2. Pengadaan Alat Input Manual */}
            <div className="flex items-center justify-between p-3.5 bg-zinc-950/50 border border-zinc-800 rounded-xl">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-zinc-300">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-zinc-200 block text-sm">Alat Tambahan (Input Manual)</span>
                  <span className="text-xs text-zinc-500">
                    Total {eventDetail?.manualEquipments?.length || 0} item peralatan non-gudang
                  </span>
                </div>
              </div>
              <span className="text-base font-bold text-zinc-100 shrink-0 ml-3">
                {formatRupiah(budgetingStats.manualEquipTotal)}
              </span>
            </div>

            {/* 3. Kebutuhan Utilitas (Konsumsi, Akomodasi, dll.) */}
            <div className="flex items-center justify-between p-3.5 bg-zinc-950/50 border border-amber-900/30 rounded-xl">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-amber-950/50 border border-amber-800/40 flex items-center justify-center shrink-0 text-amber-400">
                  <Coffee className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-zinc-200 block text-sm">Management Utility (Konsumsi, Akomodasi, dll.)</span>
                  <span className="text-xs text-zinc-500">
                    Total {eventDetail?.utilities?.length || 0} pos utilitas operasional
                  </span>
                </div>
              </div>
              <span className="text-base font-bold text-amber-400 shrink-0 ml-3">
                {formatRupiah(budgetingStats.utilityTotal)}
              </span>
            </div>

            {/* 4. Biaya Kru Operasional */}
            <div className="flex items-center justify-between p-3.5 bg-zinc-950/50 border border-zinc-800 rounded-xl">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-zinc-300">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-zinc-200 block text-sm">Biaya Honorarium Kru</span>
                  <span className="text-xs text-zinc-500">
                    Honor tim operasional & petugas lapangan
                  </span>
                </div>
              </div>
              <span className="text-base font-bold text-zinc-100 shrink-0 ml-3">
                {formatRupiah(budgetingStats.crewTotal)}
              </span>
            </div>

            {/* 5. Biaya Vendor Eksternal */}
            <div className="flex items-center justify-between p-3.5 bg-zinc-950/50 border border-zinc-800 rounded-xl">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-zinc-300">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-zinc-200 block text-sm">Vendor Eksternal</span>
                  <span className="text-xs text-zinc-500">
                    Vendor katering, genset, rigging, dll.
                  </span>
                </div>
              </div>
              <span className="text-base font-bold text-zinc-100 shrink-0 ml-3">
                {formatRupiah(budgetingStats.externalVendorTotal)}
              </span>
            </div>

            {/* 6. Guest Star & Riders (Artis & Bintang Tamu) */}
            <div className="flex items-center justify-between p-3.5 bg-zinc-950/50 border border-purple-900/40 rounded-xl">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-purple-950/50 border border-purple-800/50 flex items-center justify-center shrink-0 text-purple-400">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-zinc-200 block text-sm">Guest Star & Riders (Bintang Tamu / Artis)</span>
                  <span className="text-xs text-zinc-400">
                    Total {eventDetail?.guestStars?.length || 0} Pengisi Acara (Honor: {formatRupiah(budgetingStats.guestStarFeeTotal)} + Riders Vendor Luar: {formatRupiah(budgetingStats.guestStarRidersTotal)})
                  </span>
                </div>
              </div>
              <span className="text-base font-bold text-purple-400 shrink-0 ml-3">
                {formatRupiah(budgetingStats.guestStarTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

