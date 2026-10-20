/**
 * eventReportGenerators.ts
 * Pure utility functions untuk men-generate teks Copy Markdown (WhatsApp/Discord)
 * dan Copy TSV / Tab-Separated (Excel / Google Sheets) untuk Event Management Master Sheet.
 */

import type {
  EventDetailData,
  AvailableEventSummary,
  BudgetingStats,
  EventReportSectionFilters,
  EventGuestStarRiderData,
  EventTimelineItemData,
} from "../types";
import { formatRupiah, formatDateID } from "@/shared/lib/formatters";
import { groupItemsByPrimaryCategory } from "@/shared/lib/grouping";

export interface GenerateReportOptions {
  eventDetail: EventDetailData | null;
  currentSelectedSummary?: AvailableEventSummary;
  budgetingStats: BudgetingStats;
  items: any[];
  sections: EventReportSectionFilters;
}

/**
 * Membersihkan string agar aman dimasukkan ke dalam sel TSV (tanpa newline atau tab internal)
 */
function cleanTSV(val: any): string {
  if (val === null || val === undefined) return "";
  return String(val).replace(/[\t\r\n]+/g, " ").trim();
}

/**
 * Membersihkan string agar aman dimasukkan ke dalam tabel Markdown (mengganti pipe '|' dan newline)
 */
function cleanMD(val: any): string {
  if (val === null || val === undefined) return "-";
  const str = String(val).replace(/[\r\n]+/g, " ").replace(/\|/g, "\\|").trim();
  return str === "" ? "-" : str;
}

/**
 * Generator Markdown untuk WhatsApp / Discord / Dokumen Teknis
 */
