"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { isDemoEmail } from "@/lib/permissions";
import { 
  addBulkMaintenance as _addBulkMaintenance, 
  completeMaintenanceItem as _completeMaintenanceItem 
} from "@/features/maintenance";
import {
  ensureDefaultPackageMasterData as _ensureDefaultPackageMasterData,
  createMasterCategory as _createMasterCategory,
  updateMasterCategory as _updateMasterCategory,
  deleteMasterCategory as _deleteMasterCategory,
  createMasterLabel as _createMasterLabel,
  updateMasterLabel as _updateMasterLabel,
  deleteMasterLabel as _deleteMasterLabel,
} from "@/features/master-data";
import {
  createPackageTemplate as _createPackageTemplate,
  updatePackageTemplate as _updatePackageTemplate,
  deletePackageTemplate as _deletePackageTemplate,
  addBulkRental as _addBulkRental,
} from "@/features/packages";
import {
  createHistory as _createHistory,
  updateHistory as _updateHistory,
  deleteHistory as _deleteHistory,
} from "@/features/transactions";
import {
  createItem as _createItem,
  updateItem as _updateItem,
  deleteItemFull as _deleteItemFull,
  reduceItemQuantity as _reduceItemQuantity,
  addStockToExistingItem as _addStockToExistingItem,
  createCategory as _createCategory,
  updateCategory as _updateCategory,
  deleteCategory as _deleteCategory,
  batchRegenerateCodes as _batchRegenerateCodes,
} from "@/features/inventory";
import {
  returnBulkRental as _returnBulkRental,
  syncActiveEvents as _syncActiveEvents,
} from "@/features/on-rented";
import { checkoutRental as _checkoutRental } from "@/features/pos-cart";
import {
  getOrCreateEventDetail as _getOrCreateEventDetail,
  createStandaloneEventWorkspace as _createStandaloneEventWorkspace,
  updateEventDetail as _updateEventDetail,
  addEventCrew as _addEventCrew,
  deleteEventCrew as _deleteEventCrew,
  addEventSponsor as _addEventSponsor,
  deleteEventSponsor as _deleteEventSponsor,
  updateEventSponsorStatus as _updateEventSponsorStatus,
  addEventVendor as _addEventVendor,
  deleteEventVendor as _deleteEventVendor,
  addEventManualEquipment as _addEventManualEquipment,
  deleteEventManualEquipment as _deleteEventManualEquipment,
  addEventUtility as _addEventUtility,
  deleteEventUtility as _deleteEventUtility,
  addEventGuestStar as _addEventGuestStar,
  deleteEventGuestStar as _deleteEventGuestStar,
  addEventGuestStarRider as _addEventGuestStarRider,
  deleteEventGuestStarRider as _deleteEventGuestStarRider,
  addEventTimelineItem as _addEventTimelineItem,
  deleteEventTimelineItem as _deleteEventTimelineItem,
} from "@/features/event-management/actions";

// --- FUNGSI HELPER UNTUK UPLOAD FOTO ---
async function uploadImageToSupabase(imageFile: File | null): Promise<string | undefined> {
  if (!imageFile || imageFile.size === 0 || imageFile.name === "undefined") {
    return undefined;
  }

  try {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error } = await supabase.storage.from('item-images').upload(fileName, imageFile, {
      contentType: imageFile.type,
      upsert: false
    });

    if (error) {
      console.error("SUPABASE UPLOAD ERROR:", error);
      return undefined;
    }

    const { data: publicUrlData } = supabase.storage.from('item-images').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("KESALAHAN SISTEM SAAT UPLOAD:", err);
    return undefined;
  }
}

// --- FUNGSI HELPER UNTUK VALIDASI AKUN DUMMY ---
async function validateDummyUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (isDemoEmail(user?.email)) {
    return { success: false, error: "Akses ditolak: Akun Dummy hanya dapat melihat data (Read-Only)." };
  }
  return null;
}

// --- FUNGSI INVENTARIS & KATEGORI (Proxied to @/features/inventory) ---
export async function createItem(formData: FormData) {
  return _createItem(formData);
}

export async function updateItem(id: string, formData: FormData) {
  return _updateItem(id, formData);
}

export async function deleteItemFull(id: string) {
  return _deleteItemFull(id);
}

export async function reduceItemQuantity(id: string, amountToReduce: number) {
  return _reduceItemQuantity(id, amountToReduce);
}

export async function addStockToExistingItem(formData: FormData) {
  return _addStockToExistingItem(formData);
}

export async function createCategory(formData: FormData) {
  return _createCategory(formData);
}

export async function updateCategory(id: string, formData: FormData) {
  return _updateCategory(id, formData);
}

export async function deleteCategory(id: string) {
  return _deleteCategory(id);
}

// --- FUNGSI TAMBAH RENTAL MASAL (Proxied to @/features/packages) ---
export async function addBulkRental(formData: FormData) {
  return _addBulkRental(formData);
}

// --- FUNGSI CHECKOUT RENTAL & TAMBAH BARANG SUSULAN (Proxied to @/features/pos-cart) ---
export async function checkoutRental(formData: FormData) {
  return _checkoutRental(formData);
}

// --- FUNGSI PENGEMBALIAN RENTAL (BALIK GUDANG) (Proxied to @/features/on-rented) ---
export async function returnBulkRental(formData: FormData) {
  return _returnBulkRental(formData);
}

