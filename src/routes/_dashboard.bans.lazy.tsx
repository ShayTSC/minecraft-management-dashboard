import { createLazyFileRoute } from '@tanstack/react-router'
import { useServerStore } from '@/stores/server'
import { useAuthStore } from '@/stores/auth'
import { Permission } from '@/types'
import { mmspClient } from '@/services/mmsp'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Ban, UserPlus, UserMinus, RefreshCw, AlertTriangle, Search, Globe } from 'lucide-react'
import { useState } from 'react'
import { formatDate } from '@/lib/utils'

export const Route = createLazyFileRoute('/_dashboard/bans')({
  component: BansPage,
})

function BansPage() {
  const { hasPermission } = useAuthStore()
  const {
    isConnected,
    bans,
    ipBans,
    isLoading,
    fetchBans,
    fetchIpBans,
    addActivityLog,
  } = useServerStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [ipBanDialogOpen, setIpBanDialogOpen] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [ipAddress, setIpAddress] = useState('')
  const [reason, setReason] = useState('')
  const [expires, setExpires] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canManageBans = hasPermission(Permission.BANS_MANAGE)
  const canManageIpBans = hasPermission(Permission.IP_BANS_MANAGE)

  const filteredBans = bans.filter(ban =>
    ban.player.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredIpBans = ipBans.filter(ban =>
    ban.ip.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleBan = async () => {
    if (!playerName.trim()) return
    setIsSubmitting(true)
    try {
      await mmspClient.addBan(
        { name: playerName.trim() },
        reason || undefined,
        expires || undefined
      )
      addActivityLog('manual', `Banned player ${playerName}`)
      setBanDialogOpen(false)
      setPlayerName('')
      setReason('')
      setExpires('')
      await fetchBans()
    } catch (error) {
      console.error('Failed to ban player:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUnban = async (player: { name: string }) => {
    if (!confirm(`Unban ${player.name}?`)) return
    try {
      await mmspClient.removeBan({ name: player.name })
      addActivityLog('manual', `Unbanned player ${player.name}`)
      await fetchBans()
    } catch (error) {
      console.error('Failed to unban player:', error)
    }
  }

  const handleIpBan = async () => {
    if (!ipAddress.trim()) return
    setIsSubmitting(true)
    try {
      await mmspClient.addIpBan(
        ipAddress.trim(),
        reason || undefined,
        expires || undefined
      )
      addActivityLog('manual', `Banned IP ${ipAddress}`)
      setIpBanDialogOpen(false)
      setIpAddress('')
      setReason('')
      setExpires('')
      await fetchIpBans()
    } catch (error) {
      console.error('Failed to ban IP:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUnbanIp = async (ip: string) => {
    if (!confirm(`Unban IP ${ip}?`)) return
    try {
      await mmspClient.removeIpBan(ip)
      addActivityLog('manual', `Unbanned IP ${ip}`)
      await fetchIpBans()
    } catch (error) {
      console.error('Failed to unban IP:', error)
    }
  }

  if (!isConnected) {
    return (
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Not Connected</AlertTitle>
        <AlertDescription>
          Connect to a server to manage bans.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                Ban Management
              </CardTitle>
              <CardDescription>
                Manage player and IP bans
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="players">
            <TabsList className="mb-4">
              <TabsTrigger value="players" className="gap-2">
                <Ban className="h-4 w-4" />
                Player Bans ({bans.length})
              </TabsTrigger>
              <TabsTrigger value="ips" className="gap-2">
                <Globe className="h-4 w-4" />
                IP Bans ({ipBans.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="players">
              <div className="flex justify-between items-center mb-4">
                <Button variant="outline" size="sm" onClick={() => fetchBans()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                {canManageBans && (
                  <Button onClick={() => setBanDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Ban Player
                  </Button>
                )}
              </div>

              {isLoading.bans ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : filteredBans.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Ban className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-1">No player bans</h3>
                  <p className="text-sm">The ban list is empty.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Source</TableHead>
                        {canManageBans && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBans.map((ban) => (
                        <TableRow key={ban.player.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center font-medium text-red-500">
                                {ban.player.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium">{ban.player.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground">
                              {ban.reason || 'No reason specified'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {ban.expires ? (
                              <Badge variant="outline">{formatDate(ban.expires)}</Badge>
                            ) : (
                              <Badge variant="destructive">Permanent</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground">
                              {ban.source || 'Unknown'}
                            </span>
                          </TableCell>
                          {canManageBans && (
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnban(ban.player)}
                              >
                                <UserMinus className="h-4 w-4 mr-1" />
                                Unban
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ips">
              <div className="flex justify-between items-center mb-4">
                <Button variant="outline" size="sm" onClick={() => fetchIpBans()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                {canManageIpBans && (
                  <Button onClick={() => setIpBanDialogOpen(true)}>
                    <Globe className="h-4 w-4 mr-2" />
                    Ban IP
                  </Button>
                )}
              </div>

              {isLoading.ipBans ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : filteredIpBans.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Globe className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-1">No IP bans</h3>
                  <p className="text-sm">The IP ban list is empty.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Source</TableHead>
                        {canManageIpBans && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIpBans.map((ban) => (
                        <TableRow key={ban.ip}>
                          <TableCell>
                            <code className="font-mono">{ban.ip}</code>
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground">
                              {ban.reason || 'No reason specified'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {ban.expires ? (
                              <Badge variant="outline">{formatDate(ban.expires)}</Badge>
                            ) : (
                              <Badge variant="destructive">Permanent</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground">
                              {ban.source || 'Unknown'}
                            </span>
                          </TableCell>
                          {canManageIpBans && (
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnbanIp(ban.ip)}
                              >
                                <UserMinus className="h-4 w-4 mr-1" />
                                Unban
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Ban Player Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban Player</DialogTitle>
            <DialogDescription>
              Add a player to the ban list
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ban-player-name">Player Name</Label>
              <Input
                id="ban-player-name"
                placeholder="Enter player name..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ban-reason">Reason (optional)</Label>
              <Input
                id="ban-reason"
                placeholder="Enter ban reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ban-expires">Expires (optional)</Label>
              <Input
                id="ban-expires"
                type="datetime-local"
                value={expires}
                onChange={(e) => setExpires(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBan} disabled={isSubmitting || !playerName.trim()}>
              {isSubmitting ? 'Banning...' : 'Ban Player'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban IP Dialog */}
      <Dialog open={ipBanDialogOpen} onOpenChange={setIpBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban IP Address</DialogTitle>
            <DialogDescription>
              Add an IP address to the ban list
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ban-ip">IP Address</Label>
              <Input
                id="ban-ip"
                placeholder="e.g., 192.168.1.1"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ip-ban-reason">Reason (optional)</Label>
              <Input
                id="ip-ban-reason"
                placeholder="Enter ban reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ip-ban-expires">Expires (optional)</Label>
              <Input
                id="ip-ban-expires"
                type="datetime-local"
                value={expires}
                onChange={(e) => setExpires(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIpBanDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleIpBan} disabled={isSubmitting || !ipAddress.trim()}>
              {isSubmitting ? 'Banning...' : 'Ban IP'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
