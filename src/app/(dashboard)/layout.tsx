"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  Compass,
  FolderOpen,
  HelpCircle,
  ImageIcon,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  ShieldCheck,
  Settings,
  ShoppingBag,
  Sparkles,
  User,
  Waves,
  X,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import DashboardBackground from "@/components/dashboard/DashboardBackground"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "仪表盘", icon: LayoutDashboard },
  { href: "/projects", label: "项目中心", icon: FolderOpen },
  { href: "/assets", label: "素材", icon: ImageIcon },
  { href: "/templates", label: "模板", icon: LayoutTemplate },
  { href: "/community", label: "广场", icon: Compass },
  { href: "/store", label: "商城", icon: ShoppingBag },
  { href: "/settings", label: "设置", icon: Settings },
  { href: "/help", label: "帮助", icon: HelpCircle },
]

const WATERMARK_STORAGE_KEY = "saas:watermark-enabled"
const WATERMARK_EVENT_NAME = "saas:watermark-change"

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`))
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [watermarkEnabled, setWatermarkEnabled] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    const savedWatermarkState = window.localStorage.getItem(WATERMARK_STORAGE_KEY)

    if (savedWatermarkState !== null) {
      setWatermarkEnabled(savedWatermarkState === "true")
    }
  }, [])

  if (status === "loading" || !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const userInitial = session.user?.name?.[0] || session.user?.email?.[0] || "U"

  const handleWatermarkToggle = (enabled: boolean) => {
    setWatermarkEnabled(enabled)
    window.localStorage.setItem(WATERMARK_STORAGE_KEY, String(enabled))
    window.dispatchEvent(
      new CustomEvent(WATERMARK_EVENT_NAME, {
        detail: { enabled },
      })
    )
  }

  return (
    <div className="min-h-screen bg-[#fbf3e8]">
      <nav className="sticky top-0 z-40 border-b border-[#eadcc8]/70 bg-[#fff8ec]/80 text-[#6d5a49] shadow-sm shadow-[#b58b5f]/10 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid h-16 grid-cols-[160px_minmax(0,1fr)_260px] items-center gap-4">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold tracking-wide text-[#5b4637]">
                SAAS
              </Link>
            </div>

            <div className="hidden min-w-0 items-center justify-center gap-2 md:flex">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "border-[#dec7ad] bg-[#efdcc3]/85 text-[#5b4637] shadow-sm shadow-[#b58b5f]/15"
                        : "border-transparent text-[#7b6653] hover:bg-[#f7ead8]/70 hover:text-[#5b4637]"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>

            <div className="hidden items-center justify-end gap-3 md:flex">
              <Link
                href="/store"
                className="flex h-8 items-center gap-1.5 rounded-full border border-[#5a3c2b] bg-[#4a3327] px-3 text-xs font-medium leading-none text-[#fff7ea] shadow-sm shadow-[#7b4f35]/20 transition-colors hover:bg-[#5a3c2b]"
              >
                <span>订阅会员</span>
                <span className="h-3.5 w-px bg-[#fff7ea]/25" />
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 fill-[#fff7ea]" />
                  <span className="tabular-nums">0</span>
                </span>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[#5b4637] transition-colors hover:bg-[#f7ead8]/70">
                    <Avatar size="sm">
                      <AvatarImage src={session.user?.image || ""} />
                      <AvatarFallback>{userInitial}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {session.user?.name || session.user?.email}
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 border-[#eadcc8] bg-[#fffaf1] text-[#5b4637] shadow-lg shadow-[#7b4f35]/15">
                  <DropdownMenuItem
                    onClick={() => router.push("/settings")}
                    className="flex cursor-pointer items-center gap-2 focus:bg-[#f5e8d6] focus:text-[#5b4637]"
                  >
                    <User className="h-4 w-4" />
                    账户
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/store")}
                    className="flex cursor-pointer items-center gap-2 focus:bg-[#f5e8d6] focus:text-[#5b4637]"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    会员中心
                  </DropdownMenuItem>
                  <div
                    className="flex cursor-default items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm outline-none"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-center gap-2">
                      <Waves className="h-4 w-4" />
                      <span>生成水印</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={watermarkEnabled}
                      aria-label={watermarkEnabled ? "关闭生成水印" : "开启生成水印"}
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        handleWatermarkToggle(!watermarkEnabled)
                      }}
                      className="relative h-5 w-9 rounded-full border border-gray-300 bg-gray-300 transition-colors data-[state=checked]:bg-gray-500"
                      data-state={watermarkEnabled ? "checked" : "unchecked"}
                    >
                      <span
                        className="absolute left-0.5 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-4 data-[state=checked]:bg-gray-950 data-[state=unchecked]:translate-x-0"
                        data-state={watermarkEnabled ? "checked" : "unchecked"}
                      />
                    </button>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex cursor-pointer items-center gap-2 text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center justify-end md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[#eadcc8]/70 bg-[#fff8ec]/95 backdrop-blur-xl md:hidden">
            <div className="space-y-1 px-4 pb-4 pt-2">
              <Link
                href="/store"
                onClick={() => setMobileMenuOpen(false)}
                className="mb-2 flex h-10 items-center justify-between rounded-full bg-[#4a3327] px-4 text-sm font-medium text-[#fff7ea]"
              >
                <span>订阅会员</span>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4 fill-[#fff7ea]" />
                  0
                </span>
              </Link>

              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "border-[#dec7ad] bg-[#efdcc3]/85 text-[#5b4637] shadow-sm"
                        : "border-transparent text-[#7b6653] hover:bg-[#f7ead8]/70 hover:text-[#5b4637]"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
              <div className="mt-2 border-t pt-2">
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar size="sm">
                    <AvatarImage src={session.user?.image || ""} />
                    <AvatarFallback>{userInitial}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium">{session.user?.name || session.user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
      <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
        <DashboardBackground />
        <div className="relative z-10 h-[calc(100vh-4rem)] w-full overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
