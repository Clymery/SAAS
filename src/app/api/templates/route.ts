import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const scene = searchParams.get("scene")

    const templates = await prisma.template.findMany({
      where: {
        isSystem: true,
        ...(category ? { category } : {}),
        ...(scene ? { scene } : {}),
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error("List templates error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
