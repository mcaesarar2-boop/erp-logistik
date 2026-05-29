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

export async function createItem(formData: FormData) {
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
  try {
    const payloadStr = formData.get("payload") as string;
    if (!payloadStr) return { success: false, error: "Data kosong." };
    
    const payload = JSON.parse(payloadStr) as { id: string; qty: number }[];
    
    // Gunakan transaksi (transaction) agar database update sekaligus
    await prisma.$transaction(async (tx) => {
      for (const item of payload) {
        const dbItem = await tx.item.findUnique({ where: { id: item.id } });
        if (!dbItem) throw new Error(`Barang dengan ID ${item.id} tidak ditemukan.`);
        if (dbItem.quantity < item.qty) throw new Error(`Stok tersedia untuk ${dbItem.name} tidak mencukupi.`);
        
        await tx.item.update({
          where: { id: item.id },
          data: { quantity: dbItem.quantity - item.qty, rentedQuantity: dbItem.rentedQuantity + item.qty }
        });
      }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal memproses rental masal." };
  }
}

// --- FUNGSI PENGEMBALIAN RENTAL (BALIK GUDANG) ---
export async function returnBulkRental(formData: FormData) {
  try {
    const payloadStr = formData.get("payload") as string;
    const historyId = formData.get("historyId") as string | null;
    const historyPayloadStr = formData.get("historyPayload") as string | null;
    const historyDesc = formData.get("historyDesc") as string | null;
    
    if (!payloadStr) return { success: false, error: "Data kosong." };
    
    const payload = JSON.parse(payloadStr) as { id: string; qty: number }[];
    
    await prisma.$transaction(async (tx) => {
      for (const item of payload) {
        const dbItem = await tx.item.findUnique({ where: { id: item.id } });
        if (!dbItem) throw new Error(`Barang dengan ID ${item.id} tidak ditemukan.`);
        if (dbItem.rentedQuantity < item.qty) throw new Error(`Jumlah pengembalian untuk ${dbItem.name} melebihi yang sedang disewa.`);
        
        await tx.item.update({
          where: { id: item.id },
          data: { quantity: dbItem.quantity + item.qty, rentedQuantity: dbItem.rentedQuantity - item.qty }
        });
      }

      // Jika pengembalian ini terkait dengan Event (History), perbarui status qty event tersebut
      if (historyId) {
        const updateData: any = {};
        if (historyPayloadStr) updateData.payload = historyPayloadStr;
        if (historyDesc) updateData.description = historyDesc;
        if (Object.keys(updateData).length > 0) {
          await tx.history.update({
            where: { id: historyId },
            data: updateData
          });
        }
      }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal memproses pengembalian barang." };
  }
}

// --- FUNGSI TAMBAH PEMELIHARAAN MASAL ---
export async function addBulkMaintenance(formData: FormData) {
  try {
    const payloadStr = formData.get("payload") as string;
    if (!payloadStr) return { success: false, error: "Data kosong." };
    
    const payload = JSON.parse(payloadStr) as { id: string; qty: number }[];
    await prisma.$transaction(async (tx) => {
      for (const item of payload) {
        const dbItem = await tx.item.findUnique({ where: { id: item.id } });
        if (!dbItem) throw new Error(`Barang dengan ID ${item.id} tidak ditemukan.`);
        if (dbItem.quantity < item.qty) throw new Error(`Stok tersedia untuk ${dbItem.name} tidak mencukupi.`);
        
        await tx.item.update({
          where: { id: item.id },
          data: { quantity: dbItem.quantity - item.qty, maintenanceQuantity: dbItem.maintenanceQuantity + item.qty }
        });
      }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal memproses pemeliharaan masal." };
  }
}

// --- FUNGSI RIWAYAT / TRANSAKSI ---
export async function createHistory(formData: FormData) {
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
  try {
    // Ambil semua barang dari yang terlama ke terbaru
    const items = await prisma.item.findMany({
      include: { categories: true },
      orderBy: { createdAt: 'asc' }
    });

    // 1. Ubah semua kode menjadi "sementara" untuk menghindari bentrok / konflik duplikasi di Database
    const tempUpdates = items.map(item => 
      prisma.item.update({
        where: { id: item.id },
        data: { code: `TEMP-${item.id}` }
      })
    );
    await prisma.$transaction(tempUpdates);

    // 2. Buat dan terapkan kode baru dengan format otomatis
    const prefixCounters: Record<string, number> = {};
    const finalUpdates = [];

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

      finalUpdates.push(prisma.item.update({ where: { id: item.id }, data: { code: newCode } }));
    }

    // Simpan semua kode baru
    await prisma.$transaction(finalUpdates);
    revalidatePath("/");
    return { success: true, count: finalUpdates.length };
  } catch (error: any) {
    console.error("Batch Update Error:", error);
    return { success: false, error: "Gagal merapikan kode aset masal." };
  }
}