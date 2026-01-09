import type {
  Player,
  Operator,
  Ban,
  IpBan,
  GameRule,
  ServerStatus,
  ServerSettings,
  ServerConfig,
  NotificationType,
} from '@/types'

type NotificationCallback = (type: NotificationType, data: unknown) => void

interface ConnectionState {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  config: ServerConfig | null
}

class MMSPClient {
  private ws: WebSocket | null = null
  private requestId = 0
  private pendingRequests = new Map<number, {
    resolve: (value: unknown) => void
    reject: (error: Error) => void
  }>()
  private notificationCallbacks: NotificationCallback[] = []
  private connectionState: ConnectionState = {
    isConnected: false,
    isConnecting: false,
    error: null,
    config: null,
  }
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private stateListeners: ((state: ConnectionState) => void)[] = []

  getConnectionState(): ConnectionState {
    return { ...this.connectionState }
  }

  onStateChange(callback: (state: ConnectionState) => void): () => void {
    this.stateListeners.push(callback)
    return () => {
      this.stateListeners = this.stateListeners.filter(cb => cb !== callback)
    }
  }

  private notifyStateChange() {
    this.stateListeners.forEach(cb => cb(this.getConnectionState()))
  }

  async connect(config: ServerConfig): Promise<void> {
    if (this.ws) {
      this.disconnect()
    }

    this.connectionState = {
      isConnected: false,
      isConnecting: true,
      error: null,
      config,
    }
    this.notifyStateChange()

    return new Promise((resolve, reject) => {
      const protocol = config.useTls ? 'wss' : 'ws'
      const url = `${protocol}://${config.host}:${config.port}`

      try {
        this.ws = new WebSocket(url, {
          // @ts-expect-error Node.js WebSocket options
          headers: {
            Authorization: `Bearer ${config.secret}`,
          },
        })

        this.ws.onopen = () => {
          this.connectionState = {
            isConnected: true,
            isConnecting: false,
            error: null,
            config,
          }
          this.notifyStateChange()
          resolve()
        }

        this.ws.onerror = () => {
          const error = new Error('WebSocket connection failed')
          this.connectionState = {
            isConnected: false,
            isConnecting: false,
            error: error.message,
            config,
          }
          this.notifyStateChange()
          reject(error)
        }

        this.ws.onclose = () => {
          this.connectionState = {
            ...this.connectionState,
            isConnected: false,
            isConnecting: false,
          }
          this.notifyStateChange()
          this.handleDisconnect()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        this.connectionState = {
          isConnected: false,
          isConnecting: false,
          error: errorMessage,
          config,
        }
        this.notifyStateChange()
        reject(error)
      }
    })
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.connectionState = {
      isConnected: false,
      isConnecting: false,
      error: null,
      config: null,
    }
    this.notifyStateChange()
  }

  private handleDisconnect(): void {
    // Attempt reconnection after 5 seconds
    if (this.connectionState.config) {
      this.reconnectTimeout = setTimeout(() => {
        if (this.connectionState.config) {
          this.connect(this.connectionState.config).catch(() => {
            // Reconnection failed, will retry on next timeout
          })
        }
      }, 5000)
    }
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data)

      // Handle notification
      if (message.method?.startsWith('notification:')) {
        const type = message.method.replace('notification:', '') as NotificationType
        this.notificationCallbacks.forEach(cb => cb(type, message.params))
        return
      }

      // Handle response
      if (message.id !== undefined) {
        const pending = this.pendingRequests.get(message.id)
        if (pending) {
          this.pendingRequests.delete(message.id)
          if (message.error) {
            pending.reject(new Error(message.error.message || 'Unknown error'))
          } else {
            pending.resolve(message.result)
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse MMSP message:', error)
    }
  }

  private async request<T>(method: string, params?: unknown[]): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to server')
    }

    const id = ++this.requestId
    const message = {
      jsonrpc: '2.0',
      method,
      id,
      params: params || [],
    }

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
      })

      this.ws!.send(JSON.stringify(message))

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id)
          reject(new Error('Request timed out'))
        }
      }, 30000)
    })
  }

  onNotification(callback: NotificationCallback): () => void {
    this.notificationCallbacks.push(callback)
    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback)
    }
  }

  // Player management
  async getPlayers(): Promise<Player[]> {
    return this.request<Player[]>('minecraft:players/list')
  }

  async kickPlayer(player: Player, reason?: string): Promise<void> {
    const params = reason
      ? [[{ id: player.id, name: player.name }], { text: reason }]
      : [[{ id: player.id, name: player.name }]]
    await this.request('minecraft:players/kick', params)
  }

  // Allowlist management
  async getAllowlist(): Promise<Player[]> {
    return this.request<Player[]>('minecraft:allowlist/list')
  }

  async addToAllowlist(players: { name: string }[]): Promise<Player[]> {
    return this.request<Player[]>('minecraft:allowlist/add', [players])
  }

  async removeFromAllowlist(players: { name: string }[]): Promise<void> {
    await this.request('minecraft:allowlist/remove', [players])
  }

  async setAllowlist(players: { name: string }[]): Promise<Player[]> {
    return this.request<Player[]>('minecraft:allowlist/set', [players])
  }

  async clearAllowlist(): Promise<void> {
    await this.request('minecraft:allowlist/clear')
  }

  // Ban management
  async getBans(): Promise<Ban[]> {
    return this.request<Ban[]>('minecraft:bans/list')
  }

  async addBan(player: { name: string }, reason?: string, expires?: string): Promise<Ban[]> {
    const banEntry: { name: string; reason?: string; expires?: string } = { name: player.name }
    if (reason) banEntry.reason = reason
    if (expires) banEntry.expires = expires
    return this.request<Ban[]>('minecraft:bans/add', [[banEntry]])
  }

  async removeBan(player: { name: string }): Promise<void> {
    await this.request('minecraft:bans/remove', [[{ name: player.name }]])
  }

  // IP Ban management
  async getIpBans(): Promise<IpBan[]> {
    return this.request<IpBan[]>('minecraft:ip_bans/list')
  }

  async addIpBan(ip: string, reason?: string, expires?: string): Promise<IpBan[]> {
    const banEntry: { ip: string; reason?: string; expires?: string } = { ip }
    if (reason) banEntry.reason = reason
    if (expires) banEntry.expires = expires
    return this.request<IpBan[]>('minecraft:ip_bans/add', [[banEntry]])
  }

  async removeIpBan(ip: string): Promise<void> {
    await this.request('minecraft:ip_bans/remove', [[{ ip }]])
  }

  // Operator management
  async getOperators(): Promise<Operator[]> {
    return this.request<Operator[]>('minecraft:operators/list')
  }

  async addOperator(
    player: { name: string },
    permissionLevel: number = 4,
    bypassesPlayerLimit: boolean = false
  ): Promise<Operator[]> {
    return this.request<Operator[]>('minecraft:operators/add', [[{
      name: player.name,
      permissionLevel,
      bypassesPlayerLimit,
    }]])
  }

  async removeOperator(player: { name: string }): Promise<void> {
    await this.request('minecraft:operators/remove', [[{ name: player.name }]])
  }

  // Server control
  async getServerStatus(): Promise<ServerStatus> {
    try {
      const status = await this.request<ServerStatus>('minecraft:server/status')
      return { ...status, isOnline: true }
    } catch {
      return { isOnline: false }
    }
  }

  async saveWorld(): Promise<void> {
    await this.request('minecraft:server/save')
  }

  async stopServer(): Promise<void> {
    await this.request('minecraft:server/stop')
  }

  async sendSystemMessage(message: string, targets?: Player[]): Promise<void> {
    const params: unknown[] = [{ text: message }]
    if (targets) {
      params.push(targets.map(p => ({ id: p.id, name: p.name })))
    }
    await this.request('minecraft:server/system_message', params)
  }

  // Server settings
  async getServerSettings(): Promise<ServerSettings> {
    return this.request<ServerSettings>('minecraft:serversettings/get')
  }

  async updateServerSettings(settings: Partial<ServerSettings>): Promise<ServerSettings> {
    return this.request<ServerSettings>('minecraft:serversettings/set', [settings])
  }

  // Game rules
  async getGameRules(): Promise<GameRule[]> {
    return this.request<GameRule[]>('minecraft:gamerules/list')
  }

  async updateGameRule(key: string, value: boolean | number | string): Promise<void> {
    await this.request('minecraft:gamerules/set', [key, value])
  }

  // Schema discovery
  async discoverSchema(): Promise<unknown> {
    return this.request('rpc.discover')
  }
}

// Singleton instance
export const mmspClient = new MMSPClient()
