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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Settings, RefreshCw, AlertTriangle, Save, Users, Clock, Map } from 'lucide-react'
import { useState, useEffect } from 'react'

export const Route = createLazyFileRoute('/_dashboard/settings')({
  component: ServerSettingsPage,
})

function ServerSettingsPage() {
  const { hasPermission } = useAuthStore()
  const {
    isConnected,
    settings,
    isLoading,
    fetchSettings,
    addActivityLog,
  } = useServerStore()

  const [localSettings, setLocalSettings] = useState(settings)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const canManage = hasPermission(Permission.SERVER_SETTINGS)

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings)
      setHasChanges(false)
    }
  }, [settings])

  const updateSetting = (key: string, value: unknown) => {
    if (!canManage) return
    setLocalSettings(prev => prev ? { ...prev, [key]: value } : null)
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!localSettings || !hasChanges) return
    setIsSaving(true)
    try {
      await mmspClient.updateServerSettings(localSettings)
      addActivityLog('manual', 'Server settings updated')
      setHasChanges(false)
      await fetchSettings()
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setLocalSettings(settings)
    setHasChanges(false)
  }

  if (!isConnected) {
    return (
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Not Connected</AlertTitle>
        <AlertDescription>
          Connect to a server to manage settings.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Server Settings
          </h2>
          <p className="text-muted-foreground">
            Configure your Minecraft server settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchSettings()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {canManage && hasChanges && (
            <>
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      {isLoading.settings ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : !localSettings ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Settings Unavailable</AlertTitle>
          <AlertDescription>
            Could not load server settings. Try refreshing.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General
              </CardTitle>
              <CardDescription>
                Basic server configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="motd">Message of the Day</Label>
                <Input
                  id="motd"
                  value={localSettings.motd || ''}
                  onChange={(e) => updateSetting('motd', e.target.value)}
                  disabled={!canManage}
                  placeholder="A Minecraft Server"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={localSettings.difficulty || 'normal'}
                  onValueChange={(value) => updateSetting('difficulty', value)}
                  disabled={!canManage}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="peaceful">Peaceful</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gamemode">Default Game Mode</Label>
                <Select
                  value={localSettings.defaultGameMode || 'survival'}
                  onValueChange={(value) => updateSetting('defaultGameMode', value)}
                  disabled={!canManage}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="survival">Survival</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="adventure">Adventure</SelectItem>
                    <SelectItem value="spectator">Spectator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Player Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Players
              </CardTitle>
              <CardDescription>
                Player-related settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxPlayers">Max Players</Label>
                <Input
                  id="maxPlayers"
                  type="number"
                  min="1"
                  max="1000"
                  value={localSettings.maxPlayers || 20}
                  onChange={(e) => updateSetting('maxPlayers', parseInt(e.target.value))}
                  disabled={!canManage}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="idleTimeout">Idle Timeout (minutes)</Label>
                <Input
                  id="idleTimeout"
                  type="number"
                  min="0"
                  value={localSettings.playerIdleTimeout || 0}
                  onChange={(e) => updateSetting('playerIdleTimeout', parseInt(e.target.value))}
                  disabled={!canManage}
                />
                <p className="text-xs text-muted-foreground">0 = disabled</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enforce Allowlist</Label>
                  <p className="text-xs text-muted-foreground">
                    Only allowlisted players can join
                  </p>
                </div>
                <Switch
                  checked={localSettings.enforceAllowlist || false}
                  onCheckedChange={(checked) => updateSetting('enforceAllowlist', checked)}
                  disabled={!canManage}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Flight</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow players to fly in survival mode
                  </p>
                </div>
                <Switch
                  checked={localSettings.allowFlight || false}
                  onCheckedChange={(checked) => updateSetting('allowFlight', checked)}
                  disabled={!canManage}
                />
              </div>
            </CardContent>
          </Card>

          {/* World Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                World
              </CardTitle>
              <CardDescription>
                World and chunk settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="viewDistance">View Distance (chunks)</Label>
                <Input
                  id="viewDistance"
                  type="number"
                  min="2"
                  max="32"
                  value={localSettings.viewDistance || 10}
                  onChange={(e) => updateSetting('viewDistance', parseInt(e.target.value))}
                  disabled={!canManage}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="simulationDistance">Simulation Distance (chunks)</Label>
                <Input
                  id="simulationDistance"
                  type="number"
                  min="2"
                  max="32"
                  value={localSettings.simulationDistance || 10}
                  onChange={(e) => updateSetting('simulationDistance', parseInt(e.target.value))}
                  disabled={!canManage}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entityBroadcastRange">Entity Broadcast Range (%)</Label>
                <Input
                  id="entityBroadcastRange"
                  type="number"
                  min="10"
                  max="1000"
                  value={localSettings.entityBroadcastRange || 100}
                  onChange={(e) => updateSetting('entityBroadcastRange', parseInt(e.target.value))}
                  disabled={!canManage}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Autosave</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically save the world
                  </p>
                </div>
                <Switch
                  checked={localSettings.autosave ?? true}
                  onCheckedChange={(checked) => updateSetting('autosave', checked)}
                  disabled={!canManage}
                />
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Advanced
              </CardTitle>
              <CardDescription>
                Advanced server configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="heartbeatInterval">Heartbeat Interval (ms)</Label>
                <Input
                  id="heartbeatInterval"
                  type="number"
                  min="100"
                  max="60000"
                  value={localSettings.heartbeatInterval || 5000}
                  onChange={(e) => updateSetting('heartbeatInterval', parseInt(e.target.value))}
                  disabled={!canManage}
                />
                <p className="text-xs text-muted-foreground">
                  How often status updates are sent
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
