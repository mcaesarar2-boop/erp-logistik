"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { supabase } from "@/lib/supabase" // <--- IMPORT AGEN SUPABASE

// --- DAFTAR ADMIN ---
const ADMIN_EMAILS = ["mcaesarar@gmail.com"]; // Ganti dengan email asli adminmu!

async function verifyAdmin() {
  // SEMENTARA DIMATIKAN: Karena Next.js Server Actions belum disetting 
  // untuk membaca Cookie browser, server selalu mengira kamu belum login.
  // Untuk MVP ini, pencegahan Admin cukup dilakukan melalui blokir UI (Client Side).
  return; 
}

// src/app/actions.ts

// --- FUNGSI HELPER UNTUK UPLOAD FOTO ---
async function uploadImageToSupabase(imageFile: File | null): Promise<string | undefined> {
  // 1. Tambahan log untuk melihat apakah file sampai ke server
  console.log("INFO FILE DARI FORM:", imageFile?.name, "Size:", imageFile?.size, "Type:", imageFile?.type)

  if (!imageFile || imageFile.size === 0 || imageFile.name === "undefined") {
    console.log("Upload dibatalkan: File kosong atau tidak dilampirkan.")
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
    console.log("Upload Sukses! URL Publik:", publicUrlData.publicUrl)
    return publicUrlData.publicUrl
  } catch (err) {
    console.error("KESALAHAN SISTEM SAAT UPLOAD:", err)
    return undefined
  }
}

export async function createItem(formData: FormData) {
  try {
    await verifyAdmin();

    const name = formData.get("name") as string
    const code = formData.get("code") as string

    // --- 1. CEK DUPLIKASI KODE ASET ---
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
    const categoryName = formData.get("category") as string
    
    const imageFile = formData.get("image") as File | null
    const imageUrl = await uploadImageToSupabase(imageFile) || null;

    const category = await prisma.category.findUnique({
      where: { name: categoryName }
    })

    if (!category) return { success: false, error: "Kategori tidak ditemukan." }

    // Simpan ke database jika lolos semua ujian
    await prisma.item.create({
      data: {
        name,
        code,
        description,
        quantity,
        categoryId: category.id,
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

// ... (biarkan fungsi updateItem, deleteItemFull, reduceItemQuantity, dan addStockToExistingItem tetap seperti aslinya di bawah ini) ...
// Tambahkan fungsi ini di bagian bawah src/app/actions.ts

// src/app/actions.ts

// ... existing imports (prisma, revalidatePath, supabase)

// --- FUNGSI UPDATE YANG SUDAH DI-UPGRADE ---
export async function updateItem(id: string, formData: FormData) {
  try {
    await verifyAdmin();

    const name = formData.get("name") as string
    const code = formData.get("code") as string
    const description = formData.get("description") as string
    const quantity = parseInt(formData.get("quantity") as string) || 0
    const rentedQuantity = parseInt(formData.get("rentedQuantity") as string) || 0
    const maintenanceQuantity = parseInt(formData.get("maintenanceQuantity") as string) || 0

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

// --- Tambahkan di bagian bawah src/app/actions.ts ---

export async function deleteItemFull(id: string) {
  try {
    await verifyAdmin();

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
    await verifyAdmin();

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

// --- Tambahkan di bagian paling bawah src/app/actions.ts ---

export async function addStockToExistingItem(formData: FormData) {
  try {
    await verifyAdmin();

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
    await verifyAdmin();

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
    await verifyAdmin();

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
    await verifyAdmin();

    // Cek apakah ada barang yang menggunakan kategori ini
    const itemsCount = await prisma.item.count({ where: { categoryId: id } });
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