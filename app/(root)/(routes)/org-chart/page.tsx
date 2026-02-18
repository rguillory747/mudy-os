'use client'

import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Users, Plus, Pencil, Trash2, Bot, ChevronDown, ChevronRight, Loader2, MessageSquare, Network, List } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { VisualOrgChart } from '@/components/org-chart/visual-org-chart'

interface OrgRole {
  id: string
  name: string
  description: string | null
  persona: string | null
  instructions: string | null
  parentId: string | null
  sortOrder: number
  isActive: boolean
  modelAssignment: {
    modelConfig: {
      modelId: string
      displayName: string
      provider: string
    }
  } | null
  children?: OrgRole[]
}

const OrgChartPage: React.FC = () => {
  const router = useRouter()
  const [roles, setRoles] = useState<OrgRole[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<OrgRole | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'list' | 'visual'>('visual')
  const [newRole, setNewRole] = useState<Omit<OrgRole, 'id' | 'sortOrder' | 'isActive' | 'children'>>({
    name: '',
    description: null,
    persona: null,
    instructions: null,
    parentId: null,
    modelAssignment: null
  })

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/org-roles')
      setRoles(response.data)
    } catch (error) {
      toast.error('Failed to load org chart')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  useEffect(() => {
    // Listen for edit events from visual chart
    const handleEditEvent = (e: any) => {
      handleEditRole(e.detail)
    }
    window.addEventListener('editRole', handleEditEvent)
    return () => window.removeEventListener('editRole', handleEditEvent)
  }, [])

  const buildTree = (flatRoles: OrgRole[]): OrgRole[] => {
    const roleMap = new Map<string, OrgRole>()
    const rootRoles: OrgRole[] = []

    // Initialize map with all roles
    flatRoles.forEach(role => {
      roleMap.set(role.id, { ...role, children: [] })
    })

    // Build tree structure
    flatRoles.forEach(role => {
      const roleNode = roleMap.get(role.id)!
      if (role.parentId === null) {
        rootRoles.push(roleNode)
      } else {
        const parent = roleMap.get(role.parentId)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(roleNode)
        }
      }
    })

    // Sort children by sortOrder
    const sortChildren = (role: OrgRole) => {
      if (role.children) {
        role.children.sort((a, b) => a.sortOrder - b.sortOrder)
        role.children.forEach(sortChildren)
      }
    }

    rootRoles.forEach(sortChildren)
    return rootRoles
  }

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleEditRole = (role: OrgRole) => {
    setSelectedRole(role)
    setShowEditor(true)
  }

  const handleDeleteRole = async (id: string) => {
    try {
      await axios.delete(`/api/org-roles/${id}`)
      toast.success('Role deleted successfully')
      fetchRoles()
    } catch (error) {
      toast.error('Failed to delete role')
      console.error(error)
    }
  }

  const handleSaveRole = async () => {
    if (!selectedRole) return

    try {
      await axios.put(`/api/org-roles/${selectedRole.id}`, selectedRole)
      toast.success('Role updated successfully')
      setShowEditor(false)
      fetchRoles()
    } catch (error) {
      toast.error('Failed to update role')
      console.error(error)
    }
  }

  const handleAddRole = async () => {
    try {
      await axios.post('/api/org-roles', newRole)
      toast.success('Role created successfully')
      setShowAddDialog(false)
      setNewRole({
        name: '',
        description: null,
        persona: null,
        instructions: null,
        parentId: null,
        modelAssignment: null
      })
      fetchRoles()
    } catch (error) {
      toast.error('Failed to create role')
      console.error(error)
    }
  }

  const RoleNode: React.FC<{ role: OrgRole; level: number }> = ({ role, level }) => {
    const hasChildren = role.children && role.children.length > 0
    const isExpanded = expandedNodes.has(role.id)

    return (
      <div className="mb-2">
        <div 
          className={cn(
            "flex items-center p-3 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors cursor-pointer",
            level > 0 && "ml-6"
          )}
          style={{ paddingLeft: `${level * 1.5 + 1}rem` }}
          onClick={() => handleEditRole(role)}
        >
          <div className="flex items-center flex-1 min-w-0">
            {hasChildren ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  toggleNode(role.id)
                }}
                className="mr-2 text-gray-400 hover:text-white"
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <div className="w-6 mr-2" />
            )}
            
            <Bot className="mr-3 text-blue-400 flex-shrink-0" size={20} />
            
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{role.name}</div>
              {role.modelAssignment && (
                <div className="text-xs text-gray-400 truncate">
                  {role.modelAssignment.modelConfig.displayName}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2 ml-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/roles/${role.id}/chat`)
              }}
              title="Chat with this agent"
            >
              <MessageSquare size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleEditRole(role)
              }}
            >
              <Pencil size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('Are you sure you want to delete this role?')) {
                  handleDeleteRole(role.id)
                }
              }}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {role.children?.map(child => (
              <RoleNode key={child.id} role={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const treeData = buildTree(roles)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Workforce Org Chart</h1>
          <p className="text-gray-400 mt-2">Manage your AI team hierarchy</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-800 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('visual')}
              className={cn(
                viewMode === 'visual' && 'bg-gray-700'
              )}
            >
              <Network className="mr-2" size={16} />
              Visual
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={cn(
                viewMode === 'list' && 'bg-gray-700'
              )}
            >
              <List className="mr-2" size={16} />
              List
            </Button>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2" size={16} />
            Add Role
          </Button>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-6">
        {treeData.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto text-gray-600 mb-4" size={48} />
            <h3 className="text-xl font-medium text-gray-300 mb-2">No roles yet</h3>
            <p className="text-gray-500 mb-4">Create your first AI role to get started</p>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2" size={16} />
              Add Role
            </Button>
          </div>
        ) : viewMode === 'visual' ? (
          <VisualOrgChart />
        ) : (
          <div>
            {treeData.map(role => (
              <RoleNode key={role.id} role={role} level={0} />
            ))}
          </div>
        )}
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Role</DialogTitle>
          </DialogHeader>
          
          {selectedRole && (
            <div className="space-y-6 py-4">
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">Role Name</label>
                <Input
                  value={selectedRole.name}
                  onChange={(e) => setSelectedRole({...selectedRole, name: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">Description</label>
                <Textarea
                  value={selectedRole.description || ''}
                  onChange={(e) => setSelectedRole({...selectedRole, description: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">Persona</label>
                <Textarea
                  value={selectedRole.persona || ''}
                  onChange={(e) => setSelectedRole({...selectedRole, persona: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  rows={4}
                  placeholder="Define the personality, tone, and behavior of this AI role..."
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">Parent Role</label>
                <Select
                  value={selectedRole.parentId || ''}
                  onValueChange={(value) => setSelectedRole({...selectedRole, parentId: value || null})}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select parent role" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="" className="text-gray-300">No parent (root role)</SelectItem>
                    {roles
                      .filter(role => role.id !== selectedRole.id)
                      .map(role => (
                        <SelectItem 
                          key={role.id} 
                          value={role.id}
                          className="text-gray-300"
                        >
                          {role.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedRole.modelAssignment && (
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">Model Assignment</label>
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <div className="font-medium text-white">
                      {selectedRole.modelAssignment.modelConfig.displayName}
                    </div>
                    <div className="text-sm text-gray-400">
                      {selectedRole.modelAssignment.modelConfig.provider}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button 
              variant="destructive" 
              onClick={() => {
                if (selectedRole && confirm('Are you sure you want to delete this role?')) {
                  handleDeleteRole(selectedRole.id)
                  setShowEditor(false)
                }
              }}
            >
              <Trash2 className="mr-2" size={16} />
              Delete
            </Button>
            <Button variant="outline" onClick={() => setShowEditor(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Role Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Role</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-2">Role Name</label>
              <Input
                value={newRole.name}
                onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="e.g., Customer Support Agent"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-2">Description</label>
              <Textarea
                value={newRole.description || ''}
                onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
                placeholder="Brief description of this role..."
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-2">Parent Role</label>
              <Select
                value={newRole.parentId || ''}
                onValueChange={(value) => setNewRole({...newRole, parentId: value || null})}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select parent role" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="" className="text-gray-300">No parent (root role)</SelectItem>
                  {roles.map(role => (
                    <SelectItem 
                      key={role.id} 
                      value={role.id}
                      className="text-gray-300"
                    >
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddRole}
              disabled={!newRole.name.trim()}
            >
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default OrgChartPage