import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

interface AppSession {
  user?: { id?: string }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as AppSession | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const generation = await prisma.generation.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    })

    if (!generation) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 })
    }

    return NextResponse.json(generation)
  } catch (error) {
    console.error("Get generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as AppSession | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { status, resultUrl, error: errorMsg, metadata } = body

    const existing = await prisma.generation.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 })
    }

    const generation = await prisma.generation.update({
      where: { id: params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(resultUrl !== undefined && { resultUrl }),
        ...(errorMsg !== undefined && { error: errorMsg }),
        ...(metadata !== undefined && { metadata: typeof metadata === "string" ? metadata : JSON.stringify(metadata) }),
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    })

    if (status === "completed" && existing.status !== "completed") {
      await prisma.usageStat.updateMany({
        where: { userId: session.user.id },
        data: { totalGenerations: { increment: 1 } },
      })
    }

    return NextResponse.json(generation)
  } catch (error) {
    console.error("Update generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
