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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Crown, UserPlus, UserMinus, RefreshCw, AlertTriangle, Search, Shield } from 'lucide-react'
import { useState } from 'react'

export const Route = createLazyFileRoute('/_dashboard/operators')({
  component: OperatorsPage,
})

function OperatorsPage() {
  const { hasPermission } = useAuthStore()
  const {
    isConnected,
    operators,
    isLoading,
    fetchOperators,
    addActivityLog,
  } = useServerStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [permissionLevel, setPermissionLevel] = useState('4')
  const [bypassPlayerLimit, setBypassPlayerLimit] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canManage = hasPermission(Permission.OPERATORS_MANAGE)

  const filteredOperators = operators.filter(op =>
    op.player.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAdd = async () => {
    if (!playerName.trim()) return
    setIsSubmitting(true)
    try {
      await mmspClient.addOperator(
        { name: playerName.trim() },
        parseInt(permissionLevel),
        bypassPlayerLimit
      )
      addActivityLog('manual', `Added ${playerName} as operator (level ${permissionLevel})`)
      setAddDialogOpen(false)
      setPlayerName('')
      setPermissionLevel('4')
      setBypassPlayerLimit(false)
      await fetchOperators()
    } catch (error) {
      console.error('Failed to add operator:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemove = async (player: { name: string }) => {
    if (!confirm(`Remove ${player.name} as operator?`)) return
    try {
      await mmspClient.removeOperator({ name: player.name })
      addActivityLog('manual', `Removed operator ${player.name}`)
      await fetchOperators()
    } catch (error) {
      console.error('Failed to remove operator:', error)
    }
  }

  const getPermissionLevelLabel = (level: number) => {
    switch (level) {
      case 1: return 'Bypass spawn protection'
      case 2: return 'Use cheats & command blocks'
      case 3: return 'Use player management'
      case 4: return 'Full administrator'
      default: return `Level ${level}`
    }
  }

  if (!isConnected) {
    return (
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Not Connected</AlertTitle>
        <AlertDescription>
          Connect to a server to manage operators.
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
                <Crown className="h-5 w-5" />
                Operators
              </CardTitle>
              <CardDescription>
                Manage server operators and their permissions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search operators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => fetchOperators()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              {canManage && (
                <Button onClick={() => setAddDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Operator
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading.operators ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filteredOperators.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Crown className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-1">
                {operators.length === 0 ? 'No operators' : 'No operators found'}
              </h3>
              <p className="text-sm">
                {operators.length === 0
                  ? 'Add operators to give them administrative access.'
                  : 'Try adjusting your search query.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Permission Level</TableHead>
                    <TableHead>Bypasses Player Limit</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOperators.map((op) => (
                    <TableRow key={op.player.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-yellow-500/10 flex items-center justify-center font-medium text-yellow-500">
                            {op.player.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium">{op.player.name}</span>
                            <p className="text-xs text-muted-foreground font-mono">
                              {op.player.id.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            <Shield className="h-3 w-3 mr-1" />
                            Level {op.permissionLevel}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {getPermissionLevelLabel(op.permissionLevel)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {op.bypassesPlayerLimit ? (
                          <Badge variant="success">Yes</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemove(op.player)}
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

      {/* Add Operator Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Operator</DialogTitle>
            <DialogDescription>
              Grant operator privileges to a player
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="op-player-name">Player Name</Label>
              <Input
                id="op-player-name"
                placeholder="Enter player name..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="permission-level">Permission Level</Label>
              <Select value={permissionLevel} onValueChange={setPermissionLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Level 1 - Bypass spawn protection</SelectItem>
                  <SelectItem value="2">Level 2 - Use cheats & command blocks</SelectItem>
                  <SelectItem value="3">Level 3 - Use player management</SelectItem>
                  <SelectItem value="4">Level 4 - Full administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="bypass-limit">Bypass player limit</Label>
              <Switch
                id="bypass-limit"
                checked={bypassPlayerLimit}
                onCheckedChange={setBypassPlayerLimit}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={isSubmitting || !playerName.trim()}>
              {isSubmitting ? 'Adding...' : 'Add Operator'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
