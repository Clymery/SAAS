import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { writeFile } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

export const dynamic = "force-dynamic"

interface AppSession {
  user?: { id?: string }
}

async function generateWithStabilityAI(prompt: string): Promise<Buffer> {
  const form = new FormData()
  form.append("prompt", prompt)
  form.append("output_format", "jpeg")
  form.append("aspect_ratio", "1:1")

  const response = await fetch(
    "https://api.stability.ai/v2beta/stable-image/generate/ultra",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
        Accept: "application/json",
      },
      body: form,
    }
  )

  if (!response.ok) {
    const errText = await response.text()
    console.error("Stability AI error:", response.status, errText)
    throw new Error("Stability AI 图片生成失败")
  }

  const data = await response.json()
  if (data.finish_reason && data.finish_reason !== "SUCCESS") {
    throw new Error(`Stability AI 生成中止: ${data.finish_reason}`)
  }
  if (!data.image) throw new Error("Stability AI 未返回图片数据")

  return Buffer.from(data.image, "base64")
}

async function generateWithGPTImage(prompt: string): Promise<Buffer> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("GPT Image 2 API Key 未配置，请在 .env 中添加 OPENAI_API_KEY")
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1024",
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error("OpenAI API error:", response.status, errText)
    throw new Error("GPT Image 2 图片生成失败")
  }

  const data = await response.json()
  const b64 = data.data?.[0]?.b64_json
  if (!b64) throw new Error("GPT Image 2 未返回图片数据")

  return Buffer.from(b64, "base64")
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as AppSession | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { prompt, model = "stable-diffusion-ultra" } = await req.json()
    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    let imageBuffer: Buffer
    const ext = "jpg"

    if (model === "gpt-image-2") {
      imageBuffer = await generateWithGPTImage(prompt.trim())
    } else {
      imageBuffer = await generateWithStabilityAI(prompt.trim())
    }

    const filename = `generated-${uuidv4()}.${ext}`
    const filepath = join(process.cwd(), "public", "uploads", filename)
    await writeFile(filepath, imageBuffer)

    return NextResponse.json({ url: `/uploads/${filename}` })
  } catch (error) {
    const message = error instanceof Error ? error.message : "内部错误"
    console.error("Generate image error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
