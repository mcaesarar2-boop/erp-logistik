"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { validateDummyUser } from "@/shared/lib/serverAuth";

// --- FUNGSI PENGEMBALIAN RENTAL (BALIK GUDANG) ---
export async function returnBulkRental(formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    const payloadStr = formData.get("payload") as string;
    const historyId = formData.get("historyId") as string | null;
    const historyPayloadStr = formData.get("historyPayload") as string | null;
    const historyDesc = formData.get("historyDesc") as string | null;
    
    if (!payloadStr) return { success: false, error: "Data kosong." };
    
    const payload = JSON.parse(payloadStr) as { id: string; qty: number }[];
    if (payload.length === 0) return { success: true };
    
    await prisma.$transaction(async (tx) => {
      // 1. Validasi & Update Item Stok Gudang vs Rented
      const itemIds = payload.map(item => item.id);
      const dbItems = await tx.item.findMany({
        where: { id: { in: itemIds } }
      });
      const dbItemMap = new Map(dbItems.map(i => [i.id, i]));

      for (const item of payload) {
        const dbItem = dbItemMap.get(item.id);
        if (!dbItem) throw new Error(`Barang dengan ID ${item.id} tidak ditemukan.`);
        if (dbItem.rentedQuantity < item.qty) throw new Error(`Jumlah pengembalian untuk ${dbItem.name} melebihi yang sedang disewa.`);
      }

      // Update stok item di database
      await Promise.all(
        payload.map(item => {
          const dbItem = dbItemMap.get(item.id)!;
          return tx.item.update({
            where: { id: item.id },
            data: {
              quantity: dbItem.quantity + item.qty,
              rentedQuantity: Math.max(0, dbItem.rentedQuantity - item.qty)
            }
          });
        })
      );

      // 2. Jika pengembalian ditargetkan ke Event Tertentu (dari Tombol di Card)
      if (historyId) {
        let updatedPayloadStr = historyPayloadStr;
        let updatedDesc = historyDesc;

        // Jika client tidak mengirimkan payload ter-update atau deskripsi, hitung di backend
        if (!updatedPayloadStr) {
          const event = await tx.history.findUnique({ where: { id: historyId } });
          if (event && event.payload) {
            const eventPayload = JSON.parse(event.payload || "[]");
            const newPayload = eventPayload.map((p: any) => {
              const returnedItem = payload.find(c => c.id === p.id || (p.code && dbItemMap.get(c.id)?.code === p.code));
              if (returnedItem) {
                const newReturnedQty = Math.min(p.qty, (p.returnedQty || 0) + returnedItem.qty);
                return { ...p, returnedQty: newReturnedQty };
              }
              return p;
            });
            updatedPayloadStr = JSON.stringify(newPayload);

            const isAllReturned = newPayload
              .filter((p: any) => p.code !== "LAYANAN" && !(p.id && String(p.id).startsWith("custom-")))
              .every((p: any) => (p.returnedQty || 0) >= p.qty);

            if (isAllReturned && event.description && !event.description.includes("[SELESAI]")) {
              updatedDesc = `${event.description} [SELESAI]`;
            }
          }
        }

        const updateData: any = {};
        if (updatedPayloadStr) updateData.payload = updatedPayloadStr;
        if (updatedDesc) updateData.description = updatedDesc;
        if (Object.keys(updateData).length > 0) {
          await tx.history.update({
            where: { id: historyId },
            data: updateData
          });
        }
      } else {
        // 3. Jika pengembalian GLOBAL (dari Tombol Utama di Atas)
        // Cari semua event aktif yang belum SELESAI
        const activeEvents = await tx.history.findMany({
          where: {
            type: "INVOICE_RENTAL",
            description: { contains: "Event:" }
          },
          orderBy: { date: "asc" }
        });

        const nonCompletedEvents = activeEvents.filter(
          e => e.description && !e.description.includes("[SELESAI]")
        );

        // Tracking sisa kuantitas barang yang dikembalikan untuk didistribusikan ke event-event terkait (FIFO)
        const returnPool = new Map<string, number>();
        for (const item of payload) {
          returnPool.set(item.id, item.qty);
        }

        for (const event of nonCompletedEvents) {
          if (!event.payload) continue;
          let eventPayload: any[] = [];
          try {
            eventPayload = JSON.parse(event.payload);
          } catch {
            continue;
          }

          let eventModified = false;

          const updatedEventPayload = eventPayload.map((p: any) => {
            const dbItem = payload.find(c => c.id === p.id || (p.code && dbItemMap.get(c.id)?.code === p.code));
            if (!dbItem) return p;

            const remainingInPool = returnPool.get(dbItem.id) || 0;
            if (remainingInPool <= 0) return p;

            const unreturnedInEvent = Math.max(0, p.qty - (p.returnedQty || 0));
            if (unreturnedInEvent <= 0) return p;

            const qtyToDeduct = Math.min(remainingInPool, unreturnedInEvent);
            returnPool.set(dbItem.id, remainingInPool - qtyToDeduct);
            eventModified = true;

            return {
              ...p,
              returnedQty: (p.returnedQty || 0) + qtyToDeduct
            };
          });

          if (eventModified) {
            const isAllReturned = updatedEventPayload
              .filter((p: any) => p.code !== "LAYANAN" && !(p.id && String(p.id).startsWith("custom-")))
              .every((p: any) => (p.returnedQty || 0) >= p.qty);

            let newDesc = event.description || "";
            if (isAllReturned && !newDesc.includes("[SELESAI]")) {
              newDesc = `${newDesc} [SELESAI]`;
            }

            await tx.history.update({
              where: { id: event.id },
              data: {
                payload: JSON.stringify(updatedEventPayload),
                description: newDesc
              }
            });
          }
        }
      }
    }, { maxWait: 5000, timeout: 20000 });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("returnBulkRental error:", error);
    return { success: false, error: error.message || "Gagal memproses pengembalian barang." };
  }
}