// --- FUNGSI PEMELIHARAAN (Proxied to @/features/maintenance) ---
export async function addBulkMaintenance(formData: FormData) {
  return _addBulkMaintenance(formData);
}

export async function completeMaintenanceItem(itemId: string, qty?: number) {
  return _completeMaintenanceItem(itemId, qty);
}

// --- FUNGSI RIWAYAT / TRANSAKSI (Proxied to @/features/transactions) ---
export async function createHistory(formData: FormData) {
  return _createHistory(formData);
}

export async function updateHistory(id: string, formData: FormData) {
  return _updateHistory(id, formData);
}

export async function deleteHistory(id: string) {
  return _deleteHistory(id);
}

// --- FUNGSI PAKET / TEMPLATE RENTAL (Proxied to @/features/packages) ---
export async function createPackageTemplate(formData: FormData) {
  return _createPackageTemplate(formData);
}

export async function updatePackageTemplate(id: string, formData: FormData) {
  return _updatePackageTemplate(id, formData);
}

export async function deletePackageTemplate(id: string) {
  return _deletePackageTemplate(id);
}

// --- MASTER DATA KATEGORI UTAMA & LABEL/GRADE PAKET (Proxied to @/features/master-data) ---
export async function ensureDefaultPackageMasterData() {
  return _ensureDefaultPackageMasterData();
}

export async function createMasterCategory(name: string) {
  return _createMasterCategory(name);
}

export async function updateMasterCategory(id: string, newName: string) {
  return _updateMasterCategory(id, newName);
}

export async function deleteMasterCategory(id: string) {
  return _deleteMasterCategory(id);
}

export async function createMasterLabel(name: string) {
  return _createMasterLabel(name);
}

export async function updateMasterLabel(id: string, newName: string) {
  return _updateMasterLabel(id, newName);
}

export async function deleteMasterLabel(id: string) {
  return _deleteMasterLabel(id);
}

// --- FUNGSI BATCH GENERATE (Proxied to @/features/inventory) ---
export async function batchRegenerateCodes() {
  return _batchRegenerateCodes();
}

// --- FUNGSI SINKRONISASI DATA & BERSIHKAN GHOST EVENTS (Proxied to @/features/on-rented) ---
export async function syncActiveEvents() {
  return _syncActiveEvents();
}

// ============================================================
// --- SERVER ACTIONS UNTUK EVENT MANAGEMENT WORKSPACE (Proxied to @/features/event-management) ---
// ============================================================

export async function getOrCreateEventDetail(
  historyId: string,
  eventName: string,
  durationDays: number = 1,
  erpTotalCost: number = 0
) {
  return _getOrCreateEventDetail(historyId, eventName, durationDays, erpTotalCost);
}

export async function createStandaloneEventWorkspace(
  eventName: string,
  durationDays: number = 1,
  clientBudget: number = 0
) {
  return _createStandaloneEventWorkspace(eventName, durationDays, clientBudget);
}

export async function updateEventDetail(
  eventDetailId: string,
  data: { durationDays?: number; clientBudget?: number; notes?: string; status?: string; eventName?: string }
) {
  return _updateEventDetail(eventDetailId, data);
}

export async function addEventCrew(eventDetailId: string, formData: FormData) {
  return _addEventCrew(eventDetailId, formData);
}

export async function deleteEventCrew(crewId: string) {
  return _deleteEventCrew(crewId);
}

export async function addEventSponsor(eventDetailId: string, formData: FormData) {
  return _addEventSponsor(eventDetailId, formData);
}

export async function deleteEventSponsor(sponsorId: string) {
  return _deleteEventSponsor(sponsorId);
}

export async function updateEventSponsorStatus(sponsorId: string, status: string) {
  return _updateEventSponsorStatus(sponsorId, status);
}

export async function addEventVendor(eventDetailId: string, formData: FormData) {
  return _addEventVendor(eventDetailId, formData);
}

export async function deleteEventVendor(vendorId: string) {
  return _deleteEventVendor(vendorId);
}

export async function addEventManualEquipment(eventDetailId: string, formData: FormData) {
  return _addEventManualEquipment(eventDetailId, formData);
}

export async function deleteEventManualEquipment(equipmentId: string) {
  return _deleteEventManualEquipment(equipmentId);
}

export async function addEventUtility(eventDetailId: string, formData: FormData) {
  return _addEventUtility(eventDetailId, formData);
}

export async function deleteEventUtility(utilityId: string) {
  return _deleteEventUtility(utilityId);
}

export async function addEventGuestStar(eventDetailId: string, formData: FormData) {
  return _addEventGuestStar(eventDetailId, formData);
}

export async function deleteEventGuestStar(guestStarId: string) {
  return _deleteEventGuestStar(guestStarId);
}

export async function addEventGuestStarRider(guestStarId: string, formData: FormData) {
  return _addEventGuestStarRider(guestStarId, formData);
}

export async function deleteEventGuestStarRider(riderId: string) {
  return _deleteEventGuestStarRider(riderId);
}

export async function addEventTimelineItem(eventDetailId: string, formData: FormData) {
  return _addEventTimelineItem(eventDetailId, formData);
}

export async function deleteEventTimelineItem(timelineItemId: string) {
  return _deleteEventTimelineItem(timelineItemId);
}

