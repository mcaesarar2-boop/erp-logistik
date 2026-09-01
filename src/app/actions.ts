"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { supabase } from "@/lib/supabase" // <--- IMPORT AGEN SUPABASE

// --- FUNGSI HELPER UNTUK UPLOAD FOTO ---
async function uploadImageToSupabase(imageFile: File | null): Promise<string | undefined> {
  if (!imageFile || imageFile.size === 0 || imageFile.name === "undefined") {
    return undefined
  }

  try {
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    
    // KARENA REACT SUDAH MENANGANI FORM DENGAN BENAR, KITA BISA LANGSUNG PAKAI imageFile (TIDAK PERLU ARRAYBUFFER)
    const { error } = await supabase.storage.from('item-images').upload(fileName, imageFile, {
      contentType: imageFile.type,
      upsert: false
    })

    if (error) {
      console.error("SUPABASE UPLOAD ERROR:", error)
      return undefined
    }

    const { data: publicUrlData } = supabase.storage.from('item-images').getPublicUrl(fileName)
    return publicUrlData.publicUrl
  } catch (err) {
    console.error("KESALAHAN SISTEM SAAT UPLOAD:", err)
    return undefined
  }
}

// --- FUNGSI HELPER UNTUK MEMBUAT PREFIX KODE ASET ---
function generatePrefix(categoryName: string) {
  const words = categoryName.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase(); 
  } else {
    return words.map(w => w[0]).join('').substring(0, 3).toUpperCase();
  }
}

import { isDemoEmail } from "@/lib/permissions"

// --- FUNGSI HELPER UNTUK VALIDASI AKUN DUMMY ---
async function validateDummyUser() {
  // Ambil data user dari sesi yang aktif di server
  const { data: { user } } = await supabase.auth.getUser();

  // Cek apakah email user adalah akun dummy
  if (isDemoEmail(user?.email)) {
    // Jika ya, kembalikan pesan error
    return { success: false, error: "Akses ditolak: Akun Dummy hanya dapat melihat data (Read-Only)." };
  }
  
  // Jika bukan, kembalikan null (artinya lolos validasi)
  return null;
}

export async function createItem(formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    const name = formData.get("name") as string
    let code = formData.get("code") as string
    const categoryIds = formData.getAll("categories") as string[]
    
    if (categoryIds.length === 0) return { success: false, error: "Pilih minimal 1 kategori/label." }

    // --- 1. AUTO GENERATE KODE JIKA KOSONG ---
    if (!code || code.trim() === "") {
      let prefix = "ITM";
      
      const selectedCategories = await prisma.category.findMany({
        where: { id: { in: categoryIds } }
      });
      if (selectedCategories.length > 0) {
        const prefixes = selectedCategories.map(c => generatePrefix(c.name)).sort();
        prefix = prefixes.join('-');
      }
      
      const itemsWithPrefix = await prisma.item.findMany({
        where: { code: { startsWith: `${prefix}-` } },
        select: { code: true }
      });
      
      let nextSerial = 1;
      if (itemsWithPrefix.length > 0) {
        const serials = itemsWithPrefix.map(item => {
          const lastDashIndex = item.code.lastIndexOf('-');
          if (lastDashIndex === -1) return 0;
          const itemPrefix = item.code.substring(0, lastDashIndex);
          if (itemPrefix !== prefix) return 0;
          const num = parseInt(item.code.substring(lastDashIndex + 1), 10);
          return isNaN(num) ? 0 : num;
        });
        const maxSerial = serials.reduce((max, val) => Math.max(max, val), 0);
        nextSerial = maxSerial + 1;
      }
      code = `${prefix}-${nextSerial.toString().padStart(3, '0')}`;
    }

    // --- 2. CEK DUPLIKASI KODE ASET ---
    const existingItem = await prisma.item.findUnique({
      where: { code }
    })

    // Jika kodenya sudah ada, tolak dan kembalikan pesan error!
    if (existingItem) {
      return { success: false, error: `Kode Aset "${code}" sudah terdaftar untuk barang ${existingItem.name}!` }
    }
    // ---------------------------------

    const description = formData.get("description") as string
    // Hindari NaN dengan fallback fallback ke 0
    const quantity = parseInt(formData.get("quantity") as string) || 0 
    const price = parseFloat(formData.get("price") as string) || 0
    const rentPercentage = parseFloat(formData.get("rentPercentage") as string) || 0
    
    const imageFile = formData.get("image") as File | null
    const imageUrl = await uploadImageToSupabase(imageFile) || null;

    // Simpan ke database jika lolos semua ujian
    await prisma.item.create({
      data: {
        name,
        code,
        description,
        quantity,
        price,
        rentPercentage,
        categories: {
          connect: categoryIds.map(id => ({ id }))
        },
        status: "AVAILABLE",
        rentedQuantity: 0,
        maintenanceQuantity: 0,
        imageUrl, 
      }
    })

    revalidatePath("/")
    return { success: true } // Kembalikan status sukses
  } catch (error: any) {
    console.error("Create Item Error:", error)
    return { success: false, error: "Terjadi kesalahan pada server saat membuat barang." }
  }
}

