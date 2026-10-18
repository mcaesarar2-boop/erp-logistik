"use client";

import React from "react";
import { Calendar, Plus } from "lucide-react";
import { formatRupiah } from "@/shared/lib/formatters";
import type { EventDetailData, AvailableEventSummary, BudgetingStats } from "../types";

interface EventSelectorHeaderProps {
  availableEvents: AvailableEventSummary[];
  selectedHistoryId: string;
  onSelectEvent: (id: string) => void;
  eventDetail: EventDetailData | null;
  currentSelectedSummary?: AvailableEventSummary;
  budgetingStats: BudgetingStats;
  onOpenStandaloneDialog: () => void;
}

export function EventSelectorHeader({
  availableEvents,
  selectedHistoryId,
  onSelectEvent,
  eventDetail,
  currentSelectedSummary,
  budgetingStats,
  onOpenStandaloneDialog,
}: EventSelectorHeaderProps) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
      {/* Glow accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        {/* Judul & Selector */}
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <Calendar className="w-4 h-4" />
            <span>Event Operations & Workspace</span>
            {currentSelectedSummary?.isActive && (
              <span className="flex items-center gap-1 bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] lowercase font-normal">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                on rented aktif
              </span>
            )}
            {eventDetail && !currentSelectedSummary && (
              <span className="flex items-center gap-1 bg-blue-950/80 border border-blue-700/60 text-blue-400 px-2 py-0.5 rounded-full text-[10px] lowercase font-normal">
                workspace mandiri
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <select
                value={selectedHistoryId}
                onChange={e => onSelectEvent(e.target.value)}
                className="w-full bg-zinc-950 text-zinc-100 text-sm sm:text-base font-semibold border border-zinc-700 hover:border-zinc-600 focus:border-blue-500 rounded-xl px-4 py-3 outline-none transition-all shadow-inner cursor-pointer"
              >
                {availableEvents.length === 0 && !eventDetail && (
                  <option value="">-- Tidak ada acara aktif di On Rented --</option>
                )}
                {availableEvents.map(event => (
                  <option key={event.id} value={event.id}>
                    🟢 [Aktif] {event.title} ({event.durationDays} Hari) - {formatRupiah(event.erpTotalCost)}
                  </option>
                ))}
                {eventDetail && !availableEvents.some(e => e.id === eventDetail.id) && (
                  <option value={eventDetail.id}>
                    ✨ [Mandiri] {eventDetail.eventName} ({eventDetail.durationDays} Hari)
                  </option>
                )}
              </select>
            </div>

            {/* Tombol Buat Event Mandiri */}
            <button
              type="button"
              onClick={onOpenStandaloneDialog}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-sm font-semibold transition-colors shadow-sm whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-400" />
              <span>Workspace Baru</span>
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar (Header Summary) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-zinc-400">Durasi Acara</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-zinc-100">
                {eventDetail?.durationDays || currentSelectedSummary?.durationDays || 1}
              </span>
              <span className="text-xs text-zinc-400">Hari</span>
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-zinc-400">Tagihan ERP Pusat</span>
            <div className="mt-1">
              <span className="text-lg font-black text-amber-400 truncate block">
                {formatRupiah(currentSelectedSummary?.erpTotalCost || 0)}
              </span>
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between col-span-2 sm:col-span-1">
            <span className="text-[11px] font-medium text-zinc-400">Total Pengeluaran</span>
            <div className="mt-1">
              <span className="text-lg font-black text-rose-400 truncate block">
                {formatRupiah(budgetingStats.grandTotalPengeluaran)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

