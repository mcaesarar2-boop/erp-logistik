"use client";

import { useMemo } from "react";
import type { EventDetailData, AvailableEventSummary, BudgetingStats } from "../types";

export function useEventBudgeting(
  eventDetail: EventDetailData | null,
  currentSelectedSummary?: AvailableEventSummary
): BudgetingStats {
  return useMemo<BudgetingStats>(() => {
    // 1. Pemasukan
    const clientBudget = eventDetail?.clientBudget || 0;
    const confirmedSponsorsTotal = (eventDetail?.sponsors || [])
      .filter(s => s.status === "CONFIRMED")
      .reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
    const pendingSponsorsTotal = (eventDetail?.sponsors || [])
      .filter(s => s.status !== "CONFIRMED")
      .reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
    const totalPemasukan = clientBudget + confirmedSponsorsTotal;

    // 2. Pengeluaran
    // ERP Logistik Pusat (Single summary line price)
    const erpCost = currentSelectedSummary?.erpTotalCost || 0;

    // Alat Manual Tambahan
    const manualEquipTotal = (eventDetail?.manualEquipments || []).reduce(
      (acc, cur) => acc + (Number(cur.totalCost) || 0),
      0
    );

    // Crew Fee
    const crewTotal = (eventDetail?.crews || []).reduce(
      (acc, cur) => acc + (Number(cur.fee) || 0),
      0
    );

    // Vendor Eksternal (Di luar ERP Pusat)
    const externalVendorTotal = (eventDetail?.vendors || [])
      .filter(v => !v.isErpPusat)
      .reduce((acc, cur) => acc + (Number(cur.cost) || 0), 0);

    // Kebutuhan Utilitas (Konsumsi, Akomodasi, dll.)
    const utilityTotal = (eventDetail?.utilities || []).reduce(
      (acc, cur) => acc + (Number(cur.totalCost) || 0),
      0
    );

    // Guest Star: Fee Artis + Riders Vendor Luar
    const guestStarsList = eventDetail?.guestStars || [];
    const guestStarFeeTotal = guestStarsList.reduce(
      (acc, cur) => acc + (Number(cur.totalFee) || 0),
      0
    );
    const guestStarRidersTotal = guestStarsList.reduce((acc, gs) => {
      const rCost = (gs.riders || []).reduce((rAcc, r) => rAcc + (Number(r.totalCost) || 0), 0);
      return acc + rCost;
    }, 0);
    const guestStarTotal = guestStarFeeTotal + guestStarRidersTotal;
    const guestStarPersonnelTotal = guestStarsList.reduce(
      (acc, cur) => acc + (Number(cur.personnelCount) || 1),
      0
    );

    // Grand Total Pengeluaran
    const grandTotalPengeluaran = erpCost + manualEquipTotal + crewTotal + externalVendorTotal + utilityTotal + guestStarTotal;

    // Saldo / Margin
    const netBalance = totalPemasukan - grandTotalPengeluaran;

    return {
      clientBudget,
      confirmedSponsorsTotal,
      pendingSponsorsTotal,
      totalPemasukan,
      erpCost,
      manualEquipTotal,
      crewTotal,
      externalVendorTotal,
      utilityTotal,
      guestStarFeeTotal,
      guestStarRidersTotal,
      guestStarTotal,
      guestStarPersonnelTotal,
      grandTotalPengeluaran,
      netBalance,
      isSurplus: netBalance >= 0
    };
  }, [eventDetail, currentSelectedSummary]);
}

