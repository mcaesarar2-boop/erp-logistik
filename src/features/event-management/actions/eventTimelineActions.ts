"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { validateDummyUser } from "@/shared/lib/serverAuth";

export async function addEventTimelineItem(eventDetailId: string, formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    const title = (formData.get("title") as string)?.trim() || "";
    const category = (formData.get("category") as string)?.trim() || "PERFORMANCE";
    const dayNumber = Math.max(1, parseInt(formData.get("dayNumber") as string) || 1);
    const guestStarId = (formData.get("guestStarId") as string)?.trim() || null;
    const stageLocation = (formData.get("stageLocation") as string)?.trim() || "Main Stage";
    const notes = (formData.get("notes") as string)?.trim() || null;

    let slots: string[] = [];
    try {
      const rawSlots = formData.get("slots") as string;
      if (rawSlots) slots = JSON.parse(rawSlots);
    } catch {
      slots = [];
    }

    if (!title) {
      return { success: false, error: "Nama agenda / aktivitas wajib diisi." };
    }
    if (slots.length === 0) {
      return { success: false, error: "Pilih minimal 1 slot waktu (30 menit)." };
    }

    const sortedSlots = [...slots].sort();
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

    const item = await prisma.eventTimelineItem.create({
      data: {
        eventDetailId,
        guestStarId: guestStarId || undefined,
        dayNumber,
        title,
        category,
        startTime,
        endTime,
        slots: sortedSlots,
        stageLocation,
        notes
      }
    });

    revalidatePath("/");
    return { success: true, data: item };
  } catch (error: any) {
    console.error("addEventTimelineItem error:", error);
    return { success: false, error: error.message || "Gagal menambahkan agenda timeline." };
  }
}

export async function deleteEventTimelineItem(timelineItemId: string) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    await prisma.eventTimelineItem.delete({
      where: { id: timelineItemId }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("deleteEventTimelineItem error:", error);
    return { success: false, error: error.message || "Gagal menghapus agenda timeline." };
  }
}

