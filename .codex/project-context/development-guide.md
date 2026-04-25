# 开发指南

## API 约定

- API Route 默认需要登录，除注册和登录相关接口外。
- 用户资源查询必须带 `userId`。
- 错误响应使用 `{ error: string }`。
- `metadata` 当前是字符串字段，写入前统一 `JSON.stringify`，读取时由调用方解析。
- 使用 `updateMany` 做用户资源更新时，更新后再按 ID 查询返回最新对象。

## UI 约定

- Dashboard 是管理后台，不做营销落地页风格。
- Studio 是生产工具，布局稳定性优先于装饰性。
- 工具按钮优先使用 lucide 图标。
- 新控件尽量复用 `src/components/ui`。
- 右侧 AI/属性/批量面板避免长说明文案，重点放在控件、状态和结果预览。

## 画布约定

- Fabric 对象新增、删除、替换、背景变更后要 `renderAll()`。
- 用户可撤销的动作要调用 `saveState()`。
- 远程图片加载需要考虑 CORS。
- 生成图插入画布时应根据画布尺寸等比缩放并居中。

## 验证

普通改动：

```bash
npm run lint
```

涉及类型、构建、服务端路由：

```bash
npm run build
```

涉及 Prisma：

```bash
npx prisma generate
npx prisma migrate dev
```

## 风险点

- 乱码已经清理完毕，仅保留巡检
- 本地 SQLite 和 `public/uploads` 不是生产级方案。
- 当前 mock AI 不生成真实文件。
- 真实 AI API key 必须只保存在服务端环境变量中。