// --- FUNGSI UPDATE YANG SUDAH DI-UPGRADE ---
export async function updateItem(id: string, formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    const name = formData.get("name") as string
    const code = formData.get("code") as string
    const description = formData.get("description") as string
    const quantity = parseInt(formData.get("quantity") as string) || 0
    const rentedQuantity = parseInt(formData.get("rentedQuantity") as string) || 0
    const maintenanceQuantity = parseInt(formData.get("maintenanceQuantity") as string) || 0
    const price = parseFloat(formData.get("price") as string) || 0
    const rentPercentage = parseFloat(formData.get("rentPercentage") as string) || 0
    const categoryIds = formData.getAll("categories") as string[]

    const imageFile = formData.get("image") as File | null
    // imageUrl akan menjadi undefined jika tidak ada file (maka Prisma akan mengabaikannya)
    const imageUrl = await uploadImageToSupabase(imageFile);

    // Update data ke database
    await prisma.item.update({
      where: { id },
      data: {
        name,
        code,
        description,
        quantity,
        rentedQuantity,
        maintenanceQuantity,
        price,
        rentPercentage,
        categories: {
          set: categoryIds.map(id => ({ id }))
        },
        
        //imageUrl akan diupdate hanya jika nilainya bukan 'undefined' (ada upload baru)
        ...(imageUrl && { imageUrl }) 
      }
    })

    // Segarkan halaman dashboard agar perubahan langsung terlihat
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    console.error("Update Item Error:", error)
    return { success: false, error: "Terjadi kesalahan pada server saat memperbarui barang." }
  }
}

export async function deleteItemFull(id: string) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    // Hapus item dari database secara permanen
    await prisma.item.delete({
      where: { id }
    })
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    console.error("Delete Item Error:", error)
    return { success: false, error: "Gagal menghapus aset secara permanen." }
  }
}

export async function reduceItemQuantity(id: string, amountToReduce: number) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    // Cari item-nya dulu
    const item = await prisma.item.findUnique({ where: { id } })
    if (!item) return { success: false, error: "Barang tidak ditemukan." }

    // Hitung sisa stok
    const newQuantity = item.quantity - amountToReduce

    await prisma.item.update({
      where: { id },
      data: { quantity: Math.max(0, newQuantity) }
    })

    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    console.error("Reduce Quantity Error:", error)
    return { success: false, error: "Gagal mengurangi kuantitas." }
  }
}

export async function addStockToExistingItem(formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    const id = formData.get("itemId") as string
    const quantityToAdd = parseInt(formData.get("quantity") as string) || 0

    // Cari barangnya
    const item = await prisma.item.findUnique({ where: { id } })
    if (!item) return { success: false, error: "Barang tidak ditemukan." }

    // Tambahkan stok lamanya dengan stok yang baru masuk
    await prisma.item.update({
      where: { id },
      data: { 
        quantity: item.quantity + quantityToAdd
      }
    })

    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    console.error("Add Stock Error:", error)
    return { success: false, error: "Gagal menambahkan stok." }
  }
}

// --- FUNGSI TAMBAH LABEL/KATEGORI BARU ---
export async function createCategory(formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    const name = formData.get("name") as string;
    if (!name) return { success: false, error: "Nama label tidak boleh kosong." };

    const existingCategory = await prisma.category.findUnique({
      where: { name }
    });

    if (existingCategory) {
      return { success: false, error: `Label "${name}" sudah terdaftar!` };
    }

    await prisma.category.create({ data: { name } });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Create Category Error:", error);
    return { success: false, error: "Terjadi kesalahan pada server saat membuat label." };
  }
}

// --- FUNGSI UPDATE LABEL/KATEGORI ---
export async function updateCategory(id: string, formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    const name = formData.get("name") as string;
    if (!name) return { success: false, error: "Nama label tidak boleh kosong." };

    const existingCategory = await prisma.category.findUnique({ where: { name } });
    if (existingCategory && existingCategory.id !== id) {
      return { success: false, error: `Label "${name}" sudah terdaftar!` };
    }

    await prisma.category.update({ where: { id }, data: { name } });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Update Category Error:", error);
    return { success: false, error: "Terjadi kesalahan pada server saat memperbarui label." };
  }
}

