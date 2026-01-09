import { createLazyFileRoute } from '@tanstack/react-router'
import { useServerStore } from '@/stores/server'
import { useAuthStore } from '@/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Permission } from '@/types'
import { formatRelativeTime } from '@/lib/utils'
import {
  Users,
  Shield,
  Ban,
  Crown,
  Server,
  Activity,
  RefreshCw,
  Power,
  Save,
  Send,
  AlertTriangle,
  Wifi,
} from 'lucide-react'
import { useState } from 'react'
import { mmspClient } from '@/services/mmsp'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createLazyFileRoute('/_dashboard/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { hasPermission } = useAuthStore()
  const {
    isConnected,
    status,
    players,
    allowlist,
    bans,
    operators,
    activityLog,
    isLoading,
    fetchAll,
    addActivityLog,
  } = useServerStore()

  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleRefresh = async () => {
    await fetchAll()
    addActivityLog('manual', 'Dashboard data refreshed')
  }

  const handleSaveWorld = async () => {
    if (!hasPermission(Permission.SERVER_CONTROL)) return
    try {
      await mmspClient.saveWorld()
      addActivityLog('manual', 'World save initiated')
    } catch (error) {
      console.error('Failed to save world:', error)
    }
  }

  const handleStopServer = async () => {
    if (!hasPermission(Permission.SERVER_STOP)) return
    if (!confirm('Are you sure you want to stop the server?')) return
    try {
      await mmspClient.stopServer()
      addActivityLog('manual', 'Server stop initiated')
    } catch (error) {
      console.error('Failed to stop server:', error)
    }
  }

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return
    setIsSending(true)
    try {
      await mmspClient.sendSystemMessage(broadcastMessage)
      addActivityLog('manual', `Broadcast sent: "${broadcastMessage}"`)
      setBroadcastMessage('')
      setMessageDialogOpen(false)
    } catch (error) {
      console.error('Failed to send broadcast:', error)
    } finally {
      setIsSending(false)
    }
  }

  const stats = [
    {
      title: 'Online Players',
      value: players.length,
      max: status?.maxPlayers,
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Allowlisted',
      value: allowlist.length,
      icon: Shield,
      color: 'text-green-500',
    },
    {
      title: 'Banned Players',
      value: bans.length,
      icon: Ban,
      color: 'text-red-500',
    },
    {
      title: 'Operators',
      value: operators.length,
      icon: Crown,
      color: 'text-yellow-500',
    },
  ]

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Not Connected</AlertTitle>
          <AlertDescription>
            You are not connected to any Minecraft server. Go to the Connection page to configure and connect to a server.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Server Status Banner */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Server className="h-8 w-8 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">Server Online</h2>
                  <Badge variant="success" className="gap-1">
                    <Wifi className="h-3 w-3" />
                    Connected
                  </Badge>
                </div>
                {status?.motd && (
                  <p className="text-muted-foreground">{status.motd}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {hasPermission(Permission.SERVER_CONTROL) && (
                <>
                  <Button variant="outline" size="sm" onClick={handleSaveWorld}>
                    <Save className="h-4 w-4 mr-2" />
                    Save World
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessageDialogOpen(true)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Broadcast
                  </Button>
                </>
              )}
              {hasPermission(Permission.SERVER_STOP) && (
                <Button variant="destructive" size="sm" onClick={handleStopServer}>
                  <Power className="h-4 w-4 mr-2" />
                  Stop Server
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading.players || isLoading.status ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {stat.value}
                  {stat.max !== undefined && (
                    <span className="text-sm font-normal text-muted-foreground">
                      /{stat.max}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Online Players */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Online Players
            </CardTitle>
            <CardDescription>
              Currently connected players
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading.players ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : players.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No players online</p>
              </div>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {player.id.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                      {operators.some(op => op.player.id === player.id) && (
                        <Badge variant="secondary">
                          <Crown className="h-3 w-3 mr-1" />
                          OP
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Log
            </CardTitle>
            <CardDescription>
              Recent server events and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activityLog.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {activityLog.slice(0, 20).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{entry.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Broadcast Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Broadcast Message</DialogTitle>
            <DialogDescription>
              Send a system message to all online players
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="broadcast-message">Message</Label>
              <Input
                id="broadcast-message"
                placeholder="Enter your message..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBroadcast} disabled={isSending || !broadcastMessage.trim()}>
              {isSending ? 'Sending...' : 'Send Broadcast'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
