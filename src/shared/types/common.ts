/**
 * Definisi tipe data bersama (Shared Types) untuk aplikasi ERP Logistik
 */

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Item {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  quantity: number;
  rentedQuantity: number;
  maintenanceQuantity: number;
  status: string;
  imageUrl?: string | null;
  categories: Category[];
  price?: number | null;
  rentPercentage?: number | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface History {
  id: string;
  type: string;
  date: Date | string;
  description: string | null;
  payload: string | null;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface PackageTemplate {
  id: string;
  name: string;
  description: string | null;
  payload: string;
  kategoriUtama?: string | null;
  labelGrade?: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface MasterItem {
  id: string;
  name: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// --- EVENT MANAGEMENT TYPES ---

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
  isErpPusat?: boolean;
  notes?: string | null;
}

export interface EventManualEquipmentData {
  id: string;
  eventDetailId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  procurementType: string;
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
  unit: string;
  procurementType: string;
  unitPrice: number;
  rentalPricePerDay: number;
  rentalDays: number;
  totalCost: number;
  notes?: string | null;
}

export interface EventGuestStarRiderData {
  id: string;
  guestStarId: string;
  sourceType: "ERP_LOGISTIK" | "VENDOR_LUAR" | string;
  riderType: "TECHNICAL" | "HOSPITALITY" | string;
  erpItemId?: string | null;
  name: string;
  quantity: number;
  unit: string;
  procurementType: "SEWA" | "BELI" | string;
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
  category: string;
  feePerDay: number;
  durationDays: number;
  totalFee: number;
  personnelCount: number;
  dayNumber: number;
  timeSlots: string[];
  stageLocation: string;
  contactPerson?: string | null;
  phone?: string | null;
  riders?: EventGuestStarRiderData[];
  notes?: string | null;
}

export interface EventTimelineItemData {
  id: string;
  eventDetailId: string;
  dayNumber: number;
  timeSlots: string[];
  startTime: string;
  endTime: string;
  agendaTitle: string;
  category: string;
  stageLocation: string;
  notes?: string | null;
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

export interface GroupedCategory<T> {
  categoryName: string;
  items: T[];
}

