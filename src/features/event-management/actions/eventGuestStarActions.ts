"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { validateDummyUser } from "@/shared/lib/serverAuth";

export async function addEventGuestStar(eventDetailId: string, formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    const name = (formData.get("name") as string)?.trim() || "";
    const category = (formData.get("category") as string)?.trim() || "BAND";
    const personnelCount = Math.max(1, parseInt(formData.get("personnelCount") as string) || 1);
    const contactPerson = (formData.get("contactPerson") as string)?.trim() || null;
    const feePerDay = Math.max(0, parseFloat(formData.get("feePerDay") as string) || 0);
    const durationDays = Math.max(1, parseInt(formData.get("durationDays") as string) || 1);
    const dayNumber = Math.max(1, parseInt(formData.get("dayNumber") as string) || 1);
    const stageTime = (formData.get("stageTime") as string)?.trim() || null;
    const stageLocation = (formData.get("stageLocation") as string)?.trim() || "Main Stage";
    const notes = (formData.get("notes") as string)?.trim() || null;

    let timelineSlots: string[] = [];
    try {
      const rawSlots = formData.get("timelineSlots") as string;
      if (rawSlots) {
        timelineSlots = JSON.parse(rawSlots);
      }
    } catch {
      timelineSlots = [];
    }

    if (!name) {
      return { success: false, error: "Nama Guest Star / Artis wajib diisi." };
    }

    const totalFee = feePerDay * durationDays;

    const guestStar = await prisma.eventGuestStar.create({
      data: {
        eventDetailId,
        name,
        category,
        personnelCount,
        contactPerson,
        feePerDay,
        durationDays,
        totalFee,
        dayNumber,
        stageTime,
        timelineSlots,
        notes
      },
      include: {
        riders: true
      }
    });

    // Otomatis sinkronkan slot jadwal ke tabel EventTimelineItem terpusat
    if (timelineSlots.length > 0) {
      const sortedSlots = [...timelineSlots].sort();
      const startTime = sortedSlots[0];
      const lastSlot = sortedSlots[sortedSlots.length - 1];
      const [lastH, lastM] = lastSlot.split(":").map(Number);
      let endH = lastH;
      let endM = lastM + 30;
      if (endM >= 60) {
        endH = (endH + 1) % 24;
        endM = endM - 60;
      }
      const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

      const createdTimelineItem = await prisma.eventTimelineItem.create({
        data: {
          eventDetailId,
          guestStarId: guestStar.id,
          dayNumber,
          title: name,
          category: "PERFORMANCE",
          startTime,
          endTime,
          slots: sortedSlots,
          stageLocation,
          notes
        }
      });
      revalidatePath("/");
      return { success: true, data: guestStar, timelineItem: createdTimelineItem };
    }

    revalidatePath("/");
    return { success: true, data: guestStar, timelineItem: null };
  } catch (error: any) {
    console.error("addEventGuestStar error:", error);
    return { success: false, error: error.message || "Gagal menambahkan Guest Star." };
  }
}

export async function deleteEventGuestStar(guestStarId: string) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    await prisma.eventTimelineItem.deleteMany({
      where: { guestStarId }
    });
    await prisma.eventGuestStar.delete({
      where: { id: guestStarId }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("deleteEventGuestStar error:", error);
    return { success: false, error: error.message || "Gagal menghapus Guest Star." };
  }
}

export async function addEventGuestStarRider(guestStarId: string, formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    const name = (formData.get("name") as string)?.trim() || "";
    const riderType = (formData.get("riderType") as string)?.trim() || "TECHNICAL";
    const sourceType = (formData.get("sourceType") as string)?.trim() || "VENDOR_LUAR";
    const quantity = Math.max(1, parseInt(formData.get("quantity") as string) || 1);
    const unit = (formData.get("unit") as string)?.trim() || "Unit";
    const notes = (formData.get("notes") as string)?.trim() || null;

    if (!name) {
      return { success: false, error: "Nama kebutuhan riders wajib diisi." };
    }

    let procurementType = "SEWA";
    let unitPrice = 0;
    let rentalPricePerDay = 0;
    let rentalDays = 1;
    let totalCost = 0;

    if (sourceType === "ERP_LOGISTIK") {
      procurementType = "FREE_ERP";
      unitPrice = 0;
      rentalPricePerDay = 0;
      rentalDays = 1;
      totalCost = 0; // Tercover dalam transaksi paket/sewa ERP Pusat
    } else {
      procurementType = ((formData.get("procurementType") as string)?.toUpperCase() === "BELI" ? "BELI" : "SEWA");
      if (procurementType === "BELI") {
        unitPrice = Math.max(0, parseFloat(formData.get("unitPrice") as string) || 0);
        totalCost = quantity * unitPrice;
      } else {
        rentalPricePerDay = Math.max(0, parseFloat(formData.get("rentalPricePerDay") as string) || 0);
        rentalDays = Math.max(1, parseInt(formData.get("rentalDays") as string) || 1);
        totalCost = quantity * rentalPricePerDay * rentalDays;
      }
    }

    const rider = await prisma.eventGuestStarRider.create({
      data: {
        guestStarId,
        name,
        riderType,
        sourceType,
        quantity,
        unit,
        procurementType,
        unitPrice,
        rentalPricePerDay,
        rentalDays,
        totalCost,
        notes
      }
    });

    revalidatePath("/");
    return { success: true, data: rider };
  } catch (error: any) {
    console.error("addEventGuestStarRider error:", error);
    return { success: false, error: error.message || "Gagal menambahkan item riders." };
  }
}

export async function deleteEventGuestStarRider(riderId: string) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    await prisma.eventGuestStarRider.delete({
      where: { id: riderId }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("deleteEventGuestStarRider error:", error);
    return { success: false, error: error.message || "Gagal menghapus item riders." };
  }
}

