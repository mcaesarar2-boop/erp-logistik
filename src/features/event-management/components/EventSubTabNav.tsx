"use client";

import React from "react";
import { Users, DollarSign, Package, Coffee, Mic, CalendarDays, Edit3, Printer } from "lucide-react";
import type { EventDetailData, AvailableEventSummary, BudgetingStats, EventSubTabType } from "../types";

interface EventSubTabNavProps {
  activeSubTab: EventSubTabType;
  onSelectSubTab: (tab: EventSubTabType) => void;
  eventDetail: EventDetailData | null;
  currentSelectedSummary?: AvailableEventSummary;
  budgetingStats: BudgetingStats;
  isEditingEventInfo: boolean;
  onToggleEditEventInfo: () => void;
}

export function EventSubTabNav({
  activeSubTab,
  onSelectSubTab,
  eventDetail,
  currentSelectedSummary,
  budgetingStats,
  isEditingEventInfo,
  onToggleEditEventInfo,
}: EventSubTabNavProps) {
  return (
    <div className="print:hidden bg-zinc-900/40 border border-zinc-800 rounded-2xl p-2 sm:p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {/* Sub-Tab 1: Overview */}
        <button
          type="button"
          onClick={() => onSelectSubTab("overview")}
          className={`whitespace-nowrap flex items-center gap-2 py-2 px-3.5 font-semibold text-xs sm:text-sm transition-all rounded-xl cursor-pointer ${
            activeSubTab === "overview"
              ? "bg-blue-950/70 border border-blue-500/80 text-blue-300 ring-1 ring-blue-500/40 shadow-sm"
              : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 hover:border-zinc-700"
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Overview & Operasional</span>
          <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full ml-1 font-bold">
            {(eventDetail?.crews?.length || 0) + (eventDetail?.sponsors?.length || 0) + (eventDetail?.vendors?.length || 0)}
          </span>
        </button>

        {/* Sub-Tab 2: Budgeting */}
        <button
          type="button"
          onClick={() => onSelectSubTab("budgeting")}
          className={`whitespace-nowrap flex items-center gap-2 py-2 px-3.5 font-semibold text-xs sm:text-sm transition-all rounded-xl cursor-pointer ${
            activeSubTab === "budgeting"
              ? "bg-emerald-950/70 border border-emerald-500/80 text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm"
              : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 hover:border-zinc-700"
          }`}
        >
          <DollarSign className="w-4 h-4 shrink-0" />
          <span>Budgeting (Keuangan)</span>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full ml-1 font-bold ${
              budgetingStats.isSurplus
                ? "bg-emerald-900/80 text-emerald-300 border border-emerald-700/60"
                : "bg-rose-900/80 text-rose-300 border border-rose-700/60"
            }`}
          >
            {budgetingStats.isSurplus ? "+ Surplus" : "- Defisit"}
          </span>
        </button>

        {/* Sub-Tab 3: Alat */}
        <button
          type="button"
          onClick={() => onSelectSubTab("equipment")}
          className={`whitespace-nowrap flex items-center gap-2 py-2 px-3.5 font-semibold text-xs sm:text-sm transition-all rounded-xl cursor-pointer ${
            activeSubTab === "equipment"
              ? "bg-cyan-950/70 border border-cyan-500/80 text-cyan-300 ring-1 ring-cyan-500/40 shadow-sm"
              : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 hover:border-zinc-700"
          }`}
        >
          <Package className="w-4 h-4 shrink-0" />
          <span>Manajemen Perlengkapan (Alat)</span>
          <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full ml-1 font-bold">
            {(currentSelectedSummary?.payload?.length || 0) + (eventDetail?.manualEquipments?.length || 0)}
          </span>
        </button>

        {/* Sub-Tab 4: Management Utility */}
        <button
          type="button"
          onClick={() => onSelectSubTab("utility")}
          className={`whitespace-nowrap flex items-center gap-2 py-2 px-3.5 font-semibold text-xs sm:text-sm transition-all rounded-xl cursor-pointer ${
            activeSubTab === "utility"
              ? "bg-amber-950/70 border border-amber-500/80 text-amber-300 ring-1 ring-amber-500/40 shadow-sm"
              : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 hover:border-zinc-700"
          }`}
        >
          <Coffee className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Management Utility</span>
          <span className="text-[11px] bg-zinc-800 text-amber-400 px-2 py-0.5 rounded-full ml-1 font-bold">
            {eventDetail?.utilities?.length || 0}
          </span>
        </button>

        {/* Sub-Tab 5: Guest Star & Riders */}
        <button
          type="button"
          onClick={() => onSelectSubTab("gueststar")}
          className={`whitespace-nowrap flex items-center gap-2 py-2 px-3.5 font-semibold text-xs sm:text-sm transition-all rounded-xl cursor-pointer ${
            activeSubTab === "gueststar"
              ? "bg-purple-950/70 border border-purple-500/80 text-purple-300 ring-1 ring-purple-500/40 shadow-sm"
              : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 hover:border-zinc-700"
          }`}
        >
          <Mic className="w-4 h-4 text-purple-400 shrink-0" />
          <span>Guest Star & Riders</span>
          <span className="text-[11px] bg-zinc-800 text-purple-300 px-2 py-0.5 rounded-full ml-1 font-bold">
            {eventDetail?.guestStars?.length || 0}
          </span>
        </button>

        {/* Sub-Tab 6: Master Timeline Terpusat */}
        <button
          type="button"
          onClick={() => onSelectSubTab("timeline")}
          className={`whitespace-nowrap flex items-center gap-2 py-2 px-3.5 font-semibold text-xs sm:text-sm transition-all rounded-xl cursor-pointer ${
            activeSubTab === "timeline"
              ? "bg-indigo-950/70 border border-indigo-500/80 text-indigo-300 ring-1 ring-indigo-500/40 shadow-sm"
              : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 hover:border-zinc-700"
          }`}
        >
          <CalendarDays className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>Master Timeline Terpusat</span>
          <span className="text-[11px] bg-zinc-800 text-indigo-300 px-2 py-0.5 rounded-full ml-1 font-bold">
            {eventDetail?.timelineItems?.length || 0}
          </span>
        </button>

        {/* Sub-Tab 7: Laporan & Cetak (Sheet) */}
        <button
          type="button"
          onClick={() => onSelectSubTab("report")}
          className={`whitespace-nowrap flex items-center gap-2 py-2 px-3.5 font-semibold text-xs sm:text-sm transition-all rounded-xl cursor-pointer ${
            activeSubTab === "report"
              ? "bg-teal-950/70 border border-teal-500/80 text-teal-300 ring-1 ring-teal-500/40 shadow-sm"
              : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 hover:border-zinc-700"
          }`}
        >
          <Printer className="w-4 h-4 text-teal-400 shrink-0" />
          <span>Laporan & Cetak (Sheet)</span>
        </button>
      </div>

      {/* Info ID, Shortcut & Edit Button */}
      {eventDetail && (
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <button
            type="button"
            onClick={() => onSelectSubTab("report")}
            className="whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-2 bg-teal-950/70 hover:bg-teal-900/80 border border-teal-700/70 hover:border-teal-600 rounded-xl text-xs font-semibold text-teal-300 transition-colors cursor-pointer shadow-xs"
            title="Buka Laporan Master Sheet & Cetak Dokumen"
          >
            <Printer className="w-3.5 h-3.5 text-teal-400" />
            <span>Cetak / Salin Laporan</span>
          </button>

          <button
            onClick={onToggleEditEventInfo}
            className="whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-600 rounded-xl text-xs font-semibold text-zinc-300 transition-colors cursor-pointer shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-400" />
            <span>{isEditingEventInfo ? "Tutup Edit" : "Edit Info Acara"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

