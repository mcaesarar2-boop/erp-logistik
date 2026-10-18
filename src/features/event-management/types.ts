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

export interface AvailableEventSummary {
  id: string;
  title: string;
  date: string | Date;
  durationDays: number;
  erpTotalCost: number;
  payload: any[];
  isActive: boolean;
}

export interface BudgetingStats {
  clientBudget: number;
  confirmedSponsorsTotal: number;
  pendingSponsorsTotal: number;
  totalPemasukan: number;
  erpCost: number;
  manualEquipTotal: number;
  crewTotal: number;
  externalVendorTotal: number;
  utilityTotal: number;
  guestStarFeeTotal: number;
  guestStarRidersTotal: number;
  guestStarTotal: number;
  guestStarPersonnelTotal: number;
  grandTotalPengeluaran: number;
  netBalance: number;
  isSurplus: boolean;
}

export type EventSubTabType = "overview" | "budgeting" | "equipment" | "utility" | "gueststar" | "timeline";

