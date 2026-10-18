"use client";

import React, { useState } from "react";
import { Users, Handshake, Building2, ShieldCheck, Trash2 } from "lucide-react";
import { formatRupiah } from "@/shared/lib/formatters";
import { AddCrewDialog } from "../crew/AddCrewDialog";
import { AddSponsorDialog } from "../sponsor/AddSponsorDialog";
import { AddVendorDialog } from "../vendor/AddVendorDialog";
import { deleteEventCrew, deleteEventSponsor, updateEventSponsorStatus, deleteEventVendor } from "../../actions";
import type { EventDetailData, AvailableEventSummary, EventCrewData, EventSponsorData, EventVendorData } from "../../types";

interface EventOverviewTabProps {
  eventDetail: EventDetailData | null;
  currentSelectedSummary?: AvailableEventSummary;
  isDummyUser?: boolean;
  onShowDemoWarning?: () => void;
  onUpdateEventDetail: (updater: (prev: EventDetailData | null) => EventDetailData | null) => void;
}

export function EventOverviewTab({
  eventDetail,
  currentSelectedSummary,
  isDummyUser,
  onShowDemoWarning,
  onUpdateEventDetail,
}: EventOverviewTabProps) {
  const [isCrewDialogOpen, setIsCrewDialogOpen] = useState(false);
  const [isSponsorDialogOpen, setIsSponsorDialogOpen] = useState(false);
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);

  const handleDeleteCrew = async (crewId: string) => {
    if (isDummyUser) {
      onShowDemoWarning?.();
      return;
    }
    const res = await deleteEventCrew(crewId);
    if (res.success) {
      onUpdateEventDetail(prev => prev ? {
        ...prev,
        crews: prev.crews.filter(c => c.id !== crewId)
      } : null);
    }
  };

  const handleToggleSponsorStatus = async (sponsor: EventSponsorData) => {
    if (isDummyUser) {
      onShowDemoWarning?.();
      return;
    }
    const newStatus = sponsor.status === "CONFIRMED" ? "PENDING" : "CONFIRMED";
    const res = await updateEventSponsorStatus(sponsor.id, newStatus);
    if (res.success) {
      onUpdateEventDetail(prev => prev ? {
        ...prev,
        sponsors: prev.sponsors.map(s => s.id === sponsor.id ? { ...s, status: newStatus } : s)
      } : null);
    }
  };

  const handleDeleteSponsor = async (sponsorId: string) => {
    if (isDummyUser) {
      onShowDemoWarning?.();
      return;
    }
    const res = await deleteEventSponsor(sponsorId);
    if (res.success) {
      onUpdateEventDetail(prev => prev ? {
        ...prev,
        sponsors: prev.sponsors.filter(s => s.id !== sponsorId)
      } : null);
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (isDummyUser) {
      onShowDemoWarning?.();
      return;
    }
    const res = await deleteEventVendor(vendorId);
    if (res.success) {
      onUpdateEventDetail(prev => prev ? {
        ...prev,
        vendors: prev.vendors.filter(v => v.id !== vendorId)
      } : null);
    } else {
      alert(res.error || "Gagal menghapus vendor.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Section A: Info Dasar Acara */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs text-zinc-400 font-medium">Nama Acara</span>
          <p className="text-base font-bold text-zinc-100 mt-1 line-clamp-2">
            {eventDetail?.eventName || currentSelectedSummary?.title || "-"}
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs text-zinc-400 font-medium">Durasi Pelaksanaan</span>
          <p className="text-xl font-bold text-blue-400 mt-1">
            {eventDetail?.durationDays || currentSelectedSummary?.durationDays || 1} Hari
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs text-zinc-400 font-medium">Budget Alokasi Klien</span>
          <p className="text-xl font-bold text-emerald-400 mt-1 truncate">
            {formatRupiah(eventDetail?.clientBudget || 0)}
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs text-zinc-400 font-medium">Status Operasional</span>
          <div className="mt-1 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-sm font-semibold text-zinc-200">
              {eventDetail?.status || "ACTIVE"}
            </span>
          </div>
        </div>
      </div>

      {/* Section B: Manajemen Crew & Personil */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" /> Manajemen Kru & Pembagian Divisi
            </h3>
            <p className="text-xs text-zinc-400">
              Catat nama kru, divisi tugas, jumlah orang, dan honorarium / fee operasional.
            </p>
          </div>

          <AddCrewDialog
            isOpen={isCrewDialogOpen}
            onOpenChange={setIsCrewDialogOpen}
            eventDetailId={eventDetail?.id || ""}
            isDummyUser={isDummyUser}
            onShowDemoWarning={onShowDemoWarning}
            onCrewAdded={(newCrew) => {
              onUpdateEventDetail(prev => prev ? {
                ...prev,
                crews: [...prev.crews, newCrew]
              } : null);
            }}
          />
        </div>

        {/* Tabel Kru */}
        {eventDetail?.crews && eventDetail.crews.length > 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950/60 border-b border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Nama Kru / Tim</th>
                    <th className="py-3 px-4">Divisi</th>
                    <th className="py-3 px-4 text-center">Jumlah Orang</th>
                    <th className="py-3 px-4">Catatan Tugas</th>
                    <th className="py-3 px-4 text-right">Honor / Fee</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {eventDetail.crews.map(crew => (
                    <tr key={crew.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-zinc-100">{crew.name}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-950/70 border border-blue-800/50 text-blue-300">
                          {crew.division}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-zinc-300">
                        {crew.memberCount} Orang
                      </td>
                      <td className="py-3 px-4 text-xs text-zinc-400 italic">
                        {crew.notes || "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400">
                        {formatRupiah(crew.fee)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteCrew(crew.id)}
                          className="p-1.5 hover:bg-rose-950/80 hover:text-rose-400 text-zinc-500 rounded-md transition-colors cursor-pointer"
                          title="Hapus Kru"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-zinc-950/80 border-t border-zinc-800 text-xs font-bold">
                  <tr>
                    <td colSpan={2} className="py-3 px-4 text-zinc-400">
                      Total Kru: {eventDetail.crews.reduce((a, b) => a + b.memberCount, 0)} Orang ({eventDetail.crews.length} Divisi/Tim)
                    </td>
                    <td colSpan={2} className="py-3 px-4 text-right text-zinc-400">
                      Total Fee Kru:
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-black text-emerald-400">
                      {formatRupiah(eventDetail.crews.reduce((a, b) => a + b.fee, 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
            Belum ada kru yang ditambahkan. Klik &quot;Tambah Kru&quot; di atas untuk mencatat daftar tim.
          </div>
        )}
      </div>

      {/* Section C: Manajemen Sponsor */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Handshake className="w-5 h-5 text-amber-400" /> Manajemen Sponsor
            </h3>
            <p className="text-xs text-zinc-400">
              Daftar sponsor pendukung, bentuk dukungan (dana masuk / in-kind), serta status realisasi.
            </p>
          </div>

          <AddSponsorDialog
            isOpen={isSponsorDialogOpen}
            onOpenChange={setIsSponsorDialogOpen}
            eventDetailId={eventDetail?.id || ""}
            isDummyUser={isDummyUser}
            onShowDemoWarning={onShowDemoWarning}
            onSponsorAdded={(newSponsor) => {
              onUpdateEventDetail(prev => prev ? {
                ...prev,
                sponsors: [...prev.sponsors, newSponsor]
              } : null);
            }}
          />
        </div>

        {/* List Sponsor Cards */}
        {eventDetail?.sponsors && eventDetail.sponsors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventDetail.sponsors.map(sponsor => (
              <div
                key={sponsor.id}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700 transition-all relative group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-zinc-100 text-base line-clamp-1">{sponsor.name}</h4>
                    <button
                      onClick={() => handleToggleSponsorStatus(sponsor)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                        sponsor.status === "CONFIRMED"
                          ? "bg-emerald-950/80 border-emerald-700 text-emerald-400"
                          : "bg-amber-950/80 border-amber-700 text-amber-400"
                      }`}
                      title="Klik untuk ubah status Confirmed / Pending"
                    >
                      {sponsor.status}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                    <span className="bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-medium text-zinc-300">
                      {sponsor.supportType}
                    </span>
                    {sponsor.notes && (
                      <span className="text-[11px] text-zinc-500 truncate" title={sponsor.notes}>
                        {sponsor.notes}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3 mt-3">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block">Nominal Masuk</span>
                    <span className="text-base font-black text-emerald-400">
                      {formatRupiah(sponsor.amount)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteSponsor(sponsor.id)}
                    className="p-1.5 hover:bg-rose-950/80 hover:text-rose-400 text-zinc-500 rounded-md transition-colors cursor-pointer"
                    title="Hapus Sponsor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
            Belum ada sponsor tercatat.
          </div>
        )}
      </div>

      {/* Section D: Manajemen Vendor (Pusat & Eksternal) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" /> Daftar Vendor Terlibat
            </h3>
            <p className="text-xs text-zinc-400">
              ERP Logistik Pusat otomatis menjadi vendor utama. Tambahkan vendor eksternal jika ada pengadaan luar.
            </p>
          </div>

          <AddVendorDialog
            isOpen={isVendorDialogOpen}
            onOpenChange={setIsVendorDialogOpen}
            eventDetailId={eventDetail?.id || ""}
            isDummyUser={isDummyUser}
            onShowDemoWarning={onShowDemoWarning}
            onVendorAdded={(newVendor) => {
              onUpdateEventDetail(prev => prev ? {
                ...prev,
                vendors: [...prev.vendors, newVendor]
              } : null);
            }}
          />
        </div>

        {/* List Vendors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vendor Utama: ERP Logistik Pusat (Pinned & Highlighted) */}
          <div className="bg-gradient-to-br from-indigo-950/40 via-zinc-900/60 to-zinc-900/40 border-2 border-indigo-700/60 rounded-xl p-5 flex flex-col justify-between shadow-md relative overflow-hidden">
            <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-indigo-900/60 text-indigo-300 border border-indigo-600/50 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Vendor Utama ERP
            </div>

            <div>
              <h4 className="text-base font-black text-indigo-200 mt-1">ERP Logistik Pusat</h4>
              <p className="text-xs text-zinc-400 mt-0.5">Penyedia Peralatan & Logistik Gudang Pusat</p>
              <p className="text-xs text-zinc-500 mt-2 italic">
                Otomatis tersinkronisasi dari transaksi rental keranjang gudang.
              </p>
            </div>

            <div className="border-t border-indigo-900/50 pt-3 mt-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold">Total Biaya Sewa Gudang</span>
                <p className="text-lg font-black text-amber-400">
                  {formatRupiah(currentSelectedSummary?.erpTotalCost || 0)}
                </p>
              </div>
              <span className="text-[11px] text-indigo-400 bg-indigo-950/90 border border-indigo-800/80 px-2 py-1 rounded-md font-mono">
                Auto-Synced
              </span>
            </div>
          </div>

          {/* Vendor Eksternal Lainnya */}
          {eventDetail?.vendors && eventDetail.vendors.filter(v => !v.isErpPusat).map(vendor => (
            <div
              key={vendor.id}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-base font-bold text-zinc-100">{vendor.name}</h4>
                    <span className="inline-block mt-1 bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs font-medium">
                      {vendor.category}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteVendor(vendor.id)}
                    className="p-1.5 hover:bg-rose-950/80 hover:text-rose-400 text-zinc-500 rounded-md transition-colors cursor-pointer"
                    title="Hapus Vendor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {vendor.notes && (
                  <p className="text-xs text-zinc-400 mt-3 italic line-clamp-2">
                    {vendor.notes}
                  </p>
                )}
              </div>

              <div className="border-t border-zinc-800 pt-3 mt-4 flex items-center justify-between">
                <span className="text-xs text-zinc-400">Biaya Vendor</span>
                <span className="text-base font-bold text-zinc-100">
                  {formatRupiah(vendor.cost)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

