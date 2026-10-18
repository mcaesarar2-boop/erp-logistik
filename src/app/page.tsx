import prisma from "@/lib/prisma"
import MultiLayerDashboard from "@/components/MultiLayerDashboard"
import { AddItemDialog } from "@/features/inventory"
import { AddRentalDialog, PosCartProvider } from "@/features/pos-cart"
import { AddMaintenanceDialog } from "@/features/maintenance"
import { AddPackageDialog } from "@/features/packages"
import { ManagePackageMasterDialog, ensureDefaultPackageMasterData } from "@/features/master-data"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  // 1. Parallel Fetching dengan Promise.all untuk mengeliminasi waterfall
  const [
    items,
    categories,
    histories,
    packages,
    rawMasterCategories,
    rawMasterLabels,
    eventDetails,
  ] = await Promise.all([
    prisma.item
      .findMany({
        include: {
          categories: true,
        },
      })
      .catch((e) => {
        console.error("Dashboard: Error fetching items:", e);
        return [];
      }),
    prisma.category
      .findMany()
      .catch((e) => {
        console.error("Dashboard: Error fetching categories:", e);
        return [];
      }),
    prisma.history
      .findMany({
        orderBy: { date: "desc" },
      })
      .catch((e) => {
        console.error("Dashboard: Error fetching history:", e);
        return [];
      }),
    prisma.packageTemplate
      .findMany({
        orderBy: { createdAt: "desc" },
      })
      .catch(() => []),
    prisma.masterCategory
      .findMany({
        orderBy: { name: "asc" },
      })
      .catch(() => []),
    prisma.masterLabel
      .findMany({
        orderBy: { name: "asc" },
      })
      .catch(() => []),
    prisma.eventDetail
      .findMany({
        include: {
          crews: { orderBy: { createdAt: "asc" } },
          sponsors: { orderBy: { createdAt: "asc" } },
          vendors: { orderBy: { createdAt: "asc" } },
          manualEquipments: { orderBy: { createdAt: "asc" } },
          utilities: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      })
      .catch(() => []),
  ])

  // 2. Eliminasi database write pada HTTP GET:
  // Hanya inisialisasi default master data jika tabel benar-benar kosong
  let masterCategories = rawMasterCategories
  let masterLabels = rawMasterLabels

  if (masterCategories.length === 0 && masterLabels.length === 0) {
    await ensureDefaultPackageMasterData()
    const [freshCategories, freshLabels] = await Promise.all([
      prisma.masterCategory.findMany({ orderBy: { name: "asc" } }).catch(() => []),
      prisma.masterLabel.findMany({ orderBy: { name: "asc" } }).catch(() => []),
    ])
    masterCategories = freshCategories
    masterLabels = freshLabels
  }

  return (
    <PosCartProvider>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Dashboard Inventaris</h1>
            <p className="text-sm text-zinc-400">Kelola ketersediaan barang logistik Anda.</p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap w-full md:w-auto gap-2 mt-2 md:mt-0 sm:justify-end items-center">
            <AddPackageDialog items={items} masterCategories={masterCategories} masterLabels={masterLabels} />
            <ManagePackageMasterDialog masterCategories={masterCategories} masterLabels={masterLabels} />
            <AddRentalDialog items={items} packages={packages} />
            <AddMaintenanceDialog items={items} />
            <AddItemDialog items={items} categories={categories} />
          </div>
        </div>
        
        <MultiLayerDashboard 
          items={items} 
          categories={categories} 
          histories={histories} 
          packages={packages} 
          masterCategories={masterCategories}
          masterLabels={masterLabels}
          initialEventDetails={eventDetails}
        />
      </main>
    </PosCartProvider>
  )
}