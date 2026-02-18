'use client'

import { OrganizationSwitcher } from '@clerk/nextjs'

export default function OrgSwitcher() {
  return (
    <OrganizationSwitcher
      hidePersonal={false}
      afterCreateOrganizationUrl='/onboarding'
      afterSelectOrganizationUrl='/'
      appearance={{
        elements: {
          rootBox: 'flex items-center',
          organizationSwitcherTrigger: 'py-1 px-2 rounded-md'
        }
      }}
    />
  )
}