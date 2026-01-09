import { createFileRoute, Outlet, Link, useNavigate, useLocation } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth'
import { useServerStore } from '@/stores/server'
import { Permission } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Users,
  Shield,
  Ban,
  Crown,
  Settings,
  Gamepad2,
  Link2,
  UserCog,
  LogOut,
  Menu,
  X,
  Wifi,
  WifiOff,
  Pickaxe,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_dashboard')({
  component: DashboardLayout,
})

const navItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    permission: Permission.SERVER_VIEW,
  },
  {
    title: 'Players',
    href: '/players',
    icon: Users,
    permission: Permission.PLAYERS_VIEW,
  },
  {
    title: 'Allowlist',
    href: '/allowlist',
    icon: Shield,
    permission: Permission.ALLOWLIST_VIEW,
  },
  {
    title: 'Bans',
    href: '/bans',
    icon: Ban,
    permission: Permission.BANS_VIEW,
  },
  {
    title: 'Operators',
    href: '/operators',
    icon: Crown,
    permission: Permission.OPERATORS_VIEW,
  },
  {
    title: 'Game Rules',
    href: '/gamerules',
    icon: Gamepad2,
    permission: Permission.GAMERULES_VIEW,
  },
  {
    title: 'Server Settings',
    href: '/settings',
    icon: Settings,
    permission: Permission.SERVER_SETTINGS,
  },
  {
    title: 'Connection',
    href: '/connection',
    icon: Link2,
    permission: Permission.SERVER_VIEW,
  },
  {
    title: 'User Management',
    href: '/users',
    icon: UserCog,
    permission: Permission.USERS_VIEW,
  },
]

function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, logout, hasPermission } = useAuthStore()
  const { isConnected, status, activeConfigId, configs } = useServerStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated || !user) {
    return null
  }

  const activeConfig = configs.find(c => c.id === activeConfigId)

  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }

  const filteredNavItems = navItems.filter(item => hasPermission(item.permission))

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-card border-r transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <Pickaxe className="h-5 w-5 text-primary" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-lg truncate">MC Dashboard</h1>
              <p className="text-xs text-muted-foreground truncate">
                {activeConfig?.name || 'Not connected'}
              </p>
            </div>
          )}
        </div>

        {/* Connection status */}
        <div className={cn("p-3 border-b", !sidebarOpen && "flex justify-center")}>
          <Badge
            variant={isConnected ? "success" : "secondary"}
            className={cn("gap-1", !sidebarOpen && "p-2")}
          >
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3" />
                {sidebarOpen && (
                  <span>
                    {status?.onlinePlayers ?? 0}/{status?.maxPlayers ?? '?'} Online
                  </span>
                )}
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                {sidebarOpen && <span>Disconnected</span>}
              </>
            )}
          </Badge>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 p-2">
          <nav className="space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    !sidebarOpen && "justify-center"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.title}</span>}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        {/* User section */}
        <div className="border-t p-3">
          <div className={cn(
            "flex items-center gap-3 mb-3",
            !sidebarOpen && "justify-center"
          )}>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-medium">
                {user.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user.displayName}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size={sidebarOpen ? "default" : "icon"}
            className={cn("w-full", !sidebarOpen && "h-10 w-10")}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b bg-card flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Separator orientation="vertical" className="h-6 hidden lg:block" />
            <h2 className="font-semibold">
              {filteredNavItems.find(item => item.href === location.pathname)?.title || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {status?.version && (
              <Badge variant="outline" className="hidden sm:flex">
                Minecraft {status.version}
              </Badge>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
