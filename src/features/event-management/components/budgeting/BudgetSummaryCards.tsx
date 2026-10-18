"use client";

import React from "react";
import { TrendingUp, TrendingDown, Package, DollarSign } from "lucide-react";
import { formatRupiah } from "@/shared/lib/formatters";
import type { BudgetingStats, AvailableEventSummary } from "../../types";

interface BudgetSummaryCardsProps {
  budgetingStats: BudgetingStats;
  currentSelectedSummary?: AvailableEventSummary;
}

export function BudgetSummaryCards({
  budgetingStats,
  currentSelectedSummary,
}: BudgetSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Total Pemasukan */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Pemasukan</span>
          <span className="p-2 bg-emerald-950/60 border border-emerald-800/40 rounded-xl text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-black text-emerald-400 block truncate">
            {formatRupiah(budgetingStats.totalPemasukan)}
          </span>
          <p className="text-[11px] text-zinc-500 mt-1">
            Budget Klien + Sponsor Masuk
          </p>
        </div>
      </div>

      {/* KPI 2: Tagihan ERP Pusat (1 Baris Ringkas) */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sewa ERP Pusat</span>
          <span className="p-2 bg-amber-950/60 border border-amber-800/40 rounded-xl text-amber-400">
            <Package className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-black text-amber-400 block truncate">
            {formatRupiah(budgetingStats.erpCost)}
          </span>
          <p className="text-[11px] text-zinc-500 mt-1 truncate">
            {currentSelectedSummary?.title || "Tagihan Gudang"}
          </p>
        </div>
      </div>

      {/* KPI 3: Grand Total Pengeluaran */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Pengeluaran</span>
          <span className="p-2 bg-rose-950/60 border border-rose-800/40 rounded-xl text-rose-400">
            <TrendingDown className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-black text-rose-400 block truncate">
            {formatRupiah(budgetingStats.grandTotalPengeluaran)}
          </span>
          <p className="text-[11px] text-zinc-500 mt-1">
            ERP + Alat + Kru + Vendor + Utilitas
          </p>
        </div>
      </div>

      {/* KPI 4: Sisa Anggaran / Laba Bersih */}
      <div
        className={`border rounded-2xl p-5 flex flex-col justify-between shadow-sm ${
          budgetingStats.isSurplus
            ? "bg-emerald-950/20 border-emerald-800/50"
            : "bg-rose-950/20 border-rose-800/50"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            {budgetingStats.isSurplus ? "Surplus Anggaran" : "Defisit Anggaran"}
          </span>
          <span
            className={`p-2 rounded-xl border ${
              budgetingStats.isSurplus
                ? "bg-emerald-900/60 border-emerald-700/60 text-emerald-300"
                : "bg-rose-900/60 border-rose-700/60 text-rose-300"
            }`}
          >
            <DollarSign className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-3">
          <span
            className={`text-2xl font-black block truncate ${
              budgetingStats.isSurplus ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatRupiah(budgetingStats.netBalance)}
          </span>
          <p className="text-[11px] text-zinc-400 mt-1">
            {budgetingStats.isSurplus ? "Margin keuangan aman" : "Perlu penyesuaian biaya"}
          </p>
        </div>
      </div>
    </div>
  );
}

