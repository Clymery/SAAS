import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

interface AppSession {
  user?: { id?: string }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as AppSession | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { type, inputImageUrl, generationId } = body

    const delay = 2000 + Math.random() * 1000
    await wait(delay)

    let resultUrl: string

    if (type === "scene") {
      resultUrl = `/uploads/mock-scene-${Date.now()}.jpg`
    } else if (type === "background_removal") {
      resultUrl = inputImageUrl || `/uploads/mock-bg-removed-${Date.now()}.png`
    } else {
      resultUrl = `/uploads/mock-${type}-${Date.now()}.jpg`
    }

    let generation
    if (generationId) {
      generation = await prisma.generation.findFirst({
        where: { id: generationId, userId: session.user.id },
      })
    }

    if (!generation && type) {
      generation = await prisma.generation.findFirst({
        where: {
          userId: session.user.id,
          type,
          status: "pending",
        },
        orderBy: { createdAt: "desc" },
      })
    }

    if (generation) {
      const wasPending = generation.status === "pending"
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: "completed",
          resultUrl,
        },
      })

      if (wasPending) {
        await prisma.usageStat.updateMany({
          where: { userId: session.user.id },
          data: { totalGenerations: { increment: 1 } },
        })
      }
    }

    return NextResponse.json({
      success: true,
      type,
      resultUrl,
      generationId: generation?.id,
    })
  } catch (error) {
    console.error("Mock generate error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
