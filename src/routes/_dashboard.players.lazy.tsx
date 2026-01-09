import { createLazyFileRoute } from '@tanstack/react-router'
import { useServerStore } from '@/stores/server'
import { useAuthStore } from '@/stores/auth'
import { Permission } from '@/types'
import { mmspClient } from '@/services/mmsp'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { Users, UserX, Send, Crown, RefreshCw, AlertTriangle, Search } from 'lucide-react'
import { useState } from 'react'

export const Route = createLazyFileRoute('/_dashboard/players')({
  component: PlayersPage,
})

function PlayersPage() {
  const { hasPermission } = useAuthStore()
  const {
    isConnected,
    players,
    operators,
    isLoading,
    fetchPlayers,
    addActivityLog,
  } = useServerStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [kickDialogOpen, setKickDialogOpen] = useState(false)
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string } | null>(null)
  const [kickReason, setKickReason] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canKick = hasPermission(Permission.PLAYERS_KICK)
  const canMessage = hasPermission(Permission.PLAYERS_MESSAGE)

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleKick = async () => {
    if (!selectedPlayer) return
    setIsSubmitting(true)
    try {
      await mmspClient.kickPlayer(selectedPlayer, kickReason || undefined)
      addActivityLog('manual', `Kicked player ${selectedPlayer.name}`)
      setKickDialogOpen(false)
      setKickReason('')
      setSelectedPlayer(null)
      await fetchPlayers()
    } catch (error) {
      console.error('Failed to kick player:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedPlayer || !message.trim()) return
    setIsSubmitting(true)
    try {
      await mmspClient.sendSystemMessage(message, [selectedPlayer])
      addActivityLog('manual', `Sent message to ${selectedPlayer.name}`)
      setMessageDialogOpen(false)
      setMessage('')
      setSelectedPlayer(null)
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openKickDialog = (player: { id: string; name: string }) => {
    setSelectedPlayer(player)
    setKickDialogOpen(true)
  }

  const openMessageDialog = (player: { id: string; name: string }) => {
    setSelectedPlayer(player)
    setMessageDialogOpen(true)
  }

  if (!isConnected) {
    return (
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Not Connected</AlertTitle>
        <AlertDescription>
          Connect to a server to manage players.
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
                <Users className="h-5 w-5" />
                Online Players
              </CardTitle>
              <CardDescription>
                View and manage connected players
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => fetchPlayers()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading.players ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-1">
                {players.length === 0 ? 'No players online' : 'No players found'}
              </h3>
              <p className="text-sm">
                {players.length === 0
                  ? 'Players will appear here when they join the server.'
                  : 'Try adjusting your search query.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>UUID</TableHead>
                    <TableHead>Status</TableHead>
                    {(canKick || canMessage) && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.map((player) => {
                    const isOperator = operators.some(op => op.player.id === player.id)
                    return (
                      <TableRow key={player.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center font-medium">
                              {player.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{player.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs text-muted-foreground">
                            {player.id}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="success">Online</Badge>
                            {isOperator && (
                              <Badge variant="secondary">
                                <Crown className="h-3 w-3 mr-1" />
                                OP
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        {(canKick || canMessage) && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {canMessage && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openMessageDialog(player)}
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Message
                                </Button>
                              )}
                              {canKick && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => openKickDialog(player)}
                                >
                                  <UserX className="h-4 w-4 mr-1" />
                                  Kick
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kick Dialog */}
      <Dialog open={kickDialogOpen} onOpenChange={setKickDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kick Player</DialogTitle>
            <DialogDescription>
              Disconnect {selectedPlayer?.name} from the server
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kick-reason">Reason (optional)</Label>
              <Input
                id="kick-reason"
                placeholder="Enter kick reason..."
                value={kickReason}
                onChange={(e) => setKickReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKickDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleKick} disabled={isSubmitting}>
              {isSubmitting ? 'Kicking...' : 'Kick Player'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>
              Send a private message to {selectedPlayer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Input
                id="message"
                placeholder="Enter your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={isSubmitting || !message.trim()}>
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
