"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { generateMarkdownEvent } from "@/shared/lib/markdownGenerators";
import { syncActiveEvents } from "../actions/onRentedActions";
import type { History, Item } from "../types";

interface UseOnRentedEventsProps {
  histories: History[];
  items: Item[];
  isDummyUser?: boolean;
  onTriggerDemoWarning?: (action: "add" | "edit" | "delete" | "batch") => void;
}

export function useOnRentedEvents({
  histories,
  items,
  isDummyUser = false,
  onTriggerDemoWarning,
}: UseOnRentedEventsProps) {
  const router = useRouter();
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToastMsg, setSyncToastMsg] = useState(false);

  // Active Events Logic (Dengan Proteksi Ghost Event)
  const activeEvents = useMemo(() => {
    return histories.filter((h) => {
      // 1. Validasi tipe dan status event
      if (
        h.type !== "INVOICE_RENTAL" ||
        !h.description?.includes("Event:") ||
        h.description?.includes("[SELESAI]")
      ) {
        return false;
      }

      // 2. Proteksi UI: Cek apakah masih ada barang fisik yang belum dikembalikan (Rented > 0)
      if (!h.payload) return false;
      try {
        const payload = JSON.parse(h.payload);
        if (!Array.isArray(payload) || payload.length === 0) return false;

        const activeItems = payload.filter((p: any) => {
          const remainingQty = (Number(p.qty) || 0) - (Number(p.returnedQty) || 0);
          const isPhysicalItem =
            p.code !== "LAYANAN" && !(p.id && String(p.id).startsWith("custom-"));
          return isPhysicalItem && remainingQty > 0;
        });

        return activeItems.length > 0;
      } catch {
        return false;
      }
    });
  }, [histories]);

  // Handler Sinkronisasi Data & Pembersihan Ghost Events
  const handleSyncData = async () => {
    if (isDummyUser) {
      onTriggerDemoWarning?.("edit");
      return;
    }
    setIsSyncing(true);
    try {
      const res = await syncActiveEvents();
      if (res && res.success) {
        router.refresh();
        setSyncToastMsg(true);
        setTimeout(() => setSyncToastMsg(false), 3000);
      }
    } catch (err) {
      console.error("Gagal sinkronisasi data:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handler Salin Data Event ke Clipboard dalam Format Markdown
  const handleCopyEvent = async (event: History) => {
    try {
      const text = generateMarkdownEvent(event, items);
      await navigator.clipboard.writeText(text);
      setCopiedEventId(event.id);
      setTimeout(() => {
        setCopiedEventId((prev) => (prev === event.id ? null : prev));
      }, 2000);
    } catch (err) {
      console.error("Gagal menyalin event ke clipboard", err);
    }
  };

  return {
    activeEvents,
    isSyncing,
    syncToastMsg,
    handleSyncData,
    copiedEventId,
    handleCopyEvent,
  };
}

