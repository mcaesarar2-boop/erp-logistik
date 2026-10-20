"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Copy,
  Table,
  Printer,
  CheckCircle2,
  Filter,
  CheckSquare,
  Square,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { EventPrintableSheet } from "./EventPrintableSheet";
import {
  generateEventMarkdown,
  generateEventTSV,
} from "../../lib/eventReportGenerators";
import type {
  EventDetailData,
  AvailableEventSummary,
  BudgetingStats,
  EventReportSectionFilters,
} from "../../types";

export interface EventReportSubTabProps {
  eventDetail: EventDetailData | null;
  currentSelectedSummary?: AvailableEventSummary;
  budgetingStats: BudgetingStats;
  items: any[];
}

export function EventReportSubTab({
  eventDetail,
  currentSelectedSummary,
  budgetingStats,
  items,
}: EventReportSubTabProps) {
  // 6 Section Visibility Filters (default all checked: true)
  const [sections, setSections] = useState<EventReportSectionFilters>({
    operational: true,
    budgeting: true,
    equipment: true,
    utility: true,
    guestStars: true,
    timeline: true,
  });

  // Toast feedback state
  const [toast, setToast] = useState<{ title: string; description?: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const toggleSection = (key: keyof EventReportSectionFilters) => {
    setSections(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectAll = (selectAll: boolean) => {
    setSections({
      operational: selectAll,
      budgeting: selectAll,
      equipment: selectAll,
      utility: selectAll,
      guestStars: selectAll,
      timeline: selectAll,
    });
  };

  // Safe clipboard copier
  const copyText = async (text: string): Promise<boolean> => {
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn("navigator.clipboard failed, attempting fallback:", err);
      }
    }
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textArea);
      return success;
    } catch (err) {
      console.error("Copy to clipboard fallback failed:", err);
      return false;
    }
  };

  // 1. Copy Markdown
  const handleCopyMarkdown = async () => {
    const md = generateEventMarkdown({
      eventDetail,
      currentSelectedSummary,
      budgetingStats,
      items,
      sections,
    });

    const success = await copyText(md);
    if (success) {
      setToast({
        title: "Laporan Markdown berhasil disalin!",
        description: "Format Markdown rapi siap dipaste ke grup WhatsApp, Discord, atau catatan rapat.",
      });
    }
  };

  // 2. Copy TSV (Excel / Sheet)
  const handleCopyTSV = async () => {
    const tsv = generateEventTSV({
      eventDetail,
      currentSelectedSummary,
      budgetingStats,
      items,
      sections,
    });

    const success = await copyText(tsv);
    if (success) {
      setToast({
        title: "Format Tabel (TSV) berhasil disalin!",
        description: "Kolom & baris terpisah rapi. Langsung tekan Ctrl+V di Microsoft Excel atau Google Sheets.",
      });
    }
  };

  // 3. Print / PDF
  const handlePrint = () => {
    window.print();
  };

  const allSelected = Object.values(sections).every(Boolean);

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* ========================================================
          ISOLATED PRINT STYLES
         ======================================================== */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 8mm 10mm 10mm 10mm;
            }
            html, body {
              background: #ffffff !important;
              color: #0f172a !important;
              font-size: 10pt !important;
              height: auto !important;
              overflow: visible !important;
            }
            /* Hide application shell elements */
            header, nav, aside, footer, [role="navigation"], .print\\:hidden {
              display: none !important;
            }
            /* Reset printable container */
            .event-printable-document {
              background: #ffffff !important;
              color: #0f172a !important;
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              max-width: 100% !important;
              width: 100% !important;
            }
            .page-break-inside-avoid {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
          }
        `,
      }} />

      {/* ========================================================
          TOOLBAR CONTROL BAR (print:hidden)
         ======================================================== */}
      <div className="print:hidden bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
        {/* Header Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-950/80 border border-teal-700/60 text-teal-400">
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
                  Laporan & Lembar Kerja Eksekutif (Master Sheet)
                </h3>
                <p className="text-xs text-zinc-400">
                  Kustomisasi bagian laporan yang ingin ditampilkan, disalin ke WhatsApp/Excel, atau dicetak ke PDF/kertas.
                </p>
              </div>
            </div>
          </div>

          {/* 3 Tombol Aksi Utama */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tombol 1: Salin Markdown */}
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer active:scale-95"
              title="Salin laporan dalam format Markdown untuk WhatsApp atau Discord"
            >
              <Copy className="w-4 h-4 text-emerald-400" />
              <span>Salin Markdown (WA / Grup)</span>
            </button>

            {/* Tombol 2: Salin TSV */}
            <button
              type="button"
              onClick={handleCopyTSV}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer active:scale-95"
              title="Salin data dalam format Tab-Separated Values untuk langsung di-paste ke Excel / Google Sheets"
            >
              <Table className="w-4 h-4 text-blue-400" />
              <span>Salin Format Tabel (Excel/Sheets)</span>
            </button>

            {/* Tombol 3: Cetak Dokumen / Simpan PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer active:scale-95"
              title="Cetak lembar dokumen bersih atau simpan sebagai file PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Dokumen / Simpan PDF</span>
            </button>
          </div>
        </div>

        {/* Section Visibility Toggles (Checkboxes) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
              <Filter className="w-3.5 h-3.5 text-teal-400" />
              <span>Pilih Bagian Laporan yang Ditampilkan & Disalin:</span>
            </div>

            <button
              type="button"
              onClick={() => handleSelectAll(!allSelected)}
              className="text-xs text-teal-400 hover:text-teal-300 font-semibold cursor-pointer underline underline-offset-2"
            >
              {allSelected ? "Batal Pilih Semua" : "Pilih Semua Bagian"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {/* Toggle 1: Operasional */}
            <label
              onClick={() => toggleSection("operational")}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                sections.operational
                  ? "bg-blue-950/30 border-blue-600/50 text-blue-200"
                  : "bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:border-zinc-700"
              }`}
            >
              <input
                type="checkbox"
                checked={sections.operational}
                onChange={() => {}}
                className="mt-0.5 accent-blue-500 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold block text-zinc-200">
                  Info & Operasional (Kru, Sponsor, Vendor)
                </span>
                <span className="text-[11px] text-zinc-400">
                  Daftar divisi kru, status sponsor, dan vendor terlibat.
                </span>
              </div>
            </label>

            {/* Toggle 2: Budgeting */}
            <label
              onClick={() => toggleSection("budgeting")}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                sections.budgeting
                  ? "bg-emerald-950/30 border-emerald-600/50 text-emerald-200"
                  : "bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:border-zinc-700"
              }`}
            >
              <input
                type="checkbox"
                checked={sections.budgeting}
                onChange={() => {}}
                className="mt-0.5 accent-emerald-500 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold block text-zinc-200">
                  Ringkasan Budgeting (Keuangan)
                </span>
                <span className="text-[11px] text-zinc-400">
                  Nir-biaya jika ingin dicetak untuk kru lapangan tanpa nominal.
                </span>
              </div>
            </label>

            {/* Toggle 3: Perlengkapan */}
            <label
              onClick={() => toggleSection("equipment")}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                sections.equipment
                  ? "bg-cyan-950/30 border-cyan-600/50 text-cyan-200"
                  : "bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:border-zinc-700"
              }`}
            >
              <input
                type="checkbox"
                checked={sections.equipment}
                onChange={() => {}}
                className="mt-0.5 accent-cyan-500 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold block text-zinc-200">
                  Daftar Perlengkapan (ERP Pusat & Manual)
                </span>
                <span className="text-[11px] text-zinc-400">
                  Alat gudang pusat per kategori & alat pengadaan manual.
                </span>
              </div>
            </label>

            {/* Toggle 4: Utility */}
            <label
              onClick={() => toggleSection("utility")}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                sections.utility
                  ? "bg-amber-950/30 border-amber-600/50 text-amber-200"
                  : "bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:border-zinc-700"
              }`}
            >
              <input
                type="checkbox"
                checked={sections.utility}
                onChange={() => {}}
                className="mt-0.5 accent-amber-500 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold block text-zinc-200">
                  Management Utility
                </span>
                <span className="text-[11px] text-zinc-400">
                  Konsumsi, akomodasi, transportasi, listrik operasional.
                </span>
              </div>
            </label>

            {/* Toggle 5: Guest Star & Riders */}
            <label
              onClick={() => toggleSection("guestStars")}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                sections.guestStars
                  ? "bg-purple-950/30 border-purple-600/50 text-purple-200"
                  : "bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:border-zinc-700"
              }`}
            >
              <input
                type="checkbox"
                checked={sections.guestStars}
                onChange={() => {}}
                className="mt-0.5 accent-purple-500 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold block text-zinc-200">
                  Guest Star & Riders
                </span>
                <span className="text-[11px] text-zinc-400">
                  Pengisi acara, jadwal tampil, serta riders teknis & hospitality.
                </span>
              </div>
            </label>

            {/* Toggle 6: Master Timeline */}
            <label
              onClick={() => toggleSection("timeline")}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                sections.timeline
                  ? "bg-indigo-950/30 border-indigo-600/50 text-indigo-200"
                  : "bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:border-zinc-700"
              }`}
            >
              <input
                type="checkbox"
                checked={sections.timeline}
                onChange={() => {}}
                className="mt-0.5 accent-indigo-500 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold block text-zinc-200">
                  Master Timeline / Rundown Acara
                </span>
                <span className="text-[11px] text-zinc-400">
                  Jadwal rundown per hari dengan slot waktu 30 menit & PIC.
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* ========================================================
          FLOATING TOAST NOTIFICATION
         ======================================================== */}
      {toast && (
        <div className="print:hidden fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-zinc-900 border border-teal-500/80 text-white px-5 py-3.5 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-100">{toast.title}</p>
            {toast.description && (
              <p className="text-xs text-zinc-400">{toast.description}</p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          VISUAL PRINTABLE SHEET DOCUMENT PREVIEW (A4 STYLE)
         ======================================================== */}
      <div className="pt-2">
        <EventPrintableSheet
          eventDetail={eventDetail}
          currentSelectedSummary={currentSelectedSummary}
          budgetingStats={budgetingStats}
          items={items}
          sections={sections}
        />
      </div>
    </div>
  );
}

export default EventReportSubTab;

