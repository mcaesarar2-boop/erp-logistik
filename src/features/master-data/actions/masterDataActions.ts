"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { validateDummyUser } from "@/shared/lib/serverAuth";

/**
 * Inisialisasi master data default untuk kategori & label paket jika masih kosong.
 */
export async function ensureDefaultPackageMasterData() {
  try {
    const catCount = await prisma.masterCategory.count();
    if (catCount === 0) {
      const defaultCats = ["Audio", "Lighting", "Video", "Stage", "Backline"];
      for (const cat of defaultCats) {
        await prisma.masterCategory.upsert({
          where: { name: cat },
          create: { name: cat },
          update: {},
        });
      }
    }

    const labelCount = await prisma.masterLabel.count();
    if (labelCount === 0) {
      const defaultLabels = [
        "Concert",
        "Festival",
        "Corporate",
        "Grade A",
        "Grade B",
        "Outdoor",
        "Indoor",
        "Wedding",
      ];
      for (const lbl of defaultLabels) {
        await prisma.masterLabel.upsert({
          where: { name: lbl },
          create: { name: lbl },
          update: {},
        });
      }
    }
  } catch (err) {
    console.error("Error ensuring default package master data:", err);
  }
}

// ==========================================
// 1. MasterCategory CRUD
// ==========================================

export async function createMasterCategory(name: string) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;

  try {
    const trimmed = name?.trim();
    if (!trimmed) return { success: false, error: "Nama kategori tidak boleh kosong." };

    const existing = await prisma.masterCategory.findFirst({
      where: { name: { equals: trimmed, mode: "insensitive" } },
    });
    if (existing) return { success: false, error: `Kategori "${trimmed}" sudah ada.` };

    const created = await prisma.masterCategory.create({
      data: { name: trimmed },
    });
    revalidatePath("/");
    return { success: true, data: created };
  } catch (error: any) {
    console.error("Create MasterCategory Error:", error);
    return { success: false, error: "Gagal menambahkan kategori master." };
  }
}

export async function updateMasterCategory(id: string, newName: string) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;

  try {
    const trimmed = newName?.trim();
    if (!trimmed) return { success: false, error: "Nama kategori tidak boleh kosong." };

    const current = await prisma.masterCategory.findUnique({ where: { id } });
    if (!current) return { success: false, error: "Kategori tidak ditemukan." };

    if (current.name.toLowerCase() !== trimmed.toLowerCase()) {
      const duplicate = await prisma.masterCategory.findFirst({
        where: { name: { equals: trimmed, mode: "insensitive" } },
      });
      if (duplicate) return { success: false, error: `Kategori "${trimmed}" sudah digunakan.` };
    }

    const oldName = current.name;
    const updated = await prisma.masterCategory.update({
      where: { id },
      data: { name: trimmed },
    });

    // Cascading update ke semua Paket yang memakai nama kategori lama
    if (oldName !== trimmed) {
      await prisma.packageTemplate.updateMany({
        where: { kategoriUtama: oldName },
        data: { kategoriUtama: trimmed },
      });
    }

    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Update MasterCategory Error:", error);
    return { success: false, error: "Gagal memperbarui kategori master." };
  }
}

export async function deleteMasterCategory(id: string) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;

  try {
    const current = await prisma.masterCategory.findUnique({ where: { id } });
    if (!current) return { success: false, error: "Kategori tidak ditemukan." };

    await prisma.masterCategory.delete({ where: { id } });

    // Cascading update: set kategoriUtama menjadi null pada paket yang menggunakannya
    await prisma.packageTemplate.updateMany({
      where: { kategoriUtama: current.name },
      data: { kategoriUtama: null },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Delete MasterCategory Error:", error);
    return { success: false, error: "Gagal menghapus kategori master." };
  }
}

// ==========================================
// 2. MasterLabel CRUD
// ==========================================

export async function createMasterLabel(name: string) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;

  try {
    const trimmed = name?.trim();
    if (!trimmed) return { success: false, error: "Nama label tidak boleh kosong." };

    const existing = await prisma.masterLabel.findFirst({
      where: { name: { equals: trimmed, mode: "insensitive" } },
    });
    if (existing) return { success: false, error: `Label "${trimmed}" sudah ada.` };

    const created = await prisma.masterLabel.create({
      data: { name: trimmed },
    });
    revalidatePath("/");
    return { success: true, data: created };
  } catch (error: any) {
    console.error("Create MasterLabel Error:", error);
    return { success: false, error: "Gagal menambahkan label master." };
  }
}

export async function updateMasterLabel(id: string, newName: string) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;

  try {
    const trimmed = newName?.trim();
    if (!trimmed) return { success: false, error: "Nama label tidak boleh kosong." };

    const current = await prisma.masterLabel.findUnique({ where: { id } });
    if (!current) return { success: false, error: "Label tidak ditemukan." };

    if (current.name.toLowerCase() !== trimmed.toLowerCase()) {
      const duplicate = await prisma.masterLabel.findFirst({
        where: { name: { equals: trimmed, mode: "insensitive" } },
      });
      if (duplicate) return { success: false, error: `Label "${trimmed}" sudah digunakan.` };
    }

    const oldName = current.name;
    const updated = await prisma.masterLabel.update({
      where: { id },
      data: { name: trimmed },
    });

    // Cascading update ke semua Paket yang memuat oldName dalam array labelGrade
    if (oldName !== trimmed) {
      const affectedPackages = await prisma.packageTemplate.findMany({
        where: { labelGrade: { has: oldName } },
      });
      for (const pkg of affectedPackages) {
        const newLabels = (pkg.labelGrade || []).map((l) => (l === oldName ? trimmed : l));
        await prisma.packageTemplate.update({
          where: { id: pkg.id },
          data: { labelGrade: newLabels },
        });
      }
    }

    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Update MasterLabel Error:", error);
    return { success: false, error: "Gagal memperbarui label master." };
  }
}

export async function deleteMasterLabel(id: string) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;

  try {
    const current = await prisma.masterLabel.findUnique({ where: { id } });
    if (!current) return { success: false, error: "Label tidak ditemukan." };

    await prisma.masterLabel.delete({ where: { id } });

    // Cascading update: hapus label dari array labelGrade paket yang menggunakannya
    const affectedPackages = await prisma.packageTemplate.findMany({
      where: { labelGrade: { has: current.name } },
    });
    for (const pkg of affectedPackages) {
      const newLabels = (pkg.labelGrade || []).filter((l) => l !== current.name);
      await prisma.packageTemplate.update({
        where: { id: pkg.id },
        data: { labelGrade: newLabels },
      });
    }

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Delete MasterLabel Error:", error);
    return { success: false, error: "Gagal menghapus label master." };
  }
}

