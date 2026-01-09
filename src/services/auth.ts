import type { User, Role, Permission } from '@/types'
import { rolePermissions } from '@/types'

// Mock user storage (in production, this would be persisted)
let users: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    displayName: 'Admin',
    role: 'admin' as Role,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// Get user by ID
export function getUserById(id: string): User | undefined {
  return users.find(u => u.id === id)
}

// Get user by email
export function getUserByEmail(email: string): User | undefined {
  return users.find(u => u.email === email)
}

// Get all users
export function getAllUsers(): User[] {
  return [...users]
}

// Create user
export function createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
  const user: User = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  users.push(user)
  return user
}

// Update user
export function updateUser(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): User | undefined {
  const index = users.findIndex(u => u.id === id)
  if (index === -1) return undefined

  users[index] = {
    ...users[index],
    ...data,
    updatedAt: new Date(),
  }
  return users[index]
}

// Delete user
export function deleteUser(id: string): boolean {
  const index = users.findIndex(u => u.id === id)
  if (index === -1) return false
  users.splice(index, 1)
  return true
}

// Check if user has permission
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false
  const permissions = rolePermissions[user.role]
  return permissions?.includes(permission) ?? false
}

// Check if user has any of the permissions
export function hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(user, p))
}

// Check if user has all of the permissions
export function hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(user, p))
}

// Get user's permissions
export function getUserPermissions(user: User | null): Permission[] {
  if (!user) return []
  return rolePermissions[user.role] ?? []
}
