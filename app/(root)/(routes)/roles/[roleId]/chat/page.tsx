import { prismadb } from '@/lib/prismadb'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getCurrentOrg } from '@/lib/tenant'
import { ChatInterface } from '@/components/chat/chat-interface'

interface RoleChatPageProps {
  params: Promise<{
    roleId: string
  }>
}

export default async function RoleChatPage({ params }: RoleChatPageProps) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const { roleId } = await params
  const org = await getCurrentOrg()

  if (!org) {
    redirect('/')
  }

  const role = await prismadb.orgRole.findUnique({
    where: { id: roleId },
    include: {
      modelAssignment: {
        include: {
          modelConfig: true
        }
      }
    }
  })

  if (!role || role.orgId !== org.id) {
    redirect('/org-chart')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{role.name}</h1>
            {role.description && (
              <p className="text-sm text-muted-foreground">{role.description}</p>
            )}
          </div>
          {role.modelAssignment?.modelConfig && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Powered by</p>
              <p className="text-sm font-medium">{role.modelAssignment.modelConfig.displayName}</p>
            </div>
          )}
        </div>
      </div>

      <ChatInterface roleId={roleId} roleName={role.name} persona={role.persona || undefined} />
    </div>
  )
}
