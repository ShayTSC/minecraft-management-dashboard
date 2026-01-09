import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ServerConfig,
  Player,
  Operator,
  Ban,
  IpBan,
  GameRule,
  ServerStatus,
  ServerSettings,
  ActivityLogEntry,
  NotificationType,
} from '@/types'
import { mmspClient } from '@/services/mmsp'

interface ServerState {
  // Connection
  configs: ServerConfig[]
  activeConfigId: string | null
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null

  // Server data
  status: ServerStatus | null
  settings: ServerSettings | null
  players: Player[]
  allowlist: Player[]
  bans: Ban[]
  ipBans: IpBan[]
  operators: Operator[]
  gameRules: GameRule[]

  // Activity log
  activityLog: ActivityLogEntry[]

  // Loading states
  isLoading: {
    status: boolean
    settings: boolean
    players: boolean
    allowlist: boolean
    bans: boolean
    ipBans: boolean
    operators: boolean
    gameRules: boolean
  }

  // Actions
  addConfig: (config: Omit<ServerConfig, 'id' | 'createdAt' | 'updatedAt'>) => ServerConfig
  updateConfig: (id: string, config: Partial<ServerConfig>) => void
  deleteConfig: (id: string) => void
  setDefaultConfig: (id: string) => void

  connect: (configId: string) => Promise<void>
  disconnect: () => void

  fetchStatus: () => Promise<void>
  fetchSettings: () => Promise<void>
  fetchPlayers: () => Promise<void>
  fetchAllowlist: () => Promise<void>
  fetchBans: () => Promise<void>
  fetchIpBans: () => Promise<void>
  fetchOperators: () => Promise<void>
  fetchGameRules: () => Promise<void>
  fetchAll: () => Promise<void>

  addActivityLog: (type: NotificationType | 'manual', message: string, data?: unknown) => void
  clearActivityLog: () => void
}

