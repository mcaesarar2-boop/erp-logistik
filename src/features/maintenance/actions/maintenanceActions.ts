"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { validateDummyUser } from "@/shared/lib/serverAuth";

/**
 * Memindahkan sejumlah stok barang dari status 'Tersedia' (quantity)
 * ke status 'Dalam Pemeliharaan' (maintenanceQuantity).
 */
export async function addBulkMaintenance(formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;

  try {
    const payloadStr = formData.get("payload") as string;
    if (!payloadStr) return { success: false, error: "Data kosong." };

    const payload = JSON.parse(payloadStr) as { id: string; qty: number }[];
    if (payload.length === 0) return { success: true };

    await prisma.$transaction(async (tx) => {
      const itemIds = payload.map((item) => item.id);
      const dbItems = await tx.item.findMany({
        where: { id: { in: itemIds } },
      });
      const dbItemMap = new Map(dbItems.map((i) => [i.id, i]));

      for (const item of payload) {
        const dbItem = dbItemMap.get(item.id);
        if (!dbItem) throw new Error(`Barang dengan ID ${item.id} tidak ditemukan.`);
        if (dbItem.quantity < item.qty) {
          throw new Error(`Stok tersedia untuk ${dbItem.name} tidak mencukupi.`);
        }
      }

      await Promise.all(
        payload.map((item) => {
          const dbItem = dbItemMap.get(item.id)!;
          return tx.item.update({
            where: { id: item.id },
            data: {
              quantity: dbItem.quantity - item.qty,
              maintenanceQuantity: dbItem.maintenanceQuantity + item.qty,
            },
          });
        })
      );
    }, { maxWait: 5000, timeout: 20000 });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("addBulkMaintenance error:", error);
    return { success: false, error: error.message || "Gagal memproses pemeliharaan masal." };
  }
}

/**
 * Menyelesaikan pemeliharaan item: mengembalikan jumlah unit dari
 * 'maintenanceQuantity' kembali ke stok 'quantity' (tersedia).
 */
export async function completeMaintenanceItem(itemId: string, qtyToRestore?: number) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;

  try {
    const dbItem = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!dbItem) {
      return { success: false, error: "Barang tidak ditemukan." };
    }

    if (dbItem.maintenanceQuantity <= 0) {
      return { success: false, error: "Barang ini tidak sedang dalam pemeliharaan." };
    }

    const restoreQty = (qtyToRestore && qtyToRestore > 0)
      ? Math.min(qtyToRestore, dbItem.maintenanceQuantity)
      : dbItem.maintenanceQuantity;

    await prisma.item.update({
      where: { id: itemId },
      data: {
        quantity: dbItem.quantity + restoreQty,
        maintenanceQuantity: dbItem.maintenanceQuantity - restoreQty,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("completeMaintenanceItem error:", error);
    return { success: false, error: error.message || "Gagal menyelesaikan pemeliharaan barang." };
  }
}

