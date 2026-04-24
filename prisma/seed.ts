import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.template.count()
  if (existing > 0) {
    console.log('Templates already seeded')
    return
  }

  const templates = [
    {
      name: '淘宝主图',
      description: '淘宝平台商品主图模板',
      category: 'taobao',
      scene: null,
      thumbnail: '/templates/taobao-main.png',
      width: 800,
      height: 800,
      canvasData: JSON.stringify({ width: 800, height: 800, backgroundColor: '#ffffff' }),
    },
    {
      name: '天猫详情页首图',
      description: '天猫详情页首图模板',
      category: 'tmall',
      scene: null,
      thumbnail: '/templates/tmall-detail.png',
      width: 790,
      height: 400,
      canvasData: JSON.stringify({ width: 790, height: 400, backgroundColor: '#f5f5f5' }),
    },
    {
      name: '京东主图',
      description: '京东平台商品主图模板',
      category: 'jd',
      scene: null,
      thumbnail: '/templates/jd-main.png',
      width: 800,
      height: 800,
      canvasData: JSON.stringify({ width: 800, height: 800, backgroundColor: '#ffffff' }),
    },
    {
      name: '亚马逊主图',
      description: '亚马逊平台商品主图模板',
      category: 'amazon',
      scene: null,
      thumbnail: '/templates/amazon-main.png',
      width: 2000,
      height: 2000,
      canvasData: JSON.stringify({ width: 2000, height: 2000, backgroundColor: '#ffffff' }),
    },
  ]

  for (const template of templates) {
    await prisma.template.create({ data: template })
  }

  console.log('Seeded templates successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
