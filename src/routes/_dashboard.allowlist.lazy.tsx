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
import { Shield, UserPlus, UserMinus, RefreshCw, AlertTriangle, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'

export const Route = createLazyFileRoute('/_dashboard/allowlist')({
  component: AllowlistPage,
})

function AllowlistPage() {
  const { hasPermission } = useAuthStore()
  const {
    isConnected,
    allowlist,
    isLoading,
    fetchAllowlist,
    addActivityLog,
  } = useServerStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canManage = hasPermission(Permission.ALLOWLIST_MANAGE)

  const filteredList = allowlist.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAdd = async () => {
    if (!playerName.trim()) return
    setIsSubmitting(true)
    try {
      await mmspClient.addToAllowlist([{ name: playerName.trim() }])
      addActivityLog('manual', `Added ${playerName} to allowlist`)
      setAddDialogOpen(false)
      setPlayerName('')
      await fetchAllowlist()
    } catch (error) {
      console.error('Failed to add to allowlist:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemove = async (player: { name: string }) => {
    if (!confirm(`Remove ${player.name} from the allowlist?`)) return
    try {
      await mmspClient.removeFromAllowlist([{ name: player.name }])
      addActivityLog('manual', `Removed ${player.name} from allowlist`)
      await fetchAllowlist()
    } catch (error) {
      console.error('Failed to remove from allowlist:', error)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear the entire allowlist? This action cannot be undone.')) return
    try {
      await mmspClient.clearAllowlist()
      addActivityLog('manual', 'Cleared allowlist')
      await fetchAllowlist()
    } catch (error) {
      console.error('Failed to clear allowlist:', error)
    }
  }

  if (!isConnected) {
    return (
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Not Connected</AlertTitle>
        <AlertDescription>
          Connect to a server to manage the allowlist.
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
                <Shield className="h-5 w-5" />
                Allowlist
              </CardTitle>
              <CardDescription>
                Manage players who can join the server
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
              <Button variant="outline" size="icon" onClick={() => fetchAllowlist()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              {canManage && (
                <>
                  <Button onClick={() => setAddDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Player
                  </Button>
                  {allowlist.length > 0 && (
                    <Button variant="destructive" onClick={handleClearAll}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading.allowlist ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-1">
                {allowlist.length === 0 ? 'Allowlist is empty' : 'No players found'}
              </h3>
              <p className="text-sm">
                {allowlist.length === 0
                  ? 'Add players to allow them to join the server.'
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
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-green-500/10 flex items-center justify-center font-medium text-green-500">
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
                      {canManage && (
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemove(player)}
                          >
                            <UserMinus className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Player Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Allowlist</DialogTitle>
            <DialogDescription>
              Add a player to the server allowlist
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="player-name">Player Name</Label>
              <Input
                id="player-name"
                placeholder="Enter player name..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={isSubmitting || !playerName.trim()}>
              {isSubmitting ? 'Adding...' : 'Add Player'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
