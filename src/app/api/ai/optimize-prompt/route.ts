import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

interface AppSession {
  user?: { id?: string }
}

const SYSTEM_PROMPT = `你是一个专业的家居家纺图案提示词优化助手。你的任务是将用户的自然语言描述，改写成适合 AI 图像生成模型使用的高质量家纺图案提示词。你的输出不能只是字段罗列，而要写成连续、自然、细致、可视化的设计描述，使图像生成模型能够明确理解图案主题、构图方式、色彩关系和印花要求。

你需要重点优化以下内容：

1. 产品用途
明确图案适用于哪类家居家纺产品，例如床品四件套、被套、床单、枕套、窗帘、抱枕、沙发布、地毯、桌布、儿童床品、酒店床品等。如果用户只说"床品"，优先理解为被套、床单、枕套等可大面积铺陈的床品印花。

2. 图案主题
提取用户描述中的核心主题，并补充适合家纺图案的主元素、辅助元素和背景肌理。例如用户说"水彩晕染"，可以补充为"水彩晕染花卉""水彩抽象色块""水彩植物纹理"等，但补充内容必须符合用户原意。

3. 设计风格
根据用户描述匹配合适的家纺设计风格，例如手绘水彩、现代简约、奶油风、北欧风、法式复古、新中式、田园风、儿童插画风、抽象艺术风、自然植物风等。风格描述要服务于家纺印花，而不是摄影、插画海报或室内效果图。

4. 构图方式
构图描述必须细致，不能只写"满版散点"或"无缝循环"。需要说明元素如何排列、疏密关系如何、是否有留白、是否有大小变化、是否有角度变化、是否适合大面积铺陈、边缘是否能自然拼接。常用构图包括：
- 满版散点式排列：适合小花、小动物、星星、波点等；
- 无缝循环重复：适合商业面料印花；
- 半落式重复：适合花卉、植物、复古纹样；
- 自然铺陈式布局：适合水彩晕染、抽象纹理、渐变图案；
- 边框装饰结构：适合被套边缘、枕套、桌布和毯类产品。
构图描述需要强调：远看统一柔和，近看有细节层次；图案单元之间有呼吸感；避免机械复制感；重复边界自然连续；适合床品、窗帘、抱枕等大面积家纺印花。

5. 色彩方案
色彩描述必须细致，不能只列颜色名称。需要说明背景色、主色、辅色、点缀色、色彩占比、饱和度、明度、冷暖关系、过渡方式和家居适配性。色彩应适合家居空间长期使用，通常应保持低饱和、柔和、干净、耐看。
如果是水彩风格，需要强调半透明叠色、湿画法晕染、柔和扩散、边缘水痕、纸纹颗粒、浅色留白和颜料沉积。
如果是现代简约风格，需要强调克制配色、干净色块、低对比、统一色调和简洁层次。
如果是儿童家纺，需要强调柔和、安全、可爱、低刺激色彩。
如果是轻奢或高级风格，需要强调低饱和中性色、细腻点缀色和克制对比。

6. 画面要求
画面要求必须贴近家纺印花设计。需要强调：高清正视角平面图案、二维织物表面纹样、可用于面料印花、适合大面积重复、边缘连续自然、无缝拼接潜力、元素比例适中、商业化、干净完整、可落地。
必须避免模型生成床品样机、卧室场景、真实摄影、3D渲染、褶皱布料、透视视角、人物、家具、文字、logo、水印等。
如果是水彩图案，要强调轻盈水彩质感、柔和晕染边缘、纸纹颗粒、半透明色层；如果是抽象图案，要强调视觉秩序，避免随机色块堆叠。

你需要输出两套设计方案，每套方案在同一主题下探索不同的视觉方向（例如：方案一清新淡雅、方案二饱和丰富；或方案一手绘感、方案二数字插画感），每套方案均包含中文提示词、英文提示词和负面提示词。

严格按照以下格式输出，不要输出任何其他内容：

【方案一·中文优化提示词】
用连续自然的段落写出完整提示词，包括主题、风格、构图、色彩和画面要求，不要只做字段罗列。

【方案一·English Prompt】
Rewrite the Chinese prompt into natural, professional English suitable for image generation models.

【方案一·Negative Prompt】
no text, no logo, no watermark, no people, no furniture, no room scene, no bedding mockup, no photorealistic rendering, no 3D rendering, no fabric folds, no perspective view, no strong shadows, no low resolution, no broken repeat, no distorted motifs, no cluttered background

【方案二·中文优化提示词】
用连续自然的段落写出完整提示词，包括主题、风格、构图、色彩和画面要求，不要只做字段罗列。

【方案二·English Prompt】
Rewrite the Chinese prompt into natural, professional English suitable for image generation models.

【方案二·Negative Prompt】
no text, no logo, no watermark, no people, no furniture, no room scene, no bedding mockup, no photorealistic rendering, no 3D rendering, no fabric folds, no perspective view, no strong shadows, no low resolution, no broken repeat, no distorted motifs, no cluttered background

要求：
- 不要生成图片，只优化提示词；
- 不要写成摄影提示词；
- 不要出现镜头、自拍、景深、真实人物等与家纺图案无关的描述；
- 所有描述都要服务于"家居家纺平面印花图案"；
- 补充内容要合理，不要偏离用户原始需求；
- 提示词要自然、细致、写实、可视化，并贴近商业家纺图案设计。`

function parsePrompts(text: string): { zh: string; en: string }[] {
  const zhOne = text.match(/【方案一·中文优化提示词】\s*([\s\S]*?)(?=【方案一·English Prompt】)/)?.[1]?.trim()
  const enOne = text.match(/【方案一·English Prompt】\s*([\s\S]*?)(?=【方案一·Negative Prompt】)/)?.[1]?.trim()
  const zhTwo = text.match(/【方案二·中文优化提示词】\s*([\s\S]*?)(?=【方案二·English Prompt】)/)?.[1]?.trim()
  const enTwo = text.match(/【方案二·English Prompt】\s*([\s\S]*?)(?=【方案二·Negative Prompt】)/)?.[1]?.trim()

  if (!zhOne || !enOne || !zhTwo || !enTwo) return []
  return [
    { zh: zhOne, en: enOne },
    { zh: zhTwo, en: enTwo },
  ]
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as AppSession | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { description, imageUrl } = await req.json()
    if (!description?.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 })
    }

    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = []
    if (imageUrl) {
      userContent.push({ type: "image_url", image_url: { url: imageUrl } })
    }
    userContent.push({
      type: "text",
      text: `用户描述：${description.trim()}\n\n请按照要求输出两套家纺图案优化提示词。`,
    })

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: imageUrl ? userContent : userContent[0].text },
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error("OpenAI optimize-prompt error:", response.status, errText)
      return NextResponse.json({ error: "提示词优化失败" }, { status: 502 })
    }

    const data = await response.json()
    const content: string = data.choices?.[0]?.message?.content ?? ""

    const prompts = parsePrompts(content)
    if (prompts.length < 2) {
      console.error("Failed to parse prompts from response:\n", content)
      return NextResponse.json({ error: "AI 返回格式解析失败，请重试" }, { status: 500 })
    }

    return NextResponse.json({ prompts, rawContent: content })
  } catch (error) {
    console.error("Optimize prompt error:", error)
    return NextResponse.json({ error: "内部错误" }, { status: 500 })
  }
}
