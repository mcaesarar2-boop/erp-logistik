"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { validateDummyUser } from "@/shared/lib/serverAuth";

export async function addEventUtility(eventDetailId: string, formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    const name = (formData.get("name") as string)?.trim() || "";
    const category = (formData.get("category") as string)?.trim() || "Konsumsi";
    const quantity = Math.max(1, parseInt(formData.get("quantity") as string) || 1);
    const unit = (formData.get("unit") as string)?.trim() || "pcs";
    const procurementType = ((formData.get("procurementType") as string)?.toUpperCase() === "SEWA" ? "SEWA" : "BELI") as "BELI" | "SEWA";

    let unitPrice = 0;
    let rentalPricePerDay = 0;
    let rentalDays = 1;
    let totalCost = 0;

    if (procurementType === "BELI") {
      unitPrice = Math.max(0, parseFloat(formData.get("unitPrice") as string) || 0);
      totalCost = quantity * unitPrice;
    } else {
      rentalPricePerDay = Math.max(0, parseFloat(formData.get("rentalPricePerDay") as string) || 0);
      rentalDays = Math.max(1, parseInt(formData.get("rentalDays") as string) || 1);
      totalCost = quantity * rentalPricePerDay * rentalDays;
    }

    const notes = (formData.get("notes") as string)?.trim() || null;

    if (!name) {
      return { success: false, error: "Nama kebutuhan utilitas wajib diisi." };
    }

    const utility = await prisma.eventUtility.create({
      data: {
        eventDetailId,
        name,
        category,
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
    return { success: true, data: utility };
  } catch (error: any) {
    console.error("addEventUtility error:", error);
    return { success: false, error: error.message || "Gagal menambahkan utilitas event." };
  }
}

export async function deleteEventUtility(utilityId: string) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    await prisma.eventUtility.delete({
      where: { id: utilityId }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("deleteEventUtility error:", error);
    return { success: false, error: error.message || "Gagal menghapus utilitas event." };
  }
}

