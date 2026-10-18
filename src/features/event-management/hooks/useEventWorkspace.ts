"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { EventDetailData, AvailableEventSummary, EventSubTabType } from "../types";
import { getOrCreateEventDetail } from "../actions";

export function useEventWorkspace(histories: any[], initialEventDetails: EventDetailData[] = []) {
  // --- SUB-TAB STATE ---
  const [activeSubTab, setActiveSubTab] = useState<EventSubTabType>("overview");

  // --- DAFTAR EVENT AKTIF DARI ON RENTED ---
  const availableEvents = useMemo<AvailableEventSummary[]>(() => {
    const list: AvailableEventSummary[] = [];

    histories.forEach(h => {
      // 1. Validasi tipe dan status event (Hanya transaksi Event aktif di On Rented)
      if (
        h.type !== "INVOICE_RENTAL" ||
        !h.description?.includes("Event:") ||
        h.description?.includes("[SELESAI]")
      ) {
        return;
      }

      // 2. Proteksi UI: Cek apakah masih ada barang fisik yang belum dikembalikan (Rented > 0)
      if (!h.payload) return;
      let payload: any[] = [];
      try {
        payload = JSON.parse(h.payload);
        if (!Array.isArray(payload) || payload.length === 0) return;
      } catch {
        return;
      }

      const activeItems = payload.filter((p: any) => {
        const remainingQty = (Number(p.qty) || 0) - (Number(p.returnedQty) || 0);
        const isPhysicalItem = p.code !== "LAYANAN" && !(p.id && String(p.id).startsWith("custom-"));
        return isPhysicalItem && remainingQty > 0;
      });

      if (activeItems.length === 0) return;

      // Hitung total nilai rental ERP
      const erpTotalCost = payload.reduce(
        (acc: number, cur: any) => acc + (Number(cur.price) || 0) * (Number(cur.qty) || 0),
        0
      );

      // Hitung durasi hari dari description (contoh: "3 Hari")
      const dayMatch = h.description?.match(/(\d+)\s*Hari/i);
      const durationDays = dayMatch ? Math.max(1, parseInt(dayMatch[1])) : 1;

      // Bersihkan nama event konsisten dengan Daftar Event di On Rented
      const title = h.description.split("|")[0].replace("Event:", "").trim() || "Event Aktif";

      list.push({
        id: h.id,
        title,
        date: h.date,
        durationDays,
        erpTotalCost,
        payload,
        isActive: true
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [histories]);

  // --- EVENT YANG SEDANG DIPILIH ---
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>("");
  const [eventDetail, setEventDetail] = useState<EventDetailData | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Summary event aktif yang dipilih
  const currentSelectedSummary = useMemo(() => {
    return availableEvents.find(e => e.id === selectedHistoryId);
  }, [availableEvents, selectedHistoryId]);

  // Function to reload event detail
  const refreshEventDetail = useCallback(async () => {
    if (!selectedHistoryId) return;
    const currentEvent = availableEvents.find(e => e.id === selectedHistoryId);
    if (!currentEvent) return;

    setIsLoadingDetail(true);
    try {
      const res = await getOrCreateEventDetail(
        currentEvent.id,
        currentEvent.title,
        currentEvent.durationDays,
        currentEvent.erpTotalCost
      );
      if (res.success && res.data) {
        setEventDetail(res.data as EventDetailData);
      }
    } finally {
      setIsLoadingDetail(false);
    }
  }, [selectedHistoryId, availableEvents]);

  // Load or initialize event detail when selection changes
  useEffect(() => {
    if (!selectedHistoryId) {
      if (availableEvents.length > 0) {
        setSelectedHistoryId(availableEvents[0].id);
      } else {
        setEventDetail(null);
      }
      return;
    }

    const currentEvent = availableEvents.find(e => e.id === selectedHistoryId);
    if (!currentEvent) {
      if (eventDetail && eventDetail.id === selectedHistoryId) {
        return;
      }
      if (availableEvents.length > 0) {
        setSelectedHistoryId(availableEvents[0].id);
      } else {
        setSelectedHistoryId("");
        setEventDetail(null);
      }
      return;
    }

    let isMounted = true;
    setIsLoadingDetail(true);

    getOrCreateEventDetail(
      currentEvent.id,
      currentEvent.title,
      currentEvent.durationDays,
      currentEvent.erpTotalCost
    ).then(res => {
      if (isMounted) {
        setIsLoadingDetail(false);
        if (res.success && res.data) {
          setEventDetail(res.data as EventDetailData);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedHistoryId, availableEvents]);

  return {
    availableEvents,
    selectedHistoryId,
    setSelectedHistoryId,
    eventDetail,
    setEventDetail,
    isLoadingDetail,
    currentSelectedSummary,
    refreshEventDetail,
    activeSubTab,
    setActiveSubTab,
  };
}

