"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { validateDummyUser } from "@/shared/lib/serverAuth";

// --- FUNGSI CHECKOUT RENTAL & TAMBAH BARANG SUSULAN ---
export async function checkoutRental(formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    const itemsPayloadStr = formData.get("itemsPayload") as string;
    const customPayloadStr = formData.get("customPayload") as string;
    const rentalDays = Math.max(1, parseInt(formData.get("rentalDays") as string) || 1);
    const discountPercentage = Math.max(0, Math.min(100, parseFloat(formData.get("discountPercentage") as string) || 0));
    const discountDesc = (formData.get("discountDesc") as string) || "";
    const eventName = (formData.get("eventName") as string) || "";
    const targetEventId = (formData.get("targetEventId") as string) || "";
    const targetEventName = (formData.get("targetEventName") as string) || "";

    const cartItems = itemsPayloadStr ? (JSON.parse(itemsPayloadStr) as any[]) : [];
    const customItems = customPayloadStr ? (JSON.parse(customPayloadStr) as any[]) : [];

    if (cartItems.length === 0 && customItems.length === 0) {
      return { success: false, error: "Keranjang masih kosong." };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Validasi & Kurangi Stok Barang Fisik (Akumulasikan kuantitas per itemId dari seluruh baris)
      if (cartItems.length > 0) {
        const requestedQtyMap = new Map<string, number>();
        for (const item of cartItems) {
          const cur = requestedQtyMap.get(item.id) || 0;
          requestedQtyMap.set(item.id, cur + (Number(item.qty) || 1));
        }

        const itemIds = Array.from(requestedQtyMap.keys());
        const dbItems = await tx.item.findMany({
          where: { id: { in: itemIds } },
        });
        const dbItemMap = new Map(dbItems.map((i) => [i.id, i]));

        for (const [itemId, totalQty] of requestedQtyMap.entries()) {
          const dbItem = dbItemMap.get(itemId);
          if (!dbItem) throw new Error(`Barang dengan ID ${itemId} tidak ditemukan.`);
          if (dbItem.quantity < totalQty) {
            throw new Error(
              `Stok tersedia untuk "${dbItem.name}" tidak mencukupi (Tersedia: ${dbItem.quantity}, Total Diminta: ${totalQty}).`
            );
          }
        }

        await Promise.all(
          Array.from(requestedQtyMap.entries()).map(([itemId, totalQty]) => {
            const dbItem = dbItemMap.get(itemId)!;
            return tx.item.update({
              where: { id: itemId },
              data: {
                quantity: dbItem.quantity - totalQty,
                rentedQuantity: dbItem.rentedQuantity + totalQty,
              },
            });
          })
        );
      }

      // 2. Susun Snapshot Payload untuk Transaksi / Invoice Baru (Sertakan lineId dan Diskon Item)
      const newItemsPayload = [
        ...cartItems.map((c: any) => {
          const itemDiscount = Math.max(0, Math.min(100, Number(c.discount) || 0));
          const baseRentPerItem = ((c.price || 0) * (c.rentPercentage || 0)) / 100;
          const netRentPerItem = baseRentPerItem * (1 - itemDiscount / 100);
          return {
            lineId: c.lineId || crypto.randomUUID(),
            id: c.id,
            name: c.name,
            code: c.code,
            qty: Number(c.qty) || 1,
            returnedQty: 0,
            imageUrl: c.imageUrl || null,
            basePrice: baseRentPerItem,
            discount: itemDiscount,
            price: netRentPerItem * rentalDays * (1 - discountPercentage / 100),
            footnote: c.footnote || "",
          };
        }),
        ...customItems.map((c: any) => {
          const itemDiscount = Math.max(0, Math.min(100, Number(c.discount) || 0));
          const basePrice = Number(c.price) || 0;
          const netPrice = basePrice * (1 - itemDiscount / 100);
          return {
            lineId: c.lineId || crypto.randomUUID(),
            id: c.id || `custom-${Date.now()}`,
            name: c.name,
            code: "LAYANAN",
            qty: Number(c.qty) || 1,
            returnedQty: 0,
            imageUrl: null,
            basePrice: basePrice,
            discount: itemDiscount,
            price: netPrice * rentalDays * (1 - discountPercentage / 100),
            footnote: c.footnote || "Layanan Tambahan",
          };
        }),
      ];

      const totalPhysicalQty = cartItems.reduce((acc: number, i: any) => acc + (Number(i.qty) || 1), 0);
      const totalCustomQty = customItems.reduce((acc: number, i: any) => acc + (Number(i.qty) || 1), 0);

      // 3. JIKA MODE TAMBAH BARANG SUSULAN (targetEventId TERSEDIA)
      if (targetEventId) {
        const existingEvent = await tx.history.findUnique({
          where: { id: targetEventId },
        });

        if (!existingEvent) {
          throw new Error("Event yang dituju tidak ditemukan di database.");
        }

        // Parse payload event lama dan tambahkan item baru sebagai baris mandiri tanpa auto-merge
        let existingEventPayload: any[] = [];
        try {
          existingEventPayload = JSON.parse(existingEvent.payload || "[]");
        } catch {
          existingEventPayload = [];
        }

        for (const newItem of newItemsPayload) {
          existingEventPayload.push({ ...newItem, returnedQty: 0 });
        }

        // Update record event lama (pastikan tidak ada flag [SELESAI])
        const cleanEventDesc = (existingEvent.description || "Event").replace(" [SELESAI]", "").trim();
        await tx.history.update({
          where: { id: targetEventId },
          data: {
            payload: JSON.stringify(existingEventPayload),
            description: cleanEventDesc,
          },
        });

        // Buat record Invoice / Transaksi BARU terpisah khusus untuk keranjang tambahan ini
        const cleanName = targetEventName || eventName.replace("(Tambahan)", "").trim() || "Event";
        let addonInvoiceDesc = `[${cleanName}] - Invoice Tambahan | Invoice Rental (`;
        if (totalPhysicalQty > 0) addonInvoiceDesc += `${totalPhysicalQty} Aset`;
        if (totalPhysicalQty > 0 && totalCustomQty > 0) addonInvoiceDesc += `, `;
        if (totalCustomQty > 0) addonInvoiceDesc += `${totalCustomQty} Layanan`;
        addonInvoiceDesc += `)`;

        if (rentalDays > 1) addonInvoiceDesc += ` - ${rentalDays} Hari`;
        if (discountPercentage > 0) {
          addonInvoiceDesc += ` - Diskon ${discountPercentage}%`;
          if (discountDesc.trim()) addonInvoiceDesc += ` (${discountDesc.trim()})`;
        }

        await tx.history.create({
          data: {
            type: "INVOICE_RENTAL",
            date: new Date(),
            description: addonInvoiceDesc,
            payload: JSON.stringify(newItemsPayload),
          },
        });
      } else {
        // 4. JIKA CHECKOUT NORMAL (EVENT / RENTAL BARU)
        let historyDesc = `Invoice Rental (`;
        if (totalPhysicalQty > 0) historyDesc += `${totalPhysicalQty} Aset`;
        if (totalPhysicalQty > 0 && totalCustomQty > 0) historyDesc += `, `;
        if (totalCustomQty > 0) historyDesc += `${totalCustomQty} Layanan`;
        historyDesc += `)`;

        if (eventName.trim() !== "") {
          historyDesc = `Event: ${eventName.trim()} | ` + historyDesc;
        }
        if (rentalDays > 1) historyDesc += ` - ${rentalDays} Hari`;
        if (discountPercentage > 0) {
          historyDesc += ` - Diskon ${discountPercentage}%`;
          if (discountDesc.trim() !== "") {
            historyDesc += ` (${discountDesc.trim()})`;
          }
        }

        await tx.history.create({
          data: {
            type: "INVOICE_RENTAL",
            date: new Date(),
            description: historyDesc,
            payload: JSON.stringify(newItemsPayload),
          },
        });
      }
    }, { maxWait: 5000, timeout: 25000 });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("checkoutRental error:", error);
    return { success: false, error: error.message || "Gagal memproses checkout sewa." };
  }
}

