"use client";

import React from "react";
import { Item } from "@/shared/types/common";
import { formatRupiah } from "@/shared/lib/formatters";
import { useHighlightMetrics } from "../hooks/useHighlightMetrics";

export interface HighlightOverviewProps {
  items: Item[];
}

export function HighlightOverview({ items }: HighlightOverviewProps) {
  const { totalItems, availableUnits, rentedUnits, maintenanceUnits, totalValuation } = useHighlightMetrics(items);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-zinc-100">Ringkasan Sistem Logistik</h2>

      <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-xl shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 mb-1">Total Valuasi Seluruh Aset</p>
          <p className="truncate text-2xl font-bold text-blue-400 md:text-4xl">{formatRupiah(totalValuation)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-xl shadow-sm">
          <p className="text-sm font-medium text-zinc-500 mb-1">Total Jenis Aset</p>
          <p className="text-3xl font-bold text-zinc-50">{totalItems}</p>
        </div>
        <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-xl shadow-sm">
          <p className="text-sm font-medium text-zinc-500 mb-1">Total Unit Tersedia</p>
          <p className="text-3xl font-bold text-emerald-400">{availableUnits}</p>
        </div>
        <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-xl shadow-sm">
          <p className="text-sm font-medium text-zinc-500 mb-1">Total Unit Rented</p>
          <p className="text-3xl font-bold text-amber-400">{rentedUnits}</p>
        </div>
        <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-xl shadow-sm">
          <p className="text-sm font-medium text-zinc-500 mb-1">Total Unit MT</p>
          <p className="text-3xl font-bold text-red-500">{maintenanceUnits}</p>
        </div>
      </div>
    </div>
  );
}

