import { createLazyFileRoute } from '@tanstack/react-router'
import { useServerStore } from '@/stores/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import {
  Link2,
  Plus,
  Trash2,
  Edit,
  Wifi,
  WifiOff,
  Server,
  Star,
  Check,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { useState } from 'react'
import type { ServerConfig } from '@/types'

export const Route = createLazyFileRoute('/_dashboard/connection')({
  component: ConnectionPage,
})

function ConnectionPage() {
  const {
    configs,
    activeConfigId,
    isConnected,
    isConnecting,
    connectionError,
    addConfig,
    updateConfig,
    deleteConfig,
    setDefaultConfig,
    connect,
    disconnect,
  } = useServerStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ServerConfig | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    host: 'localhost',
    port: 25585,
    secret: '',
    useTls: false,
  })

  const resetForm = () => {
    setFormData({
      name: '',
      host: 'localhost',
      port: 25585,
      secret: '',
      useTls: false,
    })
    setEditingConfig(null)
  }

  const openAddDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (config: ServerConfig) => {
    setEditingConfig(config)
    setFormData({
      name: config.name,
      host: config.host,
      port: config.port,
      secret: config.secret,
      useTls: config.useTls,
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.name.trim() || !formData.host.trim()) return

    if (editingConfig) {
      updateConfig(editingConfig.id, {
        name: formData.name,
        host: formData.host,
        port: formData.port,
        secret: formData.secret,
        useTls: formData.useTls,
      })
    } else {
      addConfig({
        name: formData.name,
        host: formData.host,
        port: formData.port,
        secret: formData.secret,
        useTls: formData.useTls,
        isDefault: configs.length === 0,
      })
    }

    setDialogOpen(false)
    resetForm()
  }

  const handleDelete = (id: string) => {
    if (configs.length === 1) {
      alert('You must have at least one server configuration.')
      return
    }
    if (!confirm('Are you sure you want to delete this configuration?')) return
    deleteConfig(id)
  }

  const handleConnect = async (configId: string) => {
    try {
      await connect(configId)
    } catch (error) {
      console.error('Connection failed:', error)
    }
  }

  const handleDisconnect = () => {
    disconnect()
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className={isConnected ? 'border-green-500/50' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-muted-foreground" />
            )}
            Connection Status
          </CardTitle>
          <CardDescription>
            {isConnected
              ? `Connected to ${configs.find(c => c.id === activeConfigId)?.name}`
              : 'Not connected to any server'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connectionError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>{connectionError}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-4">
            <Badge
              variant={isConnected ? 'success' : 'secondary'}
              className="gap-1"
            >
              {isConnected ? (
                <>
                  <Check className="h-3 w-3" />
                  Connected
                </>
              ) : isConnecting ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  Disconnected
                </>
              )}
            </Badge>

            {isConnected && (
              <Button variant="outline" onClick={handleDisconnect}>
                Disconnect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Server Configurations */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Server Configurations
              </CardTitle>
              <CardDescription>
                Manage your Minecraft server connections
              </CardDescription>
            </div>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Server
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Server className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-1">No configurations</h3>
              <p className="text-sm">Add a server configuration to get started.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Port</TableHead>
                    <TableHead>TLS</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => {
                    const isActive = config.id === activeConfigId && isConnected
                    return (
                      <TableRow key={config.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {config.isDefault && (
                              <Star className="h-4 w-4 text-yellow-500" />
                            )}
                            <span className="font-medium">{config.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm">{config.host}</code>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm">{config.port}</code>
                        </TableCell>
                        <TableCell>
                          {config.useTls ? (
                            <Badge variant="success">Enabled</Badge>
                          ) : (
                            <Badge variant="outline">Disabled</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {isActive ? (
                            <Badge variant="success" className="gap-1">
                              <Wifi className="h-3 w-3" />
                              Connected
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Idle</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!config.isDefault && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDefaultConfig(config.id)}
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(config)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(config.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            {isActive ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDisconnect}
                              >
                                Disconnect
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleConnect(config.id)}
                                disabled={isConnecting}
                              >
                                {isConnecting ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <Link2 className="h-4 w-4 mr-1" />
                                )}
                                Connect
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            How to configure your Minecraft server for MMSP
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>
            The Minecraft Server Management Protocol (MMSP) requires Minecraft Java Edition 1.21.9 or later.
            Add these settings to your <code>server.properties</code> file:
          </p>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
{`management-server-enabled=true
management-server-host=localhost
management-server-port=25585
management-server-secret=your-40-character-secret-token-here
management-server-tls-enabled=false`}
          </pre>
          <p>
            <strong>Note:</strong> For production servers, enable TLS and use a strong secret token.
            The secret must be a 40-character alphanumeric string.
          </p>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? 'Edit Server' : 'Add Server'}
            </DialogTitle>
            <DialogDescription>
              {editingConfig
                ? 'Update the server configuration'
                : 'Add a new Minecraft server connection'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="server-name">Name</Label>
              <Input
                id="server-name"
                placeholder="My Minecraft Server"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="server-host">Host</Label>
                <Input
                  id="server-host"
                  placeholder="localhost"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="server-port">Port</Label>
                <Input
                  id="server-port"
                  type="number"
                  placeholder="25585"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="server-secret">Secret Token</Label>
              <Input
                id="server-secret"
                type="password"
                placeholder="40-character secret from server.properties"
                value={formData.secret}
                onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Use TLS</Label>
                <p className="text-xs text-muted-foreground">
                  Enable secure WebSocket connection
                </p>
              </div>
              <Switch
                checked={formData.useTls}
                onCheckedChange={(checked) => setFormData({ ...formData, useTls: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.name.trim() || !formData.host.trim()}>
              {editingConfig ? 'Save Changes' : 'Add Server'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
