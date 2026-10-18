"use client";

import React, { useState } from "react";
import { Package, ShoppingBag, Trash2 } from "lucide-react";
import { formatRupiah } from "@/shared/lib/formatters";
import { ItemThumbnail } from "@/shared/components/ItemThumbnail";
import { groupItemsByPrimaryCategory } from "@/shared/lib/grouping";
import { AddManualEquipmentDialog } from "./AddManualEquipmentDialog";
import { deleteEventManualEquipment } from "../../actions";
import type { EventDetailData, AvailableEventSummary, EventManualEquipmentData } from "../../types";

interface EventEquipmentTabProps {
  eventDetail: EventDetailData | null;
  currentSelectedSummary?: AvailableEventSummary;
  items: any[];
  isDummyUser?: boolean;
  onShowDemoWarning?: () => void;
  onUpdateEventDetail: (updater: (prev: EventDetailData | null) => EventDetailData | null) => void;
}

export function EventEquipmentTab({
  eventDetail,
  currentSelectedSummary,
  items,
  isDummyUser,
  onShowDemoWarning,
  onUpdateEventDetail,
}: EventEquipmentTabProps) {
  const [isEquipDialogOpen, setIsEquipDialogOpen] = useState(false);

  const handleDeleteManualEquip = async (equipId: string) => {
    if (isDummyUser) {
      onShowDemoWarning?.();
      return;
    }
    const res = await deleteEventManualEquipment(equipId);
    if (res.success) {
      onUpdateEventDetail(prev => prev ? {
        ...prev,
        manualEquipments: prev.manualEquipments.filter(e => e.id !== equipId)
      } : null);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-150">
      {/* KATEGORI A: ALAT DARI ERP PUSAT (AUTO-SYNCED & READ-ONLY) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" /> Kategori A - Alat dari ERP Pusat
              </h3>
              <span className="bg-indigo-950/80 border border-indigo-700 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Auto-Synced (Read-Only)
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Seluruh inventaris logistik yang disewa untuk event ini, langsung tersinkron dari transaksi gudang pusat.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-zinc-400">Total Tagihan Alat ERP</span>
            <p className="text-base font-black text-amber-400">
              {formatRupiah(currentSelectedSummary?.erpTotalCost || 0)}
            </p>
          </div>
        </div>

        {currentSelectedSummary?.payload && currentSelectedSummary.payload.length > 0 ? (
          <div className="space-y-6">
            {groupItemsByPrimaryCategory(currentSelectedSummary.payload, items).map(group => (
              <div key={group.categoryName} className="space-y-3">
                {/* Header Grup Kategori */}
                <div className="flex items-center gap-2 pb-1.5 border-b border-zinc-800/80">
                  <span className="w-1.5 h-3.5 bg-indigo-500 rounded-full shrink-0" />
                  <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    {group.categoryName}
                  </h4>
                  <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.2 rounded-full">
                    {group.items.length} Barang
                  </span>
                </div>

                {/* Grid Item Gudang */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.items.map((pItem: any, idx: number) => {
                    const realItem = items.find(i => i.id === pItem.id || i.code === pItem.code);
                    const note = pItem.catatan || pItem.footnote;

                    return (
                      <div
                        key={idx}
                        className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 flex items-center gap-3 relative group"
                      >
                        {/* Thumbnail */}
                        <div className="shrink-0">
                          <ItemThumbnail
                            src={realItem?.imageUrl || pItem.imageUrl}
                            alt={pItem.name}
                            className="w-12 h-12 rounded-lg"
                            iconClassName="w-5 h-5 text-zinc-500"
                          />
                        </div>

                        {/* Detail */}
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-sm text-zinc-100 truncate" title={pItem.name}>
                            {pItem.name}
                          </h5>
                          <p className="text-[11px] font-mono text-zinc-500">{pItem.code}</p>
                          {note && (
                            <p className="text-[10px] text-zinc-400 italic truncate" title={note}>
                              {note}
                            </p>
                          )}
                        </div>

                        {/* Qty & Subtotal */}
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-900/40 px-2 py-0.5 rounded block mb-1">
                            {pItem.qty} Unit
                          </span>
                          <span className="text-[11px] text-zinc-400 font-medium">
                            {formatRupiah(pItem.price * pItem.qty)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
            Tidak ada data barang sewa dari gudang ERP untuk event ini.
          </div>
        )}
      </div>

      {/* KATEGORI B: ALAT TAMBAHAN (INPUT MANUAL DENGAN KALKULASI) */}
      <div className="space-y-4 pt-4 border-t border-zinc-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" /> Kategori B - Alat Tambahan (Input Manual)
              </h3>
              <span className="bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Non-ERP / Eksternal
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Input alat di luar gudang ERP dengan logika kalkulasi Beli (Qty × Harga) atau Sewa (Qty × Harga/Hari × Hari).
            </p>
          </div>

          <AddManualEquipmentDialog
            isOpen={isEquipDialogOpen}
            onOpenChange={setIsEquipDialogOpen}
            eventDetailId={eventDetail?.id || ""}
            isDummyUser={isDummyUser}
            onShowDemoWarning={onShowDemoWarning}
            onEquipmentAdded={(newEquip) => {
              onUpdateEventDetail(prev => prev ? {
                ...prev,
                manualEquipments: [...prev.manualEquipments, newEquip]
              } : null);
            }}
          />
        </div>

        {/* List Alat Input Manual */}
        {eventDetail?.manualEquipments && eventDetail.manualEquipments.length > 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950/60 border-b border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Nama Barang</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 text-center">Tipe</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4">Kalkulasi Biaya</th>
                    <th className="py-3 px-4 text-right">Total Biaya</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {eventDetail.manualEquipments.map(eq => (
                    <tr key={eq.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-zinc-100 block">{eq.name}</span>
                        {eq.notes && (
                          <span className="text-[11px] text-zinc-500 italic block">{eq.notes}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-zinc-400">{eq.category}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          eq.procurementType === "BELI"
                            ? "bg-emerald-950/80 border border-emerald-700 text-emerald-300"
                            : "bg-blue-950/80 border border-blue-700 text-blue-300"
                        }`}>
                          {eq.procurementType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-zinc-300">
                        {eq.quantity} Unit
                      </td>
                      <td className="py-3 px-4 text-xs text-zinc-400 font-mono">
                        {eq.procurementType === "BELI" ? (
                          <span>{eq.quantity} × {formatRupiah(eq.unitPrice)}</span>
                        ) : (
                          <span>{eq.quantity} × {formatRupiah(eq.rentalPricePerDay)}/hari × {eq.rentalDays} Hari</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-400">
                        {formatRupiah(eq.totalCost)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteManualEquip(eq.id)}
                          className="p-1.5 hover:bg-rose-950/80 hover:text-rose-400 text-zinc-500 rounded-md transition-colors cursor-pointer"
                          title="Hapus Barang Manual"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-zinc-950/80 border-t border-zinc-800 text-xs font-bold">
                  <tr>
                    <td colSpan={4} className="py-3 px-4 text-zinc-400">
                      Total Peralatan Manual: {eventDetail.manualEquipments.length} Macam Barang
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-400">
                      Akumulasi Total:
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-black text-emerald-400">
                      {formatRupiah(eventDetail.manualEquipments.reduce((a, b) => a + b.totalCost, 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
            Belum ada peralatan tambahan manual. Klik &quot;Input Alat Tambahan&quot; untuk menambah barang di luar gudang ERP.
          </div>
        )}
      </div>
    </div>
  );
}

