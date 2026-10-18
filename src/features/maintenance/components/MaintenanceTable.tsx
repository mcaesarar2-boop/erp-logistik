"use client";

import React, { useState, useMemo } from "react";
import { MaintenanceItem } from "../types";
import { ItemThumbnail } from "@/shared/components/ItemThumbnail";
import { formatRupiah } from "@/shared/lib/formatters";
import { completeMaintenanceItem } from "../actions/maintenanceActions";
import { useAuthPermission } from "@/shared/hooks/useAuthPermission";
import { DemoRestrictionDialog } from "@/shared/components/DemoRestrictionDialog";
import { DEMO_MESSAGES } from "@/shared/constants/permissions";
import { Wrench, CheckCircle2, Search, Loader2 } from "lucide-react";

export interface MaintenanceTableProps {
  items: MaintenanceItem[];
  categories?: { id: string; name: string }[];
}

export function MaintenanceTable({ items, categories = [] }: MaintenanceTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { isDummyUser, showDemoWarning, setShowDemoWarning, canMutate } = useAuthPermission();

  // Filter items in maintenance
  const maintenanceItems = useMemo(() => {
    return items.filter((item) => item.maintenanceQuantity > 0);
  }, [items]);

  // Filter based on search and category
  const filteredItems = useMemo(() => {
    return maintenanceItems.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categories?.some((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        selectedCategory === "ALL" ||
        item.categories?.some((c) => c.id === selectedCategory);

      return matchSearch && matchCategory;
    });
  }, [maintenanceItems, searchQuery, selectedCategory]);

  const totalMtUnits = useMemo(() => {
    return maintenanceItems.reduce((acc, item) => acc + item.maintenanceQuantity, 0);
  }, [maintenanceItems]);

  const totalMtValuation = useMemo(() => {
    return maintenanceItems.reduce(
      (acc, item) => acc + item.maintenanceQuantity * (item.price || 0),
      0
    );
  }, [maintenanceItems]);

  const handleComplete = async (item: MaintenanceItem) => {
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }

    if (!confirm(`Selesaikan pemeliharaan untuk ${item.name} (${item.maintenanceQuantity} unit akan dikembalikan ke stok tersedia)?`)) {
      return;
    }

    try {
      setProcessingId(item.id);
      setErrorMsg(null);
      const res = await completeMaintenanceItem(item.id);
      if (!res.success) {
        setErrorMsg(res.error || "Gagal menyelesaikan pemeliharaan.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan sistem.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-red-400" />
            Barang Dalam Pemeliharaan
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Total {maintenanceItems.length} jenis aset ({totalMtUnits} unit) senilai{" "}
            <span className="text-red-400 font-semibold">{formatRupiah(totalMtValuation)}</span>
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3 bg-zinc-900/50 p-2 px-3 rounded-lg border border-zinc-800 shadow-sm flex-wrap w-full sm:w-auto">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Cari nama atau kode..."
            className="bg-transparent border-none outline-none text-sm text-zinc-100 placeholder:text-zinc-600 w-32 focus:w-48 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {categories.length > 0 && (
            <>
              <div className="w-px h-4 bg-zinc-700 mx-1"></div>
              <select
                className="bg-zinc-950 text-zinc-100 text-sm border border-zinc-700 rounded-md outline-none cursor-pointer p-1.5 max-w-[140px] truncate"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">-- Semua Label --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-950/50 border border-red-900 text-red-400 text-sm p-3 rounded-md flex items-center gap-2">
          <span className="font-bold">Error:</span> {errorMsg}
        </div>
      )}

      {filteredItems.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 bg-zinc-900/20 rounded-xl border border-zinc-800">
          <Wrench className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
          {maintenanceItems.length === 0
            ? "Tidak ada barang yang sedang dalam pemeliharaan."
            : "Tidak ada barang pemeliharaan yang sesuai filter."}
        </div>
      ) : (
        <div className="overflow-x-auto bg-zinc-900/30 border border-zinc-800 rounded-xl">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-900/70 border-b border-zinc-800 text-xs text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Barang</th>
                <th className="py-3 px-4">Kode</th>
                <th className="py-3 px-4">Label</th>
                <th className="py-3 px-4 text-center">Unit MT</th>
                <th className="py-3 px-4 text-right">Valuasi MT</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-850/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <ItemThumbnail
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-10 h-10 rounded-md shrink-0"
                        iconClassName="w-5 h-5 text-zinc-500"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-zinc-100 truncate">{item.name}</p>
                        <p className="text-xs text-zinc-500 truncate max-w-xs">{item.description || "-"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-zinc-400">{item.code}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {item.categories && item.categories.length > 0 ? (
                        item.categories.map((c) => (
                          <span
                            key={c.id}
                            className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full"
                          >
                            {c.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-zinc-600">-</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="bg-red-950/80 border border-red-800/60 text-red-400 text-xs font-bold px-2.5 py-1 rounded-full">
                      {item.maintenanceQuantity} Unit
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-zinc-200">
                    {formatRupiah(item.maintenanceQuantity * (item.price || 0))}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleComplete(item)}
                      disabled={processingId === item.id || !canMutate}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-400 text-xs font-semibold rounded-md transition-colors disabled:opacity-50 shadow-sm"
                      title="Kembalikan semua unit MT ke stok tersedia"
                    >
                      {processingId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      Selesai
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DemoRestrictionDialog
        isOpen={showDemoWarning}
        onClose={() => setShowDemoWarning(false)}
        title={DEMO_MESSAGES.maintenance.title}
        message="Akun yang sedang digunakan adalah akun demo dan bersifat read-only. Penyelesaian pemeliharaan aset dinonaktifkan pada akun ini."
      />
    </div>
  );
}

