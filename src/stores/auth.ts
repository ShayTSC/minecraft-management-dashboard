import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Role, Permission } from '@/types'
import { rolePermissions } from '@/types'
import * as authService from '@/services/auth'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (email: string, password: string, displayName: string) => Promise<void>
  updateProfile: (data: { displayName?: string; email?: string }) => Promise<void>

  // Permission helpers
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  getPermissions: () => Permission[]

  // User management (admin only)
  users: User[]
  fetchUsers: () => void
  createUser: (data: { email: string; displayName: string; role: Role }) => User
  updateUser: (id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>) => User | undefined
  deleteUser: (id: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      users: [],

      login: async (email: string, _password: string) => {
        set({ isLoading: true })

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Find or create user
        let user = authService.getUserByEmail(email)
        if (!user) {
          // Create new user with default role
          user = authService.createUser({
            email,
            displayName: email.split('@')[0],
            role: 'viewer' as Role,
          })
        }

        set({ user, isAuthenticated: true, isLoading: false })
      },

      logout: () => {
        set({ user: null, isAuthenticated: false })
      },

      register: async (email: string, _password: string, displayName: string) => {
        set({ isLoading: true })

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Check if user exists
        const existing = authService.getUserByEmail(email)
        if (existing) {
          set({ isLoading: false })
          throw new Error('User already exists')
        }

        // Create new user
        const user = authService.createUser({
          email,
          displayName,
          role: 'viewer' as Role,
        })

        set({ user, isAuthenticated: true, isLoading: false })
      },

      updateProfile: async (data) => {
        set({ isLoading: true })

        await new Promise((resolve) => setTimeout(resolve, 500))

        const currentUser = get().user
        if (!currentUser) {
          set({ isLoading: false })
          throw new Error('Not authenticated')
        }

        const updated = authService.updateUser(currentUser.id, data)
        if (!updated) {
          set({ isLoading: false })
          throw new Error('Failed to update profile')
        }

        set({ user: updated, isLoading: false })
      },

      hasPermission: (permission: Permission) => {
        const user = get().user
        if (!user) return false
        const permissions = rolePermissions[user.role]
        return permissions?.includes(permission) ?? false
      },

      hasAnyPermission: (permissions: Permission[]) => {
        return permissions.some((p) => get().hasPermission(p))
      },

      hasAllPermissions: (permissions: Permission[]) => {
        return permissions.every((p) => get().hasPermission(p))
      },

      getPermissions: () => {
        const user = get().user
        if (!user) return []
        return rolePermissions[user.role] ?? []
      },

      fetchUsers: () => {
        const users = authService.getAllUsers()
        set({ users })
      },

      createUser: (data) => {
        const user = authService.createUser(data)
        get().fetchUsers()
        return user
      },

      updateUser: (id, data) => {
        const user = authService.updateUser(id, data)
        get().fetchUsers()
        return user
      },

      deleteUser: (id) => {
        const result = authService.deleteUser(id)
        get().fetchUsers()
        return result
      },
    }),
    {
      name: 'minecraft-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
