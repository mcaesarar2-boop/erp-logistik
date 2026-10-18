"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { validateDummyUser } from "@/shared/lib/serverAuth";

// --- FUNGSI HELPER UNTUK UPLOAD FOTO ---
async function uploadImageToSupabase(imageFile: File | null): Promise<string | undefined> {
  if (!imageFile || imageFile.size === 0 || imageFile.name === "undefined") {
    return undefined;
  }

  try {
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage.from("item-images").upload(fileName, imageFile, {
      contentType: imageFile.type,
      upsert: false,
    });

    if (error) {
      console.error("SUPABASE UPLOAD ERROR:", error);
      return undefined;
    }

    const { data: publicUrlData } = supabase.storage.from("item-images").getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("KESALAHAN SISTEM SAAT UPLOAD:", err);
    return undefined;
  }
}

// --- FUNGSI HELPER UNTUK MEMBUAT PREFIX KODE ASET ---
function generatePrefix(categoryName: string) {
  const words = categoryName.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase();
  } else {
    return words
      .map((w) => w[0])
      .join("")
      .substring(0, 3)
      .toUpperCase();
  }
}

export async function createItem(formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;

  try {
    const name = formData.get("name") as string;
    let code = formData.get("code") as string;
    const categoryIds = formData.getAll("categories") as string[];

    if (categoryIds.length === 0) return { success: false, error: "Pilih minimal 1 kategori/label." };

    // 1. AUTO GENERATE KODE JIKA KOSONG
    if (!code || code.trim() === "") {
      let prefix = "ITM";

      const selectedCategories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
      });
      if (selectedCategories.length > 0) {
        const prefixes = selectedCategories.map((c) => generatePrefix(c.name)).sort();
        prefix = prefixes.join("-");
      }

      const itemsWithPrefix = await prisma.item.findMany({
        where: { code: { startsWith: `${prefix}-` } },
        select: { code: true },
      });

      let nextSerial = 1;
      if (itemsWithPrefix.length > 0) {
        const serials = itemsWithPrefix.map((item) => {
          const lastDashIndex = item.code.lastIndexOf("-");
          if (lastDashIndex === -1) return 0;
          const itemPrefix = item.code.substring(0, lastDashIndex);
          if (itemPrefix !== prefix) return 0;
          const num = parseInt(item.code.substring(lastDashIndex + 1), 10);
          return isNaN(num) ? 0 : num;
        });
        const maxSerial = serials.reduce((max, val) => Math.max(max, val), 0);
        nextSerial = maxSerial + 1;
      }
      code = `${prefix}-${nextSerial.toString().padStart(3, "0")}`;
    }

    // 2. CEK DUPLIKASI KODE ASET
    const existingItem = await prisma.item.findUnique({
      where: { code },
    });

    if (existingItem) {
      return { success: false, error: `Kode Aset "${code}" sudah terdaftar untuk barang ${existingItem.name}!` };
    }

    const description = formData.get("description") as string;
    const quantity = parseInt(formData.get("quantity") as string) || 0;
    const price = parseFloat(formData.get("price") as string) || 0;
    const rentPercentage = parseFloat(formData.get("rentPercentage") as string) || 0;

    const imageFile = formData.get("image") as File | null;
    const imageUrl = (await uploadImageToSupabase(imageFile)) || null;

    await prisma.item.create({
      data: {
        name,
        code,
        description,
        quantity,
        price,
        rentPercentage,
        categories: {
          connect: categoryIds.map((id) => ({ id })),
        },
        status: "AVAILABLE",
        rentedQuantity: 0,
        maintenanceQuantity: 0,
        imageUrl,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Create Item Error:", error);
    return { success: false, error: "Terjadi kesalahan pada server saat membuat barang." };
  }
}

export async function updateItem(id: string, formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;

  try {
    const name = formData.get("name") as string;
    const code = formData.get("code") as string;
    const description = formData.get("description") as string;
    const quantity = parseInt(formData.get("quantity") as string) || 0;
    const rentedQuantity = parseInt(formData.get("rentedQuantity") as string) || 0;
    const maintenanceQuantity = parseInt(formData.get("maintenanceQuantity") as string) || 0;
    const price = parseFloat(formData.get("price") as string) || 0;
    const rentPercentage = parseFloat(formData.get("rentPercentage") as string) || 0;
    const categoryIds = formData.getAll("categories") as string[];

    const imageFile = formData.get("image") as File | null;
    const imageUrl = await uploadImageToSupabase(imageFile);

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
          set: categoryIds.map((catId) => ({ id: catId })),
        },
        ...(imageUrl && { imageUrl }),
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Update Item Error:", error);
    return { success: false, error: "Terjadi kesalahan pada server saat memperbarui barang." };
  }
}

