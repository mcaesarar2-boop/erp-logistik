"use client";

import React, { useState } from "react";
import { Mic, Plus, Trash2, CalendarDays, Users, Sparkles, Building2, Package, Clock, Music, Disc, Radio } from "lucide-react";
import { formatRupiah } from "@/shared/lib/formatters";
import { AddGuestStarDialog } from "./AddGuestStarDialog";
import { AddRiderDialog } from "./AddRiderDialog";
import { deleteEventGuestStar, deleteEventGuestStarRider } from "../../actions";
import type { EventDetailData, AvailableEventSummary, BudgetingStats, EventGuestStarData, EventGuestStarRiderData, EventTimelineItemData } from "../../types";

interface EventGuestStarTabProps {
  eventDetail: EventDetailData | null;
  currentSelectedSummary?: AvailableEventSummary;
  budgetingStats: BudgetingStats;
  isDummyUser?: boolean;
  onShowDemoWarning?: () => void;
  onOpenMasterTimeline: () => void;
  onUpdateEventDetail: (updater: (prev: EventDetailData | null) => EventDetailData | null) => void;
}

export function EventGuestStarTab({
  eventDetail,
  currentSelectedSummary,
  budgetingStats,
  isDummyUser,
  onShowDemoWarning,
  onOpenMasterTimeline,
  onUpdateEventDetail,
}: EventGuestStarTabProps) {
  const [isGuestStarDialogOpen, setIsGuestStarDialogOpen] = useState(false);
  const [isRiderDialogOpen, setIsRiderDialogOpen] = useState(false);
  const [selectedGuestStarForRider, setSelectedGuestStarForRider] = useState<EventGuestStarData | null>(null);

  const handleDeleteGuestStar = async (guestStarId: string) => {
    if (isDummyUser) {
      onShowDemoWarning?.();
      return;
    }
    const res = await deleteEventGuestStar(guestStarId);
    if (res.success) {
      onUpdateEventDetail(prev => prev ? {
        ...prev,
        guestStars: (prev.guestStars || []).filter(g => g.id !== guestStarId),
        timelineItems: (prev.timelineItems || []).filter(item => item.guestStarId !== guestStarId)
      } : null);
    }
  };

  const handleDeleteRider = async (guestStarId: string, riderId: string) => {
    if (isDummyUser) {
      onShowDemoWarning?.();
      return;
    }
    const res = await deleteEventGuestStarRider(riderId);
    if (res.success) {
      onUpdateEventDetail(prev => {
        if (!prev) return null;
        return {
          ...prev,
          guestStars: (prev.guestStars || []).map(gs => {
            if (gs.id === guestStarId) {
              return {
                ...gs,
                riders: (gs.riders || []).filter(r => r.id !== riderId)
              };
            }
            return gs;
          })
        };
      });
    }
  };

  const getGuestStarCategoryBadge = (cat: string) => {
    switch (cat) {
      case "BAND":
        return (
          <span className="bg-purple-950/80 border border-purple-700/60 text-purple-300 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap">
            <Music className="w-3.5 h-3.5 text-purple-400" /> Grup Band
          </span>
        );
      case "SOLO":
        return (
          <span className="bg-blue-950/80 border border-blue-700/60 text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap">
            <Mic className="w-3.5 h-3.5 text-blue-400" /> Penyanyi Solo
          </span>
        );
      case "DJ":
        return (
          <span className="bg-pink-950/80 border border-pink-700/60 text-pink-300 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap">
            <Disc className="w-3.5 h-3.5 text-pink-400" /> Disc Jockey (DJ)
          </span>
        );
      case "MC_HOST":
        return (
          <span className="bg-amber-950/80 border border-amber-700/60 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap">
            <Radio className="w-3.5 h-3.5 text-amber-400" /> MC / Pembawa Acara
          </span>
        );
      case "DANCE_PERFORMER":
        return (
          <span className="bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Dancer / Penari
          </span>
        );
      default:
        return (
          <span className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" /> Bintang Tamu
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Header Sub-Tab Guest Star */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-zinc-100 flex items-center gap-2">
              <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 shrink-0" /> Guest Star & Manajemen Riders
            </h3>
            <span className="bg-purple-950/80 border border-purple-700/60 text-purple-400 text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
              Artis & Performer
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Kelola daftar bintang tamu, personil/kru, honor penampilan, dan manajemen riders (alat panggung/musik & hospitality) dengan opsi integrasi langsung ke alat sewa gudang ERP.
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <div className="bg-zinc-900/80 border border-zinc-800/80 px-3.5 py-2 rounded-xl text-right shrink-0">
            <span className="text-[11px] text-zinc-400 block whitespace-nowrap">Total Anggaran Guest Star</span>
            <span className="text-base sm:text-lg font-black text-purple-400 whitespace-nowrap">
              {formatRupiah(budgetingStats.guestStarTotal)}
            </span>
          </div>

          {/* Tombol Buka Master Timeline Terpusat */}
          <button
            type="button"
            onClick={onOpenMasterTimeline}
            className="whitespace-nowrap shrink-0 inline-flex items-center gap-2 px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 hover:border-purple-500 hover:bg-zinc-800 text-zinc-200 hover:text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer"
          >
            <CalendarDays className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Master Timeline</span>
            {(eventDetail?.timelineItems || []).length > 0 && (
              <span className="px-1.5 py-0.2 bg-purple-500 text-white rounded-full text-[10px] font-bold">
                {eventDetail?.timelineItems?.length}
              </span>
            )}
          </button>

          {/* Tombol Tambah Guest Star */}
          <AddGuestStarDialog
            isOpen={isGuestStarDialogOpen}
            onOpenChange={setIsGuestStarDialogOpen}
            eventDetailId={eventDetail?.id || ""}
            durationDays={eventDetail?.durationDays || 1}
            timelineItems={eventDetail?.timelineItems || []}
            isDummyUser={isDummyUser}
            onShowDemoWarning={onShowDemoWarning}
            onGuestStarAdded={(newGs, timelineItem) => {
              onUpdateEventDetail(prev => {
                if (!prev) return null;
                const updatedTimeline = timelineItem
                  ? [...(prev.timelineItems || []), timelineItem]
                  : (prev.timelineItems || []);
                return {
                  ...prev,
                  guestStars: [...(prev.guestStars || []), newGs],
                  timelineItems: updatedTimeline,
                };
              });
            }}
          />
        </div>
      </div>

      {/* KPI Mini-Cards Sub-Tab Guest Star */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-zinc-400">Total Bintang Tamu</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-zinc-100">
              {eventDetail?.guestStars?.length || 0}
            </span>
            <span className="text-xs text-zinc-400">Performer</span>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-zinc-400">Total Personil Kru Artis</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-blue-400">
              {budgetingStats.guestStarPersonnelTotal}
            </span>
            <span className="text-xs text-zinc-400">Orang</span>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-zinc-400">Total Honorarium (Fee)</span>
          <div className="mt-1">
            <span className="text-base sm:text-lg font-black text-purple-400 truncate block">
              {formatRupiah(budgetingStats.guestStarFeeTotal)}
            </span>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-zinc-400">Riders Vendor Luar</span>
          <div className="mt-1">
            <span className="text-base sm:text-lg font-black text-amber-400 truncate block">
              {formatRupiah(budgetingStats.guestStarRidersTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* LIST GUEST STAR CARDS */}
      {(eventDetail?.guestStars || []).length > 0 ? (
        <div className="space-y-6">
          {eventDetail?.guestStars.map(gs => {
            const totalRidersCost = (gs.riders || []).reduce((acc, r) => acc + (Number(r.totalCost) || 0), 0);
            const grandTotalGs = gs.totalFee + totalRidersCost;

            return (
              <div
                key={gs.id}
                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm"
              >
                {/* Header Card Artis */}
                <div className="bg-zinc-950/80 border-b border-zinc-800 px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {getGuestStarCategoryBadge(gs.category)}
                      <h4 className="text-lg font-bold text-zinc-100">{gs.name}</h4>
                      {gs.stageTime && (
                        <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" /> {gs.stageTime}
                        </span>
                      )}
                      <span className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Users className="w-3 h-3 text-blue-400" /> {gs.personnelCount} Kru
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                      {gs.contactPerson && (
                        <span>PIC / Manajer: <strong className="text-zinc-200">{gs.contactPerson}</strong></span>
                      )}
                      <span>
                        Fee: <strong className="text-purple-300">{formatRupiah(gs.feePerDay)}/hari</strong> × {gs.durationDays} Hari = <strong className="text-purple-400">{formatRupiah(gs.totalFee)}</strong>
                      </span>
                      {gs.notes && (
                        <span className="italic text-zinc-500">({gs.notes})</span>
                      )}
                    </div>
                  </div>

                  {/* Aksi & Total Biaya Artis */}
                  <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-800/60">
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 uppercase block font-semibold">Total Biaya Artis & Riders</span>
                      <span className="text-base sm:text-lg font-black text-purple-400">
                        {formatRupiah(grandTotalGs)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGuestStarForRider(gs);
                          setIsRiderDialogOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah Riders
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteGuestStar(gs.id)}
                        className="p-1.5 hover:bg-rose-950/80 hover:text-rose-400 text-zinc-500 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Guest Star"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tabel Riders untuk Artis ini */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      Daftar Kebutuhan Riders (Technical & Hospitality)
                      <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.2 rounded-full">
                        {gs.riders?.length || 0} Item
                      </span>
                    </span>
                  </div>

                  {(gs.riders || []).length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-950/60 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80">
                          <tr>
                            <th className="py-2.5 px-4 whitespace-nowrap">Kebutuhan Riders</th>
                            <th className="py-2.5 px-4 text-center whitespace-nowrap">Tipe Riders</th>
                            <th className="py-2.5 px-4 whitespace-nowrap">Sumber Pengadaan</th>
                            <th className="py-2.5 px-4 text-center whitespace-nowrap">Jumlah</th>
                            <th className="py-2.5 px-4 whitespace-nowrap">Kalkulasi Biaya</th>
                            <th className="py-2.5 px-4 text-right whitespace-nowrap">Subtotal Biaya</th>
                            <th className="py-2.5 px-4 text-center whitespace-nowrap">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/40">
                          {gs.riders.map(rider => (
                            <tr key={rider.id} className="hover:bg-zinc-800/20 transition-colors">
                              {/* Nama & Catatan */}
                              <td className="py-3 px-4 min-w-[200px]">
                                <span className="font-semibold text-zinc-100 block">{rider.name}</span>
                                {rider.notes && (
                                  <span className="text-[11px] text-zinc-400 italic block mt-0.5">
                                    {rider.notes}
                                  </span>
                                )}
                              </td>

                              {/* Tipe Riders */}
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                                  rider.riderType === "TECHNICAL"
                                    ? "bg-indigo-950/80 border border-indigo-800 text-indigo-300"
                                    : "bg-emerald-950/80 border border-emerald-800 text-emerald-300"
                                }`}>
                                  {rider.riderType === "TECHNICAL" ? "Technical (Panggung)" : "Hospitality"}
                                </span>
                              </td>

                              {/* Sumber Pengadaan */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                {rider.sourceType === "ERP_LOGISTIK" ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded-lg">
                                    <Package className="w-3.5 h-3.5" /> Alat Sewa ERP Pusat (Tercover)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs text-amber-300 font-semibold bg-amber-950/50 border border-amber-800/50 px-2 py-0.5 rounded-lg">
                                    <Building2 className="w-3.5 h-3.5" /> Vendor Luar ({rider.procurementType})
                                  </span>
                                )}
                              </td>

                              {/* Qty & Satuan */}
                              <td className="py-3 px-4 text-center font-bold text-zinc-200 whitespace-nowrap">
                                {rider.quantity} {rider.unit || "Unit"}
                              </td>

                              {/* Kalkulasi Rincian */}
                              <td className="py-3 px-4 text-xs font-mono whitespace-nowrap">
                                {rider.sourceType === "ERP_LOGISTIK" ? (
                                  <span className="text-emerald-400/90 italic">Termasuk paket rental ERP</span>
                                ) : rider.procurementType === "BELI" ? (
                                  <span className="text-zinc-300">{rider.quantity} {rider.unit || "Unit"} × {formatRupiah(rider.unitPrice)}</span>
                                ) : (
                                  <span className="text-zinc-300">{rider.quantity} {rider.unit || "Unit"} × {formatRupiah(rider.rentalPricePerDay)}/hari × {rider.rentalDays} Hari</span>
                                )}
                              </td>

                              {/* Subtotal Biaya */}
                              <td className="py-3 px-4 text-right font-black whitespace-nowrap">
                                {rider.sourceType === "ERP_LOGISTIK" ? (
                                  <span className="text-emerald-400">Rp 0</span>
                                ) : (
                                  <span className="text-amber-400">{formatRupiah(rider.totalCost)}</span>
                                )}
                              </td>

                              {/* Aksi Hapus */}
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRider(gs.id, rider.id)}
                                  className="p-1 hover:bg-rose-950/80 hover:text-rose-400 text-zinc-500 rounded transition-colors cursor-pointer"
                                  title="Hapus Riders"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-zinc-950/60 border-t border-zinc-800/80 text-xs font-bold">
                          <tr>
                            <td colSpan={4} className="py-2 px-4 text-zinc-400 whitespace-nowrap">
                              Total {gs.riders.length} Item Riders untuk {gs.name}
                            </td>
                            <td className="py-2 px-4 text-right text-zinc-400 whitespace-nowrap">
                              Total Biaya Riders Eksternal:
                            </td>
                            <td className="py-2 px-4 text-right text-sm font-black text-amber-400 whitespace-nowrap">
                              {formatRupiah(totalRidersCost)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-zinc-950/30 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
                      Belum ada kebutuhan riders untuk {gs.name}. Klik <strong>&quot;Tambah Riders&quot;</strong> untuk memasukkan alat dari gudang ERP atau vendor eksternal.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl p-8 space-y-3">
          <Mic className="w-10 h-10 text-purple-500/60 mx-auto" />
          <h4 className="text-base font-bold text-zinc-300">Belum Ada Guest Star / Bintang Tamu</h4>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Daftarkan grup band, artis solo, DJ, atau MC yang tampil di acara ini beserta honor dan kebutuhan riders panggungnya.
          </p>
          <button
            type="button"
            onClick={() => setIsGuestStarDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition-colors mt-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Daftarkan Guest Star Pertama
          </button>
        </div>
      )}

      {/* DIALOG TAMBAH RIDERS */}
      <AddRiderDialog
        isOpen={isRiderDialogOpen}
        onOpenChange={setIsRiderDialogOpen}
        guestStar={selectedGuestStarForRider}
        currentSelectedSummary={currentSelectedSummary}
        isDummyUser={isDummyUser}
        onShowDemoWarning={onShowDemoWarning}
        onRiderAdded={(guestStarId, rider) => {
          onUpdateEventDetail(prev => {
            if (!prev) return null;
            return {
              ...prev,
              guestStars: (prev.guestStars || []).map(gs => {
                if (gs.id === guestStarId) {
                  return {
                    ...gs,
                    riders: [...(gs.riders || []), rider]
                  };
                }
                return gs;
              })
            };
          });
        }}
      />
    </div>
  );
}

