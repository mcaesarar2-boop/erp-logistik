"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { validateDummyUser } from "@/shared/lib/serverAuth";

export async function addEventManualEquipment(eventDetailId: string, formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    const name = (formData.get("name") as string)?.trim() || "";
    const category = (formData.get("category") as string)?.trim() || "Peralatan";
    const quantity = Math.max(1, parseInt(formData.get("quantity") as string) || 1);
    const procurementType = ((formData.get("procurementType") as string)?.toUpperCase() === "BELI" ? "BELI" : "SEWA") as "BELI" | "SEWA";
    
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
      return { success: false, error: "Nama barang peralatan wajib diisi." };
    }

    const equipment = await prisma.eventManualEquipment.create({
      data: {
        eventDetailId,
        name,
        category,
        quantity,
        procurementType,
        unitPrice,
        rentalPricePerDay,
        rentalDays,
        totalCost,
        notes
      }
    });

    revalidatePath("/");
    return { success: true, data: equipment };
  } catch (error: any) {
    console.error("addEventManualEquipment error:", error);
    return { success: false, error: error.message || "Gagal menambahkan peralatan manual." };
  }
}

export async function deleteEventManualEquipment(equipmentId: string) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    await prisma.eventManualEquipment.delete({
      where: { id: equipmentId }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("deleteEventManualEquipment error:", error);
    return { success: false, error: error.message || "Gagal menghapus peralatan manual." };
  }
}

