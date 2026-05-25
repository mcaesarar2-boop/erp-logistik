import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Memulai injeksi data (Seeding)...')

  // 1. Buat Kategori
  const audio = await prisma.category.upsert({
    where: { name: 'Audio' },
    update: {},
    create: { name: 'Audio', description: 'Sound system, mixer, dan aksesoris audio' },
  })

  const lighting = await prisma.category.upsert({
    where: { name: 'Lighting' },
    update: {},
    create: { name: 'Lighting', description: 'Lampu, console lighting, dan rigging' },
  })

  // 2. Buat Barang (Items)
  const items = [
    {
      code: 'AUD-MIX-001',
      name: 'DiGiCo Quantum 338',
      description: 'Digital Mixing Console',
      quantity: 1,
      status: 'AVAILABLE',
      categoryId: audio.id,
    },
    {
      code: 'AUD-SPK-001',
      name: 'L-Acoustics K2',
      description: 'Line Array Element',
      quantity: 12,
      status: 'AVAILABLE',
      categoryId: audio.id,
    },
    {
      code: 'AUD-AMP-001',
      name: 'd&b audiotechnik D80',
      description: 'Amplifier',
      quantity: 4,
      status: 'RENTED',
      categoryId: audio.id,
    },
    {
      code: 'LGT-MOV-001',
      name: 'Claypaky Sharpy Plus',
      description: 'Moving Head Beam/Spot',
      quantity: 24,
      status: 'AVAILABLE',
      categoryId: lighting.id,
    }
  ]

  for (const item of items) {
    await prisma.item.upsert({
      where: { code: item.code },
      update: {},
      create: item,
    })
  }

  console.log('Seeding selesai! Data inventaris berhasil dimasukkan.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })