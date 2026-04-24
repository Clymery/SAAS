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

    const projects = await prisma.project.findMany({
      where: { userId: session.user.id, status: { not: "deleted" } },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { generations: true },
        },
      },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("List projects error:", error)
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
    const { name, description, width, height } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        width: width || 800,
        height: height || 800,
        userId: session.user.id,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error("Create project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as AppSession | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id, name, description, status, canvasData } = body

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    const project = await prisma.project.updateMany({
      where: { id, userId: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(canvasData !== undefined && { canvasData }),
      },
    })

    if (project.count === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const updated = await prisma.project.findUnique({ where: { id } })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as AppSession | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    const project = await prisma.project.updateMany({
      where: { id, userId: session.user.id },
      data: { status: "deleted" },
    })

    if (project.count === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