// --- FUNGSI DELETE LABEL/KATEGORI ---
export async function deleteCategory(id: string) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    // Cek apakah ada barang yang menggunakan kategori ini
    const itemsCount = await prisma.item.count({ where: { categories: { some: { id } } } });
    if (itemsCount > 0) {
      return { success: false, error: `Gagal! Label ini masih digunakan oleh ${itemsCount} aset. Silakan pindahkan atau hapus aset terkait terlebih dahulu.` };
    }
    await prisma.category.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Category Error:", error);
    return { success: false, error: "Gagal menghapus label." };
  }
}

// --- FUNGSI TAMBAH RENTAL MASAL ---
export async function addBulkRental(formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    const payloadStr = formData.get("payload") as string;
    if (!payloadStr) return { success: false, error: "Data kosong." };
    
    const payload = JSON.parse(payloadStr) as { id: string; qty: number }[];
    if (payload.length === 0) return { success: true };
    
    // Gunakan transaksi (transaction) dengan timeout diperbesar dan eksekusi paralel
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

    const cartItems = itemsPayloadStr ? JSON.parse(itemsPayloadStr) as any[] : [];
    const customItems = customPayloadStr ? JSON.parse(customPayloadStr) as any[] : [];

    if (cartItems.length === 0 && customItems.length === 0) {
      return { success: false, error: "Keranjang masih kosong." };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Validasi & Kurangi Stok Barang Fisik
      if (cartItems.length > 0) {
        const itemIds = cartItems.map(item => item.id);
        const dbItems = await tx.item.findMany({
          where: { id: { in: itemIds } }
        });
        const dbItemMap = new Map(dbItems.map(i => [i.id, i]));

        for (const item of cartItems) {
          const dbItem = dbItemMap.get(item.id);
          if (!dbItem) throw new Error(`Barang dengan ID ${item.id} tidak ditemukan.`);
          const requestedQty = Number(item.qty) || 1;
          if (dbItem.quantity < requestedQty) {
            throw new Error(`Stok tersedia untuk "${dbItem.name}" tidak mencukupi (Tersedia: ${dbItem.quantity}, Diminta: ${requestedQty}).`);
          }
        }

        await Promise.all(
          cartItems.map(item => {
            const dbItem = dbItemMap.get(item.id)!;
            const requestedQty = Number(item.qty) || 1;
            return tx.item.update({
              where: { id: item.id },
              data: {
                quantity: dbItem.quantity - requestedQty,
                rentedQuantity: dbItem.rentedQuantity + requestedQty
              }
            });
          })
        );
      }

      // 2. Susun Snapshot Payload untuk Transaksi / Invoice Baru
      const newItemsPayload = [
        ...cartItems.map((c: any) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          qty: Number(c.qty) || 1,
          returnedQty: 0,
          imageUrl: c.imageUrl || null,
          price: (((c.price || 0) * (c.rentPercentage || 0)) / 100) * rentalDays * (1 - (discountPercentage / 100)),
          footnote: c.footnote || ""
        })),
        ...customItems.map((c: any) => ({
          id: c.id,
          name: c.name,
          code: "LAYANAN",
          qty: Number(c.qty) || 1,
          returnedQty: 0,
          imageUrl: null,
          price: (Number(c.price) || 0) * rentalDays * (1 - (discountPercentage / 100)),
          footnote: c.footnote || "Layanan Tambahan"
        }))
      ];

      const totalPhysicalQty = cartItems.reduce((acc: number, i: any) => acc + (Number(i.qty) || 1), 0);
      const totalCustomQty = customItems.reduce((acc: number, i: any) => acc + (Number(i.qty) || 1), 0);

      // 3. JIKA MODE TAMBAH BARANG SUSULAN (targetEventId TERSEDIA)
      if (targetEventId) {
        const existingEvent = await tx.history.findUnique({
          where: { id: targetEventId }
        });

        if (!existingEvent) {
          throw new Error("Event yang dituju tidak ditemukan di database.");
        }

        // Parse payload event lama dan gabungkan item baru ke dalamnya
        let existingEventPayload: any[] = [];
        try {
          existingEventPayload = JSON.parse(existingEvent.payload || "[]");
        } catch {
          existingEventPayload = [];
        }

        // Gabungkan / append item baru ke payload event lama
        for (const newItem of newItemsPayload) {
          const matchIndex = existingEventPayload.findIndex(
            (p: any) => p.id === newItem.id && (p.footnote || "") === (newItem.footnote || "")
          );
          if (matchIndex >= 0) {
            existingEventPayload[matchIndex].qty = (Number(existingEventPayload[matchIndex].qty) || 0) + newItem.qty;
            existingEventPayload[matchIndex].returnedQty = Number(existingEventPayload[matchIndex].returnedQty) || 0;
          } else {
            existingEventPayload.push({ ...newItem, returnedQty: 0 });
          }
        }

        // Update record event lama (pastikan tidak ada flag [SELESAI])
        const cleanEventDesc = (existingEvent.description || "Event").replace(" [SELESAI]", "").trim();
        await tx.history.update({
          where: { id: targetEventId },
          data: {
            payload: JSON.stringify(existingEventPayload),
            description: cleanEventDesc
          }
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
            payload: JSON.stringify(newItemsPayload)
          }
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
            payload: JSON.stringify(newItemsPayload)
          }
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

// --- FUNGSI TAMBAH PEMELIHARAAN MASAL ---
export async function addBulkMaintenance(formData: FormData) {
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
        if (dbItem.quantity < item.qty) throw new Error(`Stok tersedia untuk ${dbItem.name} tidak mencukupi.`);
      }

      await Promise.all(
        payload.map(item => {
          const dbItem = dbItemMap.get(item.id)!;
          return tx.item.update({
            where: { id: item.id },
            data: {
              quantity: dbItem.quantity - item.qty,
              maintenanceQuantity: dbItem.maintenanceQuantity + item.qty
            }
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

// --- FUNGSI RIWAYAT / TRANSAKSI ---
export async function createHistory(formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    const type = formData.get("type") as string;
    const date = new Date(formData.get("date") as string);
    const description = formData.get("description") as string;
    const payload = formData.get("payload") as string;

    await prisma.history.create({
      data: { type, date, description, payload }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Gagal menyimpan riwayat." };
  }
}

export async function updateHistory(id: string, formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    const date = new Date(formData.get("date") as string);
    const description = formData.get("description") as string;
    await prisma.history.update({
      where: { id },
      data: { date, description }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Gagal memperbarui riwayat." };
  }
}

export async function deleteHistory(id: string) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    await prisma.history.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Gagal menghapus riwayat." };
  }
}

// --- FUNGSI PAKET / TEMPLATE RENTAL ---
export async function createPackageTemplate(formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const payload = formData.get("payload") as string;

    if (!name || !payload) return { success: false, error: "Data tidak lengkap." };

    await prisma.packageTemplate.create({
      data: { name, description, payload }
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

    if (!name || !payload) return { success: false, error: "Data tidak lengkap." };

    await prisma.packageTemplate.update({
      where: { id },
      data: { name, description, payload }
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

// --- FUNGSI BATCH GENERATE (FORMAT ULANG SEMUA KODE MASAL) ---
export async function batchRegenerateCodes() {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    // Ambil semua barang dari yang terlama ke terbaru
    const items = await prisma.item.findMany({
      include: { categories: true },
      orderBy: { createdAt: 'asc' }
    });

    // 1. Ubah semua kode menjadi "sementara" untuk menghindari bentrok / konflik duplikasi di Database
    await prisma.$transaction(async (tx) => {
      await Promise.all(
        items.map(item =>
          tx.item.update({
            where: { id: item.id },
            data: { code: `TEMP-${item.id}` }
          })
        )
      );

      // 2. Buat dan terapkan kode baru dengan format otomatis
      const prefixCounters: Record<string, number> = {};
      const updates = [];

      for (const item of items) {
        let prefix = "ITM";
        if (item.categories.length > 0) {
          const prefixes = item.categories.map(c => generatePrefix(c.name)).sort();
          prefix = prefixes.join('-');
        }

        if (!prefixCounters[prefix]) prefixCounters[prefix] = 1;
        else prefixCounters[prefix]++;

        const newSerial = prefixCounters[prefix];
        const newCode = `${prefix}-${newSerial.toString().padStart(3, '0')}`;

        updates.push(tx.item.update({ where: { id: item.id }, data: { code: newCode } }));
      }

      await Promise.all(updates);
    }, { maxWait: 5000, timeout: 30000 });

    revalidatePath("/");
    return { success: true, count: items.length };
  } catch (error: any) {
    console.error("Batch Update Error:", error);
    return { success: false, error: "Gagal merapikan kode aset masal." };
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