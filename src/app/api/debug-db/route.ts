import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const rawUrl = process.env.DATABASE_URL || "NOT_SET"
  // Mask password for safety
  const maskedUrl = rawUrl.replace(/:([^:@]+)@/, ":****@")

  try {
    const itemCount = await prisma.item.count()
    const sampleItems = await prisma.item.findMany({
      take: 2,
      include: { categories: true },
    })

    return NextResponse.json({
      status: "SUCCESS",
      maskedUrl,
      itemCount,
      sampleItems,
    })
  } catch (err: unknown) {
    const error = err instanceof Error ? {
      name: err.name,
      message: err.message,
      stack: err.stack,
    } : { message: String(err) }

    return NextResponse.json({
      status: "ERROR",
      maskedUrl,
      error,
    }, { status: 500 })
  }
}
