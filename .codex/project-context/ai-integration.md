# AI 图片生成接入

## 推荐文件结构

```text
src/lib/ai/
  providers.ts
  image-generation.ts
  storage.ts
  errors.ts
```

## Provider 接口建议

```ts
export interface ImageGenerationInput {
  prompt: string
  type: "scene" | "background_removal" | "batch" | "upscale"
  inputImageUrl?: string
  metadata?: Record<string, unknown>
}

export interface ImageGenerationResult {
  images: Array<{ url: string; width?: number; height?: number }>
  raw?: unknown
}
```

## 阶段路线

1. 单 provider 同步接入：先跑通真实生成闭环。
2. Provider 抽象：支持 OpenAI、Replicate、fal、火山、通义、智谱等切换。
3. 队列化：BullMQ + Redis 处理长耗时、批量、失败重试。
4. 生产存储：S3/R2/OSS/COS 替代 `public/uploads`。

## 环境变量建议

```env
AI_PROVIDER=""
AI_API_KEY=""
AI_BASE_URL=""
AI_IMAGE_MODEL=""
AI_TIMEOUT_MS="120000"
```

对象存储：

```env
STORAGE_PROVIDER=""
STORAGE_BUCKET=""
STORAGE_REGION=""
STORAGE_ACCESS_KEY_ID=""
STORAGE_SECRET_ACCESS_KEY=""
STORAGE_PUBLIC_BASE_URL=""
```

## 前端结果展示

- 支持多图候选。
- 每张图支持设为背景、加入画布、保存到素材库。
- 生成中展示状态和耗时。
- 失败时展示可读错误，不暴露 provider 敏感响应。
