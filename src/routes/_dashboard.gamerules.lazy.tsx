import { createLazyFileRoute } from '@tanstack/react-router'
import { useServerStore } from '@/stores/server'
import { useAuthStore } from '@/stores/auth'
import { Permission } from '@/types'
import { mmspClient } from '@/services/mmsp'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Gamepad2, RefreshCw, AlertTriangle, Search, Hash, ToggleLeft } from 'lucide-react'
import { useState } from 'react'

export const Route = createLazyFileRoute('/_dashboard/gamerules')({
  component: GameRulesPage,
})

function GameRulesPage() {
  const { hasPermission } = useAuthStore()
  const {
    isConnected,
    gameRules,
    isLoading,
    fetchGameRules,
    addActivityLog,
  } = useServerStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [editingRule, setEditingRule] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canManage = hasPermission(Permission.GAMERULES_MANAGE)

  const filteredRules = gameRules.filter(rule =>
    rule.key.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group rules by category based on naming convention
  const groupedRules = filteredRules.reduce((acc, rule) => {
    let category = 'Other'
    if (rule.key.startsWith('do')) category = 'Do'
    else if (rule.key.startsWith('spawn')) category = 'Spawning'
    else if (rule.key.startsWith('natural')) category = 'Natural'
    else if (rule.key.startsWith('max')) category = 'Limits'
    else if (rule.key.startsWith('command')) category = 'Commands'
    else if (rule.key.startsWith('random')) category = 'Random'
    else if (rule.key.startsWith('send')) category = 'Feedback'
    else if (rule.key.startsWith('show')) category = 'Display'
    else if (rule.key.startsWith('reduced') || rule.key.startsWith('disable')) category = 'Reduction'
    else if (rule.key.startsWith('announce') || rule.key.startsWith('log')) category = 'Logging'

    if (!acc[category]) acc[category] = []
    acc[category].push(rule)
    return acc
  }, {} as Record<string, typeof gameRules>)

  const handleToggle = async (key: string, currentValue: boolean) => {
    if (!canManage) return
    setIsSubmitting(true)
    try {
      await mmspClient.updateGameRule(key, !currentValue)
      addActivityLog('manual', `Updated game rule ${key} to ${!currentValue}`)
      await fetchGameRules()
    } catch (error) {
      console.error('Failed to update game rule:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleIntegerUpdate = async (key: string) => {
    if (!canManage) return
    const numValue = parseInt(editValue)
    if (isNaN(numValue)) return
    setIsSubmitting(true)
    try {
      await mmspClient.updateGameRule(key, numValue)
      addActivityLog('manual', `Updated game rule ${key} to ${numValue}`)
      setEditingRule(null)
      setEditValue('')
      await fetchGameRules()
    } catch (error) {
      console.error('Failed to update game rule:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEditing = (key: string, value: number | string) => {
    setEditingRule(key)
    setEditValue(String(value))
  }

  if (!isConnected) {
    return (
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Not Connected</AlertTitle>
        <AlertDescription>
          Connect to a server to manage game rules.
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
                <Gamepad2 className="h-5 w-5" />
                Game Rules
              </CardTitle>
              <CardDescription>
                Configure server game rules
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => fetchGameRules()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading.gameRules ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Gamepad2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-1">
                {gameRules.length === 0 ? 'No game rules found' : 'No matching rules'}
              </h3>
              <p className="text-sm">
                {gameRules.length === 0
                  ? 'Game rules could not be loaded from the server.'
                  : 'Try adjusting your search query.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedRules).sort().map(([category, rules]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {category} ({rules.length})
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {rules.map((rule) => (
                      <div
                        key={rule.key}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {rule.type === 'boolean' ? (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground shrink-0" />
                          ) : (
                            <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{rule.key}</p>
                            <p className="text-xs text-muted-foreground">
                              {rule.type === 'boolean' ? 'Boolean' : 'Integer'}
                            </p>
                          </div>
                        </div>
                        <div className="ml-4">
                          {rule.type === 'boolean' ? (
                            <Switch
                              checked={rule.value === true}
                              onCheckedChange={() => handleToggle(rule.key, rule.value as boolean)}
                              disabled={!canManage || isSubmitting}
                            />
                          ) : editingRule === rule.key ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-24 h-8"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleIntegerUpdate(rule.key)
                                  if (e.key === 'Escape') {
                                    setEditingRule(null)
                                    setEditValue('')
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() => handleIntegerUpdate(rule.key)}
                                disabled={isSubmitting}
                              >
                                Save
                              </Button>
                            </div>
                          ) : (
                            <Badge
                              variant="secondary"
                              className={canManage ? 'cursor-pointer hover:bg-secondary/80' : ''}
                              onClick={() => canManage && startEditing(rule.key, rule.value as number)}
                            >
                              {String(rule.value)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
