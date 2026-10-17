"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Calendar, Users, DollarSign, Package, Plus, Trash2, CheckCircle2, 
  Clock, AlertCircle, Building2, ShieldCheck, ChevronRight, Edit3, 
  Layers, ShoppingBag, ArrowUpRight, TrendingUp, TrendingDown,
  Info, Sparkles, Filter, ExternalLink, RefreshCw, Handshake,
  Coffee, Utensils, Truck, Zap, Radio, HeartPulse, Wrench, Boxes,
  Check, Mic, Music, Star, Disc, Lock, Unlock, CalendarDays, Volume2, DoorOpen, ListChecks
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ItemThumbnail } from "@/components/ItemThumbnail";
import { groupItemsByPrimaryCategory } from "@/lib/grouping";
import { supabase } from "@/lib/supabase";
import { isDemoEmail } from "@/lib/permissions";
import { DemoRestrictionDialog } from "@/components/DemoRestrictionDialog";
import {
  getOrCreateEventDetail,
  updateEventDetail,
  addEventCrew,
  deleteEventCrew,
  addEventSponsor,
  deleteEventSponsor,
  updateEventSponsorStatus,
  addEventVendor,
  deleteEventVendor,
  addEventManualEquipment,
  deleteEventManualEquipment,
  addEventUtility,
  deleteEventUtility,
  addEventGuestStar,
  deleteEventGuestStar,
  addEventGuestStarRider,
  deleteEventGuestStarRider,
  addEventTimelineItem,
  deleteEventTimelineItem,
  createStandaloneEventWorkspace
} from "@/app/actions";

// --- KONSTANTA & HELPER TIMELINE SLOTS (30 MENIT) ---
export const EVENT_TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"
];

export const formatSlotRange = (slots: string[]): string => {
  if (!slots || slots.length === 0) return "";
  const sorted = [...slots].sort();
  const startTime = sorted[0];
  const lastSlot = sorted[sorted.length - 1];
  const [lastH, lastM] = lastSlot.split(":").map(Number);
  let endH = lastH;
  let endM = lastM + 30;
  if (endM >= 60) {
    endH = (endH + 1) % 24;
    endM = endM - 60;
  }
  const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  const totalMinutes = sorted.length * 30;
  return `${startTime} - ${endTime} WIB (${totalMinutes} Menit)`;
};

