// User roles for RBAC
export enum Role {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
}

// Permission types
export enum Permission {
  // Server permissions
  SERVER_VIEW = 'server:view',
  SERVER_CONTROL = 'server:control',
  SERVER_SETTINGS = 'server:settings',
  SERVER_STOP = 'server:stop',

  // Player permissions
  PLAYERS_VIEW = 'players:view',
  PLAYERS_KICK = 'players:kick',
  PLAYERS_MESSAGE = 'players:message',

  // Allowlist permissions
  ALLOWLIST_VIEW = 'allowlist:view',
  ALLOWLIST_MANAGE = 'allowlist:manage',

  // Ban permissions
  BANS_VIEW = 'bans:view',
  BANS_MANAGE = 'bans:manage',

  // IP Ban permissions
  IP_BANS_VIEW = 'ip_bans:view',
  IP_BANS_MANAGE = 'ip_bans:manage',

  // Operator permissions
  OPERATORS_VIEW = 'operators:view',
  OPERATORS_MANAGE = 'operators:manage',

  // Game rules permissions
  GAMERULES_VIEW = 'gamerules:view',
  GAMERULES_MANAGE = 'gamerules:manage',

  // User management permissions
  USERS_VIEW = 'users:view',
  USERS_MANAGE = 'users:manage',
}

// Role to permissions mapping
export const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: Object.values(Permission),
  [Role.MODERATOR]: [
    Permission.SERVER_VIEW,
    Permission.SERVER_CONTROL,
    Permission.SERVER_SETTINGS,
    Permission.PLAYERS_VIEW,
    Permission.PLAYERS_KICK,
    Permission.PLAYERS_MESSAGE,
    Permission.ALLOWLIST_VIEW,
    Permission.ALLOWLIST_MANAGE,
    Permission.BANS_VIEW,
    Permission.BANS_MANAGE,
    Permission.IP_BANS_VIEW,
    Permission.IP_BANS_MANAGE,
    Permission.OPERATORS_VIEW,
    Permission.GAMERULES_VIEW,
    Permission.GAMERULES_MANAGE,
  ],
  [Role.OPERATOR]: [
    Permission.SERVER_VIEW,
    Permission.PLAYERS_VIEW,
    Permission.PLAYERS_KICK,
    Permission.PLAYERS_MESSAGE,
    Permission.ALLOWLIST_VIEW,
    Permission.BANS_VIEW,
    Permission.GAMERULES_VIEW,
  ],
  [Role.VIEWER]: [
    Permission.SERVER_VIEW,
    Permission.PLAYERS_VIEW,
    Permission.ALLOWLIST_VIEW,
    Permission.BANS_VIEW,
    Permission.IP_BANS_VIEW,
    Permission.OPERATORS_VIEW,
    Permission.GAMERULES_VIEW,
  ],
}

// User type
export interface User {
  id: string
  email: string
  displayName: string
  role: Role
  createdAt: Date
  updatedAt: Date
}

// Server connection configuration
export interface ServerConfig {
  id: string
  name: string
  host: string
  port: number
  secret: string
  useTls: boolean
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

// Minecraft player
export interface Player {
  id: string
  name: string
}

// Minecraft operator
export interface Operator {
  player: Player
  permissionLevel: number
  bypassesPlayerLimit: boolean
}

// Ban entry
export interface Ban {
  player: Player
  reason?: string
  expires?: string
  source?: string
}

// IP Ban entry
export interface IpBan {
  ip: string
  reason?: string
  expires?: string
  source?: string
}

// Game rule
export interface GameRule {
  key: string
  value: boolean | number | string
  type: 'boolean' | 'integer'
}

// Server status
export interface ServerStatus {
  version?: string
  motd?: string
  maxPlayers?: number
  onlinePlayers?: number
  players?: Player[]
  isOnline: boolean
}

// Server settings
export interface ServerSettings {
  autosave?: boolean
  difficulty?: string
  enforceAllowlist?: boolean
  maxPlayers?: number
  playerIdleTimeout?: number
  allowFlight?: boolean
  motd?: string
  defaultGameMode?: string
  viewDistance?: number
  simulationDistance?: number
  heartbeatInterval?: number
  entityBroadcastRange?: number
}

// Notification types
export type NotificationType =
  | 'players/joined'
  | 'players/left'
  | 'operators/added'
  | 'operators/removed'
  | 'allowlist/updated'
  | 'bans/updated'
  | 'ip_bans/updated'
  | 'gamerules/updated'
  | 'server/started'
  | 'server/stopping'
  | 'server/saving'
  | 'server/saved'
  | 'server/status'

// Activity log entry
export interface ActivityLogEntry {
  id: string
  type: NotificationType | 'manual'
  message: string
  timestamp: Date
  data?: unknown
}
