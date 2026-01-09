import { createLazyFileRoute } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth'
import { Permission, Role, rolePermissions } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import {
  UserCog,
  Plus,
  Trash2,
  Edit,
  Shield,
  AlertTriangle,
  Search,
  Users,
  Crown,
  Eye,
  Settings,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import type { User } from '@/types'
import { formatDate } from '@/lib/utils'

export const Route = createLazyFileRoute('/_dashboard/users')({
  component: UsersPage,
})

function UsersPage() {
  const {
    user: currentUser,
    hasPermission,
    users,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  } = useAuthStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    role: Role.VIEWER,
  })

  const canManage = hasPermission(Permission.USERS_MANAGE)

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const resetForm = () => {
    setFormData({
      email: '',
      displayName: '',
      role: Role.VIEWER,
    })
    setEditingUser(null)
  }

  const openAddDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.email.trim() || !formData.displayName.trim()) return

    if (editingUser) {
      updateUser(editingUser.id, {
        displayName: formData.displayName,
        role: formData.role,
      })
    } else {
      createUser({
        email: formData.email,
        displayName: formData.displayName,
        role: formData.role,
      })
    }

    setDialogOpen(false)
    resetForm()
  }

  const handleDelete = (id: string) => {
    if (id === currentUser?.id) {
      alert("You can't delete your own account.")
      return
    }
    if (!confirm('Are you sure you want to delete this user?')) return
    deleteUser(id)
  }

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return <Crown className="h-4 w-4 text-yellow-500" />
      case Role.MODERATOR:
        return <Shield className="h-4 w-4 text-blue-500" />
      case Role.OPERATOR:
        return <Settings className="h-4 w-4 text-green-500" />
      case Role.VIEWER:
        return <Eye className="h-4 w-4 text-muted-foreground" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleBadgeVariant = (role: Role): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
    switch (role) {
      case Role.ADMIN:
        return 'default'
      case Role.MODERATOR:
        return 'secondary'
      case Role.OPERATOR:
        return 'success'
      case Role.VIEWER:
        return 'outline'
      default:
        return 'secondary'
    }
  }

  if (!hasPermission(Permission.USERS_VIEW)) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You do not have permission to view user management.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Roles Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Permissions
          </CardTitle>
          <CardDescription>
            Overview of permissions for each role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.values(Role).map((role) => (
              <div key={role} className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  {getRoleIcon(role)}
                  <h3 className="font-semibold capitalize">{role}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {rolePermissions[role].length} permissions
                </p>
                <div className="text-xs text-muted-foreground">
                  {role === Role.ADMIN && 'Full access to all features'}
                  {role === Role.MODERATOR && 'Manage players, bans, and settings'}
                  {role === Role.OPERATOR && 'Kick players and view data'}
                  {role === Role.VIEWER && 'View-only access'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage dashboard users and their roles
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              {canManage && (
                <Button onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-1">
                {users.length === 0 ? 'No users found' : 'No matching users'}
              </h3>
              <p className="text-sm">
                {users.length === 0
                  ? 'Add users to grant them access to the dashboard.'
                  : 'Try adjusting your search query.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-medium">
                            {user.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium">{user.displayName}</span>
                            {user.id === currentUser?.id && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                You
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{user.email}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)} className="gap-1">
                          {getRoleIcon(user.role)}
                          <span className="capitalize">{user.role}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">
                          {formatDate(user.createdAt)}
                        </span>
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {user.id !== currentUser?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(user.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Add User'}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Update user information and role'
                : 'Add a new user to the dashboard'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Display Name</Label>
              <Input
                id="user-name"
                placeholder="John Doe"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!editingUser}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as Role })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Role.VIEWER}>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Viewer - View-only access
                    </div>
                  </SelectItem>
                  <SelectItem value={Role.OPERATOR}>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Operator - Basic management
                    </div>
                  </SelectItem>
                  <SelectItem value={Role.MODERATOR}>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Moderator - Advanced management
                    </div>
                  </SelectItem>
                  <SelectItem value={Role.ADMIN}>
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Admin - Full access
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.email.trim() || !formData.displayName.trim()}
            >
              {editingUser ? 'Save Changes' : 'Add User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
