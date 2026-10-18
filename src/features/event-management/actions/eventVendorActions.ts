"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { validateDummyUser } from "@/shared/lib/serverAuth";

export async function addEventVendor(eventDetailId: string, formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    const name = (formData.get("name") as string)?.trim() || "";
    const category = (formData.get("category") as string)?.trim() || "Umum";
    const cost = Math.max(0, parseFloat(formData.get("cost") as string) || 0);
    const notes = (formData.get("notes") as string)?.trim() || null;

    if (!name) {
      return { success: false, error: "Nama vendor wajib diisi." };
    }

    const vendor = await prisma.eventVendor.create({
      data: {
        eventDetailId,
        name,
        category,
        cost,
        isErpPusat: false,
        notes
      }
    });

    revalidatePath("/");
    return { success: true, data: vendor };
  } catch (error: any) {
    console.error("addEventVendor error:", error);
    return { success: false, error: error.message || "Gagal menambahkan vendor." };
  }
}

export async function deleteEventVendor(vendorId: string) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    const existing = await prisma.eventVendor.findUnique({ where: { id: vendorId } });
    if (existing?.isErpPusat) {
      return { success: false, error: "Vendor ERP Logistik Pusat tidak dapat dihapus karena tersinkronisasi otomatis." };
    }
    await prisma.eventVendor.delete({
      where: { id: vendorId }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("deleteEventVendor error:", error);
    return { success: false, error: error.message || "Gagal menghapus vendor." };
  }
}

