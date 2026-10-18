"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { validateDummyUser } from "@/shared/lib/serverAuth";

export async function createPackageTemplate(formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;

  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const payload = formData.get("payload") as string;
    const kategoriUtama = (formData.get("kategoriUtama") as string)?.trim() || null;

    let labelGrade: string[] = [];
    const rawLabelGrade = formData.get("labelGrade");
    if (typeof rawLabelGrade === "string" && rawLabelGrade.trim() !== "") {
      try {
        const parsed = JSON.parse(rawLabelGrade);
        if (Array.isArray(parsed)) {
          labelGrade = parsed.map((item: any) => String(item).trim()).filter(Boolean);
        }
      } catch {
        labelGrade = rawLabelGrade.split(",").map((item) => item.trim()).filter(Boolean);
      }
    }

    if (!name || !payload) return { success: false, error: "Data tidak lengkap." };

    await prisma.packageTemplate.create({
      data: { name, description, payload, kategoriUtama, labelGrade },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Create Package Error:", error);
    return { success: false, error: "Gagal membuat paket template." };
  }
}

export async function updatePackageTemplate(id: string, formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;

  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const payload = formData.get("payload") as string;
    const kategoriUtama = (formData.get("kategoriUtama") as string)?.trim() || null;

    let labelGrade: string[] = [];
    const rawLabelGrade = formData.get("labelGrade");
    if (typeof rawLabelGrade === "string" && rawLabelGrade.trim() !== "") {
      try {
        const parsed = JSON.parse(rawLabelGrade);
        if (Array.isArray(parsed)) {
          labelGrade = parsed.map((item: any) => String(item).trim()).filter(Boolean);
        }
      } catch {
        labelGrade = rawLabelGrade.split(",").map((item) => item.trim()).filter(Boolean);
      }
    }

    if (!name || !payload) return { success: false, error: "Data tidak lengkap." };

    await prisma.packageTemplate.update({
      where: { id },
      data: { name, description, payload, kategoriUtama, labelGrade },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Update Package Error:", error);
    return { success: false, error: "Gagal memperbarui paket template." };
  }
}

export async function deletePackageTemplate(id: string) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;

  try {
    await prisma.packageTemplate.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Package Error:", error);
    return { success: false, error: "Gagal menghapus paket template." };
  }
}

export async function addBulkRental(formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    const payloadStr = formData.get("payload") as string;
    if (!payloadStr) return { success: false, error: "Data kosong." };
    
    const payload = JSON.parse(payloadStr) as { id: string; qty: number }[];
    if (payload.length === 0) return { success: true };
    
    await prisma.$transaction(async (tx) => {
      const itemIds = payload.map(item => item.id);
      const dbItems = await tx.item.findMany({
        where: { id: { in: itemIds } }
      });
      const dbItemMap = new Map(dbItems.map(i => [i.id, i]));

      for (const item of payload) {
        const dbItem = dbItemMap.get(item.id);
        if (!dbItem) throw new Error(`Barang dengan ID ${item.id} tidak ditemukan.`);
        if (dbItem.quantity < item.qty) throw new Error(`Stok tersedia untuk ${dbItem.name} tidak mencukupi (Tersedia: ${dbItem.quantity}, Diminta: ${item.qty}).`);
      }

      await Promise.all(
        payload.map(item => {
          const dbItem = dbItemMap.get(item.id)!;
          return tx.item.update({
            where: { id: item.id },
            data: {
              quantity: dbItem.quantity - item.qty,
              rentedQuantity: dbItem.rentedQuantity + item.qty
            }
          });
        })
      );
    }, { maxWait: 5000, timeout: 20000 });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("addBulkRental error:", error);
    return { success: false, error: error.message || "Gagal memproses rental masal." };
  }
}


