'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hasPermission } from '@gestion-granjas/shared/permissions';
import { useAuth } from '@/lib/auth-context';
import { tenantContextFromUser } from '@/lib/tenant-context';

type PermissionGuardProps = {
  permission: string | string[];
  children: React.ReactNode;
  fallbackHref?: string;
};

export function PermissionGuard({
  permission,
  children,
  fallbackHref = '/dashboard',
}: PermissionGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const permissions = Array.isArray(permission) ? permission : [permission];
  const allowed =
    user !== null &&
    permissions.some((codigo) => hasPermission(tenantContextFromUser(user), codigo));

  useEffect(() => {
    if (!isLoading && user && !allowed) {
      router.replace(fallbackHref);
    }
  }, [isLoading, user, allowed, router, fallbackHref]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6 text-sm text-muted">
        Cargando...
      </div>
    );
  }

  if (!user || !allowed) {
    return null;
  }

  return children;
}
