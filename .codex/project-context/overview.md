# 项目概览

## 定位

AI 驱动的电商视觉素材制作 SaaS：围绕商品图、场景图、背景替换、抠图、模板和批量生成，帮助用户快速制作可投放的营销图片。

## 当前已经具备

- 用户注册、登录、会话管理。
- Dashboard 基础页面：项目、素材、设置。
- Studio 工作台：画布、工具栏、图层、属性、AI、批量、模板。
- Prisma 数据模型：User、Project、Asset、Generation、Template、UsageStat。
- 上传接口：文件写入 `public/uploads`。
- AI mock 链路：创建 Generation 后通过 mock 接口模拟完成。

## 下一阶段重点

1. 替换 mock AI，接入真实图片生成 API。
2. 让生成结果在 Studio 内稳定预览、加入画布、设为背景、保存素材。
3. 完善画布项目保存/恢复，包括 Fabric canvasData 和缩略图。
4. 扩展后台管理：生成记录、用量、模板、用户、套餐。
5. 引入队列和对象存储，处理长耗时生成与生产环境资源管理。