// --- FUNGSI SINKRONISASI DATA & BERSIHKAN GHOST EVENTS ---
export async function syncActiveEvents() {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    const activeEvents = await prisma.history.findMany({
      where: {
        type: "INVOICE_RENTAL",
        description: { contains: "Event:" }
      },
      orderBy: { date: "asc" }
    });

    const nonCompletedEvents = activeEvents.filter(
      e => e.description && !e.description.includes("[SELESAI]")
    );

    const items = await prisma.item.findMany();
    const itemMap = new Map(items.map(i => [i.id, i]));
    const itemCodeMap = new Map(items.map(i => [i.code, i]));

    let updatedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const event of nonCompletedEvents) {
        if (!event.payload) continue;
        let eventPayload: any[] = [];
        try {
          eventPayload = JSON.parse(event.payload);
        } catch {
          continue;
        }

        if (!Array.isArray(eventPayload) || eventPayload.length === 0) {
          await tx.history.update({
            where: { id: event.id },
            data: { description: `${event.description || "Event"} [SELESAI]` }
          });
          updatedCount++;
          continue;
        }

        const physicalItems = eventPayload.filter(
          (p: any) => p.code !== "LAYANAN" && !(p.id && String(p.id).startsWith("custom-"))
        );

        if (physicalItems.length === 0) {
          await tx.history.update({
            where: { id: event.id },
            data: { description: `${event.description || "Event"} [SELESAI]` }
          });
          updatedCount++;
          continue;
        }

        const unreturnedCount = physicalItems.reduce((acc: number, p: any) => {
          const rem = Math.max(0, (Number(p.qty) || 0) - (Number(p.returnedQty) || 0));
          return acc + rem;
        }, 0);

        const allItemsInDbReturned = physicalItems.every((p: any) => {
          const dbItem = itemMap.get(p.id) || (p.code ? itemCodeMap.get(p.code) : undefined);
          return !dbItem || dbItem.rentedQuantity === 0;
        });

        if (unreturnedCount === 0 || allItemsInDbReturned) {
          const updatedPayload = eventPayload.map((p: any) => {
            const isPhysical = p.code !== "LAYANAN" && !(p.id && String(p.id).startsWith("custom-"));
            if (isPhysical) {
              return { ...p, returnedQty: Number(p.qty) || 1 };
            }
            return p;
          });

          let newDesc = event.description || "Event";
          if (!newDesc.includes("[SELESAI]")) {
            newDesc = `${newDesc} [SELESAI]`;
          }

          await tx.history.update({
            where: { id: event.id },
            data: {
              description: newDesc,
              payload: JSON.stringify(updatedPayload)
            }
          });
          updatedCount++;
        }
      }
    }, { maxWait: 5000, timeout: 20000 });

    revalidatePath("/");
    return { success: true, count: updatedCount };
  } catch (error: any) {
    console.error("syncActiveEvents error:", error);
    return { success: false, error: error.message || "Gagal melakukan sinkronisasi data event." };
  }
}
