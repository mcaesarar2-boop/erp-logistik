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

  const histories = await prisma.history.findMany({
    orderBy: { date: 'desc' } // Urutkan riwayat dari yang terbaru
  })

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Dashboard Inventaris</h1>
          <p className="text-sm text-zinc-400">Kelola ketersediaan barang logistik Anda.</p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap w-full md:w-auto gap-2 mt-2 md:mt-0 sm:justify-end">
          <AddRentalDialog items={items} />
          <AddMaintenanceDialog items={items} />
          <AddItemDialog items={items} categories={categories} />
        </div>
      </div>
      
      <MultiLayerDashboard items={items} categories={categories} histories={histories} />
    </main>
  )
}