export function generateEventMarkdown({
  eventDetail,
  currentSelectedSummary,
  budgetingStats,
  items,
  sections,
}: GenerateReportOptions): string {
  const eventName = eventDetail?.eventName || currentSelectedSummary?.title || "Event Tanpa Judul";
  const duration = eventDetail?.durationDays || currentSelectedSummary?.durationDays || 1;
  const status = eventDetail?.status || "PLANNING";
  const printDate = formatDateID(new Date());

  const lines: string[] = [];

  // ==========================================
  // KOP / HEADER LAPORAN
  // ==========================================
  lines.push(`# 📋 LAPORAN MASTER SHEET: ${eventName.toUpperCase()}`);
  lines.push(`**Status Operasional:** \`${status}\` | **Durasi:** ${duration} Hari | **Tanggal Cetak:** ${printDate}`);
  if (eventDetail?.notes) {
    lines.push(`> 📝 **Catatan Acara:** ${cleanMD(eventDetail.notes)}`);
  }
  lines.push("");

  // Ringkasan Cepat KPI
  lines.push("### 📌 RINGKASAN KPI OPERASIONAL");
  const totalCrews = (eventDetail?.crews || []).reduce((acc, c) => acc + (c.memberCount || 1), 0);
  const totalErpItems = (currentSelectedSummary?.payload || []).reduce((acc, p) => acc + (p.qty || 1), 0);
  const totalManualItems = (eventDetail?.manualEquipments || []).reduce((acc, m) => acc + (m.quantity || 1), 0);
  const totalGuestStars = eventDetail?.guestStars?.length || 0;
  const totalTimelineAgendas = eventDetail?.timelineItems?.length || 0;

  lines.push(`- **Kru & Personil:** ${totalCrews} Orang (${eventDetail?.crews?.length || 0} Divisi/Pos)`);
  lines.push(`- **Total Perlengkapan:** ${totalErpItems + totalManualItems} Unit (ERP: ${totalErpItems} | Manual: ${totalManualItems})`);
  lines.push(`- **Bintang Tamu:** ${totalGuestStars} Pengisi Acara`);
  lines.push(`- **Agenda Rundown:** ${totalTimelineAgendas} Agenda Acara`);

  if (sections.budgeting) {
    lines.push(`- **Total Pemasukan:** ${formatRupiah(budgetingStats.totalPemasukan)}`);
    lines.push(`- **Total Pengeluaran:** ${formatRupiah(budgetingStats.grandTotalPengeluaran)} (ERP: ${formatRupiah(budgetingStats.erpCost)})`);
    lines.push(`- **Hasil Neraca:** **${budgetingStats.isSurplus ? "SURPLUS" : "DEFISIT"} ${formatRupiah(budgetingStats.netBalance)}**`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  // ==========================================
  // BAGIAN I: OPERASIONAL (KRU, SPONSOR & VENDOR)
  // ==========================================
  if (sections.operational) {
    lines.push("## 👥 BAGIAN I — OPERASIONAL (KRU, SPONSOR & VENDOR)");
    lines.push("");

    // 1. Kru
    lines.push("### 1. Daftar Kru Operasional");
    const crews = eventDetail?.crews || [];
    if (crews.length > 0) {
      if (sections.budgeting) {
        lines.push("| No | Divisi | Nama / Posisi | Personil | Honorarium | Catatan |");
        lines.push("|---|---|---|:---:|:---:|---|");
        crews.forEach((c, idx) => {
          lines.push(`| ${idx + 1} | ${cleanMD(c.division)} | ${cleanMD(c.name)} | ${c.memberCount} Orang | ${formatRupiah(c.fee)} | ${cleanMD(c.notes)} |`);
        });
      } else {
        lines.push("| No | Divisi | Nama / Posisi | Personil | Catatan |");
        lines.push("|---|---|---|:---:|---|");
        crews.forEach((c, idx) => {
          lines.push(`| ${idx + 1} | ${cleanMD(c.division)} | ${cleanMD(c.name)} | ${c.memberCount} Orang | ${cleanMD(c.notes)} |`);
        });
      }
    } else {
      lines.push("_Belum ada daftar kru terdata._");
    }
    lines.push("");

    // 2. Sponsor
    lines.push("### 2. Daftar Sponsor & Pendanaan");
    const sponsors = eventDetail?.sponsors || [];
    if (sponsors.length > 0) {
      lines.push("| No | Nama Sponsor | Bentuk Dukungan | Status | Nilai Sponsor | Catatan |");
      lines.push("|---|---|---|:---:|:---:|---|");
      sponsors.forEach((s, idx) => {
        const statusBadge = s.status === "CONFIRMED" ? "CONFIRMED ✅" : "PENDING ⏳";
        lines.push(`| ${idx + 1} | ${cleanMD(s.name)} | ${cleanMD(s.supportType)} | ${statusBadge} | ${formatRupiah(s.amount)} | ${cleanMD(s.notes)} |`);
      });
    } else {
      lines.push("_Belum ada sponsor terdata._");
    }
    lines.push("");

    // 3. Vendor
    lines.push("### 3. Daftar Vendor Terlibat");
    lines.push("| No | Nama Vendor | Kategori / Layanan | Tipe Vendor | Biaya | Catatan |");
    lines.push("|---|---|---|---|:---:|---|");
    // Row 1: ERP Logistik Pusat
    lines.push(`| 1 | **ERP Logistik Pusat** | Logistik & Peralatan Gudang Utama | **Vendor Utama ERP** | ${sections.budgeting ? formatRupiah(budgetingStats.erpCost) : "-"} | Auto-synced dari sewa gudang pusat |`);
    const externalVendors = (eventDetail?.vendors || []).filter(v => !v.isErpPusat);
    externalVendors.forEach((v, idx) => {
      const costStr = sections.budgeting ? formatRupiah(v.cost) : "-";
      lines.push(`| ${idx + 2} | ${cleanMD(v.name)} | ${cleanMD(v.category)} | Vendor Eksternal | ${costStr} | ${cleanMD(v.notes)} |`);
    });
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // ==========================================
  // BAGIAN II: RINGKASAN BUDGETING (KEUANGAN)
  // ==========================================
  if (sections.budgeting) {
    lines.push("## 💰 BAGIAN II — RINGKASAN KEUANGAN (BUDGETING)");
    lines.push("");

    // Pemasukan
    lines.push("### A. Rincian Pemasukan");
    lines.push("| Pos Pemasukan | Keterangan | Nominal |");
    lines.push("|---|---|:---:|");
    lines.push(`| Budget Alokasi Klien | Anggaran resmi dari penyelenggara / klien | ${formatRupiah(budgetingStats.clientBudget)} |`);
    lines.push(`| Sponsor (Confirmed) | Total dana sponsor terverifikasi masuk | ${formatRupiah(budgetingStats.confirmedSponsorsTotal)} |`);
    if (budgetingStats.pendingSponsorsTotal > 0) {
      lines.push(`| Potensi Sponsor (Pending) | Pengajuan proposal yang masih proses | +${formatRupiah(budgetingStats.pendingSponsorsTotal)} |`);
    }
    lines.push(`| **TOTAL PEMASUKAN REALISASI** | **Budget + Sponsor Confirmed** | **${formatRupiah(budgetingStats.totalPemasukan)}** |`);
    lines.push("");

    // Pengeluaran
    lines.push("### B. Rincian Pos Pengeluaran");
    lines.push("| Pos Pengeluaran | Keterangan | Total Biaya |");
    lines.push("|---|---|:---:|");
    lines.push(`| Tagihan ERP Gudang Pusat | Sewa Alat Logistik (${duration} Hari) - Single Summary Row | ${formatRupiah(budgetingStats.erpCost)} |`);
    lines.push(`| Alat Tambahan (Manual) | Pengadaan perlengkapan di luar gudang ERP | ${formatRupiah(budgetingStats.manualEquipTotal)} |`);
    lines.push(`| Management Utility | Konsumsi, akomodasi, transportasi, listrik, dsb. | ${formatRupiah(budgetingStats.utilityTotal)} |`);
    lines.push(`| Honorarium Kru Operasional | Total gaji/honor seluruh divisi tim lapangan | ${formatRupiah(budgetingStats.crewTotal)} |`);
    lines.push(`| Vendor Eksternal | Vendor pihak ketiga non-ERP pusat | ${formatRupiah(budgetingStats.externalVendorTotal)} |`);
    lines.push(`| Guest Star & Riders | Fee Artis (${formatRupiah(budgetingStats.guestStarFeeTotal)}) + Riders Luar (${formatRupiah(budgetingStats.guestStarRidersTotal)}) | ${formatRupiah(budgetingStats.guestStarTotal)} |`);
    lines.push(`| **TOTAL PENGELUARAN** | **Grand Total Beban Biaya Acara** | **${formatRupiah(budgetingStats.grandTotalPengeluaran)}** |`);
    lines.push("");

    // Neraca
    lines.push(`> 💵 **HASIL AKHIR ANGGARAN:** **${budgetingStats.isSurplus ? "SURPLUS" : "DEFISIT"} ${formatRupiah(budgetingStats.netBalance)}** (${budgetingStats.isSurplus ? "Kondisi Keuangan Aman & Surplus" : "Perhatian: Defisit Anggaran!"})`);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // ==========================================
  // BAGIAN III: DAFTAR PERLENGKAPAN (EQUIPMENT)
  // ==========================================
  if (sections.equipment) {
    lines.push("## 📦 BAGIAN III — DAFTAR PERLENGKAPAN (EQUIPMENT)");
    lines.push("");

    // Sub-A: ERP Pusat
    lines.push("### A. Alat Gudang ERP Logistik Pusat (Auto-Synced)");
    const payload = currentSelectedSummary?.payload || [];
    if (payload.length > 0) {
      const grouped = groupItemsByPrimaryCategory(payload, items);
      grouped.forEach(g => {
        lines.push(`#### Kategori: ${g.categoryName.toUpperCase()} (${g.items.length} Barang)`);
        lines.push("| No | Kode | Nama Barang | Jumlah | Catatan / Footnote |");
        lines.push("|---|---|---|:---:|---|");
        g.items.forEach((pItem: any, idx: number) => {
          const note = pItem.catatan || pItem.footnote || "-";
          lines.push(`| ${idx + 1} | \`${cleanMD(pItem.code)}\` | ${cleanMD(pItem.name)} | ${pItem.qty} Unit | ${cleanMD(note)} |`);
        });
        lines.push("");
      });
    } else {
      lines.push("_Tidak ada perlengkapan dari gudang ERP pusat yang disewa._");
      lines.push("");
    }

    // Sub-B: Manual
    lines.push("### B. Alat Pengadaan Manual (Non-ERP / Eksternal)");
    const manualEquips = eventDetail?.manualEquipments || [];
    if (manualEquips.length > 0) {
      lines.push("| No | Nama Alat | Kategori | Tipe | Jumlah | Durasi | Harga Satuan | Subtotal Biaya | Catatan |");
      lines.push("|---|---|---|:---:|:---:|:---:|:---:|:---:|---|");
      manualEquips.forEach((m, idx) => {
        const unitPriceStr = m.procurementType === "BELI"
          ? formatRupiah(m.unitPrice)
          : `${formatRupiah(m.rentalPricePerDay)}/hari`;
        const durationStr = m.procurementType === "SEWA" ? `${m.rentalDays} Hari` : "-";
        lines.push(`| ${idx + 1} | ${cleanMD(m.name)} | ${cleanMD(m.category)} | ${m.procurementType} | ${m.quantity} Unit | ${durationStr} | ${unitPriceStr} | ${formatRupiah(m.totalCost)} | ${cleanMD(m.notes)} |`);
      });
    } else {
      lines.push("_Tidak ada perlengkapan manual tambahan._");
    }
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // ==========================================
  // BAGIAN IV: MANAGEMENT UTILITY
  // ==========================================
  if (sections.utility) {
    lines.push("## ☕ BAGIAN IV — MANAGEMENT UTILITY & OPERASIONAL");
    const utils = eventDetail?.utilities || [];
    if (utils.length > 0) {
      lines.push("| No | Kebutuhan Utility | Kategori | Tipe | Jumlah | Durasi | Harga Satuan | Total Biaya | Catatan |");
      lines.push("|---|---|---|:---:|:---:|:---:|:---:|:---:|---|");
      utils.forEach((u, idx) => {
        const unitPriceStr = u.procurementType === "BELI"
          ? formatRupiah(u.unitPrice)
          : `${formatRupiah(u.rentalPricePerDay)}/hari`;
        const durationStr = u.procurementType === "SEWA" ? `${u.rentalDays} Hari` : "-";
        const qtyUnit = `${u.quantity} ${u.unit || "Unit"}`;
        lines.push(`| ${idx + 1} | ${cleanMD(u.name)} | ${cleanMD(u.category)} | ${u.procurementType} | ${qtyUnit} | ${durationStr} | ${unitPriceStr} | ${formatRupiah(u.totalCost)} | ${cleanMD(u.notes)} |`);
      });
    } else {
      lines.push("_Belum ada kebutuhan utility operasional yang dicatat._");
    }
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // ==========================================
  // BAGIAN V: GUEST STAR & RIDERS
  // ==========================================
  if (sections.guestStars) {
    lines.push("## 🎤 BAGIAN V — GUEST STAR & RIDERS");
    lines.push("");

    const guestStars = eventDetail?.guestStars || [];
    if (guestStars.length > 0) {
      lines.push("### 1. Daftar Pengisi Acara / Guest Star");
      lines.push("| No | Nama Artis / Grup | Kategori | Personil | Jadwal Tampil | Kontak PIC | Honorarium | Catatan |");
      lines.push("|---|---|---|:---:|---|---|:---:|---|");
      guestStars.forEach((gs, idx) => {
        const schedule = gs.stageTime ? `Hari ke-${gs.dayNumber || 1} (${gs.stageTime})` : `Hari ke-${gs.dayNumber || 1}`;
        lines.push(`| ${idx + 1} | **${cleanMD(gs.name)}** | ${cleanMD(gs.category)} | ${gs.personnelCount} Orang | ${schedule} | ${cleanMD(gs.contactPerson)} | ${formatRupiah(gs.totalFee)} | ${cleanMD(gs.notes)} |`);
      });
      lines.push("");

      lines.push("### 2. Daftar Kebutuhan Riders (Teknis & Hospitality)");
      const allRiders: { gsName: string; rider: EventGuestStarRiderData }[] = [];
      guestStars.forEach(gs => {
        (gs.riders || []).forEach(r => {
          allRiders.push({ gsName: gs.name, rider: r });
        });
      });

      if (allRiders.length > 0) {
        lines.push("| No | Artis | Kebutuhan Riders | Tipe Riders | Sumber Pengadaan | Jumlah | Biaya | Catatan |");
        lines.push("|---|---|---|:---:|---|:---:|:---:|---|");
        allRiders.forEach((item, idx) => {
          const r = item.rider;
          const sourceText = r.sourceType === "ERP_LOGISTIK"
            ? "ERP Logistik Pusat (Tercover)"
            : `Vendor Luar (${r.procurementType})`;
          const costStr = r.sourceType === "ERP_LOGISTIK" ? "Rp 0 (Paket ERP)" : formatRupiah(r.totalCost);
          lines.push(`| ${idx + 1} | ${cleanMD(item.gsName)} | ${cleanMD(r.name)} | ${r.riderType} | ${sourceText} | ${r.quantity} ${r.unit || "Unit"} | ${costStr} | ${cleanMD(r.notes)} |`);
        });
      } else {
        lines.push("_Belum ada riders yang dicatat untuk seluruh pengisi acara._");
      }
    } else {
      lines.push("_Belum ada data guest star / pengisi acara._");
    }
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // ==========================================
  // BAGIAN VI: MASTER TIMELINE / RUNDOWN
  // ==========================================
  if (sections.timeline) {
    lines.push("## ⏱️ BAGIAN VI — MASTER TIMELINE / RUNDOWN ACARA");
    const timelineItems = [...(eventDetail?.timelineItems || [])].sort((a, b) => {
      if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
      return a.startTime.localeCompare(b.startTime);
    });

    if (timelineItems.length > 0) {
      // Group by dayNumber
      const dayNumbers = Array.from(new Set(timelineItems.map(i => i.dayNumber))).sort((a, b) => a - b);
      dayNumbers.forEach(day => {
        lines.push(`### 📅 Rundown Hari ke-${day}`);
        lines.push("| Rentang Jam (WIB) | Agenda / Acara | Kategori | Lokasi / Stage | PIC / Guest Star | Catatan |");
        lines.push("|---|---|---|---|---|---|");

        const dayItems = timelineItems.filter(i => i.dayNumber === day);
        dayItems.forEach(item => {
          const timeRange = `${item.startTime} - ${item.endTime} WIB`;
          let picOrGs = "-";
          if (item.guestStarId) {
            const matchedGs = (eventDetail?.guestStars || []).find(g => g.id === item.guestStarId);
            picOrGs = matchedGs ? `⭐ ${matchedGs.name}` : "Guest Star";
          }
          lines.push(`| ${timeRange} | **${cleanMD(item.title)}** | ${cleanMD(item.category)} | ${cleanMD(item.stageLocation)} | ${cleanMD(picOrGs)} | ${cleanMD(item.notes)} |`);
        });
        lines.push("");
      });
    } else {
      lines.push("_Belum ada rundown agenda yang dibuat._");
    }
  }

  return lines.join("\n");
}

/**
 * Generator Tab-Separated Values (TSV) untuk Paste Langsung ke Excel / Google Sheets
 */
export function generateEventTSV({
  eventDetail,
  currentSelectedSummary,
  budgetingStats,
  items,
  sections,
}: GenerateReportOptions): string {
  const eventName = eventDetail?.eventName || currentSelectedSummary?.title || "Event Tanpa Judul";
  const duration = eventDetail?.durationDays || currentSelectedSummary?.durationDays || 1;
  const status = eventDetail?.status || "PLANNING";
  const printDate = formatDateID(new Date());

  const rows: string[] = [];

  const addRow = (...cells: any[]) => {
    rows.push(cells.map(cleanTSV).join("\t"));
  };

  const addBlank = () => {
    rows.push("");
  };

  // Header Laporan
  addRow("LAPORAN MASTER SHEET ACARA", eventName.toUpperCase());
  addRow("Status Operasional", status, "Durasi Acara", `${duration} Hari`, "Tanggal Cetak", printDate);
  if (eventDetail?.notes) {
    addRow("Catatan Khusus", eventDetail.notes);
  }
  addBlank();

  // Ringkasan KPI
  addRow("RINGKASAN KPI OPERASIONAL");
  const totalCrews = (eventDetail?.crews || []).reduce((acc, c) => acc + (c.memberCount || 1), 0);
  const totalErpItems = (currentSelectedSummary?.payload || []).reduce((acc, p) => acc + (p.qty || 1), 0);
  const totalManualItems = (eventDetail?.manualEquipments || []).reduce((acc, m) => acc + (m.quantity || 1), 0);
  addRow("Total Kru / Personil", `${totalCrews} Orang`, "Divisi Terlibat", `${eventDetail?.crews?.length || 0} Divisi`);
  addRow("Total Alat Gudang ERP", `${totalErpItems} Unit`, "Total Alat Manual", `${totalManualItems} Unit`);
  addRow("Bintang Tamu / Artis", `${eventDetail?.guestStars?.length || 0} Pengisi Acara`, "Total Rundown Acara", `${eventDetail?.timelineItems?.length || 0} Agenda`);
  if (sections.budgeting) {
    addRow("Total Pemasukan Acara", formatRupiah(budgetingStats.totalPemasukan), "Total Pengeluaran", formatRupiah(budgetingStats.grandTotalPengeluaran));
    addRow("Tagihan Gudang ERP Pusat", formatRupiah(budgetingStats.erpCost), "Saldo Akhir", `${budgetingStats.isSurplus ? "SURPLUS" : "DEFISIT"} ${formatRupiah(budgetingStats.netBalance)}`);
  }
  addBlank();

  // BAGIAN I: OPERASIONAL
  if (sections.operational) {
    addRow("BAGIAN I — OPERASIONAL (KRU, SPONSOR & VENDOR)");
    addBlank();

    // Kru
    addRow("1. DAFTAR KRU OPERASIONAL");
    if (sections.budgeting) {
      addRow("No", "Divisi", "Nama / Posisi", "Jumlah Personil", "Honorarium", "Catatan");
      (eventDetail?.crews || []).forEach((c, idx) => {
        addRow(idx + 1, c.division, c.name, `${c.memberCount} Orang`, formatRupiah(c.fee), c.notes || "");
      });
    } else {
      addRow("No", "Divisi", "Nama / Posisi", "Jumlah Personil", "Catatan");
      (eventDetail?.crews || []).forEach((c, idx) => {
        addRow(idx + 1, c.division, c.name, `${c.memberCount} Orang`, c.notes || "");
      });
    }
    addBlank();

    // Sponsor
    addRow("2. DAFTAR SPONSOR & PENDANAAN");
    addRow("No", "Nama Sponsor", "Bentuk Dukungan", "Status", "Nominal Dana", "Catatan");
    (eventDetail?.sponsors || []).forEach((s, idx) => {
      addRow(idx + 1, s.name, s.supportType, s.status, formatRupiah(s.amount), s.notes || "");
    });
    addBlank();

    // Vendor
    addRow("3. DAFTAR VENDOR TERLIBAT");
    addRow("No", "Nama Vendor", "Kategori / Layanan", "Tipe Vendor", "Biaya", "Catatan");
    addRow(1, "ERP Logistik Pusat", "Logistik & Peralatan Gudang Utama", "Vendor Utama ERP", sections.budgeting ? formatRupiah(budgetingStats.erpCost) : "-", "Auto-synced dari sewa gudang pusat");
    const externalVendors = (eventDetail?.vendors || []).filter(v => !v.isErpPusat);
    externalVendors.forEach((v, idx) => {
      const costStr = sections.budgeting ? formatRupiah(v.cost) : "-";
      addRow(idx + 2, v.name, v.category, "Vendor Eksternal", costStr, v.notes || "");
    });
    addBlank();
  }

  // BAGIAN II: BUDGETING
  if (sections.budgeting) {
    addRow("BAGIAN II — RINGKASAN KEUANGAN (BUDGETING)");
    addBlank();

    addRow("A. RINCIAN PEMASUKAN ACARA");
    addRow("Pos Pemasukan", "Keterangan", "Nominal");
    addRow("Budget Alokasi Klien", "Anggaran resmi dari klien / penyelenggara", formatRupiah(budgetingStats.clientBudget));
    addRow("Dana Sponsor (Confirmed)", "Total sponsor terverifikasi", formatRupiah(budgetingStats.confirmedSponsorsTotal));
    if (budgetingStats.pendingSponsorsTotal > 0) {
      addRow("Potensi Sponsor (Pending)", "Dalam proses pengajuan", formatRupiah(budgetingStats.pendingSponsorsTotal));
    }
    addRow("TOTAL PEMASUKAN REALISASI", "Budget + Sponsor Confirmed", formatRupiah(budgetingStats.totalPemasukan));
    addBlank();

    addRow("B. RINCIAN PENGELUARAN ACARA");
    addRow("Pos Pengeluaran", "Keterangan", "Total Biaya");
    addRow("Tagihan ERP Gudang Pusat", `Sewa Gudang (${duration} Hari) - Single Summary Row`, formatRupiah(budgetingStats.erpCost));
    addRow("Alat Tambahan (Manual)", "Pengadaan perlengkapan di luar ERP", formatRupiah(budgetingStats.manualEquipTotal));
    addRow("Management Utility", "Konsumsi, akomodasi, transportasi, dsb.", formatRupiah(budgetingStats.utilityTotal));
    addRow("Honorarium Kru Operasional", "Honor seluruh kru lapangan", formatRupiah(budgetingStats.crewTotal));
    addRow("Vendor Eksternal", "Vendor pihak ketiga non-ERP", formatRupiah(budgetingStats.externalVendorTotal));
    addRow("Guest Star & Riders", "Fee Artis + Riders Vendor Luar", formatRupiah(budgetingStats.guestStarTotal));
    addRow("TOTAL PENGELUARAN", "Grand Total Pengeluaran", formatRupiah(budgetingStats.grandTotalPengeluaran));
    addBlank();

    addRow("HASIL AKHIR ANGGARAN", budgetingStats.isSurplus ? "SURPLUS" : "DEFISIT", formatRupiah(budgetingStats.netBalance));
    addBlank();
  }

  // BAGIAN III: EQUIPMENT
  if (sections.equipment) {
    addRow("BAGIAN III — DAFTAR PERLENGKAPAN (EQUIPMENT)");
    addBlank();

    // ERP
    addRow("A. ALAT GUDANG ERP LOGISTIK PUSAT (AUTO-SYNCED)");
    addRow("No", "Kategori Kebutuhan", "Kode Barang", "Nama Barang", "Jumlah", "Catatan / Footnote");
    const payload = currentSelectedSummary?.payload || [];
    if (payload.length > 0) {
      const grouped = groupItemsByPrimaryCategory(payload, items);
      let runningIdx = 1;
      grouped.forEach(g => {
        g.items.forEach((pItem: any) => {
          const note = pItem.catatan || pItem.footnote || "";
          addRow(runningIdx++, g.categoryName, pItem.code, pItem.name, `${pItem.qty} Unit`, note);
        });
      });
    } else {
      addRow("-", "-", "-", "Tidak ada perlengkapan dari gudang ERP pusat.", "-", "-");
    }
    addBlank();

    // Manual
    addRow("B. ALAT PENGADAAN MANUAL (NON-ERP)");
    addRow("No", "Nama Alat", "Kategori", "Tipe Pengadaan", "Jumlah", "Durasi Sewa", "Harga Satuan / Hari", "Total Biaya", "Catatan");
    const manualEquips = eventDetail?.manualEquipments || [];
    manualEquips.forEach((m, idx) => {
      const unitPriceStr = m.procurementType === "BELI"
        ? formatRupiah(m.unitPrice)
        : `${formatRupiah(m.rentalPricePerDay)}/hari`;
      const durStr = m.procurementType === "SEWA" ? `${m.rentalDays} Hari` : "-";
      addRow(idx + 1, m.name, m.category, m.procurementType, `${m.quantity} Unit`, durStr, unitPriceStr, formatRupiah(m.totalCost), m.notes || "");
    });
    addBlank();
  }

  // BAGIAN IV: UTILITY
  if (sections.utility) {
    addRow("BAGIAN IV — MANAGEMENT UTILITY & OPERASIONAL");
    addRow("No", "Kebutuhan Utility", "Kategori", "Tipe Pengadaan", "Jumlah", "Durasi", "Harga Satuan", "Total Biaya", "Catatan");
    const utils = eventDetail?.utilities || [];
    utils.forEach((u, idx) => {
      const unitPriceStr = u.procurementType === "BELI"
        ? formatRupiah(u.unitPrice)
        : `${formatRupiah(u.rentalPricePerDay)}/hari`;
      const durStr = u.procurementType === "SEWA" ? `${u.rentalDays} Hari` : "-";
      addRow(idx + 1, u.name, u.category, u.procurementType, `${u.quantity} ${u.unit || "Unit"}`, durStr, unitPriceStr, formatRupiah(u.totalCost), u.notes || "");
    });
    addBlank();
  }

  // BAGIAN V: GUEST STAR
  if (sections.guestStars) {
    addRow("BAGIAN V — GUEST STAR & RIDERS");
    addBlank();

    addRow("1. DAFTAR PENGISI ACARA / GUEST STAR");
    addRow("No", "Nama Artis / Bintang Tamu", "Kategori", "Jumlah Kru / Personil", "Jadwal Tampil", "Kontak PIC", "Honorarium", "Catatan");
    const guestStars = eventDetail?.guestStars || [];
    guestStars.forEach((gs, idx) => {
      const schedule = gs.stageTime ? `Hari ke-${gs.dayNumber || 1} (${gs.stageTime})` : `Hari ke-${gs.dayNumber || 1}`;
      addRow(idx + 1, gs.name, gs.category, `${gs.personnelCount} Orang`, schedule, gs.contactPerson || "", formatRupiah(gs.totalFee), gs.notes || "");
    });
    addBlank();

    addRow("2. DAFTAR RIDERS TEKNIS & HOSPITALITY");
    addRow("No", "Nama Artis", "Kebutuhan Riders", "Tipe Riders", "Sumber Pengadaan", "Jumlah", "Kalkulasi Biaya", "Subtotal Biaya", "Catatan");
    let riderIdx = 1;
    guestStars.forEach(gs => {
      (gs.riders || []).forEach(r => {
        const sourceText = r.sourceType === "ERP_LOGISTIK"
          ? "ERP Logistik Pusat (Tercover)"
          : `Vendor Luar (${r.procurementType})`;
        const calcStr = r.sourceType === "ERP_LOGISTIK"
          ? "Paket ERP"
          : r.procurementType === "BELI"
          ? `${formatRupiah(r.unitPrice)}/unit`
          : `${formatRupiah(r.rentalPricePerDay)}/hari × ${r.rentalDays} hari`;
        const costStr = r.sourceType === "ERP_LOGISTIK" ? "Rp 0" : formatRupiah(r.totalCost);
        addRow(riderIdx++, gs.name, r.name, r.riderType, sourceText, `${r.quantity} ${r.unit || "Unit"}`, calcStr, costStr, r.notes || "");
      });
    });
    addBlank();
  }

  // BAGIAN VI: MASTER TIMELINE
  if (sections.timeline) {
    addRow("BAGIAN VI — MASTER TIMELINE / RUNDOWN ACARA");
    addRow("Hari", "Rentang Jam (WIB)", "Agenda / Rundown Acara", "Kategori", "Lokasi / Stage", "PIC / Guest Star", "Catatan");
    const timelineItems = [...(eventDetail?.timelineItems || [])].sort((a, b) => {
      if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
      return a.startTime.localeCompare(b.startTime);
    });
    timelineItems.forEach(item => {
      const timeRange = `${item.startTime} - ${item.endTime} WIB`;
      let picOrGs = "-";
      if (item.guestStarId) {
        const matchedGs = (eventDetail?.guestStars || []).find(g => g.id === item.guestStarId);
        picOrGs = matchedGs ? matchedGs.name : "Guest Star";
      }
      addRow(`Hari ke-${item.dayNumber}`, timeRange, item.title, item.category, item.stageLocation || "-", picOrGs, item.notes || "");
    });
    addBlank();
  }

  return rows.join("\r\n");
}