export const getSlotRangeText = (slot: string): string => {
  const [lastH, lastM] = slot.split(":").map(Number);
  let endH = lastH;
  let endM = lastM + 30;
  if (endM >= 60) {
    endH = (endH + 1) % 24;
    endM = endM - 60;
  }
  return `${slot} - ${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
};

// --- TIPE DATA ---
export interface EventDetailData {
  id: string;
  historyId?: string | null;
  eventName: string;
  durationDays: number;
  clientBudget?: number | null;
  notes?: string | null;
  status: string;
  crews: EventCrewData[];
  sponsors: EventSponsorData[];
  vendors: EventVendorData[];
  manualEquipments: EventManualEquipmentData[];
  utilities: EventUtilityData[];
  guestStars: EventGuestStarData[];
  timelineItems: EventTimelineItemData[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface EventCrewData {
  id: string;
  eventDetailId: string;
  name: string;
  division: string;
  memberCount: number;
  fee: number;
  notes?: string | null;
}

export interface EventSponsorData {
  id: string;
  eventDetailId: string;
  name: string;
  supportType: string;
  amount: number;
  status: string;
  notes?: string | null;
}

export interface EventVendorData {
  id: string;
  eventDetailId: string;
  name: string;
  category: string;
  cost: number;
  isErpPusat: boolean;
  notes?: string | null;
}

export interface EventManualEquipmentData {
  id: string;
  eventDetailId: string;
  name: string;
  category: string;
  quantity: number;
  procurementType: "BELI" | "SEWA";
  unitPrice: number;
  rentalPricePerDay: number;
  rentalDays: number;
  totalCost: number;
  notes?: string | null;
}

export interface EventUtilityData {
  id: string;
  eventDetailId: string;
  name: string;
  category: string;
  quantity: number;
  unit?: string | null;
  procurementType: "BELI" | "SEWA";
  unitPrice: number;
  rentalPricePerDay: number;
  rentalDays: number;
  totalCost: number;
  notes?: string | null;
}

export interface EventGuestStarRiderData {
  id: string;
  guestStarId: string;
  name: string;
  riderType: "TECHNICAL" | "HOSPITALITY";
  sourceType: "ERP_LOGISTIK" | "VENDOR_LUAR";
  quantity: number;
  unit?: string | null;
  procurementType: "SEWA" | "BELI" | "FREE_ERP";
  unitPrice: number;
  rentalPricePerDay: number;
  rentalDays: number;
  totalCost: number;
  notes?: string | null;
}

export interface EventGuestStarData {
  id: string;
  eventDetailId: string;
  name: string;
  category: "BAND" | "SOLO" | "DJ" | "MC_HOST" | "DANCE_PERFORMER" | "LAINNYA";
  personnelCount: number;
  contactPerson?: string | null;
  feePerDay: number;
  durationDays: number;
  totalFee: number;
  dayNumber?: number;
  stageTime?: string | null;
  timelineSlots?: string[];
  notes?: string | null;
  riders: EventGuestStarRiderData[];
}

export interface EventTimelineItemData {
  id: string;
  eventDetailId: string;
  guestStarId?: string | null;
  dayNumber: number;
  title: string;
  category: string;
  startTime: string;
  endTime: string;
  slots: string[];
  stageLocation?: string | null;
  notes?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface EventManagementTabProps {
  histories: any[];
  items: any[];
  initialEventDetails?: EventDetailData[];
}

export default function EventManagementTab({
  histories,
  items,
  initialEventDetails = []
}: EventManagementTabProps) {
  // --- STATE USER & PERMISSIONS ---
  const [isDummyUser, setIsDummyUser] = useState(false);
  const [showDemoWarning, setShowDemoWarning] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setIsDummyUser(isDemoEmail(data.user.email));
      }
    });
  }, []);

  // --- SUB-TAB STATE ---
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "budgeting" | "equipment" | "utility" | "gueststar" | "timeline">("overview");

  // --- DAFTAR EVENT AKTIF DARI ON RENTED (MENGIKUTI DAFTAR EVENT / ACARA AKTIF DI DASHBOARD ON RENTED) ---
  const availableEvents = useMemo(() => {
    const list: {
      id: string;
      title: string;
      date: string;
      durationDays: number;
      erpTotalCost: number;
      payload: any[];
      isActive: boolean;
    }[] = [];

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

    // Urutkan tanggal terbaru
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [histories]);

  // --- EVENT YANG SEDANG DIPILIH ---
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>("");
  const [eventDetail, setEventDetail] = useState<EventDetailData | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Sync selected event data
  const currentSelectedSummary = useMemo(() => {
    return availableEvents.find(e => e.id === selectedHistoryId);
  }, [availableEvents, selectedHistoryId]);

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
      // Jika event yang dipilih sebelumnya adalah standalone event yang sedang dibuka
      if (eventDetail && eventDetail.id === selectedHistoryId) {
        return;
      }
      // Jika ada event aktif di On Rented, default ke event aktif pertama
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

  // --- DIALOG & FORM STATES ---
  const [isStandaloneDialogOpen, setIsStandaloneDialogOpen] = useState(false);
  const [isCrewDialogOpen, setIsCrewDialogOpen] = useState(false);
  const [isSponsorDialogOpen, setIsSponsorDialogOpen] = useState(false);
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [isEquipDialogOpen, setIsEquipDialogOpen] = useState(false);
  const [isUtilityDialogOpen, setIsUtilityDialogOpen] = useState(false);
  const [isEditingEventInfo, setIsEditingEventInfo] = useState(false);

  // Form states for manual equipment dynamic calculation
  const [equipProcurementType, setEquipProcurementType] = useState<"BELI" | "SEWA">("BELI");
  const [equipQty, setEquipQty] = useState<number | "">(1);
  const [equipUnitPrice, setEquipUnitPrice] = useState<number | "">(0);
  const [equipRentalPricePerDay, setEquipRentalPricePerDay] = useState<number | "">(0);
  const [equipRentalDays, setEquipRentalDays] = useState<number | "">(1);

  // Dynamic calculation for manual equipment preview
  const calculatedEquipTotal = useMemo(() => {
    const q = Math.max(1, Number(equipQty) || 1);
    if (equipProcurementType === "BELI") {
      const price = Math.max(0, Number(equipUnitPrice) || 0);
      return q * price;
    } else {
      const perDay = Math.max(0, Number(equipRentalPricePerDay) || 0);
      const days = Math.max(1, Number(equipRentalDays) || 1);
      return q * perDay * days;
    }
  }, [equipProcurementType, equipQty, equipUnitPrice, equipRentalPricePerDay, equipRentalDays]);

  // Form states for Management Utility dynamic calculation
  const [utilityCategory, setUtilityCategory] = useState<string>("Konsumsi");
  const [utilityProcurementType, setUtilityProcurementType] = useState<"BELI" | "SEWA">("BELI");
  const [utilityQty, setUtilityQty] = useState<number | "">(1);
  const [utilityUnit, setUtilityUnit] = useState<string>("Porsi");
  const [utilityUnitPrice, setUtilityUnitPrice] = useState<number | "">(0);
  const [utilityRentalPricePerDay, setUtilityRentalPricePerDay] = useState<number | "">(0);
  const [utilityRentalDays, setUtilityRentalDays] = useState<number | "">(1);

  // Dynamic calculation for utility preview
  const calculatedUtilityTotal = useMemo(() => {
    const q = Math.max(1, Number(utilityQty) || 1);
    if (utilityProcurementType === "BELI") {
      const price = Math.max(0, Number(utilityUnitPrice) || 0);
      return q * price;
    } else {
      const perDay = Math.max(0, Number(utilityRentalPricePerDay) || 0);
      const days = Math.max(1, Number(utilityRentalDays) || 1);
      return q * perDay * days;
    }
  }, [utilityProcurementType, utilityQty, utilityUnitPrice, utilityRentalPricePerDay, utilityRentalDays]);

  // Form states for Guest Star & Riders
  const [isGuestStarDialogOpen, setIsGuestStarDialogOpen] = useState(false);
  const [gsCategory, setGsCategory] = useState<string>("BAND");
  const [gsPersonnelCount, setGsPersonnelCount] = useState<number | "">(1);
  const [gsFeePerDay, setGsFeePerDay] = useState<number | "">(0);
  const [gsDurationDays, setGsDurationDays] = useState<number | "">(1);

  // Timeline states for Guest Star Modal (Cinema-seat blocking system)
  const [gsDayNumber, setGsDayNumber] = useState<number>(1);
  const [gsSelectedSlots, setGsSelectedSlots] = useState<string[]>([]);
  const [gsStageLocation, setGsStageLocation] = useState<string>("Main Stage");

  // Centralized Master Timeline Modal & General Agenda States
  const [isMasterTimelineOpen, setIsMasterTimelineOpen] = useState<boolean>(false);
  const [masterTimelineFilterDay, setMasterTimelineFilterDay] = useState<number>(1);
  const [isAddAgendaDialogOpen, setIsAddAgendaDialogOpen] = useState<boolean>(false);
  const [agendaTitle, setAgendaTitle] = useState<string>("");
  const [agendaCategory, setAgendaCategory] = useState<string>("SOUNDCHECK");
  const [agendaDayNumber, setAgendaDayNumber] = useState<number>(1);
  const [agendaSelectedSlots, setAgendaSelectedSlots] = useState<string[]>([]);
  const [agendaStageLocation, setAgendaStageLocation] = useState<string>("Main Stage");
  const [agendaNotes, setAgendaNotes] = useState<string>("");

  // Helper mapping of occupied slots per day from eventDetail.timelineItems
  const getOccupiedSlotsForDay = useCallback(
    (day: number, excludeGuestStarId?: string, excludeTimelineId?: string) => {
      const map: { [slot: string]: EventTimelineItemData } = {};
      if (!eventDetail?.timelineItems) return map;

      eventDetail.timelineItems.forEach(item => {
        if (item.dayNumber !== day) return;
        if (excludeGuestStarId && item.guestStarId === excludeGuestStarId) return;
        if (excludeTimelineId && item.id === excludeTimelineId) return;

        (item.slots || []).forEach(slot => {
          map[slot] = item;
        });
      });
      return map;
    },
    [eventDetail?.timelineItems]
  );

  const handleToggleGsSlot = (slot: string) => {
    const occupiedMap = getOccupiedSlotsForDay(gsDayNumber);
    if (occupiedMap[slot]) return; // Slot is locked / occupied

    setGsSelectedSlots(prev => {
      if (prev.includes(slot)) {
        return prev.filter(s => s !== slot);
      } else {
        return [...prev, slot].sort();
      }
    });
  };

  const handleToggleAgendaSlot = (slot: string) => {
    const occupiedMap = getOccupiedSlotsForDay(agendaDayNumber);
    if (occupiedMap[slot]) return; // Slot is locked / occupied

    setAgendaSelectedSlots(prev => {
      if (prev.includes(slot)) {
        return prev.filter(s => s !== slot);
      } else {
        return [...prev, slot].sort();
      }
    });
  };

  const calculatedGsTotalFee = useMemo(() => {
    const fee = Math.max(0, Number(gsFeePerDay) || 0);
    const days = Math.max(1, Number(gsDurationDays) || 1);
    return fee * days;
  }, [gsFeePerDay, gsDurationDays]);

  // Form states for adding Rider to specific guest star
  const [isRiderDialogOpen, setIsRiderDialogOpen] = useState(false);
  const [selectedGuestStarForRider, setSelectedGuestStarForRider] = useState<EventGuestStarData | null>(null);
  const [riderSourceType, setRiderSourceType] = useState<"ERP_LOGISTIK" | "VENDOR_LUAR">("ERP_LOGISTIK");
  const [riderType, setRiderType] = useState<"TECHNICAL" | "HOSPITALITY">("TECHNICAL");
  const [riderSelectedErpItemName, setRiderSelectedErpItemName] = useState<string>("");
  const [riderCustomName, setRiderCustomName] = useState<string>("");
  const [riderQuantity, setRiderQuantity] = useState<number | "">(1);
  const [riderUnit, setRiderUnit] = useState<string>("Unit");
  const [riderProcurementType, setRiderProcurementType] = useState<"SEWA" | "BELI">("SEWA");
  const [riderUnitPrice, setRiderUnitPrice] = useState<number | "">(0);
  const [riderRentalPricePerDay, setRiderRentalPricePerDay] = useState<number | "">(0);
  const [riderRentalDays, setRiderRentalDays] = useState<number | "">(1);

  const calculatedRiderTotal = useMemo(() => {
    if (riderSourceType === "ERP_LOGISTIK") return 0;
    const q = Math.max(1, Number(riderQuantity) || 1);
    if (riderProcurementType === "BELI") {
      const price = Math.max(0, Number(riderUnitPrice) || 0);
      return q * price;
    } else {
      const perDay = Math.max(0, Number(riderRentalPricePerDay) || 0);
      const days = Math.max(1, Number(riderRentalDays) || 1);
      return q * perDay * days;
    }
  }, [riderSourceType, riderQuantity, riderProcurementType, riderUnitPrice, riderRentalPricePerDay, riderRentalDays]);

  // Form states for editing basic event info
  const [editDurationDays, setEditDurationDays] = useState<number>(1);
  const [editClientBudget, setEditClientBudget] = useState<number>(0);
  const [editEventNotes, setEditEventNotes] = useState<string>("");

  useEffect(() => {
    if (eventDetail) {
      setEditDurationDays(eventDetail.durationDays || 1);
      setEditClientBudget(eventDetail.clientBudget || 0);
      setEditEventNotes(eventDetail.notes || "");
    }
  }, [eventDetail]);

  // --- GROUPING UTILITIES PER KATEGORI (UNTUK UI & LAPORAN) ---
  const groupedUtilities = useMemo(() => {
    const groups: { [key: string]: EventUtilityData[] } = {};
    const utils = eventDetail?.utilities || [];
    utils.forEach(u => {
      const cat = u.category?.trim() || "Lainnya";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(u);
    });
    return groups;
  }, [eventDetail?.utilities]);

  // --- CALCULATIONS FOR BUDGETING (SUB-TAB 2) ---
  const budgetingStats = useMemo(() => {
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

  // --- EVENT ACTIONS ---
  const handleSaveEventInfo = async () => {
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }
    if (!eventDetail) return;
    const res = await updateEventDetail(eventDetail.id, {
      durationDays: editDurationDays,
      clientBudget: editClientBudget,
      notes: editEventNotes
    });
    if (res.success && res.data) {
      setEventDetail(prev => prev ? { ...prev, ...res.data } : null);
      setIsEditingEventInfo(false);
    } else {
      alert(res.error || "Gagal memperbarui informasi event.");
    }
  };

  const handleAddCrew = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }
    if (!eventDetail) return;
    const formData = new FormData(e.currentTarget);
    const res = await addEventCrew(eventDetail.id, formData);
    if (res.success && res.data) {
      setEventDetail(prev => prev ? {
        ...prev,
        crews: [...prev.crews, res.data as EventCrewData]
      } : null);
      setIsCrewDialogOpen(false);
    } else {
      alert(res.error || "Gagal menambahkan kru.");
    }
  };

  const handleDeleteCrew = async (crewId: string) => {
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }
    const res = await deleteEventCrew(crewId);
    if (res.success) {
      setEventDetail(prev => prev ? {
        ...prev,
        crews: prev.crews.filter(c => c.id !== crewId)
      } : null);
    }
  };

  const handleAddSponsor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }
    if (!eventDetail) return;
    const formData = new FormData(e.currentTarget);
    const res = await addEventSponsor(eventDetail.id, formData);
    if (res.success && res.data) {
      setEventDetail(prev => prev ? {
        ...prev,
        sponsors: [...prev.sponsors, res.data as EventSponsorData]
      } : null);
      setIsSponsorDialogOpen(false);
    } else {
      alert(res.error || "Gagal menambahkan sponsor.");
    }
  };

  const handleDeleteSponsor = async (sponsorId: string) => {
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }
    const res = await deleteEventSponsor(sponsorId);
    if (res.success) {
      setEventDetail(prev => prev ? {
        ...prev,
        sponsors: prev.sponsors.filter(s => s.id !== sponsorId)
      } : null);
    }
  };

  const handleToggleSponsorStatus = async (sponsor: EventSponsorData) => {
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }
    const newStatus = sponsor.status === "CONFIRMED" ? "PENDING" : "CONFIRMED";
    const res = await updateEventSponsorStatus(sponsor.id, newStatus);
    if (res.success) {
      setEventDetail(prev => prev ? {
        ...prev,
        sponsors: prev.sponsors.map(s => s.id === sponsor.id ? { ...s, status: newStatus } : s)
      } : null);
    }
  };

  const handleAddVendor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }
    if (!eventDetail) return;
    const formData = new FormData(e.currentTarget);
    const res = await addEventVendor(eventDetail.id, formData);
    if (res.success && res.data) {
      setEventDetail(prev => prev ? {
        ...prev,
        vendors: [...prev.vendors, res.data as EventVendorData]
      } : null);
      setIsVendorDialogOpen(false);
    } else {
      alert(res.error || "Gagal menambahkan vendor.");
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }
    const res = await deleteEventVendor(vendorId);
    if (res.success) {
      setEventDetail(prev => prev ? {
        ...prev,
        vendors: prev.vendors.filter(v => v.id !== vendorId)
      } : null);
    } else {
      alert(res.error || "Gagal menghapus vendor.");
    }
  };

  const handleAddManualEquip = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }
    if (!eventDetail) return;
    const formData = new FormData(e.currentTarget);
    formData.set("procurementType", equipProcurementType);
    const res = await addEventManualEquipment(eventDetail.id, formData);
    if (res.success && res.data) {
      setEventDetail(prev => prev ? {
        ...prev,
        manualEquipments: [...prev.manualEquipments, res.data as EventManualEquipmentData]
      } : null);
      setIsEquipDialogOpen(false);
      // Reset form fields
      setEquipQty(1);
      setEquipUnitPrice(0);
      setEquipRentalPricePerDay(0);
      setEquipRentalDays(1);
    } else {
      alert(res.error || "Gagal menambahkan peralatan manual.");
    }
  };

  const handleDeleteManualEquip = async (equipId: string) => {
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }
    const res = await deleteEventManualEquipment(equipId);
    if (res.success) {
      setEventDetail(prev => prev ? {
        ...prev,
        manualEquipments: prev.manualEquipments.filter(e => e.id !== equipId)
      } : null);
    }
  };

  const handleAddUtility = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }
    if (!eventDetail) return;
    const formData = new FormData(e.currentTarget);
    formData.set("category", utilityCategory);
    formData.set("procurementType", utilityProcurementType);
    formData.set("unit", utilityUnit);

    const res = await addEventUtility(eventDetail.id, formData);
    if (res.success && res.data) {
      setEventDetail(prev => prev ? {
        ...prev,
        utilities: [...(prev.utilities || []), res.data as EventUtilityData]
      } : null);
      setIsUtilityDialogOpen(false);
      // Reset form fields
      setUtilityQty(1);
      setUtilityUnitPrice(0);
      setUtilityRentalPricePerDay(0);
      setUtilityRentalDays(1);
    } else {
      alert(res.error || "Gagal menambahkan kebutuhan utilitas.");
    }
  };

  const handleDeleteUtility = async (utilityId: string) => {
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }
    const res = await deleteEventUtility(utilityId);
    if (res.success) {
      setEventDetail(prev => prev ? {
        ...prev,
        utilities: (prev.utilities || []).filter(u => u.id !== utilityId)
      } : null);
    }
  };

  const handleAddGuestStar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }
    if (!eventDetail) return;
    const formData = new FormData(e.currentTarget);
    formData.set("category", gsCategory);
    formData.set("personnelCount", String(gsPersonnelCount || 1));
    formData.set("feePerDay", String(gsFeePerDay || 0));
    formData.set("durationDays", String(gsDurationDays || eventDetail.durationDays || 1));
    formData.set("dayNumber", String(gsDayNumber || 1));
    formData.set("stageLocation", gsStageLocation || "Main Stage");
    formData.set("timelineSlots", JSON.stringify(gsSelectedSlots));
    if (gsSelectedSlots.length > 0) {
      formData.set("stageTime", formatSlotRange(gsSelectedSlots));
    }

    const res = await addEventGuestStar(eventDetail.id, formData);
    if (res.success && res.data) {
      setEventDetail(prev => {
        if (!prev) return null;
        const newGs: EventGuestStarData = {
          ...(res.data as EventGuestStarData),
          riders: []
        };
        const updatedTimeline = (res as any).timelineItem
          ? [...(prev.timelineItems || []), (res as any).timelineItem as EventTimelineItemData]
          : (prev.timelineItems || []);

        return {
          ...prev,
          guestStars: [...(prev.guestStars || []), newGs],
          timelineItems: updatedTimeline
        };
      });
      setIsGuestStarDialogOpen(false);
      setGsFeePerDay(0);
      setGsPersonnelCount(1);
      setGsSelectedSlots([]);
      setGsDayNumber(1);
      setGsStageLocation("Main Stage");
    } else {
      alert(res.error || "Gagal menambahkan Guest Star.");
    }
  };

  const handleDeleteGuestStar = async (guestStarId: string) => {
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }
    const res = await deleteEventGuestStar(guestStarId);
    if (res.success) {
      setEventDetail(prev => prev ? {
        ...prev,
        guestStars: (prev.guestStars || []).filter(g => g.id !== guestStarId),
        timelineItems: (prev.timelineItems || []).filter(item => item.guestStarId !== guestStarId)
      } : null);
    }
  };

  const handleAddTimelineAgenda = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }
    if (!eventDetail) return;
    if (agendaSelectedSlots.length === 0) {
      alert("Pilih minimal 1 slot waktu (30 menit).");
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("title", agendaTitle);
    formData.set("category", agendaCategory);
    formData.set("dayNumber", String(agendaDayNumber || 1));
    formData.set("stageLocation", agendaStageLocation || "Main Stage");
    formData.set("notes", agendaNotes || "");
    formData.set("slots", JSON.stringify(agendaSelectedSlots));

    const res = await addEventTimelineItem(eventDetail.id, formData);
    if (res.success && res.data) {
      setEventDetail(prev => prev ? {
        ...prev,
        timelineItems: [...(prev.timelineItems || []), res.data as EventTimelineItemData]
      } : null);
      setIsAddAgendaDialogOpen(false);
      setAgendaTitle("");
      setAgendaNotes("");
      setAgendaSelectedSlots([]);
    } else {
      alert(res.error || "Gagal menambahkan agenda timeline.");
    }
  };

  const handleDeleteTimelineItem = async (timelineItemId: string) => {
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }
    const res = await deleteEventTimelineItem(timelineItemId);
    if (res.success) {
      setEventDetail(prev => prev ? {
        ...prev,
        timelineItems: (prev.timelineItems || []).filter(item => item.id !== timelineItemId)
      } : null);
    }
  };

  const handleAddRider = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }
    if (!selectedGuestStarForRider) return;
    const formData = new FormData(e.currentTarget);
    const finalName = riderSourceType === "ERP_LOGISTIK" ? riderSelectedErpItemName : riderCustomName;
    if (!finalName) {
      alert("Pilih barang dari gudang ERP atau ketik nama riders.");
      return;
    }

    formData.set("name", finalName);
    formData.set("sourceType", riderSourceType);
    formData.set("riderType", riderType);
    formData.set("quantity", String(riderQuantity || 1));
    formData.set("unit", riderUnit);
    formData.set("procurementType", riderSourceType === "ERP_LOGISTIK" ? "FREE_ERP" : riderProcurementType);
    if (riderSourceType === "VENDOR_LUAR") {
      formData.set("unitPrice", String(riderUnitPrice || 0));
      formData.set("rentalPricePerDay", String(riderRentalPricePerDay || 0));
      formData.set("rentalDays", String(riderRentalDays || 1));
    }

    const res = await addEventGuestStarRider(selectedGuestStarForRider.id, formData);
    if (res.success && res.data) {
      setEventDetail(prev => {
        if (!prev) return null;
        return {
          ...prev,
          guestStars: (prev.guestStars || []).map(gs => {
            if (gs.id === selectedGuestStarForRider.id) {
              return {
                ...gs,
                riders: [...(gs.riders || []), res.data as EventGuestStarRiderData]
              };
            }
            return gs;
          })
        };
      });
      setIsRiderDialogOpen(false);
      setRiderCustomName("");
      setRiderSelectedErpItemName("");
      setRiderUnitPrice(0);
      setRiderRentalPricePerDay(0);
      setRiderRentalDays(1);
    } else {
      alert(res.error || "Gagal menambahkan item riders.");
    }
  };

  const handleDeleteRider = async (guestStarId: string, riderId: string) => {
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }
    const res = await deleteEventGuestStarRider(riderId);
    if (res.success) {
      setEventDetail(prev => {
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

  const handleCreateStandalone = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("eventName") as string) || "Event Baru";
    const days = Math.max(1, parseInt(formData.get("durationDays") as string) || 1);
    const budget = Math.max(0, parseFloat(formData.get("clientBudget") as string) || 0);

    const res = await createStandaloneEventWorkspace(name, days, budget);
    if (res.success && res.data) {
      setEventDetail(res.data as EventDetailData);
      setSelectedHistoryId(res.data.id);
      setIsStandaloneDialogOpen(false);
    } else {
      alert(res.error || "Gagal membuat workspace event.");
    }
  };

  // Format IDR currency helper
  const formatRupiah = (val: number = 0) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Helper Icon Kategori Utilitas
  const getCategoryIcon = (category: string) => {
    const catLower = category.toLowerCase();
    if (catLower.includes("konsumsi") || catLower.includes("makan") || catLower.includes("catering")) {
      return <Utensils className="w-4 h-4 text-amber-400" />;
    }
    if (catLower.includes("akomodasi") || catLower.includes("hotel") || catLower.includes("penginapan")) {
      return <Building2 className="w-4 h-4 text-blue-400" />;
    }
    if (catLower.includes("transport") || catLower.includes("kendaraan") || catLower.includes("mobil")) {
      return <Truck className="w-4 h-4 text-emerald-400" />;
    }
    if (catLower.includes("listrik") || catLower.includes("bbm") || catLower.includes("genset") || catLower.includes("daya")) {
      return <Zap className="w-4 h-4 text-yellow-400" />;
    }
    if (catLower.includes("komunikasi") || catLower.includes("ht") || catLower.includes("internet") || catLower.includes("wifi")) {
      return <Radio className="w-4 h-4 text-purple-400" />;
    }
    if (catLower.includes("medis") || catLower.includes("p3k") || catLower.includes("kesehatan")) {
      return <HeartPulse className="w-4 h-4 text-rose-400" />;
    }
    if (catLower.includes("tools") || catLower.includes("teknis") || catLower.includes("alat")) {
      return <Wrench className="w-4 h-4 text-cyan-400" />;
    }
    return <Boxes className="w-4 h-4 text-indigo-400" />;
  };

  // Helper Badge Kategori Guest Star
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
            <Star className="w-3.5 h-3.5 text-zinc-400" /> Bintang Tamu
          </span>
        );
    }
  };

  // Helper Badge Kategori Timeline Agenda
  const getTimelineCategoryBadge = (category: string) => {
    switch (category) {
      case "PERFORMANCE":
        return (
          <span className="bg-purple-950/80 border border-purple-700/60 text-purple-300 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap">
            <Mic className="w-3.5 h-3.5 text-purple-400" /> Show / Performance
          </span>
        );
      case "SOUNDCHECK":
        return (
          <span className="bg-amber-950/80 border border-amber-700/60 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap">
            <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Soundcheck / GR
          </span>
        );
      case "BRIEFING":
        return (
          <span className="bg-blue-950/80 border border-blue-700/60 text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap">
            <Users className="w-3.5 h-3.5 text-blue-400" /> Briefing Kru
          </span>
        );
      case "GATE_OPEN":
        return (
          <span className="bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap">
            <DoorOpen className="w-3.5 h-3.5 text-emerald-400" /> Open Gate / Registrasi
          </span>
        );
      case "BREAK":
        return (
          <span className="bg-rose-950/80 border border-rose-700/60 text-rose-300 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap">
            <Coffee className="w-3.5 h-3.5 text-rose-400" /> Break / Ishoma
          </span>
        );
      default:
        return (
          <span className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-zinc-400" /> Agenda Umum
          </span>
        );
    }
  };

  // --- CENTRALIZED TIMELINE VIEW RENDERER (DIPAKAI DI SUB-TAB 6 & DIALOG MODAL) ---
  const renderTimelineContent = () => {
    const currentDayItems = (eventDetail?.timelineItems || [])
      .filter(item => item.dayNumber === masterTimelineFilterDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const occupiedMap = getOccupiedSlotsForDay(masterTimelineFilterDay);
    const totalOccupiedSlotsCount = Object.keys(occupiedMap).length;
    const totalFreeSlotsCount = Math.max(0, EVENT_TIME_SLOTS.length - totalOccupiedSlotsCount);

    const guestStarsInDay = (eventDetail?.guestStars || []).filter(
      gs => (gs.dayNumber || 1) === masterTimelineFilterDay
    );

    return (
      <div className="space-y-6">
        {/* Header Controls: Hari & Tambah Agenda */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950/60 p-4 border border-zinc-800/80 rounded-2xl">
          {/* Day Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Filter Hari:
            </span>
            {Array.from({ length: eventDetail?.durationDays || 1 }).map((_, idx) => {
              const dNum = idx + 1;
              const isCurrent = masterTimelineFilterDay === dNum;
              const itemsInThisDay = (eventDetail?.timelineItems || []).filter(i => i.dayNumber === dNum).length;
              return (
                <button
                  key={dNum}
                  type="button"
                  onClick={() => setMasterTimelineFilterDay(dNum)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isCurrent
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40 ring-1 ring-indigo-400"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  <span>Hari ke-{dNum}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isCurrent ? "bg-indigo-800 text-white" : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {itemsInThisDay}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Action Button: Tambah Agenda Acara */}
          <button
            type="button"
            onClick={() => {
              setAgendaDayNumber(masterTimelineFilterDay);
              setAgendaSelectedSlots([]);
              setIsAddAgendaDialogOpen(true);
            }}
            className="whitespace-nowrap shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-indigo-900/30 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Tambah Agenda Rundown</span>
          </button>
        </div>

        {/* Quick Metrics Bar Hari Ini */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-zinc-400">Total Agenda Terjadwal</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-zinc-100">
                {currentDayItems.length}
              </span>
              <span className="text-xs text-zinc-400">Sesi</span>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-zinc-400">Guest Star di Hari Ini</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-purple-400">
                {guestStarsInDay.length}
              </span>
              <span className="text-xs text-zinc-400">Performer</span>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-zinc-400">Slot Terpakai (Locked)</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-amber-400">
                {totalOccupiedSlotsCount}
              </span>
              <span className="text-xs text-zinc-400">/ 32 Slot ({(totalOccupiedSlotsCount * 0.5).toFixed(1)} Jam)</span>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-zinc-400">Slot Tersedia (Bebas)</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-emerald-400">
                {totalFreeSlotsCount}
              </span>
              <span className="text-xs text-zinc-400">Slot Bebas</span>
            </div>
          </div>
        </div>

        {/* Matrix Visual Timeline Bar (08:00 - 23:30) */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
            <div>
              <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Visual Matrix Jadwal Panggung (Hari ke-{masterTimelineFilterDay})</span>
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Visual blocking 30-menit terpusat. Slot hijau bebas dapat diklik langsung untuk menjadwalkan agenda.
              </p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span className="text-zinc-400">Show</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-zinc-400">Soundcheck</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="text-zinc-400">Briefing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-zinc-400">Gate Open</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="text-zinc-400">Break</span>
              </div>
            </div>
          </div>

          {/* Grid Slots */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
            {EVENT_TIME_SLOTS.map(slot => {
              const occupied = occupiedMap[slot];
              if (occupied) {
                const getBorderAndBg = () => {
                  switch (occupied.category) {
                    case "PERFORMANCE":
                      return "bg-purple-950/70 border-purple-600/70 text-purple-200";
                    case "SOUNDCHECK":
                      return "bg-amber-950/70 border-amber-600/70 text-amber-200";
                    case "BRIEFING":
                      return "bg-blue-950/70 border-blue-600/70 text-blue-200";
                    case "GATE_OPEN":
                      return "bg-emerald-950/70 border-emerald-600/70 text-emerald-200";
                    case "BREAK":
                      return "bg-rose-950/70 border-rose-600/70 text-rose-200";
                    default:
                      return "bg-zinc-800 border-zinc-600 text-zinc-200";
                  }
                };

                return (
                  <div
                    key={slot}
                    title={`🔒 Terkunci:\n${occupied.title}\n(${occupied.startTime} - ${occupied.endTime} WIB)\nKategori: ${occupied.category}\nLokasi: ${occupied.stageLocation || 'Main Stage'}`}
                    className={`p-2 rounded-xl border text-center transition-all shadow-sm flex flex-col items-center justify-between min-h-[62px] ${getBorderAndBg()}`}
                  >
                    <span className="text-[11px] font-mono font-bold leading-tight whitespace-nowrap">{getSlotRangeText(slot)}</span>
                    <span className="text-[10px] font-semibold truncate max-w-full px-0.5 mt-0.5">
                      {occupied.title}
                    </span>
                  </div>
                );
              }

              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => {
                    setAgendaDayNumber(masterTimelineFilterDay);
                    setAgendaSelectedSlots([slot]);
                    setIsAddAgendaDialogOpen(true);
                  }}
                  title={`Klik untuk menjadwalkan agenda di jam ${getSlotRangeText(slot)}`}
                  className="p-2 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-900/40 hover:border-emerald-500 text-emerald-400 hover:text-emerald-200 text-center cursor-pointer transition-all flex flex-col items-center justify-between min-h-[62px]"
                >
                  <span className="text-[11px] font-mono font-bold leading-tight whitespace-nowrap">{getSlotRangeText(slot)}</span>
                  <span className="text-[9px] text-emerald-400/80 mt-0.5">+ Jadwalkan</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Chronological Rundown List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-indigo-400" />
              <span>Daftar Rundown & Agenda Hari ke-{masterTimelineFilterDay}</span>
              <span className="text-xs text-zinc-400 font-normal">({currentDayItems.length} Agenda)</span>
            </h4>
          </div>

          {currentDayItems.length > 0 ? (
            <div className="space-y-2.5">
              {currentDayItems.map(item => {
                const durationMinutes = (item.slots || []).length * 30;
                return (
                  <div
                    key={item.id}
                    className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-sm"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      {/* Time Badge */}
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-center shrink-0 min-w-[110px]">
                        <span className="text-xs font-mono font-bold text-zinc-100 block">
                          {item.startTime} - {item.endTime}
                        </span>
                        <span className="text-[10px] text-indigo-400 font-semibold block mt-0.5">
                          {durationMinutes} Menit ({(item.slots || []).length} Slot)
                        </span>
                      </div>

                      {/* Info & Category */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {getTimelineCategoryBadge(item.category)}
                          <h5 className="text-base font-bold text-zinc-100 leading-snug">
                            {item.title}
                          </h5>
                          {item.stageLocation && (
                            <span className="text-[11px] bg-zinc-800/80 text-zinc-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                              📍 {item.stageLocation}
                            </span>
                          )}
                        </div>

                        {item.notes && (
                          <p className="text-xs text-zinc-400 italic">
                            Catatan: {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800/60 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDeleteTimelineItem(item.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 hover:bg-rose-950/80 hover:text-rose-400 text-zinc-500 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-transparent hover:border-rose-900/60"
                        title="Hapus Agenda & Buka Slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl p-6 space-y-2">
              <Clock className="w-8 h-8 text-zinc-600 mx-auto" />
              <h5 className="text-sm font-bold text-zinc-300">Belum Ada Agenda Terjadwal di Hari ke-{masterTimelineFilterDay}</h5>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Mulai susun rundown dengan menambahkan Guest Star di tab Guest Star atau tambahkan agenda soundcheck/briefing di sini.
              </p>
              <button
                type="button"
                onClick={() => {
                  setAgendaDayNumber(masterTimelineFilterDay);
                  setAgendaSelectedSlots([]);
                  setIsAddAgendaDialogOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors mt-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tambah Agenda Hari Ini
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ============================================================ */}
      {/* 1. HEADER HALAMAN EVENT & SELECTOR DROPDOWN */}
      {/* ============================================================ */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Judul & Selector */}
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
              <Calendar className="w-4 h-4" />
              <span>Event Operations & Workspace</span>
              {currentSelectedSummary?.isActive && (
                <span className="flex items-center gap-1 bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] lowercase font-normal">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  on rented aktif
                </span>
              )}
              {eventDetail && !currentSelectedSummary && (
                <span className="flex items-center gap-1 bg-blue-950/80 border border-blue-700/60 text-blue-400 px-2 py-0.5 rounded-full text-[10px] lowercase font-normal">
                  workspace mandiri
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <select
                  value={selectedHistoryId}
                  onChange={e => setSelectedHistoryId(e.target.value)}
                  className="w-full bg-zinc-950 text-zinc-100 text-sm sm:text-base font-semibold border border-zinc-700 hover:border-zinc-600 focus:border-blue-500 rounded-xl px-4 py-3 outline-none transition-all shadow-inner cursor-pointer"
                >
                  {availableEvents.length === 0 && !eventDetail && (
                    <option value="">-- Tidak ada acara aktif di On Rented --</option>
                  )}
                  {availableEvents.map(event => (
                    <option key={event.id} value={event.id}>
                      🟢 [Aktif] {event.title} ({event.durationDays} Hari) - {formatRupiah(event.erpTotalCost)}
                    </option>
                  ))}
                  {eventDetail && !availableEvents.some(e => e.id === eventDetail.id) && (
                    <option value={eventDetail.id}>
                      ✨ [Mandiri] {eventDetail.eventName} ({eventDetail.durationDays} Hari)
                    </option>
                  )}
                </select>
              </div>

              {/* Tombol Buat Event Mandiri */}
              <Dialog open={isStandaloneDialogOpen} onOpenChange={setIsStandaloneDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-sm font-semibold transition-colors shadow-sm whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-blue-400" />
                    <span>Workspace Baru</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold">Inisialisasi Workspace Event Mandiri</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateStandalone} className="space-y-4 pt-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">Nama Acara / Event</label>
                      <input
                        type="text"
                        name="eventName"
                        required
                        placeholder="Contoh: Konser Rock Merdeka 2026"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Durasi (Jumlah Hari)</label>
                        <input
                          type="number"
                          name="durationDays"
                          min="1"
                          defaultValue={1}
                          required
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Budget Klien (IDR)</label>
                        <input
                          type="number"
                          name="clientBudget"
                          min="0"
                          defaultValue={0}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setIsStandaloneDialogOpen(false)}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                      >
                        Buat Workspace
                      </button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Quick Metrics Bar (Header Summary) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-zinc-400">Durasi Acara</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-zinc-100">
                  {eventDetail?.durationDays || currentSelectedSummary?.durationDays || 1}
                </span>
                <span className="text-xs text-zinc-400">Hari</span>
              </div>
            </div>

            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-zinc-400">Tagihan ERP Pusat</span>
              <div className="mt-1">
                <span className="text-lg font-black text-amber-400 truncate block">
                  {formatRupiah(currentSelectedSummary?.erpTotalCost || 0)}
                </span>
              </div>
            </div>

            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between col-span-2 sm:col-span-1">
              <span className="text-[11px] font-medium text-zinc-400">Total Pengeluaran</span>
              <div className="mt-1">
                <span className="text-lg font-black text-rose-400 truncate block">
                  {formatRupiah(budgetingStats.grandTotalPengeluaran)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {availableEvents.length === 0 && !eventDetail ? (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-10 sm:p-14 text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-500 shadow-inner">
            <Calendar className="w-8 h-8 text-amber-400" />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-lg font-bold text-zinc-100">Tidak Ada Acara Aktif di On Rented</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Saat ini tidak ada acara rental yang berstatus aktif di tab On Rented. Anda dapat menyewakan alat dengan tipe Event di POS Kasir atau membuat workspace mandiri baru.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsStandaloneDialogOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Inisialisasi Workspace Baru</span>
          </button>
        </div>
      ) : (
        <>
          {/* ============================================================ */}
          {/* 2. SUB-TAB NAVIGATION (RESPONSIVE WRAP, TANPA SCROLLBAR SAMPING) */}
          {/* ============================================================ */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-2 sm:p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        {/* Buttons List with flex-wrap so it wraps cleanly without cutting off */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-Tab 1: Overview */}
          <button
            type="button"
            onClick={() => setActiveSubTab("overview")}
            className={`whitespace-nowrap flex items-center gap-2 py-2 px-3.5 font-semibold text-xs sm:text-sm transition-all rounded-xl cursor-pointer ${
              activeSubTab === "overview"
                ? "bg-blue-950/70 border border-blue-500/80 text-blue-300 ring-1 ring-blue-500/40 shadow-sm"
                : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 hover:border-zinc-700"
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Overview & Operasional</span>
            <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full ml-1 font-bold">
              {(eventDetail?.crews?.length || 0) + (eventDetail?.sponsors?.length || 0) + (eventDetail?.vendors?.length || 0)}
            </span>
          </button>

          {/* Sub-Tab 2: Budgeting */}
          <button
            type="button"
            onClick={() => setActiveSubTab("budgeting")}
            className={`whitespace-nowrap flex items-center gap-2 py-2 px-3.5 font-semibold text-xs sm:text-sm transition-all rounded-xl cursor-pointer ${
              activeSubTab === "budgeting"
                ? "bg-emerald-950/70 border border-emerald-500/80 text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm"
                : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 hover:border-zinc-700"
            }`}
          >
            <DollarSign className="w-4 h-4 shrink-0" />
            <span>Budgeting (Keuangan)</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full ml-1 font-bold ${
              budgetingStats.isSurplus 
                ? "bg-emerald-900/80 text-emerald-300 border border-emerald-700/60"
                : "bg-rose-900/80 text-rose-300 border border-rose-700/60"
            }`}>
              {budgetingStats.isSurplus ? "+ Surplus" : "- Defisit"}
            </span>
          </button>

          {/* Sub-Tab 3: Alat */}
          <button
            type="button"
            onClick={() => setActiveSubTab("equipment")}
            className={`whitespace-nowrap flex items-center gap-2 py-2 px-3.5 font-semibold text-xs sm:text-sm transition-all rounded-xl cursor-pointer ${
              activeSubTab === "equipment"
                ? "bg-cyan-950/70 border border-cyan-500/80 text-cyan-300 ring-1 ring-cyan-500/40 shadow-sm"
                : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 hover:border-zinc-700"
            }`}
          >
            <Package className="w-4 h-4 shrink-0" />
            <span>Manajemen Perlengkapan (Alat)</span>
            <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full ml-1 font-bold">
              {(currentSelectedSummary?.payload?.length || 0) + (eventDetail?.manualEquipments?.length || 0)}
            </span>
          </button>

          {/* Sub-Tab 4: Management Utility */}
          <button
            type="button"
            onClick={() => setActiveSubTab("utility")}
            className={`whitespace-nowrap flex items-center gap-2 py-2 px-3.5 font-semibold text-xs sm:text-sm transition-all rounded-xl cursor-pointer ${
              activeSubTab === "utility"
                ? "bg-amber-950/70 border border-amber-500/80 text-amber-300 ring-1 ring-amber-500/40 shadow-sm"
                : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 hover:border-zinc-700"
            }`}
          >
            <Coffee className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Management Utility</span>
            <span className="text-[11px] bg-zinc-800 text-amber-400 px-2 py-0.5 rounded-full ml-1 font-bold">
              {eventDetail?.utilities?.length || 0}
            </span>
          </button>

          {/* Sub-Tab 5: Guest Star & Riders */}
          <button
            type="button"
            onClick={() => setActiveSubTab("gueststar")}
            className={`whitespace-nowrap flex items-center gap-2 py-2 px-3.5 font-semibold text-xs sm:text-sm transition-all rounded-xl cursor-pointer ${
              activeSubTab === "gueststar"
                ? "bg-purple-950/70 border border-purple-500/80 text-purple-300 ring-1 ring-purple-500/40 shadow-sm"
                : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 hover:border-zinc-700"
            }`}
          >
            <Mic className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Guest Star & Riders</span>
            <span className="text-[11px] bg-zinc-800 text-purple-300 px-2 py-0.5 rounded-full ml-1 font-bold">
              {eventDetail?.guestStars?.length || 0}
            </span>
          </button>

          {/* Sub-Tab 6: Master Timeline Terpusat */}
          <button
            type="button"
            onClick={() => setActiveSubTab("timeline")}
            className={`whitespace-nowrap flex items-center gap-2 py-2 px-3.5 font-semibold text-xs sm:text-sm transition-all rounded-xl cursor-pointer ${
              activeSubTab === "timeline"
                ? "bg-indigo-950/70 border border-indigo-500/80 text-indigo-300 ring-1 ring-indigo-500/40 shadow-sm"
                : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 hover:border-zinc-700"
            }`}
          >
            <CalendarDays className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Master Timeline Terpusat</span>
            <span className="text-[11px] bg-zinc-800 text-indigo-300 px-2 py-0.5 rounded-full ml-1 font-bold">
              {eventDetail?.timelineItems?.length || 0}
            </span>
          </button>
        </div>

        {/* Info ID & Edit Button */}
        {eventDetail && (
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              onClick={() => setIsEditingEventInfo(!isEditingEventInfo)}
              className="whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-600 rounded-xl text-xs font-semibold text-zinc-300 transition-colors cursor-pointer shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-400" />
              <span>{isEditingEventInfo ? "Tutup Edit" : "Edit Info Acara"}</span>
            </button>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* QUICK INLINE FORM EDIT EVENT INFO (JIKA TERBUKA) */}
      {/* ============================================================ */}
      {isEditingEventInfo && eventDetail && (
        <div className="bg-zinc-900 border border-blue-900/50 rounded-xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-blue-400" /> Ubah Parameter Dasar Event
            </h4>
            <span className="text-xs text-zinc-500 font-mono">ID: {eventDetail.id}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Durasi Acara (Hari)</label>
              <input
                type="number"
                min="1"
                value={editDurationDays}
                onChange={e => setEditDurationDays(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Budget Klien (IDR)</label>
              <input
                type="number"
                min="0"
                value={editClientBudget}
                onChange={e => setEditClientBudget(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Catatan Tambahan Event</label>
              <input
                type="text"
                value={editEventNotes}
                onChange={e => setEditEventNotes(e.target.value)}
                placeholder="Misal: Lokasi Lapangan Gasibu, loading h-1"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsEditingEventInfo(false)}
              className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveEventInfo}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Simpan Perubahan
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. SUB-TAB 1: OVERVIEW & OPERASIONAL (CREW, SPONSOR, VENDOR) */}
      {/* ============================================================ */}
      {activeSubTab === "overview" && (
        <div className="space-y-8">
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

              <Dialog open={isCrewDialogOpen} onOpenChange={setIsCrewDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Tambah Kru
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold">Tambah Kru / Petugas Lapangan</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddCrew} className="space-y-4 pt-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">Nama Personil / Tim</label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="Contoh: Budi Santoso / Tim Audio FoH"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Divisi</label>
                        <select
                          name="division"
                          defaultValue="Audio"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="Audio">Audio / Sound</option>
                          <option value="Lighting">Lighting</option>
                          <option value="Stage">Stage & Rigging</option>
                          <option value="Runner">Runner / Lapangan</option>
                          <option value="Dokumentasi">Dokumentasi & Media</option>
                          <option value="Multimedia">Multimedia / LED</option>
                          <option value="Keamanan">Keamanan & Crowd Control</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Jumlah Orang</label>
                        <input
                          type="number"
                          name="memberCount"
                          min="1"
                          defaultValue={1}
                          required
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">Total Fee / Honor (IDR)</label>
                      <input
                        type="number"
                        name="fee"
                        min="0"
                        defaultValue={0}
                        placeholder="Nominal honor"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">Catatan Tugas / Posisi</label>
                      <input
                        type="text"
                        name="notes"
                        placeholder="Contoh: Standby FoH & Soundcheck"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setIsCrewDialogOpen(false)}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                      >
                        Simpan Kru
                      </button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
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
                Belum ada kru yang ditambahkan. Klik "Tambah Kru" di atas untuk mencatat daftar tim.
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

              <Dialog open={isSponsorDialogOpen} onOpenChange={setIsSponsorDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Tambah Sponsor
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold">Pencatatan Sponsor Baru</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddSponsor} className="space-y-4 pt-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">Nama Sponsor / Perusahaan</label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="Contoh: Bank BCA / PT Sumber Berkah"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Bentuk Dukungan</label>
                        <select
                          name="supportType"
                          defaultValue="DANA"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="DANA">Dukungan Dana (Cash)</option>
                          <option value="BARANG">Barang / In-Kind</option>
                          <option value="MEDIA">Media Partner</option>
                          <option value="LAINNYA">Lainnya</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Status</label>
                        <select
                          name="status"
                          defaultValue="CONFIRMED"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="CONFIRMED">Confirmed / Masuk</option>
                          <option value="PENDING">Pending / Verifikasi</option>
                          <option value="PROPOSAL">Proposal / Negosiasi</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">Nominal Dana / Estimasi Nilai (IDR)</label>
                      <input
                        type="number"
                        name="amount"
                        min="0"
                        defaultValue={0}
                        required
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">Catatan / Kontrak</label>
                      <input
                        type="text"
                        name="notes"
                        placeholder="Contoh: Logo di backdrop & 500 pcs lanyard"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setIsSponsorDialogOpen(false)}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                      >
                        Simpan Sponsor
                      </button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
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

              <Dialog open={isVendorDialogOpen} onOpenChange={setIsVendorDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Tambah Vendor Eksternal
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold">Tambah Vendor Eksternal</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddVendor} className="space-y-4 pt-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">Nama Vendor / Perusahaan</label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="Contoh: Catering Bu Sari / PT Mega Genset"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Kategori Pekerjaan</label>
                        <input
                          type="text"
                          name="category"
                          required
                          placeholder="Misal: Konsumsi / Kelistrikan"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Estimasi Biaya (IDR)</label>
                        <input
                          type="number"
                          name="cost"
                          min="0"
                          defaultValue={0}
                          required
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">Catatan Pekerjaan</label>
                      <input
                        type="text"
                        name="notes"
                        placeholder="Contoh: 150 porsi makan siang kru"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setIsVendorDialogOpen(false)}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                      >
                        Simpan Vendor
                      </button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
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
      )}

      {/* ============================================================ */}
      {/* 4. SUB-TAB 2: BUDGETING (RINGKASAN KEUANGAN) */}
      {/* ============================================================ */}
      {activeSubTab === "budgeting" && (
        <div className="space-y-8 animate-in fade-in duration-150">
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Total Pemasukan */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Pemasukan</span>
                <span className="p-2 bg-emerald-950/60 border border-emerald-800/40 rounded-xl text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-emerald-400 block truncate">
                  {formatRupiah(budgetingStats.totalPemasukan)}
                </span>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Budget Klien + Sponsor Masuk
                </p>
              </div>
            </div>

            {/* KPI 2: Tagihan ERP Pusat (1 Baris Ringkas) */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sewa ERP Pusat</span>
                <span className="p-2 bg-amber-950/60 border border-amber-800/40 rounded-xl text-amber-400">
                  <Package className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-amber-400 block truncate">
                  {formatRupiah(budgetingStats.erpCost)}
                </span>
                <p className="text-[11px] text-zinc-500 mt-1 truncate">
                  {currentSelectedSummary?.title || "Tagihan Gudang"}
                </p>
              </div>
            </div>

            {/* KPI 3: Grand Total Pengeluaran */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Pengeluaran</span>
                <span className="p-2 bg-rose-950/60 border border-rose-800/40 rounded-xl text-rose-400">
                  <TrendingDown className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-rose-400 block truncate">
                  {formatRupiah(budgetingStats.grandTotalPengeluaran)}
                </span>
                <p className="text-[11px] text-zinc-500 mt-1">
                  ERP + Alat + Kru + Vendor + Utilitas
                </p>
              </div>
            </div>

            {/* KPI 4: Sisa Anggaran / Laba Bersih */}
            <div className={`border rounded-2xl p-5 flex flex-col justify-between shadow-sm ${
              budgetingStats.isSurplus 
                ? "bg-emerald-950/20 border-emerald-800/50" 
                : "bg-rose-950/20 border-rose-800/50"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  {budgetingStats.isSurplus ? "Surplus Anggaran" : "Defisit Anggaran"}
                </span>
                <span className={`p-2 rounded-xl border ${
                  budgetingStats.isSurplus
                    ? "bg-emerald-900/60 border-emerald-700/60 text-emerald-300"
                    : "bg-rose-900/60 border-rose-700/60 text-rose-300"
                }`}>
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <span className={`text-2xl font-black block truncate ${
                  budgetingStats.isSurplus ? "text-emerald-400" : "text-rose-400"
                }`}>
                  {formatRupiah(budgetingStats.netBalance)}
                </span>
                <p className="text-[11px] text-zinc-400 mt-1">
                  {budgetingStats.isSurplus ? "Margin keuangan aman" : "Perlu penyesuaian biaya"}
                </p>
              </div>
            </div>
          </div>

          {/* Breakdown Komparasi Lengkap (Pemasukan vs Pengeluaran) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Kolom Kiri: Rincian Pemasukan */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="font-bold text-zinc-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" /> Sumber Pemasukan Acara
                </h3>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-0.5 rounded-full">
                  Total: {formatRupiah(budgetingStats.totalPemasukan)}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-zinc-950/50 border border-zinc-800 rounded-xl">
                  <div>
                    <span className="font-semibold text-zinc-200 block text-sm">Budget Alokasi Klien</span>
                    <span className="text-xs text-zinc-500">Anggaran resmi dari penyelenggara / klien</span>
                  </div>
                  <span className="text-base font-bold text-zinc-100">
                    {formatRupiah(budgetingStats.clientBudget)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-zinc-950/50 border border-zinc-800 rounded-xl">
                  <div>
                    <span className="font-semibold text-zinc-200 block text-sm">Dana Sponsor (Confirmed)</span>
                    <span className="text-xs text-zinc-500">
                      Total dari {eventDetail?.sponsors?.filter(s => s.status === "CONFIRMED").length || 0} sponsor terverifikasi
                    </span>
                  </div>
                  <span className="text-base font-bold text-emerald-400">
                    {formatRupiah(budgetingStats.confirmedSponsorsTotal)}
                  </span>
                </div>

                {budgetingStats.pendingSponsorsTotal > 0 && (
                  <div className="flex items-center justify-between p-3.5 bg-amber-950/10 border border-amber-900/30 rounded-xl">
                    <div>
                      <span className="font-semibold text-amber-300 block text-sm">Potensi Sponsor (Pending/Proposal)</span>
                      <span className="text-xs text-zinc-500">Belum masuk dalam kalkulasi realisasi</span>
                    </div>
                    <span className="text-sm font-semibold text-amber-400 italic">
                      +{formatRupiah(budgetingStats.pendingSponsorsTotal)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Kolom Kanan: Rincian Pengeluaran */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="font-bold text-zinc-100 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-rose-400" /> Rincian Pos Pengeluaran
                </h3>
                <span className="text-xs font-bold text-rose-400 bg-rose-950/60 border border-rose-800/50 px-2.5 py-0.5 rounded-full">
                  Total: {formatRupiah(budgetingStats.grandTotalPengeluaran)}
                </span>
              </div>

              <div className="space-y-3">
                {/* 1. Baris Ringkasan ERP Pusat (Sesuai Syarat No 4: Tanpa Rincian List Barang) */}
                <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-indigo-950/40 to-zinc-950/60 border border-indigo-800/50 rounded-xl">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-indigo-900/60 border border-indigo-700/60 flex items-center justify-center shrink-0 text-indigo-300">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-100 text-sm truncate">
                          Tagihan ERP Pusat: {currentSelectedSummary?.title || "Sewa Alat Gudang"}
                        </span>
                        <span className="text-[10px] bg-indigo-900/60 text-indigo-300 px-1.5 py-0.5 rounded font-mono shrink-0">
                          auto-synced
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400 block truncate">
                        Nilai total sewa gudang ({currentSelectedSummary?.durationDays || 1} Hari acara)
                      </span>
                    </div>
                  </div>
                  <span className="text-base font-black text-amber-400 shrink-0 ml-3">
                    {formatRupiah(budgetingStats.erpCost)}
                  </span>
                </div>

                {/* 2. Pengadaan Alat Input Manual */}
                <div className="flex items-center justify-between p-3.5 bg-zinc-950/50 border border-zinc-800 rounded-xl">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-zinc-300">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-200 block text-sm">Alat Tambahan (Input Manual)</span>
                      <span className="text-xs text-zinc-500">
                        Total {eventDetail?.manualEquipments?.length || 0} item peralatan non-gudang
                      </span>
                    </div>
                  </div>
                  <span className="text-base font-bold text-zinc-100 shrink-0 ml-3">
                    {formatRupiah(budgetingStats.manualEquipTotal)}
                  </span>
                </div>

                {/* 3. Kebutuhan Utilitas (Konsumsi, Akomodasi, dll.) (BARU) */}
                <div className="flex items-center justify-between p-3.5 bg-zinc-950/50 border border-amber-900/30 rounded-xl">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-amber-950/50 border border-amber-800/40 flex items-center justify-center shrink-0 text-amber-400">
                      <Coffee className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-200 block text-sm">Management Utility (Konsumsi, Akomodasi, dll.)</span>
                      <span className="text-xs text-zinc-500">
                        Total {eventDetail?.utilities?.length || 0} pos utilitas operasional
                      </span>
                    </div>
                  </div>
                  <span className="text-base font-bold text-amber-400 shrink-0 ml-3">
                    {formatRupiah(budgetingStats.utilityTotal)}
                  </span>
                </div>

                {/* 4. Biaya Kru Operasional */}
                <div className="flex items-center justify-between p-3.5 bg-zinc-950/50 border border-zinc-800 rounded-xl">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-zinc-300">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-200 block text-sm">Biaya Honorarium Kru</span>
                      <span className="text-xs text-zinc-500">
                        Honor tim operasional & petugas lapangan
                      </span>
                    </div>
                  </div>
                  <span className="text-base font-bold text-zinc-100 shrink-0 ml-3">
                    {formatRupiah(budgetingStats.crewTotal)}
                  </span>
                </div>

                {/* 5. Biaya Vendor Eksternal */}
                <div className="flex items-center justify-between p-3.5 bg-zinc-950/50 border border-zinc-800 rounded-xl">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-zinc-300">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-200 block text-sm">Vendor Eksternal</span>
                      <span className="text-xs text-zinc-500">
                        Vendor katering, genset, rigging, dll.
                      </span>
                    </div>
                  </div>
                  <span className="text-base font-bold text-zinc-100 shrink-0 ml-3">
                    {formatRupiah(budgetingStats.externalVendorTotal)}
                  </span>
                </div>

                {/* 6. Guest Star & Riders (Artis & Bintang Tamu) (BARU) */}
                <div className="flex items-center justify-between p-3.5 bg-zinc-950/50 border border-purple-900/40 rounded-xl">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-purple-950/50 border border-purple-800/50 flex items-center justify-center shrink-0 text-purple-400">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-200 block text-sm">Guest Star & Riders (Bintang Tamu / Artis)</span>
                      <span className="text-xs text-zinc-400">
                        Total {eventDetail?.guestStars?.length || 0} Pengisi Acara (Honor: {formatRupiah(budgetingStats.guestStarFeeTotal)} + Riders Vendor Luar: {formatRupiah(budgetingStats.guestStarRidersTotal)})
                      </span>
                    </div>
                  </div>
                  <span className="text-base font-bold text-purple-400 shrink-0 ml-3">
                    {formatRupiah(budgetingStats.guestStarTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. SUB-TAB 3: MANAJEMEN PERLENGKAPAN (ALAT ERP VS MANUAL) */}
      {/* ============================================================ */}
      {activeSubTab === "equipment" && (
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
                        const isCustom = pItem.code === "LAYANAN" || (pItem.id && String(pItem.id).startsWith("custom-"));
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

              <Dialog open={isEquipDialogOpen} onOpenChange={setIsEquipDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Input Alat Tambahan
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold">Input Peralatan Manual Non-Gudang</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddManualEquip} className="space-y-4 pt-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">Nama Barang / Peralatan</label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="Contoh: Kabel Roll 50m / Gaffer Tape"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Kategori</label>
                        <select
                          name="category"
                          defaultValue="Audio"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="Audio">Audio / Sound</option>
                          <option value="Lighting">Lighting</option>
                          <option value="Stage">Stage & Rigging</option>
                          <option value="Kabel">Kabel & Power</option>
                          <option value="Tools">Tools & Aksesoris</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Qty (Jumlah Unit)</label>
                        <input
                          type="number"
                          name="quantity"
                          min="1"
                          value={equipQty}
                          onChange={e => setEquipQty(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))}
                          required
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Radio Pilihan Tipe Pengadaan */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-400">Tipe Pengadaan</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setEquipProcurementType("BELI")}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            equipProcurementType === "BELI"
                              ? "bg-emerald-950/80 border-emerald-600 text-emerald-300"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <span>Beli (Aset Baru)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEquipProcurementType("SEWA")}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            equipProcurementType === "SEWA"
                              ? "bg-blue-950/80 border-blue-600 text-blue-300"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <span>Sewa (Vendor Luar)</span>
                        </button>
                      </div>
                    </div>

                    {/* INPUT DINAMIS SESUAI TIPE */}
                    {equipProcurementType === "BELI" ? (
                      <div className="space-y-1.5 p-3 bg-zinc-900/60 border border-emerald-900/40 rounded-xl animate-in fade-in">
                        <label className="text-xs font-medium text-emerald-400">Harga Beli Satuan (IDR)</label>
                        <input
                          type="number"
                          name="unitPrice"
                          min="0"
                          value={equipUnitPrice}
                          onChange={e => setEquipUnitPrice(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
                          required
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
                        />
                        <p className="text-[11px] text-zinc-500 mt-1">
                          Rumus: Qty ({equipQty || 1}) × Harga Beli = <strong className="text-emerald-400">{formatRupiah(calculatedEquipTotal)}</strong>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 p-3 bg-zinc-900/60 border border-blue-900/40 rounded-xl animate-in fade-in">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-blue-400">Harga Sewa / Hari</label>
                            <input
                              type="number"
                              name="rentalPricePerDay"
                              min="0"
                              value={equipRentalPricePerDay}
                              onChange={e => setEquipRentalPricePerDay(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
                              required
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-blue-400">Durasi Sewa (Hari)</label>
                            <input
                              type="number"
                              name="rentalDays"
                              min="1"
                              value={equipRentalDays}
                              onChange={e => setEquipRentalDays(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))}
                              required
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-zinc-500">
                          Rumus: Qty ({equipQty || 1}) × Sewa/Hari ({formatRupiah(Number(equipRentalPricePerDay) || 0)}) × {equipRentalDays || 1} Hari = <strong className="text-blue-400">{formatRupiah(calculatedEquipTotal)}</strong>
                        </p>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">Catatan Tambahan</label>
                      <input
                        type="text"
                        name="notes"
                        placeholder="Contoh: Beli di Glodok / Sewa dari Vendor B"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setIsEquipDialogOpen(false)}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                      >
                        Simpan Barang
                      </button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
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
                Belum ada peralatan tambahan manual. Klik "Input Alat Tambahan" untuk menambah barang di luar gudang ERP.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. SUB-TAB 4: MANAGEMENT UTILITY (KONSUMSI, AKOMODASI, DLL.) */}
      {/* ============================================================ */}
      {activeSubTab === "utility" && (
        <div className="space-y-8 animate-in fade-in duration-150">
          {/* Header Sub-Tab Utility */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-zinc-100 flex items-center gap-2">
                  <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 shrink-0" /> Management Utility Event
                </h3>
                <span className="bg-amber-950/80 border border-amber-700/60 text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  Per Kategori
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Kelola dan pantau seluruh kebutuhan utilitas acara seperti konsumsi, akomodasi, transportasi, kelistrikan/BBM, dan komunikasi secara terstruktur per kategori.
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
              <div className="bg-zinc-900/80 border border-zinc-800/80 px-3.5 py-2 rounded-xl text-right shrink-0">
                <span className="text-[11px] text-zinc-400 block whitespace-nowrap">Total Pengeluaran Utilitas</span>
                <span className="text-base sm:text-lg font-black text-amber-400 whitespace-nowrap">
                  {formatRupiah(budgetingStats.utilityTotal)}
                </span>
              </div>

              {/* Tombol Tambah Utilitas */}
              <Dialog open={isUtilityDialogOpen} onOpenChange={setIsUtilityDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="whitespace-nowrap shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-amber-900/30 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 shrink-0" /> Tambah Kebutuhan Utilitas
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-xl sm:max-w-2xl max-h-[92vh] overflow-y-auto p-6">
                  <DialogHeader className="pb-2 border-b border-zinc-800/80">
                    <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2.5">
                      <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <Coffee className="w-5 h-5 text-amber-400" />
                      </div>
                      Tambah Kebutuhan Utilitas Event
                    </DialogTitle>
                  </DialogHeader>

                  <form onSubmit={handleAddUtility} className="space-y-4 pt-3">
                    {/* 1. Nama Kebutuhan */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300">
                        Nama Kebutuhan / Pengadaan <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="Contoh: Nasi Box Kru Siang & Malam / Hotel Aston 3 Kamar / Bensin Genset"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500 placeholder:text-zinc-600"
                      />
                    </div>

                    {/* 2. Pilihan Jenis Kategori Utilitas */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-300">
                        Jenis / Kategori Utilitas <span className="text-rose-400">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          { id: "Konsumsi", label: "Konsumsi", icon: "🍱", desc: "Makan & Minum" },
                          { id: "Akomodasi", label: "Akomodasi", icon: "🏨", desc: "Hotel & Kamar" },
                          { id: "Transportasi", label: "Transportasi", icon: "🚐", desc: "Mobil & BBM" },
                          { id: "Kelistrikan & BBM", label: "Listrik & BBM", icon: "⚡", desc: "Genset & Daya" },
                          { id: "Komunikasi & IT", label: "Komunikasi", icon: "📻", desc: "HT & Internet" },
                          { id: "Medis & Keselamatan", label: "Medis & P3K", icon: "🩺", desc: "Obat & Tim Medis" },
                          { id: "Kebersihan & Sanitasi", label: "Kebersihan", icon: "🧹", desc: "Janitor & Sampah" },
                          { id: "Lainnya", label: "Lain-lain", icon: "📦", desc: "Operasional Lain" }
                        ].map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setUtilityCategory(cat.id)}
                            className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              utilityCategory === cat.id
                                ? "bg-amber-950/70 border-amber-500 text-amber-200 ring-1 ring-amber-500/50 shadow-md shadow-amber-950/50"
                                : "bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/80 hover:border-zinc-700"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-base shrink-0">{cat.icon}</span>
                              <span className="text-xs font-bold leading-tight whitespace-nowrap">{cat.label}</span>
                            </div>
                            <span className="text-[10px] text-zinc-400 leading-tight whitespace-nowrap">{cat.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. Jumlah & Satuan */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">
                          Jumlah (Qty) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="number"
                          name="quantity"
                          min="1"
                          value={utilityQty}
                          onChange={e => setUtilityQty(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))}
                          required
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Satuan</label>
                        <select
                          value={utilityUnit}
                          onChange={e => setUtilityUnit(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="Porsi">Porsi / Box</option>
                          <option value="Kamar">Kamar / Kamar-Malam</option>
                          <option value="Unit">Unit / Buah</option>
                          <option value="Liter">Liter (BBM)</option>
                          <option value="Hari">Hari</option>
                          <option value="Paket">Paket</option>
                          <option value="Pcs">Pcs</option>
                          <option value="Orang">Orang / Kru</option>
                        </select>
                      </div>
                    </div>

                    {/* 4. Tipe Pengadaan (Beli vs Sewa) */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-400">Tipe Biaya / Pengadaan</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setUtilityProcurementType("BELI")}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            utilityProcurementType === "BELI"
                              ? "bg-amber-950/80 border-amber-600 text-amber-300 shadow-sm"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <span>Beli / Biaya Langsung</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setUtilityProcurementType("SEWA")}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            utilityProcurementType === "SEWA"
                              ? "bg-blue-950/80 border-blue-600 text-blue-300 shadow-sm"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <span>Sewa (Harian / Durasi)</span>
                        </button>
                      </div>
                    </div>

                    {/* 5. Input Dinamis Sesuai Tipe */}
                    {utilityProcurementType === "BELI" ? (
                      <div className="space-y-1.5 p-3.5 bg-zinc-900/60 border border-amber-900/40 rounded-xl animate-in fade-in">
                        <label className="text-xs font-medium text-amber-400">
                          Harga Satuan (IDR per {utilityUnit}) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="number"
                          name="unitPrice"
                          min="0"
                          value={utilityUnitPrice}
                          onChange={e => setUtilityUnitPrice(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
                          required
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500"
                        />
                        <p className="text-[11px] text-zinc-400 mt-1">
                          Kalkulasi: {utilityQty || 1} {utilityUnit} × {formatRupiah(Number(utilityUnitPrice) || 0)} = <strong className="text-amber-400">{formatRupiah(calculatedUtilityTotal)}</strong>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 p-3.5 bg-zinc-900/60 border border-blue-900/40 rounded-xl animate-in fade-in">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-blue-400">
                              Harga Sewa / Hari <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="number"
                              name="rentalPricePerDay"
                              min="0"
                              value={utilityRentalPricePerDay}
                              onChange={e => setUtilityRentalPricePerDay(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
                              required
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-blue-400">
                              Durasi Sewa (Hari) <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="number"
                              name="rentalDays"
                              min="1"
                              value={utilityRentalDays}
                              onChange={e => setUtilityRentalDays(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))}
                              required
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Kalkulasi: {utilityQty || 1} {utilityUnit} × {formatRupiah(Number(utilityRentalPricePerDay) || 0)}/hari × {utilityRentalDays || 1} Hari = <strong className="text-blue-400">{formatRupiah(calculatedUtilityTotal)}</strong>
                        </p>
                      </div>
                    )}

                    {/* 6. Catatan */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">Catatan / Keterangan</label>
                      <input
                        type="text"
                        name="notes"
                        placeholder="Contoh: Menu ayam bakar + es teh, pengiriman jam 11:30"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setIsUtilityDialogOpen(false)}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                      >
                        Simpan Utilitas
                      </button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Ringkasan Pill / Badges Kategori Utilitas */}
          {Object.keys(groupedUtilities).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Object.entries(groupedUtilities).map(([catName, utils]) => {
                const subtotal = utils.reduce((a, b) => a + b.totalCost, 0);
                return (
                  <div
                    key={catName}
                    className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between hover:border-zinc-700 transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-zinc-800/80 rounded-lg shrink-0">
                        {getCategoryIcon(catName)}
                      </div>
                      <span className="text-xs font-bold text-zinc-200 leading-tight whitespace-nowrap">{catName}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2 border-t border-zinc-800/40 pt-2">
                      <span className="text-[11px] text-zinc-400 whitespace-nowrap">{utils.length} Kebutuhan</span>
                      <span className="text-sm font-black text-amber-400 whitespace-nowrap">
                        {formatRupiah(subtotal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* RENDER LAPORAN / UI GROUPED PER KATEGORI */}
          {Object.keys(groupedUtilities).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedUtilities).map(([catName, utils]) => {
                const categoryTotal = utils.reduce((acc, cur) => acc + (Number(cur.totalCost) || 0), 0);

                return (
                  <div
                    key={catName}
                    className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm"
                  >
                    {/* Header Kategori */}
                    <div className="bg-zinc-950/70 border-b border-zinc-800 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg shrink-0">
                          {getCategoryIcon(catName)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                            <span>Kategori: {catName}</span>
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                              {utils.length} Kebutuhan
                            </span>
                          </h4>
                          <span className="text-[11px] text-zinc-500">
                            Rincian pengeluaran pos {catName.toLowerCase()}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-zinc-400 uppercase block font-semibold whitespace-nowrap">Subtotal Kategori</span>
                        <span className="text-base font-black text-amber-400 whitespace-nowrap">
                          {formatRupiah(categoryTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Tabel Item dalam Kategori Ini */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-950/40 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80">
                          <tr>
                            <th className="py-3 px-4 whitespace-nowrap">Nama Kebutuhan</th>
                            <th className="py-3 px-4 text-center whitespace-nowrap">Tipe Biaya</th>
                            <th className="py-3 px-4 text-center whitespace-nowrap">Jumlah / Qty</th>
                            <th className="py-3 px-4 whitespace-nowrap">Kalkulasi Rincian</th>
                            <th className="py-3 px-4 text-right whitespace-nowrap">Subtotal Biaya</th>
                            <th className="py-3 px-4 text-center whitespace-nowrap">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/40">
                          {utils.map(item => (
                            <tr key={item.id} className="hover:bg-zinc-800/20 transition-colors">
                              {/* Nama & Catatan */}
                              <td className="py-3.5 px-4 min-w-[200px]">
                                <span className="font-semibold text-zinc-100 block">{item.name}</span>
                                {item.notes && (
                                  <span className="text-[11px] text-zinc-400 italic block mt-0.5" title={item.notes}>
                                    {item.notes}
                                  </span>
                                )}
                              </td>

                              {/* Tipe Badge */}
                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                                  item.procurementType === "BELI"
                                    ? "bg-amber-950/80 border border-amber-800 text-amber-300"
                                    : "bg-blue-950/80 border border-blue-800 text-blue-300"
                                }`}>
                                  {item.procurementType}
                                </span>
                              </td>

                              {/* Qty & Satuan */}
                              <td className="py-3.5 px-4 text-center font-bold text-zinc-200 whitespace-nowrap">
                                {item.quantity} {item.unit || "pcs"}
                              </td>

                              {/* Kalkulasi Rincian */}
                              <td className="py-3.5 px-4 text-xs text-zinc-300 font-mono whitespace-nowrap">
                                {item.procurementType === "BELI" ? (
                                  <span>{item.quantity} {item.unit || "pcs"} × {formatRupiah(item.unitPrice)}</span>
                                ) : (
                                  <span>{item.quantity} {item.unit || "pcs"} × {formatRupiah(item.rentalPricePerDay)}/hari × {item.rentalDays} Hari</span>
                                )}
                              </td>

                              {/* Subtotal Biaya */}
                              <td className="py-3.5 px-4 text-right font-black text-amber-400 whitespace-nowrap">
                                {formatRupiah(item.totalCost)}
                              </td>

                              {/* Aksi Hapus */}
                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUtility(item.id)}
                                  className="p-1.5 hover:bg-rose-950/80 hover:text-rose-400 text-zinc-500 rounded-md transition-colors cursor-pointer"
                                  title="Hapus Kebutuhan Utilitas"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-zinc-950/60 border-t border-zinc-800/80 text-xs font-bold">
                          <tr>
                            <td colSpan={3} className="py-2.5 px-4 text-zinc-400 whitespace-nowrap">
                              Subtotal Kategori {catName}: {utils.length} Kebutuhan
                            </td>
                            <td className="py-2.5 px-4 text-right text-zinc-400 whitespace-nowrap">
                              Total Pos:
                            </td>
                            <td className="py-2.5 px-4 text-right text-sm font-black text-amber-400 whitespace-nowrap">
                              {formatRupiah(categoryTotal)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl p-8 space-y-3">
              <Coffee className="w-10 h-10 text-amber-500/60 mx-auto" />
              <h4 className="text-base font-bold text-zinc-300">Belum Ada Kebutuhan Utilitas Tercatat</h4>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Kelola akomodasi hotel, konsumsi kru, transportasi, bensin genset, atau kebutuhan utilitas lainnya secara terstruktur per kategori.
              </p>
              <button
                type="button"
                onClick={() => setIsUtilityDialogOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-colors mt-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tambah Utilitas Pertama
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. SUB-TAB 5: GUEST STAR & RIDERS MANAGEMENT (ARTIS / BAND)  */}
      {/* ============================================================ */}
      {activeSubTab === "gueststar" && (
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
                onClick={() => setIsMasterTimelineOpen(true)}
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
              <Dialog open={isGuestStarDialogOpen} onOpenChange={setIsGuestStarDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="whitespace-nowrap shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-purple-900/30 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 shrink-0" /> Tambah Guest Star
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-2xl sm:max-w-3xl max-h-[92vh] overflow-y-auto p-6">
                  <DialogHeader className="pb-2 border-b border-zinc-800/80">
                    <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2.5">
                      <div className="p-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                        <Mic className="w-5 h-5 text-purple-400" />
                      </div>
                      Tambah Guest Star / Pengisi Acara
                    </DialogTitle>
                  </DialogHeader>

                  <form onSubmit={handleAddGuestStar} className="space-y-4 pt-3">
                    {/* 1. Nama Artis / Band */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300">
                        Nama Guest Star / Artis / Band <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="Contoh: Sheila on 7 / Raisa / DJ Winky / MC Desta"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-purple-500 placeholder:text-zinc-600"
                      />
                    </div>

                    {/* 2. Pilihan Jenis / Kategori Performer */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-300">
                        Kategori Performer <span className="text-rose-400">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { id: "BAND", label: "Grup Band", icon: "🎸", desc: "Formasi Musik Lengkap" },
                          { id: "SOLO", label: "Penyanyi Solo", icon: "🎤", desc: "Vokalis / Soloist" },
                          { id: "DJ", label: "Disc Jockey (DJ)", icon: "🎧", desc: "Electronic Music" },
                          { id: "MC_HOST", label: "MC / Host", icon: "🎙️", desc: "Pembawa Acara" },
                          { id: "DANCE_PERFORMER", label: "Dancer / Tari", icon: "💃", desc: "Koreografi / Seni" },
                          { id: "LAINNYA", label: "Lain-lain", icon: "⭐", desc: "Pengisi Acara Lain" }
                        ].map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setGsCategory(cat.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              gsCategory === cat.id
                                ? "bg-purple-950/70 border-purple-500 text-purple-200 ring-1 ring-purple-500/50 shadow-md"
                                : "bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/80"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-base">{cat.icon}</span>
                              <span className="text-xs font-bold leading-tight">{cat.label}</span>
                            </div>
                            <span className="text-[10px] text-zinc-400 leading-tight">{cat.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. Jumlah Personil & Kontak Manajer */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-300">
                          Jumlah Personil / Rombongan Kru <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="number"
                          name="personnelCount"
                          min="1"
                          value={gsPersonnelCount}
                          onChange={e => setGsPersonnelCount(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))}
                          required
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-purple-500"
                        />
                        <span className="text-[10px] text-zinc-500">Jumlah orang untuk alokasi konsumsi & ID Card</span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-300">Kontak Person / Manajer</label>
                        <input
                          type="text"
                          name="contactPerson"
                          placeholder="Contoh: Mas Anton (0812-3456-7890)"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    {/* 4. Biaya Penampilan & Durasi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-zinc-900/60 border border-purple-900/40 rounded-xl">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-purple-300">
                          Fee / Honor per Hari (IDR) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="number"
                          name="feePerDay"
                          min="0"
                          value={gsFeePerDay}
                          onChange={e => setGsFeePerDay(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
                          required
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-purple-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-purple-300">
                          Durasi Tampil (Hari) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="number"
                          name="durationDays"
                          min="1"
                          value={gsDurationDays}
                          onChange={e => setGsDurationDays(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))}
                          required
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-purple-500"
                        />
                      </div>

                      <div className="sm:col-span-2 pt-1 border-t border-zinc-800/60">
                        <p className="text-xs text-zinc-300">
                          Total Honor: {gsDurationDays || 1} Hari × {formatRupiah(Number(gsFeePerDay) || 0)} ={" "}
                          <strong className="text-purple-400 font-bold">{formatRupiah(calculatedGsTotalFee)}</strong>
                        </p>
                      </div>
                    </div>

                    {/* 5. SISTEM TIMELINE TERPUSAT: CINEMA-SEAT BLOCKING JADWAL TAMPIL (30 MENIT) */}
                    <div className="space-y-3 p-4 bg-zinc-900/60 border border-purple-900/50 rounded-2xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                        <div>
                          <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-purple-400" />
                            Booking Slot Jadwal Tampil (Timeline Terpusat)
                          </label>
                          <span className="text-[11px] text-zinc-400 block mt-0.5">
                            Pilih slot waktu tampil (kelipatan 30 menit). Slot terisi akan otomatis terkunci.
                          </span>
                        </div>

                        {/* Pilihan Hari Penampilan */}
                        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
                          <span className="text-[10px] text-zinc-400 font-semibold px-2 uppercase tracking-wider">Hari:</span>
                          {Array.from({ length: eventDetail?.durationDays || 1 }).map((_, idx) => {
                            const dNum = idx + 1;
                            const isCurrentDay = gsDayNumber === dNum;
                            return (
                              <button
                                key={dNum}
                                type="button"
                                onClick={() => {
                                  setGsDayNumber(dNum);
                                  setGsSelectedSlots([]);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                  isCurrentDay
                                    ? "bg-purple-600 text-white shadow-sm ring-1 ring-purple-400"
                                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                                }`}
                              >
                                Hari {dNum}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Lokasi Panggung & Catatan Singkat */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-zinc-400">Lokasi Panggung / Stage</label>
                          <input
                            type="text"
                            value={gsStageLocation}
                            onChange={e => setGsStageLocation(e.target.value)}
                            placeholder="Contoh: Main Stage / Stage 2 / Hall A"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-purple-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-zinc-400">Catatan Khusus / Rider Cue</label>
                          <input
                            type="text"
                            name="notes"
                            placeholder="Contoh: Ruang tunggu VIP, Soundcheck sore"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>

                      {/* Legend Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-emerald-950/80 border border-emerald-500/50 inline-block"></span>
                            <span className="text-zinc-400">Tersedia (Bebas)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-purple-600 border border-purple-400 inline-block shadow-xs"></span>
                            <span className="text-zinc-300 font-medium">Terpilih</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-zinc-800 border border-zinc-700 inline-block opacity-60"></span>
                            <span className="text-zinc-500">Terkunci (Sudah Terisi)</span>
                          </div>
                        </div>
                        {gsSelectedSlots.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setGsSelectedSlots([])}
                            className="text-rose-400 hover:text-rose-300 font-semibold underline cursor-pointer text-[11px]"
                          >
                            Reset Pilihan
                          </button>
                        )}
                      </div>

                      {/* Cinema-Seat Interactive Grid (30-Minute Slots) - 4 Kolom Rapi & Jelas */}
                      {(() => {
                        const occupiedMap = getOccupiedSlotsForDay(gsDayNumber);
                        return (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl">
                            {EVENT_TIME_SLOTS.map(slot => {
                              const occupied = occupiedMap[slot];
                              const isSelected = gsSelectedSlots.includes(slot);

                              if (occupied) {
                                return (
                                  <div
                                    key={slot}
                                    title={`🔒 Terkunci / Sudah Terisi:\n${occupied.title}\n(${occupied.startTime} - ${occupied.endTime} WIB)\nKategori: ${occupied.category}\nLokasi: ${occupied.stageLocation || 'Main Stage'}`}
                                    className="p-2.5 rounded-xl bg-zinc-800/70 border border-zinc-700/50 text-zinc-500 text-center cursor-not-allowed select-none opacity-60 flex flex-col items-center justify-center min-h-[52px]"
                                  >
                                    <span className="text-xs font-mono font-bold leading-tight tracking-tight line-through text-zinc-400">
                                      {getSlotRangeText(slot)}
                                    </span>
                                    <span className="text-[10px] text-zinc-500 truncate max-w-full px-1 mt-1 font-medium" title={occupied.title}>
                                      🔒 {occupied.title}
                                    </span>
                                  </div>
                                );
                              }

                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => handleToggleGsSlot(slot)}
                                  className={`p-2.5 rounded-xl text-center cursor-pointer select-none transition-all flex flex-col items-center justify-center min-h-[52px] ${
                                    isSelected
                                      ? "bg-purple-600 border-2 border-purple-400 text-white font-bold shadow-md shadow-purple-900/50 scale-[1.02] ring-2 ring-purple-500/40"
                                      : "bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-400"
                                  }`}
                                >
                                  <span className="text-xs font-mono font-bold leading-tight tracking-tight">
                                    {getSlotRangeText(slot)}
                                  </span>
                                  <span className="text-[10px] opacity-85 mt-1 font-medium">
                                    {isSelected ? "✓ Dipilih" : "Bebas"}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}

                      {/* Status Banner Pilihan Slot */}
                      {gsSelectedSlots.length > 0 ? (
                        <div className="p-3 bg-purple-950/50 border border-purple-800/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-purple-200 animate-in fade-in">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-purple-400 shrink-0" />
                            <span>
                              <strong>Hari ke-{gsDayNumber}</strong>: Pukul{" "}
                              <span className="text-white font-bold">{formatSlotRange(gsSelectedSlots)} WIB</span>{" "}
                              <span className="text-purple-300 font-semibold">
                                ({gsSelectedSlots.length} Slot / {gsSelectedSlots.length * 30} Menit)
                              </span>
                            </span>
                          </div>
                          <span className="text-[10px] bg-purple-800/80 text-purple-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider self-start sm:self-auto">
                            Slot Siap Diblock
                          </span>
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-500 italic px-1">
                          💡 Klik tombol waktu hijau di atas untuk mem-booking slot rundown artis ini secara eksklusif.
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setIsGuestStarDialogOpen(false)}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                      >
                        Simpan Guest Star
                      </button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
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
                          Belum ada kebutuhan riders untuk {gs.name}. Klik <strong>"Tambah Riders"</strong> untuk memasukkan alat dari gudang ERP atau vendor eksternal.
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

          {/* DIALOG TAMBAH RIDERS KE GUEST STAR */}
          <Dialog open={isRiderDialogOpen} onOpenChange={setIsRiderDialogOpen}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-xl sm:max-w-2xl max-h-[92vh] overflow-y-auto p-6">
              <DialogHeader className="pb-2 border-b border-zinc-800/80">
                <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2.5">
                  <div className="p-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <span>Tambah Kebutuhan Riders: <strong className="text-purple-300">{selectedGuestStarForRider?.name}</strong></span>
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleAddRider} className="space-y-4 pt-3">
                {/* 1. Pemilihan Sumber Pengadaan (Gudang ERP vs Vendor Luar) */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300">
                    Sumber Pengadaan Alat / Riders <span className="text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setRiderSourceType("ERP_LOGISTIK");
                        setRiderType("TECHNICAL");
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        riderSourceType === "ERP_LOGISTIK"
                          ? "bg-emerald-950/70 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/50 shadow-md"
                          : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold">Dari Alat Gudang ERP (On-Rented)</span>
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        Otomatis ambil dari daftar sewa ERP aktif (Biaya Rp 0 / Tercover).
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRiderSourceType("VENDOR_LUAR")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        riderSourceType === "VENDOR_LUAR"
                          ? "bg-amber-950/70 border-amber-500 text-amber-200 ring-1 ring-amber-500/50 shadow-md"
                          : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold">Vendor Eksternal / Beli Baru</span>
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        Sewa alat luar atau pengadaan hospitality terpisah.
                      </span>
                    </button>
                  </div>
                </div>

                {/* 2. Form Input Berdasarkan Sumber */}
                {riderSourceType === "ERP_LOGISTIK" ? (
                  <div className="space-y-3 p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl animate-in fade-in">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-emerald-300">
                        Pilih Alat dari Transaksi Gudang ERP Pusat <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={riderSelectedErpItemName}
                        onChange={e => setRiderSelectedErpItemName(e.target.value)}
                        required
                        className="w-full bg-zinc-950 border border-emerald-700/60 text-zinc-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 cursor-pointer"
                      >
                        <option value="">-- Pilih Alat dari On-Rented Event Ini --</option>
                        {(currentSelectedSummary?.payload || []).map((item: any, idx: number) => (
                          <option key={idx} value={item.name}>
                            {item.name} (Tersedia Qty: {item.qty})
                          </option>
                        ))}
                      </select>
                      {(currentSelectedSummary?.payload || []).length === 0 && (
                        <p className="text-[11px] text-rose-400 mt-1">
                          Belum ada data barang sewa ERP pada event ini. Silakan gunakan opsi Vendor Eksternal.
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-emerald-300">Jumlah (Qty)</label>
                        <input
                          type="number"
                          name="quantity"
                          min="1"
                          value={riderQuantity}
                          onChange={e => setRiderQuantity(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))}
                          required
                          className="w-full bg-zinc-950 border border-emerald-700/60 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-emerald-300">Satuan</label>
                        <input
                          type="text"
                          value={riderUnit}
                          onChange={e => setRiderUnit(e.target.value)}
                          className="w-full bg-zinc-950 border border-emerald-700/60 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-950/60 border border-emerald-700/40 rounded-lg flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-200">
                        Item riders ini diambil langsung dari inventaris gudang ERP pusat yang sudah dipesan untuk event ini. <strong>Biaya Rp 0</strong> (tidak dihitung ganda karena sudah masuk di total sewa ERP).
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in">
                    {/* Nama Kebutuhan Riders */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300">
                        Nama Kebutuhan Riders <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={riderCustomName}
                        onChange={e => setRiderCustomName(e.target.value)}
                        required
                        placeholder="Contoh: Keyboard Roland RD-2000 / Ampeg SVT Bass Amp / Buah Segar & Handuk"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500 placeholder:text-zinc-600"
                      />
                    </div>

                    {/* Tipe Riders: Technical vs Hospitality */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300">Kategori Riders</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setRiderType("TECHNICAL")}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            riderType === "TECHNICAL"
                              ? "bg-indigo-950/80 border-indigo-600 text-indigo-300 shadow-sm"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <span>Technical (Alat Musik / Panggung)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRiderType("HOSPITALITY")}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            riderType === "HOSPITALITY"
                              ? "bg-emerald-950/80 border-emerald-600 text-emerald-300 shadow-sm"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <span>Hospitality (Ruang Ganti / Konsumsi)</span>
                        </button>
                      </div>
                    </div>

                    {/* Qty & Satuan */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-300">Jumlah (Qty) <span className="text-rose-400">*</span></label>
                        <input
                          type="number"
                          min="1"
                          value={riderQuantity}
                          onChange={e => setRiderQuantity(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))}
                          required
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-300">Satuan</label>
                        <select
                          value={riderUnit}
                          onChange={e => setRiderUnit(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="Unit">Unit</option>
                          <option value="Set">Set</option>
                          <option value="Pcs">Pcs</option>
                          <option value="Paket">Paket</option>
                          <option value="Box">Box / Porsi</option>
                        </select>
                      </div>
                    </div>

                    {/* Tipe Pengadaan: Sewa vs Beli */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300">Tipe Pengadaan Vendor</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setRiderProcurementType("SEWA")}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            riderProcurementType === "SEWA"
                              ? "bg-blue-950/80 border-blue-600 text-blue-300 shadow-sm"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <span>Sewa Vendor Luar (Harian)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRiderProcurementType("BELI")}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            riderProcurementType === "BELI"
                              ? "bg-amber-950/80 border-amber-600 text-amber-300 shadow-sm"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <span>Beli Langsung / Sekali Pakai</span>
                        </button>
                      </div>
                    </div>

                    {/* Kalkulasi Biaya Dinamis */}
                    {riderProcurementType === "SEWA" ? (
                      <div className="space-y-3 p-3.5 bg-zinc-900/60 border border-blue-900/40 rounded-xl">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-blue-400">Harga Sewa / Hari <span className="text-rose-400">*</span></label>
                            <input
                              type="number"
                              min="0"
                              value={riderRentalPricePerDay}
                              onChange={e => setRiderRentalPricePerDay(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
                              required
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-blue-400">Durasi Sewa (Hari) <span className="text-rose-400">*</span></label>
                            <input
                              type="number"
                              min="1"
                              value={riderRentalDays}
                              onChange={e => setRiderRentalDays(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))}
                              required
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Kalkulasi: {riderQuantity || 1} {riderUnit} × {formatRupiah(Number(riderRentalPricePerDay) || 0)}/hari × {riderRentalDays || 1} Hari = <strong className="text-blue-400">{formatRupiah(calculatedRiderTotal)}</strong>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 p-3.5 bg-zinc-900/60 border border-amber-900/40 rounded-xl">
                        <label className="text-xs font-semibold text-amber-400">Harga Beli Satuan (IDR) <span className="text-rose-400">*</span></label>
                        <input
                          type="number"
                          min="0"
                          value={riderUnitPrice}
                          onChange={e => setRiderUnitPrice(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
                          required
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500"
                        />
                        <p className="text-[11px] text-zinc-400 mt-1">
                          Kalkulasi: {riderQuantity || 1} {riderUnit} × {formatRupiah(Number(riderUnitPrice) || 0)} = <strong className="text-amber-400">{formatRupiah(calculatedRiderTotal)}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Catatan Riders */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Catatan / Spesifikasi Teknis</label>
                  <input
                    type="text"
                    name="notes"
                    placeholder="Contoh: Wajib merk Roland atau Yamaha Motif, kabel jack 5m"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsRiderDialogOpen(false)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Simpan Riders
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* ============================================================ */}
      {/* 8. SUB-TAB 6: MASTER TIMELINE TERPUSAT & RUNDOWN ACARA       */}
      {/* ============================================================ */}
      {activeSubTab === "timeline" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-zinc-100 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 shrink-0" />
                  Master Timeline & Rundown Terpusat
                </h3>
                <span className="bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  Multi-Day Schedule Matrix
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Sistem blocking jadwal panggung terpusat. Mengamankan slot waktu agar Guest Star, Soundcheck, Briefing Kru, dan Gate Open tersinkronisasi tanpa bentrok.
              </p>
            </div>
          </div>

          {renderTimelineContent()}
        </div>
      )}
        </>
      )}

      {/* ============================================================ */}
      {/* DIALOG POPUP: MASTER TIMELINE TERPUSAT                       */}
      {/* ============================================================ */}
      <Dialog open={isMasterTimelineOpen} onOpenChange={setIsMasterTimelineOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-4xl sm:max-w-5xl max-h-[92vh] overflow-y-auto p-6">
          <DialogHeader className="pb-3 border-b border-zinc-800/80">
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                <CalendarDays className="w-5 h-5 text-indigo-400" />
              </div>
              Master Timeline & Rundown Terpusat
            </DialogTitle>
          </DialogHeader>

          <div className="pt-2">
            {renderTimelineContent()}
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* DIALOG POPUP: TAMBAH AGENDA RUNDOWN UMUM (NON-GUEST STAR)    */}
      {/* ============================================================ */}
      <Dialog open={isAddAgendaDialogOpen} onOpenChange={setIsAddAgendaDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-2xl sm:max-w-3xl max-h-[92vh] overflow-y-auto p-6">
          <DialogHeader className="pb-2 border-b border-zinc-800/80">
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                <Clock className="w-5 h-5 text-indigo-400" />
              </div>
              Tambah Agenda Rundown Acara
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddTimelineAgenda} className="space-y-4 pt-3">
            {/* 1. Nama Agenda */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Nama Agenda / Sesi Acara <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={agendaTitle}
                onChange={e => setAgendaTitle(e.target.value)}
                required
                placeholder="Contoh: Soundcheck Artis Utama / Briefing Kru Pagi / Open Gate Utama"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500 placeholder:text-zinc-600"
              />
            </div>

            {/* 2. Kategori Agenda */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">
                Kategori Agenda <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "SOUNDCHECK", label: "Soundcheck / GR", icon: "🔊" },
                  { id: "BRIEFING", label: "Briefing Kru", icon: "📋" },
                  { id: "GATE_OPEN", label: "Open Gate / Registrasi", icon: "🚪" },
                  { id: "BREAK", label: "Break / Ishoma", icon: "☕" },
                  { id: "PERFORMANCE", label: "Special Show", icon: "🎤" },
                  { id: "OTHER", label: "Agenda Umum", icon: "⚙️" }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setAgendaCategory(cat.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      agendaCategory === cat.id
                        ? "bg-indigo-950/70 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/50 shadow-md"
                        : "bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/80"
                    }`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span className="text-xs font-bold leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Panggung & Hari */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Hari ke-</label>
                <select
                  value={agendaDayNumber}
                  onChange={e => {
                    setAgendaDayNumber(Number(e.target.value));
                    setAgendaSelectedSlots([]);
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {Array.from({ length: eventDetail?.durationDays || 1 }).map((_, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      Hari ke-{idx + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Lokasi / Panggung</label>
                <input
                  type="text"
                  value={agendaStageLocation}
                  onChange={e => setAgendaStageLocation(e.target.value)}
                  placeholder="Contoh: Main Stage / Front Gate / Area VIP"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* 4. Cinema-Seat Slot Picker untuk Agenda */}
            <div className="space-y-2.5 p-3.5 bg-zinc-900/60 border border-indigo-900/40 rounded-xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  Pilih Slot Waktu (Hari ke-{agendaDayNumber})
                </label>
                {agendaSelectedSlots.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAgendaSelectedSlots([])}
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline cursor-pointer"
                  >
                    Reset Pilihan
                  </button>
                )}
              </div>

              {(() => {
                const occupiedMap = getOccupiedSlotsForDay(agendaDayNumber);
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl">
                    {EVENT_TIME_SLOTS.map(slot => {
                      const occupied = occupiedMap[slot];
                      const isSelected = agendaSelectedSlots.includes(slot);

                      if (occupied) {
                        return (
                          <div
                            key={slot}
                            title={`🔒 Terkunci:\n${occupied.title}\n(${occupied.startTime} - ${occupied.endTime} WIB)\nKategori: ${occupied.category}`}
                            className="p-2.5 rounded-xl bg-zinc-800/70 border border-zinc-700/50 text-zinc-500 text-center cursor-not-allowed select-none opacity-60 flex flex-col items-center justify-center min-h-[52px]"
                          >
                            <span className="text-xs font-mono font-bold leading-tight tracking-tight line-through text-zinc-400">
                              {getSlotRangeText(slot)}
                            </span>
                            <span className="text-[10px] text-zinc-500 truncate max-w-full px-1 mt-1 font-medium">🔒 {occupied.title}</span>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleToggleAgendaSlot(slot)}
                          className={`p-2.5 rounded-xl text-center cursor-pointer select-none transition-all flex flex-col items-center justify-center min-h-[52px] ${
                            isSelected
                              ? "bg-indigo-600 border-2 border-indigo-400 text-white font-bold shadow-md shadow-indigo-900/50 scale-[1.02] ring-2 ring-indigo-500/40"
                              : "bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-400"
                          }`}
                        >
                          <span className="text-xs font-mono font-bold leading-tight tracking-tight">
                            {getSlotRangeText(slot)}
                          </span>
                          <span className="text-[10px] opacity-85 mt-1 font-medium">{isSelected ? "✓ Dipilih" : "Bebas"}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              {agendaSelectedSlots.length > 0 ? (
                <div className="p-2.5 bg-indigo-950/50 border border-indigo-800/60 rounded-xl text-xs text-indigo-200">
                  <span>
                    Terpilih: <strong>Hari ke-{agendaDayNumber}</strong>, Pukul{" "}
                    <span className="text-white font-bold">{formatSlotRange(agendaSelectedSlots)} WIB</span>{" "}
                    ({agendaSelectedSlots.length} Slot / {agendaSelectedSlots.length * 30} Menit)
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-zinc-400 italic">Pilih satu atau lebih slot waktu untuk memblock jadwal.</p>
              )}
            </div>

            {/* 5. Catatan */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Catatan Khusus</label>
              <input
                type="text"
                value={agendaNotes}
                onChange={e => setAgendaNotes(e.target.value)}
                placeholder="Contoh: Sound engineer wajib standby, mik wireless 4 buah"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsAddAgendaDialogOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                Simpan Agenda
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Demo Warning Dialog */}
      <DemoRestrictionDialog
        isOpen={showDemoWarning}
        onClose={() => setShowDemoWarning(false)}
        message="Akses Dibatasi: Akun demo/dummy hanya memiliki izin lihat (Read-Only) pada modul Event Management."
      />
    </div>
  );
}
