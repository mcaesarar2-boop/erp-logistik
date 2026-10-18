"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { validateDummyUser } from "@/shared/lib/serverAuth";

export async function addEventSponsor(eventDetailId: string, formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    const name = (formData.get("name") as string)?.trim() || "";
    const supportType = (formData.get("supportType") as string)?.trim() || "DANA";
    const amount = Math.max(0, parseFloat(formData.get("amount") as string) || 0);
    const status = (formData.get("status") as string)?.trim() || "CONFIRMED";
    const notes = (formData.get("notes") as string)?.trim() || null;

    if (!name) {
      return { success: false, error: "Nama sponsor wajib diisi." };
    }

    const sponsor = await prisma.eventSponsor.create({
      data: {
        eventDetailId,
        name,
        supportType,
        amount,
        status,
        notes
      }
    });

    revalidatePath("/");
    return { success: true, data: sponsor };
  } catch (error: any) {
    console.error("addEventSponsor error:", error);
    return { success: false, error: error.message || "Gagal menambahkan sponsor." };
  }
}

export async function deleteEventSponsor(sponsorId: string) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    await prisma.eventSponsor.delete({
      where: { id: sponsorId }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("deleteEventSponsor error:", error);
    return { success: false, error: error.message || "Gagal menghapus sponsor." };
  }
}

export async function updateEventSponsorStatus(sponsorId: string, status: string) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    await prisma.eventSponsor.update({
      where: { id: sponsorId },
      data: { status }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("updateEventSponsorStatus error:", error);
    return { success: false, error: error.message || "Gagal memperbarui status sponsor." };
  }
}

