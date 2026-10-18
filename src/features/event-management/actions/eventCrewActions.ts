"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { validateDummyUser } from "@/shared/lib/serverAuth";

export async function addEventCrew(eventDetailId: string, formData: FormData) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    const name = (formData.get("name") as string)?.trim() || "";
    const division = (formData.get("division") as string)?.trim() || "General";
    const memberCount = Math.max(1, parseInt(formData.get("memberCount") as string) || 1);
    const fee = Math.max(0, parseFloat(formData.get("fee") as string) || 0);
    const notes = (formData.get("notes") as string)?.trim() || null;

    if (!name) {
      return { success: false, error: "Nama personil / deskripsi crew wajib diisi." };
    }

    const crew = await prisma.eventCrew.create({
      data: {
        eventDetailId,
        name,
        division,
        memberCount,
        fee,
        notes
      }
    });

    revalidatePath("/");
    return { success: true, data: crew };
  } catch (error: any) {
    console.error("addEventCrew error:", error);
    return { success: false, error: error.message || "Gagal menambahkan kru." };
  }
}

export async function deleteEventCrew(crewId: string) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    await prisma.eventCrew.delete({
      where: { id: crewId }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("deleteEventCrew error:", error);
    return { success: false, error: error.message || "Gagal menghapus kru." };
  }
}

