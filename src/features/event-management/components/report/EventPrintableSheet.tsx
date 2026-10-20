"use client";

import React from "react";
import {
  FileText,
  Users,
  DollarSign,
  Package,
  Coffee,
  Mic,
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building2,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Sparkles,
  Info,
} from "lucide-react";
import { formatRupiah, formatDateID } from "@/shared/lib/formatters";
import { groupItemsByPrimaryCategory } from "@/shared/lib/grouping";
import type {
  EventDetailData,
  AvailableEventSummary,
  BudgetingStats,
  EventReportSectionFilters,
  EventGuestStarRiderData,
} from "../../types";

export interface EventPrintableSheetProps {
  eventDetail: EventDetailData | null;
  currentSelectedSummary?: AvailableEventSummary;
  budgetingStats: BudgetingStats;
  items: any[];
  sections: EventReportSectionFilters;
}

export function EventPrintableSheet({
  eventDetail,
  currentSelectedSummary,
  budgetingStats,
  items,
  sections,
}: EventPrintableSheetProps) {
  const eventName = eventDetail?.eventName || currentSelectedSummary?.title || "Event Tanpa Judul";
  const duration = eventDetail?.durationDays || currentSelectedSummary?.durationDays || 1;
  const status = eventDetail?.status || "PLANNING";
  const printDate = formatDateID(new Date());

  // KPI operasional
  const totalCrews = (eventDetail?.crews || []).reduce((acc, c) => acc + (c.memberCount || 1), 0);
  const totalErpItems = (currentSelectedSummary?.payload || []).reduce((acc, p) => acc + (p.qty || 1), 0);
  const totalManualItems = (eventDetail?.manualEquipments || []).reduce((acc, m) => acc + (m.quantity || 1), 0);
  const totalGuestStars = eventDetail?.guestStars?.length || 0;
  const totalTimelineAgendas = eventDetail?.timelineItems?.length || 0;

  // Grouped ERP payload items
  const groupedErpItems = React.useMemo(() => {
    return groupItemsByPrimaryCategory(currentSelectedSummary?.payload || [], items);
  }, [currentSelectedSummary?.payload, items]);

  // Flattened riders for Section V
  const allGuestStarRiders = React.useMemo(() => {
    const list: { guestStarName: string; rider: EventGuestStarRiderData }[] = [];
    (eventDetail?.guestStars || []).forEach(gs => {
      (gs.riders || []).forEach(r => {
        list.push({ guestStarName: gs.name, rider: r });
      });
    });
    return list;
  }, [eventDetail?.guestStars]);

  // Sorted timeline items
  const sortedTimeline = React.useMemo(() => {
    return [...(eventDetail?.timelineItems || [])].sort((a, b) => {
      if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [eventDetail?.timelineItems]);

  const timelineDays = React.useMemo(() => {
    const set = new Set(sortedTimeline.map(i => i.dayNumber));
    return Array.from(set).sort((a, b) => a - b);
  }, [sortedTimeline]);

  return (
    <div className="event-printable-document bg-white text-zinc-900 border border-zinc-200 shadow-2xl rounded-2xl p-6 sm:p-10 max-w-5xl mx-auto font-sans leading-normal selection:bg-teal-100 selection:text-teal-900">
      {/* ========================================================
          1. KOP / HEADER DOKUMEN EKSEKUTIF
         ======================================================== */}
      <div className="border-b-2 border-zinc-900 pb-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-zinc-900 text-white">
                Master Sheet Acara
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-300">
                Status: {status}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-300">
                {duration} Hari Pelaksanaan
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 mt-2 tracking-tight">
              {eventName}
            </h1>

            {eventDetail?.notes && (
              <p className="text-xs text-zinc-600 mt-1.5 italic max-w-2xl">
                Catatan Acara: {eventDetail.notes}
              </p>
            )}
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold block">
              Tanggal Cetak Dokumen
            </span>
            <span className="text-sm font-bold text-zinc-900 font-mono">
              {printDate}
            </span>
            <div className="mt-1 text-[11px] text-zinc-500 font-mono">
              ERP-LOGISTIK MASTER REPORT
            </div>
          </div>
        </div>

        {/* Ringkasan KPI Utama (Highlights) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-zinc-200">
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block tracking-wider">
              Total Kru Lapangan
            </span>
            <span className="text-lg font-black text-zinc-900 mt-0.5 block">
              {totalCrews} <span className="text-xs font-semibold text-zinc-500">Orang</span>
            </span>
            <span className="text-[11px] text-zinc-500">
              {eventDetail?.crews?.length || 0} Divisi Operasional
            </span>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block tracking-wider">
              Total Logistik Alat
            </span>
            <span className="text-lg font-black text-zinc-900 mt-0.5 block">
              {totalErpItems + totalManualItems} <span className="text-xs font-semibold text-zinc-500">Unit</span>
            </span>
            <span className="text-[11px] text-zinc-500">
              ERP: {totalErpItems} | Manual: {totalManualItems}
            </span>
          </div>

          {sections.budgeting ? (
            <>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block tracking-wider">
                  Total Pemasukan
                </span>
                <span className="text-lg font-black text-emerald-700 mt-0.5 block truncate">
                  {formatRupiah(budgetingStats.totalPemasukan)}
                </span>
                <span className="text-[11px] text-emerald-700/80">
                  Klien + Sponsor Masuk
                </span>
              </div>

              <div className={`rounded-xl p-3 border ${
                budgetingStats.isSurplus
                  ? "bg-teal-50 border-teal-200 text-teal-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}>
                <span className="text-[10px] uppercase font-bold block tracking-wider">
                  {budgetingStats.isSurplus ? "Surplus Anggaran" : "Defisit Anggaran"}
                </span>
                <span className={`text-lg font-black mt-0.5 block truncate ${
                  budgetingStats.isSurplus ? "text-teal-700" : "text-rose-700"
                }`}>
                  {formatRupiah(budgetingStats.netBalance)}
                </span>
                <span className="text-[11px] opacity-80 block truncate">
                  Beban: {formatRupiah(budgetingStats.grandTotalPengeluaran)}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block tracking-wider">
                  Pengisi Acara (GS)
                </span>
                <span className="text-lg font-black text-zinc-900 mt-0.5 block">
                  {totalGuestStars} <span className="text-xs font-semibold text-zinc-500">Artis / MC</span>
                </span>
                <span className="text-[11px] text-zinc-500">
                  Total Bintang Tamu
                </span>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block tracking-wider">
                  Agenda Rundown
                </span>
                <span className="text-lg font-black text-zinc-900 mt-0.5 block">
                  {totalTimelineAgendas} <span className="text-xs font-semibold text-zinc-500">Agenda</span>
                </span>
                <span className="text-[11px] text-zinc-500">
                  {duration} Hari Pelaksanaan
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-10">
        {/* ========================================================
            2. BAGIAN I — OPERASIONAL (KRU, SPONSOR & VENDOR)
           ======================================================== */}
        {sections.operational && (
          <section className="page-break-inside-avoid space-y-5">
            <div className="flex items-center gap-2 border-b-2 border-zinc-800 pb-2">
              <span className="w-2 h-5 bg-blue-600 rounded-sm shrink-0" />
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wide text-zinc-900">
                Bagian I — Operasional (Kru, Sponsor & Vendor)
              </h2>
            </div>

            {/* Sub 1: Kru */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                1. Daftar Kru Operasional Lapangan ({eventDetail?.crews?.length || 0} Pos)
              </h3>
              {(eventDetail?.crews || []).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse border border-zinc-300">
                    <thead className="bg-zinc-100 text-zinc-700 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="border border-zinc-300 px-3 py-2 w-10 text-center">No</th>
                        <th className="border border-zinc-300 px-3 py-2">Divisi</th>
                        <th className="border border-zinc-300 px-3 py-2">Nama / PIC Pos</th>
                        <th className="border border-zinc-300 px-3 py-2 text-center w-24">Jumlah Kru</th>
                        {sections.budgeting && (
                          <th className="border border-zinc-300 px-3 py-2 text-right w-32">Honorarium</th>
                        )}
                        <th className="border border-zinc-300 px-3 py-2">Catatan Tugas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {eventDetail?.crews.map((crew, idx) => (
                        <tr key={crew.id} className={idx % 2 === 1 ? "bg-zinc-50" : "bg-white"}>
                          <td className="border border-zinc-300 px-3 py-1.5 text-center font-mono">{idx + 1}</td>
                          <td className="border border-zinc-300 px-3 py-1.5 font-bold text-zinc-900">{crew.division}</td>
                          <td className="border border-zinc-300 px-3 py-1.5 font-semibold text-zinc-800">{crew.name}</td>
                          <td className="border border-zinc-300 px-3 py-1.5 text-center font-bold">{crew.memberCount} Orang</td>
                          {sections.budgeting && (
                            <td className="border border-zinc-300 px-3 py-1.5 text-right font-mono font-bold text-zinc-900">
                              {formatRupiah(crew.fee)}
                            </td>
                          )}
                          <td className="border border-zinc-300 px-3 py-1.5 text-zinc-600">{crew.notes || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                    {sections.budgeting && (
                      <tfoot className="bg-zinc-100 font-bold text-zinc-900">
                        <tr>
                          <td colSpan={3} className="border border-zinc-300 px-3 py-2 text-right">
                            Total Personil & Biaya Kru:
                          </td>
                          <td className="border border-zinc-300 px-3 py-2 text-center font-black">
                            {totalCrews} Orang
                          </td>
                          <td className="border border-zinc-300 px-3 py-2 text-right font-mono font-black text-blue-700">
                            {formatRupiah(budgetingStats.crewTotal)}
                          </td>
                          <td className="border border-zinc-300 px-3 py-2"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                  Belum ada kru yang didaftarkan.
                </p>
              )}
            </div>

            {/* Sub 2: Sponsor */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                2. Daftar Sponsor & Pendanaan ({eventDetail?.sponsors?.length || 0} Sponsor)
              </h3>
              {(eventDetail?.sponsors || []).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse border border-zinc-300">
                    <thead className="bg-zinc-100 text-zinc-700 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="border border-zinc-300 px-3 py-2 w-10 text-center">No</th>
                        <th className="border border-zinc-300 px-3 py-2">Nama Sponsor</th>
                        <th className="border border-zinc-300 px-3 py-2">Bentuk Dukungan</th>
                        <th className="border border-zinc-300 px-3 py-2 text-center w-28">Status Verifikasi</th>
                        <th className="border border-zinc-300 px-3 py-2 text-right w-36">Nilai Pendanaan</th>
                        <th className="border border-zinc-300 px-3 py-2">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {eventDetail?.sponsors.map((sp, idx) => (
                        <tr key={sp.id} className={idx % 2 === 1 ? "bg-zinc-50" : "bg-white"}>
                          <td className="border border-zinc-300 px-3 py-1.5 text-center font-mono">{idx + 1}</td>
                          <td className="border border-zinc-300 px-3 py-1.5 font-bold text-zinc-900">{sp.name}</td>
                          <td className="border border-zinc-300 px-3 py-1.5 text-zinc-800">{sp.supportType}</td>
                          <td className="border border-zinc-300 px-3 py-1.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              sp.status === "CONFIRMED"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "bg-amber-100 text-amber-800 border border-amber-300"
                            }`}>
                              {sp.status === "CONFIRMED" ? "Confirmed" : "Pending"}
                            </span>
                          </td>
                          <td className="border border-zinc-300 px-3 py-1.5 text-right font-mono font-bold text-zinc-900">
                            {formatRupiah(sp.amount)}
                          </td>
                          <td className="border border-zinc-300 px-3 py-1.5 text-zinc-600">{sp.notes || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-zinc-100 font-bold text-zinc-900">
                      <tr>
                        <td colSpan={4} className="border border-zinc-300 px-3 py-2 text-right">
                          Total Sponsor Masuk (Confirmed):
                        </td>
                        <td className="border border-zinc-300 px-3 py-2 text-right font-mono font-black text-emerald-700">
                          {formatRupiah(budgetingStats.confirmedSponsorsTotal)}
                        </td>
                        <td className="border border-zinc-300 px-3 py-2 text-[10px] text-zinc-500 font-normal">
                          {budgetingStats.pendingSponsorsTotal > 0 && `(Pending: ${formatRupiah(budgetingStats.pendingSponsorsTotal)})`}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                  Belum ada data sponsor yang didaftarkan.
                </p>
              )}
            </div>

            {/* Sub 3: Vendor */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                3. Daftar Vendor Terlibat (Gudang ERP Pusat & Vendor Eksternal)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-zinc-300">
                  <thead className="bg-zinc-100 text-zinc-700 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="border border-zinc-300 px-3 py-2 w-10 text-center">No</th>
                      <th className="border border-zinc-300 px-3 py-2">Nama Vendor</th>
                      <th className="border border-zinc-300 px-3 py-2">Kategori / Ruang Lingkup</th>
                      <th className="border border-zinc-300 px-3 py-2 text-center w-36">Tipe Vendor</th>
                      {sections.budgeting && (
                        <th className="border border-zinc-300 px-3 py-2 text-right w-36">Biaya Pengadaan</th>
                      )}
                      <th className="border border-zinc-300 px-3 py-2">Catatan Operasional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {/* Row 1: ERP Pusat */}
                    <tr className="bg-indigo-50/60 font-semibold">
                      <td className="border border-zinc-300 px-3 py-2 text-center font-mono font-bold">1</td>
                      <td className="border border-zinc-300 px-3 py-2 font-black text-indigo-900">
                        ERP Logistik Pusat
                      </td>
                      <td className="border border-zinc-300 px-3 py-2 text-zinc-800">
                        Penyedia Peralatan & Logistik Gudang Utama
                      </td>
                      <td className="border border-zinc-300 px-3 py-2 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-100 text-indigo-800 border border-indigo-300">
                          Vendor Utama ERP
                        </span>
                      </td>
                      {sections.budgeting && (
                        <td className="border border-zinc-300 px-3 py-2 text-right font-mono font-black text-indigo-950">
                          {formatRupiah(budgetingStats.erpCost)}
                        </td>
                      )}
                      <td className="border border-zinc-300 px-3 py-2 text-zinc-600 text-[11px] italic">
                        Tersinkronisasi otomatis dari transaksi rental gudang pusat ({duration} Hari acara).
                      </td>
                    </tr>

                    {/* Vendor Eksternal */}
                    {(eventDetail?.vendors || []).filter(v => !v.isErpPusat).map((v, idx) => (
                      <tr key={v.id} className={idx % 2 === 1 ? "bg-zinc-50" : "bg-white"}>
                        <td className="border border-zinc-300 px-3 py-1.5 text-center font-mono">{idx + 2}</td>
                        <td className="border border-zinc-300 px-3 py-1.5 font-bold text-zinc-900">{v.name}</td>
                        <td className="border border-zinc-300 px-3 py-1.5 text-zinc-800">{v.category}</td>
                        <td className="border border-zinc-300 px-3 py-1.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-300">
                            Vendor Luar
                          </span>
                        </td>
                        {sections.budgeting && (
                          <td className="border border-zinc-300 px-3 py-1.5 text-right font-mono font-bold text-zinc-900">
                            {formatRupiah(v.cost)}
                          </td>
                        )}
                        <td className="border border-zinc-300 px-3 py-1.5 text-zinc-600">{v.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                  {sections.budgeting && (
                    <tfoot className="bg-zinc-100 font-bold text-zinc-900">
                      <tr>
                        <td colSpan={4} className="border border-zinc-300 px-3 py-2 text-right">
                          Total Beban Vendor (ERP Pusat + Eksternal):
                        </td>
                        <td className="border border-zinc-300 px-3 py-2 text-right font-mono font-black text-zinc-950">
                          {formatRupiah(budgetingStats.erpCost + budgetingStats.externalVendorTotal)}
                        </td>
                        <td className="border border-zinc-300 px-3 py-2"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================
            3. BAGIAN II — RINGKASAN KEUANGAN (BUDGETING)
           ======================================================== */}
        {sections.budgeting && (
          <section className="page-break-inside-avoid space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-zinc-800 pb-2">
              <span className="w-2 h-5 bg-emerald-600 rounded-sm shrink-0" />
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wide text-zinc-900">
                Bagian II — Ringkasan Keuangan (Budgeting)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Kolom Kiri: Pemasukan */}
              <div className="border border-zinc-300 rounded-xl overflow-hidden">
                <div className="bg-emerald-50 px-4 py-2.5 border-b border-zinc-300 flex items-center justify-between">
                  <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Sumber Pemasukan Acara
                  </h4>
                  <span className="text-xs font-mono font-black text-emerald-800">
                    {formatRupiah(budgetingStats.totalPemasukan)}
                  </span>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <tbody className="divide-y divide-zinc-200">
                    <tr>
                      <td className="px-3 py-2.5 text-zinc-700">
                        <strong className="text-zinc-900 block">Budget Alokasi Klien</strong>
                        <span className="text-[10px] text-zinc-500">Anggaran resmi penyelenggara</span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-zinc-900">
                        {formatRupiah(budgetingStats.clientBudget)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 text-zinc-700">
                        <strong className="text-zinc-900 block">Dana Sponsor (Confirmed)</strong>
                        <span className="text-[10px] text-zinc-500">
                          {eventDetail?.sponsors?.filter(s => s.status === "CONFIRMED").length || 0} Sponsor Terverifikasi
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-700">
                        {formatRupiah(budgetingStats.confirmedSponsorsTotal)}
                      </td>
                    </tr>
                    {budgetingStats.pendingSponsorsTotal > 0 && (
                      <tr className="bg-amber-50/50">
                        <td className="px-3 py-2 text-zinc-700">
                          <span className="text-amber-800 font-semibold block text-[11px]">Potensi Sponsor (Pending)</span>
                          <span className="text-[10px] text-zinc-500">Belum masuk realisasi</span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-[11px] text-amber-700 font-semibold italic">
                          +{formatRupiah(budgetingStats.pendingSponsorsTotal)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-zinc-100 font-black border-t-2 border-zinc-300">
                    <tr>
                      <td className="px-3 py-2 text-zinc-900">TOTAL PEMASUKAN REALISASI</td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-800 text-sm">
                        {formatRupiah(budgetingStats.totalPemasukan)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Kolom Kanan: Pengeluaran */}
              <div className="border border-zinc-300 rounded-xl overflow-hidden">
                <div className="bg-rose-50 px-4 py-2.5 border-b border-zinc-300 flex items-center justify-between">
                  <h4 className="text-xs font-black text-rose-900 uppercase tracking-wide flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                    Pos Pengeluaran Acara
                  </h4>
                  <span className="text-xs font-mono font-black text-rose-800">
                    {formatRupiah(budgetingStats.grandTotalPengeluaran)}
                  </span>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <tbody className="divide-y divide-zinc-200">
                    {/* Baris Ringkas ERP Pusat Sesuai Aturan */}
                    <tr className="bg-indigo-50/50">
                      <td className="px-3 py-2 text-zinc-700">
                        <strong className="text-indigo-900 block">Tagihan ERP Logistik Pusat</strong>
                        <span className="text-[10px] text-zinc-500">Sewa Alat Gudang ({duration} Hari acara)</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-black text-indigo-950">
                        {formatRupiah(budgetingStats.erpCost)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-zinc-700">
                        <strong className="text-zinc-900 block">Alat Pengadaan Manual</strong>
                        <span className="text-[10px] text-zinc-500">{eventDetail?.manualEquipments?.length || 0} Item tambahan non-ERP</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-zinc-900">
                        {formatRupiah(budgetingStats.manualEquipTotal)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-zinc-700">
                        <strong className="text-zinc-900 block">Management Utility</strong>
                        <span className="text-[10px] text-zinc-500">Konsumsi, akomodasi, transportasi, listrik, dll.</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-zinc-900">
                        {formatRupiah(budgetingStats.utilityTotal)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-zinc-700">
                        <strong className="text-zinc-900 block">Honorarium Kru Operasional</strong>
                        <span className="text-[10px] text-zinc-500">{totalCrews} Orang personil tim lapangan</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-zinc-900">
                        {formatRupiah(budgetingStats.crewTotal)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-zinc-700">
                        <strong className="text-zinc-900 block">Vendor Eksternal</strong>
                        <span className="text-[10px] text-zinc-500">Pihak ketiga luar gudang pusat</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-zinc-900">
                        {formatRupiah(budgetingStats.externalVendorTotal)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-zinc-700">
                        <strong className="text-zinc-900 block">Guest Star & Riders Luar</strong>
                        <span className="text-[10px] text-zinc-500">
                          Fee ({formatRupiah(budgetingStats.guestStarFeeTotal)}) + Riders Luar ({formatRupiah(budgetingStats.guestStarRidersTotal)})
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-zinc-900">
                        {formatRupiah(budgetingStats.guestStarTotal)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-zinc-100 font-black border-t-2 border-zinc-300">
                    <tr>
                      <td className="px-3 py-2 text-zinc-900">GRAND TOTAL PENGELUARAN</td>
                      <td className="px-3 py-2 text-right font-mono text-rose-800 text-sm">
                        {formatRupiah(budgetingStats.grandTotalPengeluaran)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Kotak Neraca Akhir */}
            <div className={`p-4 rounded-xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              budgetingStats.isSurplus
                ? "bg-teal-50 border-teal-500 text-teal-950"
                : "bg-rose-50 border-rose-500 text-rose-950"
            }`}>
              <div>
                <span className="text-xs font-black uppercase tracking-wider block">
                  Status Neraca Anggaran: {budgetingStats.isSurplus ? "Surplus Keuangan" : "Defisit Keuangan"}
                </span>
                <p className="text-xs text-zinc-700 mt-0.5">
                  {budgetingStats.isSurplus
                    ? "Alokasi anggaran mencukupi seluruh kebutuhan operasional acara dengan sisa saldo positif."
                    : "Peringatan: Total pengeluaran melebihi pemasukan yang terkonfirmasi. Perlu penyesuaian biaya!"}
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-zinc-600 block">
                  Saldo Bersih (Net Margin)
                </span>
                <span className={`text-xl font-black font-mono ${
                  budgetingStats.isSurplus ? "text-teal-700" : "text-rose-700"
                }`}>
                  {formatRupiah(budgetingStats.netBalance)}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================
            4. BAGIAN III — DAFTAR PERLENGKAPAN (EQUIPMENT)
           ======================================================== */}
        {sections.equipment && (
          <section className="page-break-inside-avoid space-y-6">
            <div className="flex items-center gap-2 border-b-2 border-zinc-800 pb-2">
              <span className="w-2 h-5 bg-cyan-600 rounded-sm shrink-0" />
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wide text-zinc-900">
                Bagian III — Daftar Perlengkapan (Equipment)
              </h2>
            </div>

            {/* Sub-A: Gudang ERP Pusat (Grouped by Category index 0) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-1.5">
                <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-indigo-600" />
                  Sub-bagian A: Alat Gudang ERP Pusat (Auto-Synced & Read-Only)
                </h3>
                <span className="text-xs font-mono font-bold text-zinc-700">
                  Total: {totalErpItems} Unit
                </span>
              </div>

              {groupedErpItems.length > 0 ? (
                groupedErpItems.map(group => (
                  <div key={group.categoryName} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                      <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wide">
                        Kategori: {group.categoryName} ({group.items.length} Barang)
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse border border-zinc-300">
                        <thead className="bg-zinc-100 text-zinc-700 uppercase text-[10px] font-bold">
                          <tr>
                            <th className="border border-zinc-300 px-3 py-1.5 w-10 text-center">No</th>
                            <th className="border border-zinc-300 px-3 py-1.5 w-28">Kode Barang</th>
                            <th className="border border-zinc-300 px-3 py-1.5">Nama Peralatan Logistik</th>
                            <th className="border border-zinc-300 px-3 py-1.5 text-center w-24">Jumlah</th>
                            <th className="border border-zinc-300 px-3 py-1.5">Catatan / Footnote</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {group.items.map((pItem: any, idx: number) => {
                            const note = pItem.catatan || pItem.footnote || "-";
                            return (
                              <tr key={idx} className={idx % 2 === 1 ? "bg-zinc-50" : "bg-white"}>
                                <td className="border border-zinc-300 px-3 py-1 text-center font-mono">{idx + 1}</td>
                                <td className="border border-zinc-300 px-3 py-1 font-mono text-zinc-700 text-[11px]">{pItem.code}</td>
                                <td className="border border-zinc-300 px-3 py-1 font-bold text-zinc-900">{pItem.name}</td>
                                <td className="border border-zinc-300 px-3 py-1 text-center font-bold text-zinc-900">{pItem.qty} Unit</td>
                                <td className="border border-zinc-300 px-3 py-1 text-zinc-600 italic text-[11px]">{note}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-500 italic p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                  Tidak ada peralatan logistik dari gudang ERP pusat yang disewa untuk event ini.
                </p>
              )}
            </div>

            {/* Sub-B: Pengadaan Manual */}
            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-1.5">
                <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                  Sub-bagian B: Alat Pengadaan Manual (Non-ERP / Eksternal)
                </h3>
                <span className="text-xs font-mono font-bold text-zinc-700">
                  Total: {totalManualItems} Unit
                </span>
              </div>

              {(eventDetail?.manualEquipments || []).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse border border-zinc-300">
                    <thead className="bg-zinc-100 text-zinc-700 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="border border-zinc-300 px-3 py-2 w-10 text-center">No</th>
                        <th className="border border-zinc-300 px-3 py-2">Nama Alat</th>
                        <th className="border border-zinc-300 px-3 py-2">Kategori</th>
                        <th className="border border-zinc-300 px-3 py-2 text-center w-20">Tipe</th>
                        <th className="border border-zinc-300 px-3 py-2 text-center w-20">Jumlah</th>
                        <th className="border border-zinc-300 px-3 py-2 text-center w-20">Durasi</th>
                        <th className="border border-zinc-300 px-3 py-2 text-right w-28">Harga Satuan</th>
                        <th className="border border-zinc-300 px-3 py-2 text-right w-32">Total Biaya</th>
                        <th className="border border-zinc-300 px-3 py-2">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {eventDetail?.manualEquipments.map((m, idx) => {
                        const unitPriceStr = m.procurementType === "BELI"
                          ? formatRupiah(m.unitPrice)
                          : `${formatRupiah(m.rentalPricePerDay)}/hari`;
                        const durStr = m.procurementType === "SEWA" ? `${m.rentalDays} Hari` : "-";

                        return (
                          <tr key={m.id} className={idx % 2 === 1 ? "bg-zinc-50" : "bg-white"}>
                            <td className="border border-zinc-300 px-3 py-1.5 text-center font-mono">{idx + 1}</td>
                            <td className="border border-zinc-300 px-3 py-1.5 font-bold text-zinc-900">{m.name}</td>
                            <td className="border border-zinc-300 px-3 py-1.5 text-zinc-700">{m.category}</td>
                            <td className="border border-zinc-300 px-3 py-1.5 text-center">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                m.procurementType === "BELI"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}>
                                {m.procurementType}
                              </span>
                            </td>
                            <td className="border border-zinc-300 px-3 py-1.5 text-center font-bold">{m.quantity} Unit</td>
                            <td className="border border-zinc-300 px-3 py-1.5 text-center text-zinc-600">{durStr}</td>
                            <td className="border border-zinc-300 px-3 py-1.5 text-right font-mono text-zinc-800">{unitPriceStr}</td>
                            <td className="border border-zinc-300 px-3 py-1.5 text-right font-mono font-bold text-zinc-900">
                              {formatRupiah(m.totalCost)}
                            </td>
                            <td className="border border-zinc-300 px-3 py-1.5 text-zinc-600">{m.notes || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-zinc-100 font-bold text-zinc-900">
                      <tr>
                        <td colSpan={7} className="border border-zinc-300 px-3 py-2 text-right">
                          Total Biaya Alat Manual:
                        </td>
                        <td className="border border-zinc-300 px-3 py-2 text-right font-mono font-black text-emerald-800">
                          {formatRupiah(budgetingStats.manualEquipTotal)}
                        </td>
                        <td className="border border-zinc-300 px-3 py-2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                  Tidak ada peralatan manual tambahan yang diinput.
                </p>
              )}
            </div>
          </section>
        )}

        {/* ========================================================
            5. BAGIAN IV — MANAGEMENT UTILITY
           ======================================================== */}
        {sections.utility && (
          <section className="page-break-inside-avoid space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-zinc-800 pb-2">
              <span className="w-2 h-5 bg-amber-600 rounded-sm shrink-0" />
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wide text-zinc-900">
                Bagian IV — Management Utility & Operasional
              </h2>
            </div>

            {(eventDetail?.utilities || []).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-zinc-300">
                  <thead className="bg-zinc-100 text-zinc-700 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="border border-zinc-300 px-3 py-2 w-10 text-center">No</th>
                      <th className="border border-zinc-300 px-3 py-2">Kebutuhan Utility</th>
                      <th className="border border-zinc-300 px-3 py-2">Kategori</th>
                      <th className="border border-zinc-300 px-3 py-2 text-center w-20">Tipe</th>
                      <th className="border border-zinc-300 px-3 py-2 text-center w-24">Jumlah</th>
                      <th className="border border-zinc-300 px-3 py-2 text-center w-20">Durasi</th>
                      <th className="border border-zinc-300 px-3 py-2 text-right w-28">Harga Satuan</th>
                      <th className="border border-zinc-300 px-3 py-2 text-right w-32">Total Biaya</th>
                      <th className="border border-zinc-300 px-3 py-2">Catatan Operasional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {eventDetail?.utilities.map((u, idx) => {
                      const unitPriceStr = u.procurementType === "BELI"
                        ? formatRupiah(u.unitPrice)
                        : `${formatRupiah(u.rentalPricePerDay)}/hari`;
                      const durStr = u.procurementType === "SEWA" ? `${u.rentalDays} Hari` : "-";

                      return (
                        <tr key={u.id} className={idx % 2 === 1 ? "bg-zinc-50" : "bg-white"}>
                          <td className="border border-zinc-300 px-3 py-1.5 text-center font-mono">{idx + 1}</td>
                          <td className="border border-zinc-300 px-3 py-1.5 font-bold text-zinc-900">{u.name}</td>
                          <td className="border border-zinc-300 px-3 py-1.5 text-zinc-700">{u.category}</td>
                          <td className="border border-zinc-300 px-3 py-1.5 text-center">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                              {u.procurementType}
                            </span>
                          </td>
                          <td className="border border-zinc-300 px-3 py-1.5 text-center font-bold">
                            {u.quantity} {u.unit || "Unit"}
                          </td>
                          <td className="border border-zinc-300 px-3 py-1.5 text-center text-zinc-600">{durStr}</td>
                          <td className="border border-zinc-300 px-3 py-1.5 text-right font-mono text-zinc-800">{unitPriceStr}</td>
                          <td className="border border-zinc-300 px-3 py-1.5 text-right font-mono font-bold text-zinc-900">
                            {formatRupiah(u.totalCost)}
                          </td>
                          <td className="border border-zinc-300 px-3 py-1.5 text-zinc-600">{u.notes || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-zinc-100 font-bold text-zinc-900">
                    <tr>
                      <td colSpan={7} className="border border-zinc-300 px-3 py-2 text-right">
                        Total Biaya Management Utility:
                      </td>
                      <td className="border border-zinc-300 px-3 py-2 text-right font-mono font-black text-amber-800">
                        {formatRupiah(budgetingStats.utilityTotal)}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                Belum ada kebutuhan utility operasional yang dicatat.
              </p>
            )}
          </section>
        )}

        {/* ========================================================
            6. BAGIAN V — GUEST STAR & RIDERS
           ======================================================== */}
        {sections.guestStars && (
          <section className="page-break-inside-avoid space-y-5">
            <div className="flex items-center gap-2 border-b-2 border-zinc-800 pb-2">
              <span className="w-2 h-5 bg-purple-600 rounded-sm shrink-0" />
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wide text-zinc-900">
                Bagian V — Guest Star & Riders
              </h2>
            </div>

            {/* Sub 1: Bintang Tamu */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-purple-600" />
                1. Daftar Pengisi Acara / Guest Star ({eventDetail?.guestStars?.length || 0} Artis)
              </h3>
              {(eventDetail?.guestStars || []).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse border border-zinc-300">
                    <thead className="bg-zinc-100 text-zinc-700 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="border border-zinc-300 px-3 py-2 w-10 text-center">No</th>
                        <th className="border border-zinc-300 px-3 py-2">Nama Artis / Grup</th>
                        <th className="border border-zinc-300 px-3 py-2">Kategori</th>
                        <th className="border border-zinc-300 px-3 py-2 text-center w-24">Jumlah Kru</th>
                        <th className="border border-zinc-300 px-3 py-2 text-center">Jadwal Tampil</th>
                        <th className="border border-zinc-300 px-3 py-2">Kontak PIC / Manajer</th>
                        <th className="border border-zinc-300 px-3 py-2 text-right w-36">Honorarium (Fee)</th>
                        <th className="border border-zinc-300 px-3 py-2">Catatan Khusus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {eventDetail?.guestStars.map((gs, idx) => {
                        const sched = gs.stageTime ? `Hari ke-${gs.dayNumber || 1} (${gs.stageTime})` : `Hari ke-${gs.dayNumber || 1}`;
                        return (
                          <tr key={gs.id} className={idx % 2 === 1 ? "bg-zinc-50" : "bg-white"}>
                            <td className="border border-zinc-300 px-3 py-1.5 text-center font-mono">{idx + 1}</td>
                            <td className="border border-zinc-300 px-3 py-1.5 font-black text-purple-950">{gs.name}</td>
                            <td className="border border-zinc-300 px-3 py-1.5 text-zinc-700">{gs.category}</td>
                            <td className="border border-zinc-300 px-3 py-1.5 text-center font-bold">{gs.personnelCount} Orang</td>
                            <td className="border border-zinc-300 px-3 py-1.5 text-center font-semibold text-zinc-800">{sched}</td>
                            <td className="border border-zinc-300 px-3 py-1.5 text-zinc-700">{gs.contactPerson || "-"}</td>
                            <td className="border border-zinc-300 px-3 py-1.5 text-right font-mono font-bold text-zinc-900">
                              {formatRupiah(gs.totalFee)}
                            </td>
                            <td className="border border-zinc-300 px-3 py-1.5 text-zinc-600">{gs.notes || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-zinc-100 font-bold text-zinc-900">
                      <tr>
                        <td colSpan={6} className="border border-zinc-300 px-3 py-2 text-right">
                          Total Honorarium Artis:
                        </td>
                        <td className="border border-zinc-300 px-3 py-2 text-right font-mono font-black text-purple-800">
                          {formatRupiah(budgetingStats.guestStarFeeTotal)}
                        </td>
                        <td className="border border-zinc-300 px-3 py-2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                  Belum ada guest star yang didaftarkan.
                </p>
              )}
            </div>

            {/* Sub 2: Riders */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                2. Daftar Riders Teknis & Hospitality ({allGuestStarRiders.length} Kebutuhan)
              </h3>
              {allGuestStarRiders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse border border-zinc-300">
                    <thead className="bg-zinc-100 text-zinc-700 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="border border-zinc-300 px-3 py-2 w-10 text-center">No</th>
                        <th className="border border-zinc-300 px-3 py-2">Nama Artis</th>
                        <th className="border border-zinc-300 px-3 py-2">Kebutuhan Riders</th>
                        <th className="border border-zinc-300 px-3 py-2 text-center w-28">Tipe Riders</th>
                        <th className="border border-zinc-300 px-3 py-2">Sumber Pengadaan</th>
                        <th className="border border-zinc-300 px-3 py-2 text-center w-24">Jumlah</th>
                        <th className="border border-zinc-300 px-3 py-2 text-right w-32">Subtotal Biaya</th>
                        <th className="border border-zinc-300 px-3 py-2">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {allGuestStarRiders.map((item, idx) => {
                        const r = item.rider;
                        const sourceBadge = r.sourceType === "ERP_LOGISTIK"
                          ? "Gudang ERP (Tercover)"
                          : `Vendor Luar (${r.procurementType})`;
                        const costStr = r.sourceType === "ERP_LOGISTIK" ? "Rp 0 (Paket ERP)" : formatRupiah(r.totalCost);

                        return (
                          <tr key={r.id} className={idx % 2 === 1 ? "bg-zinc-50" : "bg-white"}>
                            <td className="border border-zinc-300 px-3 py-1.5 text-center font-mono">{idx + 1}</td>
                            <td className="border border-zinc-300 px-3 py-1.5 font-bold text-purple-950">{item.guestStarName}</td>
                            <td className="border border-zinc-300 px-3 py-1.5 font-semibold text-zinc-900">{r.name}</td>
                            <td className="border border-zinc-300 px-3 py-1.5 text-center">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                r.riderType === "TECHNICAL"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}>
                                {r.riderType === "TECHNICAL" ? "Teknis" : "Hospitality"}
                              </span>
                            </td>
                            <td className="border border-zinc-300 px-3 py-1.5 text-zinc-800">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                r.sourceType === "ERP_LOGISTIK"
                                  ? "bg-teal-100 text-teal-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}>
                                {sourceBadge}
                              </span>
                            </td>
                            <td className="border border-zinc-300 px-3 py-1.5 text-center font-bold">
                              {r.quantity} {r.unit || "Unit"}
                            </td>
                            <td className="border border-zinc-300 px-3 py-1.5 text-right font-mono font-bold text-zinc-900">
                              {costStr}
                            </td>
                            <td className="border border-zinc-300 px-3 py-1.5 text-zinc-600">{r.notes || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-zinc-100 font-bold text-zinc-900">
                      <tr>
                        <td colSpan={6} className="border border-zinc-300 px-3 py-2 text-right">
                          Total Beban Riders Vendor Luar:
                        </td>
                        <td className="border border-zinc-300 px-3 py-2 text-right font-mono font-black text-amber-800">
                          {formatRupiah(budgetingStats.guestStarRidersTotal)}
                        </td>
                        <td className="border border-zinc-300 px-3 py-2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                  Belum ada riders yang dicatat.
                </p>
              )}
            </div>
          </section>
        )}

        {/* ========================================================
            7. BAGIAN VI — MASTER TIMELINE / RUNDOWN ACARA
           ======================================================== */}
        {sections.timeline && (
          <section className="page-break-inside-avoid space-y-5">
            <div className="flex items-center gap-2 border-b-2 border-zinc-800 pb-2">
              <span className="w-2 h-5 bg-indigo-600 rounded-sm shrink-0" />
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wide text-zinc-900">
                Bagian VI — Master Timeline / Rundown Acara
              </h2>
            </div>

            {sortedTimeline.length > 0 ? (
              timelineDays.map(day => {
                const dayItems = sortedTimeline.filter(i => i.dayNumber === day);
                return (
                  <div key={day} className="space-y-2">
                    <div className="flex items-center gap-2 bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-300">
                      <CalendarDays className="w-4 h-4 text-indigo-700" />
                      <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wide">
                        Rundown Hari ke-{day} ({dayItems.length} Agenda Terjadwal)
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse border border-zinc-300">
                        <thead className="bg-zinc-100 text-zinc-700 uppercase text-[10px] font-bold">
                          <tr>
                            <th className="border border-zinc-300 px-3 py-2 w-36 text-center">Waktu (WIB)</th>
                            <th className="border border-zinc-300 px-3 py-2">Nama Agenda / Aktivitas</th>
                            <th className="border border-zinc-300 px-3 py-2 w-28 text-center">Kategori</th>
                            <th className="border border-zinc-300 px-3 py-2 w-32">Lokasi / Panggung</th>
                            <th className="border border-zinc-300 px-3 py-2 w-36">PIC / Pengisi Acara</th>
                            <th className="border border-zinc-300 px-3 py-2">Catatan Operasional</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {dayItems.map((item, idx) => {
                            let picText = "-";
                            if (item.guestStarId) {
                              const matchedGs = (eventDetail?.guestStars || []).find(g => g.id === item.guestStarId);
                              picText = matchedGs ? `⭐ ${matchedGs.name}` : "Guest Star";
                            }

                            return (
                              <tr key={item.id} className={idx % 2 === 1 ? "bg-zinc-50" : "bg-white"}>
                                <td className="border border-zinc-300 px-3 py-1.5 text-center font-mono font-bold text-zinc-900 whitespace-nowrap">
                                  {item.startTime} - {item.endTime}
                                </td>
                                <td className="border border-zinc-300 px-3 py-1.5 font-black text-zinc-900">
                                  {item.title}
                                </td>
                                <td className="border border-zinc-300 px-3 py-1.5 text-center">
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-300">
                                    {item.category}
                                  </span>
                                </td>
                                <td className="border border-zinc-300 px-3 py-1.5 text-zinc-700">
                                  {item.stageLocation || "-"}
                                </td>
                                <td className="border border-zinc-300 px-3 py-1.5 font-medium text-zinc-900">
                                  {picText}
                                </td>
                                <td className="border border-zinc-300 px-3 py-1.5 text-zinc-600">
                                  {item.notes || "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-zinc-500 italic p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                Belum ada rundown agenda yang dibuat.
              </p>
            )}
          </section>
        )}

        {/* ========================================================
            TANDA TANGAN / PENGESAHAN EKSEKUTIF (SIGN-OFF BLOCK)
           ======================================================== */}
        <div className="page-break-inside-avoid pt-8 border-t-2 border-zinc-800 mt-10">
          <div className="grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              <span className="text-[11px] font-semibold text-zinc-500 block uppercase">Dibuat & Disiapkan Oleh,</span>
              <span className="text-xs font-bold text-zinc-800 mt-0.5 block">Koordinator Logistik / Event</span>
              <div className="h-16 flex items-end justify-center">
                <div className="w-36 border-b border-zinc-400" />
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 block">Nama & Tanda Tangan</span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-zinc-500 block uppercase">Diverifikasi Keuangan,</span>
              <span className="text-xs font-bold text-zinc-800 mt-0.5 block">Bendahara / Finance Lead</span>
              <div className="h-16 flex items-end justify-center">
                <div className="w-36 border-b border-zinc-400" />
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 block">Nama & Tanda Tangan</span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-zinc-500 block uppercase">Disetujui Oleh,</span>
              <span className="text-xs font-bold text-zinc-800 mt-0.5 block">Penanggung Jawab / Klien</span>
              <div className="h-16 flex items-end justify-center">
                <div className="w-36 border-b border-zinc-400" />
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 block">Nama & Tanda Tangan</span>
            </div>
          </div>

          <div className="text-center text-[10px] text-zinc-400 mt-6 pt-3 border-t border-zinc-200">
            Dokumen ini dicetak secara otomatis dari ERP Logistik Pro - Sistem Manajemen Logistik & Operasional Acara Terintegrasi.
          </div>
        </div>
      </div>
    </div>
  );
}

