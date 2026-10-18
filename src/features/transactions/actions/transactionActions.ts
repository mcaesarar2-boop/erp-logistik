"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { validateDummyUser } from "@/shared/lib/serverAuth";

export async function createHistory(formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;

  try {
    const type = formData.get("type") as string;
    const date = new Date(formData.get("date") as string);
    const description = formData.get("description") as string;
    const payload = formData.get("payload") as string;

    await prisma.history.create({
      data: { type, date, description, payload },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("createHistory error:", error);
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
      data: { date, description },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("updateHistory error:", error);
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
    console.error("deleteHistory error:", error);
    return { success: false, error: "Gagal menghapus riwayat." };
  }
}

