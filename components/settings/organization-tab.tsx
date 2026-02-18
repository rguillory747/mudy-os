'use client'

import { useState } from 'react'
import { Organization } from '@prisma/client'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface OrganizationTabProps {
  organization: Organization
}

export function OrganizationTab({ organization }: OrganizationTabProps) {
  const [name, setName] = useState(organization.name)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })

      if (!response.ok) {
        throw new Error('Failed to update organization')
      }

      toast.success('Organization updated successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update organization')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Organization Settings</h2>
        <p className="text-muted-foreground">
          Manage your organization details
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="org-name">Organization Name</Label>
          <Input
            id="org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Organization"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="org-slug">Slug</Label>
          <Input
            id="org-slug"
            value={organization.slug}
            disabled
            className="opacity-60"
          />
          <p className="text-xs text-muted-foreground">
            The slug cannot be changed after creation
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="org-id">Organization ID</Label>
          <Input
            id="org-id"
            value={organization.id}
            disabled
            className="opacity-60 font-mono text-xs"
          />
        </div>

        <div className="pt-4">
          <Button
            onClick={handleSave}
            disabled={saving || name === organization.name}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </div>
      </Card>

      <Card className="p-6 border-red-200 bg-red-50/50">
        <h3 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
        <p className="text-sm text-red-600/80 mb-4">
          Once you delete your organization, all data will be permanently removed. This action cannot be undone.
        </p>
        <Button variant="destructive" disabled>
          Delete Organization
        </Button>
      </Card>
    </div>
  )
}