export async function deleteItemFull(id: string) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;

  try {
    await prisma.item.delete({
      where: { id },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Item Error:", error);
    return { success: false, error: "Gagal menghapus aset secara permanen." };
  }
}

export async function reduceItemQuantity(id: string, amountToReduce: number) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;

  try {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) return { success: false, error: "Barang tidak ditemukan." };

    const newQuantity = item.quantity - amountToReduce;

    await prisma.item.update({
      where: { id },
      data: { quantity: Math.max(0, newQuantity) },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Reduce Quantity Error:", error);
    return { success: false, error: "Gagal mengurangi kuantitas." };
  }
}

export async function addStockToExistingItem(formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;

  try {
    const id = formData.get("itemId") as string;
    const quantityToAdd = parseInt(formData.get("quantity") as string) || 0;

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) return { success: false, error: "Barang tidak ditemukan." };

    await prisma.item.update({
      where: { id },
      data: {
        quantity: item.quantity + quantityToAdd,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Add Stock Error:", error);
    return { success: false, error: "Gagal menambahkan stok." };
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
      where: { name },
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
    const itemsCount = await prisma.item.count({ where: { categories: { some: { id } } } });
    if (itemsCount > 0) {
      return {
        success: false,
        error: `Gagal! Label ini masih digunakan oleh ${itemsCount} aset. Silakan pindahkan atau hapus aset terkait terlebih dahulu.`,
      };
    }
    await prisma.category.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Category Error:", error);
    return { success: false, error: "Gagal menghapus label." };
  }
}

// --- FUNGSI BATCH GENERATE (FORMAT ULANG SEMUA KODE MASAL) ---
export async function batchRegenerateCodes() {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;

  try {
    const items = await prisma.item.findMany({
      include: { categories: true },
      orderBy: { createdAt: "asc" },
    });

    await prisma.$transaction(
      async (tx) => {
        await Promise.all(
          items.map((item) =>
            tx.item.update({
              where: { id: item.id },
              data: { code: `TEMP-${item.id}` },
            })
          )
        );

        const prefixCounters: Record<string, number> = {};
        const updates = [];

        for (const item of items) {
          let prefix = "ITM";
          if (item.categories.length > 0) {
            const prefixes = item.categories.map((c) => generatePrefix(c.name)).sort();
            prefix = prefixes.join("-");
          }

          if (!prefixCounters[prefix]) prefixCounters[prefix] = 1;
          else prefixCounters[prefix]++;

          const newSerial = prefixCounters[prefix];
          const newCode = `${prefix}-${newSerial.toString().padStart(3, "0")}`;

          updates.push(tx.item.update({ where: { id: item.id }, data: { code: newCode } }));
        }

        await Promise.all(updates);
      },
      { maxWait: 5000, timeout: 30000 }
    );

    revalidatePath("/");
    return { success: true, count: items.length };
  } catch (error: any) {
    console.error("Batch Update Error:", error);
    return { success: false, error: "Gagal merapikan kode aset masal." };
  }
}

