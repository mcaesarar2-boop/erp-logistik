import prisma from "@/lib/prisma"
import MultiLayerDashboard from "@/components/MultiLayerDashboard"
import { AddItemDialog } from "@/components/AddItemDialog"
import { AddRentalDialog } from "@/components/AddRentalDialog"
import { AddMaintenanceDialog } from "@/components/AddMaintenanceDialog"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const items = await prisma.item.findMany({
    include: {
      categories: true
    }
  })

  const categories = await prisma.category.findMany()

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Dashboard Inventaris</h1>
          <p className="text-sm text-zinc-400">Kelola ketersediaan barang logistik Anda.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AddRentalDialog items={items} />
          <AddMaintenanceDialog items={items} />
          <AddItemDialog items={items} categories={categories} />
        </div>
      </div>
      
      <MultiLayerDashboard items={items} categories={categories} />
    </main>
  )
}