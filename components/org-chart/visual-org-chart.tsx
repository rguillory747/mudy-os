'use client'

import { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { RoleNode } from './role-node'
import axios from 'axios'
import { toast } from 'sonner'

interface OrgRole {
  id: string
  name: string
  description: string | null
  persona: string | null
  parentId: string | null
  modelAssignment: {
    modelConfig: {
      modelId: string
      displayName: string
      provider: string
    }
  } | null
}

const nodeTypes = {
  roleNode: RoleNode,
}

export function VisualOrgChart() {
  const [roles, setRoles] = useState<OrgRole[]>([])
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/org-roles')
      setRoles(response.data)
      buildFlowData(response.data)
    } catch (error) {
      toast.error('Failed to load org chart')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const buildFlowData = (rolesList: OrgRole[]) => {
    // Calculate positions using hierarchical layout
    const levelMap = new Map<string, number>()
    const childrenMap = new Map<string, string[]>()

    // Build parent-child relationships
    rolesList.forEach(role => {
      if (role.parentId) {
        const children = childrenMap.get(role.parentId) || []
        children.push(role.id)
        childrenMap.set(role.parentId, children)
      }
    })

    // Calculate levels (depth)
    const calculateLevel = (roleId: string, visited = new Set<string>()): number => {
      if (visited.has(roleId)) return 0
      visited.add(roleId)

      const role = rolesList.find(r => r.id === roleId)
      if (!role || !role.parentId) return 0
      return 1 + calculateLevel(role.parentId, visited)
    }

    rolesList.forEach(role => {
      levelMap.set(role.id, calculateLevel(role.id))
    })

    // Group by level
    const levels: string[][] = []
    rolesList.forEach(role => {
      const level = levelMap.get(role.id) || 0
      if (!levels[level]) levels[level] = []
      levels[level].push(role.id)
    })

    // Calculate positions
    const newNodes: Node[] = []
    const horizontalSpacing = 300
    const verticalSpacing = 150

    levels.forEach((levelRoles, levelIndex) => {
      const levelWidth = levelRoles.length * horizontalSpacing
      const startX = -levelWidth / 2

      levelRoles.forEach((roleId, index) => {
        const role = rolesList.find(r => r.id === roleId)!
        const x = startX + index * horizontalSpacing + horizontalSpacing / 2
        const y = levelIndex * verticalSpacing

        newNodes.push({
          id: role.id,
          type: 'roleNode',
          position: { x, y },
          data: {
            role,
            onEdit: () => handleEditRole(role),
            onDelete: () => handleDeleteRole(role.id),
            onChat: () => handleChatRole(role.id),
          },
        })
      })
    })

    // Create edges
    const newEdges: Edge[] = rolesList
      .filter(role => role.parentId)
      .map(role => ({
        id: `${role.parentId}-${role.id}`,
        source: role.parentId!,
        target: role.id,
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        style: { stroke: '#888', strokeWidth: 2 },
      }))

    setNodes(newNodes)
    setEdges(newEdges)
  }

  const handleEditRole = (role: OrgRole) => {
    // Trigger edit dialog from parent
    window.dispatchEvent(new CustomEvent('editRole', { detail: role }))
  }

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return

    try {
      await axios.delete(`/api/org-roles/${roleId}`)
      toast.success('Role deleted successfully')
      fetchRoles()
    } catch (error) {
      toast.error('Failed to delete role')
      console.error(error)
    }
  }

  const handleChatRole = (roleId: string) => {
    window.location.href = `/roles/${roleId}/chat`
  }

  const onConnect = useCallback(
    (params: Connection) => {
      // Update parent-child relationship when connection is made
      if (params.source && params.target) {
        updateRoleParent(params.target, params.source)
      }
      setEdges((eds) => addEdge(params, eds))
    },
    [setEdges]
  )

  const updateRoleParent = async (roleId: string, newParentId: string) => {
    try {
      await axios.put(`/api/org-roles/${roleId}`, { parentId: newParentId })
      toast.success('Role hierarchy updated')
    } catch (error) {
      toast.error('Failed to update hierarchy')
      fetchRoles()
    }
  }

  if (loading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center">
        <div className="text-muted-foreground">Loading org chart...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-[600px] border rounded-lg overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  )
}
