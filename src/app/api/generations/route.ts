import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

interface AppSession {
  user?: { id?: string }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as AppSession | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const generations = await prisma.generation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(generations)
  } catch (error) {
    console.error("List generations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as AppSession | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { type, prompt, projectId, metadata } = body

    if (!type || !["scene", "background_removal", "batch"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid or missing generation type" },
        { status: 400 }
      )
    }

    const generation = await prisma.generation.create({
      data: {
        type,
        prompt,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        userId: session.user.id,
        projectId: projectId || undefined,
        status: "pending",
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(generation)
  } catch (error) {
    console.error("Create generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
