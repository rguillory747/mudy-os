import { auth } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';
import { Organization } from '@prisma/client';

export async function getCurrentOrg(): Promise<Organization | null> {
  const { orgId, orgSlug } = await auth();
  
  if (!orgId) {
    return null;
  }

  let org = await prismadb.organization.findUnique({
    where: { clerkOrgId: orgId }
  });

  if (!org) {
    org = await prismadb.organization.create({
      data: {
        clerkOrgId: orgId,
        slug: orgSlug || orgId,
        name: orgSlug || 'My Organization'
      }
    });
  }

  return org;
}

export async function requireOrg(): Promise<Organization> {
  const org = await getCurrentOrg();
  
  if (!org) {
    throw new Error('Organization required');
  }
  
  return org;
}

export async function requireOrgAdmin(): Promise<Organization> {
  const { orgRole } = await auth();
  const org = await requireOrg();
  
  if (orgRole !== 'org:admin') {
    throw new Error('Admin access required');
  }
  
  return org;
}