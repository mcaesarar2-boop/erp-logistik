"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { validateDummyUser } from "@/shared/lib/serverAuth";

export async function getOrCreateEventDetail(
  historyId: string,
  eventName: string,
  durationDays: number = 1,
  erpTotalCost: number = 0
) {
  try {
    let eventDetail = await prisma.eventDetail.findFirst({
      where: { historyId },
      include: {
        crews: { orderBy: { createdAt: "asc" } },
        sponsors: { orderBy: { createdAt: "asc" } },
        vendors: { orderBy: { createdAt: "asc" } },
        manualEquipments: { orderBy: { createdAt: "asc" } },
        utilities: { orderBy: { createdAt: "asc" } },
        guestStars: {
          include: {
            riders: { orderBy: { createdAt: "asc" } }
          },
          orderBy: { createdAt: "asc" }
        },
        timelineItems: {
          orderBy: [{ dayNumber: "asc" }, { startTime: "asc" }]
        }
      }
    });

    if (!eventDetail) {
      eventDetail = await prisma.eventDetail.create({
        data: {
          historyId,
          eventName: eventName || "Event Tanpa Nama",
          durationDays: Math.max(1, durationDays),
          clientBudget: 0,
          vendors: {
            create: {
              name: "ERP Logistik Pusat",
              category: "Logistik Gudang",
              cost: Math.max(0, erpTotalCost),
              isErpPusat: true,
              notes: "Tagihan rental peralatan logistik gudang pusat (auto-synced)"
            }
          }
        },
        include: {
          crews: { orderBy: { createdAt: "asc" } },
          sponsors: { orderBy: { createdAt: "asc" } },
          vendors: { orderBy: { createdAt: "asc" } },
          manualEquipments: { orderBy: { createdAt: "asc" } },
          utilities: { orderBy: { createdAt: "asc" } },
          guestStars: {
            include: {
              riders: { orderBy: { createdAt: "asc" } }
            },
            orderBy: { createdAt: "asc" }
          },
          timelineItems: {
            orderBy: [{ dayNumber: "asc" }, { startTime: "asc" }]
          }
        }
      });
    } else {
      // Pastikan vendor ERP Logistik Pusat selalu sinkron nilainya dengan total keranjang gudang
      const erpVendor = eventDetail.vendors.find(v => v.isErpPusat);
      if (erpVendor) {
        if (Math.abs(erpVendor.cost - erpTotalCost) > 0.01) {
          await prisma.eventVendor.update({
            where: { id: erpVendor.id },
            data: { cost: erpTotalCost }
          });
          erpVendor.cost = erpTotalCost;
        }
      } else {
        const createdVendor = await prisma.eventVendor.create({
          data: {
            eventDetailId: eventDetail.id,
            name: "ERP Logistik Pusat",
            category: "Logistik Gudang",
            cost: Math.max(0, erpTotalCost),
            isErpPusat: true,
            notes: "Tagihan rental peralatan logistik gudang pusat (auto-synced)"
          }
        });
        eventDetail.vendors.unshift(createdVendor);
      }
    }

    return { success: true, data: eventDetail };
  } catch (error: any) {
    console.error("getOrCreateEventDetail error:", error);
    return { success: false, error: error.message || "Gagal memuat detail event." };
  }
}

export async function createStandaloneEventWorkspace(
  eventName: string,
  durationDays: number = 1,
  clientBudget: number = 0
) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    const eventDetail = await prisma.eventDetail.create({
      data: {
        eventName: eventName.trim() || "Event Baru",
        durationDays: Math.max(1, durationDays),
        clientBudget: Math.max(0, clientBudget),
      },
      include: {
        crews: true,
        sponsors: true,
        vendors: true,
        manualEquipments: true,
        utilities: true,
        guestStars: {
          include: {
            riders: true
          }
        },
        timelineItems: true
      }
    });
    revalidatePath("/");
    return { success: true, data: eventDetail };
  } catch (error: any) {
    console.error("createStandaloneEventWorkspace error:", error);
    return { success: false, error: error.message || "Gagal membuat workspace event." };
  }
}

export async function updateEventDetail(
  eventDetailId: string,
  data: { durationDays?: number; clientBudget?: number; notes?: string; status?: string; eventName?: string }
) {
  const validationError = await validateDummyUser();
  if (validationError) return validationError;
  try {
    const updated = await prisma.eventDetail.update({
      where: { id: eventDetailId },
      data: {
        ...(data.eventName !== undefined && { eventName: data.eventName }),
        ...(data.durationDays !== undefined && { durationDays: Math.max(1, data.durationDays) }),
        ...(data.clientBudget !== undefined && { clientBudget: Math.max(0, data.clientBudget) }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.status !== undefined && { status: data.status }),
      }
    });
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("updateEventDetail error:", error);
    return { success: false, error: error.message || "Gagal memperbarui info event." };
  }
}

