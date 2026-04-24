import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

interface AppSession {
  user?: { id?: string }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as AppSession | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")

    const assets = await prisma.asset.findMany({
      where: { userId: session.user.id, ...(type ? { type } : {}) },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(assets)
  } catch (error) {
    console.error("List assets error:", error)
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
    const { name, type, url, thumbnail, tags, metadata } = body

    if (!name || !type || !url) {
      return NextResponse.json(
        { error: "Name, type, and url are required" },
        { status: 400 }
      )
    }

    const asset = await prisma.asset.create({
      data: {
        name,
        type,
        url,
        thumbnail,
        tags,
        metadata,
        userId: session.user.id,
      },
    })

    return NextResponse.json(asset)
  } catch (error) {
    console.error("Create asset error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
