"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  ChevronDown,
  Compass,
  FolderOpen,
  HelpCircle,
  ImageIcon,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  Settings,
  ShoppingBag,
  Sparkles,
  User,
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading" || !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const userInitial = session.user?.name?.[0] || session.user?.email?.[0] || "U"

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-40 border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid h-16 grid-cols-[160px_minmax(0,1fr)_260px] items-center gap-4">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-foreground">
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
                        ? "border-gray-300 bg-gray-200 text-gray-950 shadow-sm"
                        : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
                className="flex h-8 items-center gap-1.5 rounded-full border border-gray-800 bg-gray-950 px-3 text-xs font-medium leading-none text-white shadow-sm transition-colors hover:bg-gray-900"
              >
                <span>订阅会员</span>
                <span className="h-3.5 w-px bg-white/20" />
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 fill-white" />
                  <span className="tabular-nums">0</span>
                </span>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-gray-100">
                    <Avatar size="sm">
                      <AvatarImage src={session.user?.image || ""} />
                      <AvatarFallback>{userInitial}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {session.user?.name || session.user?.email}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => router.push("/settings")}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    个人资料
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/settings")}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    账号设置
                  </DropdownMenuItem>
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
          <div className="border-t bg-white md:hidden">
            <div className="space-y-1 px-4 pb-4 pt-2">
              <Link
                href="/store"
                onClick={() => setMobileMenuOpen(false)}
                className="mb-2 flex h-10 items-center justify-between rounded-full bg-gray-950 px-4 text-sm font-medium text-white"
              >
                <span>订阅会员</span>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4 fill-white" />
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
                        ? "border-gray-300 bg-gray-200 text-gray-950 shadow-sm"
                        : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
