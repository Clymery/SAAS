import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface AppSession {
  user?: { id?: string }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as AppSession | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let stats = await prisma.usageStat.findUnique({
      where: { userId: session.user.id },
    })

    if (!stats) {
      stats = await prisma.usageStat.create({
        data: {
          userId: session.user.id,
        },
      })
    }

    const assetSizes = await prisma.asset.findMany({
      where: { userId: session.user.id },
      select: { metadata: true },
    })

    let storageUsed = stats.storageUsed
    if (storageUsed === 0) {
      storageUsed = assetSizes.length * 1024 * 1024
    }

    return NextResponse.json({
      totalGenerations: stats.totalGenerations,
      monthLimit: stats.monthLimit,
      storageUsed,
      totalImages: stats.totalImages,
    })
  } catch (error) {
    console.error("Get usage error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