const defaultConfig: ServerConfig = {
  id: 'default',
  name: 'Local Vanilla Server',
  host: 'localhost',
  port: 25585,
  secret: '',
  useTls: false,
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const useServerStore = create<ServerState>()(
  persist(
    (set, get) => ({
      // Initial state
      configs: [defaultConfig],
      activeConfigId: null,
      isConnected: false,
      isConnecting: false,
      connectionError: null,

      status: null,
      settings: null,
      players: [],
      allowlist: [],
      bans: [],
      ipBans: [],
      operators: [],
      gameRules: [],

      activityLog: [],

      isLoading: {
        status: false,
        settings: false,
        players: false,
        allowlist: false,
        bans: false,
        ipBans: false,
        operators: false,
        gameRules: false,
      },

      // Config actions
      addConfig: (configData) => {
        const config: ServerConfig = {
          ...configData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        set((state) => ({
          configs: [...state.configs, config],
        }))
        return config
      },

      updateConfig: (id, data) => {
        set((state) => ({
          configs: state.configs.map((c) =>
            c.id === id ? { ...c, ...data, updatedAt: new Date() } : c
          ),
        }))
      },

      deleteConfig: (id) => {
        set((state) => ({
          configs: state.configs.filter((c) => c.id !== id),
          activeConfigId: state.activeConfigId === id ? null : state.activeConfigId,
        }))
      },

      setDefaultConfig: (id) => {
        set((state) => ({
          configs: state.configs.map((c) => ({
            ...c,
            isDefault: c.id === id,
          })),
        }))
      },

      // Connection actions
      connect: async (configId) => {
        const config = get().configs.find((c) => c.id === configId)
        if (!config) {
          throw new Error('Configuration not found')
        }

        set({ isConnecting: true, connectionError: null })

        try {
          await mmspClient.connect(config)
          set({ isConnected: true, isConnecting: false, activeConfigId: configId })

          // Set up notification listener
          mmspClient.onNotification((type, data) => {
            const messages: Record<NotificationType, string> = {
              'players/joined': `Player joined the server`,
              'players/left': `Player left the server`,
              'operators/added': `Operator added`,
              'operators/removed': `Operator removed`,
              'allowlist/updated': `Allowlist updated`,
              'bans/updated': `Ban list updated`,
              'ip_bans/updated': `IP ban list updated`,
              'gamerules/updated': `Game rule updated`,
              'server/started': `Server started`,
              'server/stopping': `Server is stopping`,
              'server/saving': `Server is saving`,
              'server/saved': `Server saved`,
              'server/status': `Server status update`,
            }
            get().addActivityLog(type, messages[type] || `${type}`, data)

            // Refresh relevant data on notifications
            switch (type) {
              case 'players/joined':
              case 'players/left':
                get().fetchPlayers()
                get().fetchStatus()
                break
              case 'operators/added':
              case 'operators/removed':
                get().fetchOperators()
                break
              case 'allowlist/updated':
                get().fetchAllowlist()
                break
              case 'bans/updated':
                get().fetchBans()
                break
              case 'ip_bans/updated':
                get().fetchIpBans()
                break
              case 'gamerules/updated':
                get().fetchGameRules()
                break
              case 'server/status':
                get().fetchStatus()
                break
            }
          })

          // Fetch initial data
          await get().fetchAll()
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Connection failed'
          set({ isConnecting: false, connectionError: errorMessage })
          throw error
        }
      },

      disconnect: () => {
        mmspClient.disconnect()
        set({
          isConnected: false,
          activeConfigId: null,
          status: null,
          settings: null,
          players: [],
          allowlist: [],
          bans: [],
          ipBans: [],
          operators: [],
          gameRules: [],
        })
      },

      // Data fetching actions
      fetchStatus: async () => {
        set((state) => ({ isLoading: { ...state.isLoading, status: true } }))
        try {
          const status = await mmspClient.getServerStatus()
          set((state) => ({
            status,
            isLoading: { ...state.isLoading, status: false },
          }))
        } catch {
          set((state) => ({ isLoading: { ...state.isLoading, status: false } }))
        }
      },

      fetchSettings: async () => {
        set((state) => ({ isLoading: { ...state.isLoading, settings: true } }))
        try {
          const settings = await mmspClient.getServerSettings()
          set((state) => ({
            settings,
            isLoading: { ...state.isLoading, settings: false },
          }))
        } catch {
          set((state) => ({ isLoading: { ...state.isLoading, settings: false } }))
        }
      },

      fetchPlayers: async () => {
        set((state) => ({ isLoading: { ...state.isLoading, players: true } }))
        try {
          const players = await mmspClient.getPlayers()
          set((state) => ({
            players,
            isLoading: { ...state.isLoading, players: false },
          }))
        } catch {
          set((state) => ({ isLoading: { ...state.isLoading, players: false } }))
        }
      },

      fetchAllowlist: async () => {
        set((state) => ({ isLoading: { ...state.isLoading, allowlist: true } }))
        try {
          const allowlist = await mmspClient.getAllowlist()
          set((state) => ({
            allowlist,
            isLoading: { ...state.isLoading, allowlist: false },
          }))
        } catch {
          set((state) => ({ isLoading: { ...state.isLoading, allowlist: false } }))
        }
      },

      fetchBans: async () => {
        set((state) => ({ isLoading: { ...state.isLoading, bans: true } }))
        try {
          const bans = await mmspClient.getBans()
          set((state) => ({
            bans,
            isLoading: { ...state.isLoading, bans: false },
          }))
        } catch {
          set((state) => ({ isLoading: { ...state.isLoading, bans: false } }))
        }
      },

      fetchIpBans: async () => {
        set((state) => ({ isLoading: { ...state.isLoading, ipBans: true } }))
        try {
          const ipBans = await mmspClient.getIpBans()
          set((state) => ({
            ipBans,
            isLoading: { ...state.isLoading, ipBans: false },
          }))
        } catch {
          set((state) => ({ isLoading: { ...state.isLoading, ipBans: false } }))
        }
      },

      fetchOperators: async () => {
        set((state) => ({ isLoading: { ...state.isLoading, operators: true } }))
        try {
          const operators = await mmspClient.getOperators()
          set((state) => ({
            operators,
            isLoading: { ...state.isLoading, operators: false },
          }))
        } catch {
          set((state) => ({ isLoading: { ...state.isLoading, operators: false } }))
        }
      },

      fetchGameRules: async () => {
        set((state) => ({ isLoading: { ...state.isLoading, gameRules: true } }))
        try {
          const gameRules = await mmspClient.getGameRules()
          set((state) => ({
            gameRules,
            isLoading: { ...state.isLoading, gameRules: false },
          }))
        } catch {
          set((state) => ({ isLoading: { ...state.isLoading, gameRules: false } }))
        }
      },

      fetchAll: async () => {
        await Promise.all([
          get().fetchStatus(),
          get().fetchSettings(),
          get().fetchPlayers(),
          get().fetchAllowlist(),
          get().fetchBans(),
          get().fetchIpBans(),
          get().fetchOperators(),
          get().fetchGameRules(),
        ])
      },

      // Activity log actions
      addActivityLog: (type, message, data) => {
        const entry: ActivityLogEntry = {
          id: crypto.randomUUID(),
          type,
          message,
          timestamp: new Date(),
          data,
        }
        set((state) => ({
          activityLog: [entry, ...state.activityLog].slice(0, 100),
        }))
      },

      clearActivityLog: () => {
        set({ activityLog: [] })
      },
    }),
    {
      name: 'minecraft-server-storage',
      partialize: (state) => ({
        configs: state.configs,
      }),
    }
  )
)
