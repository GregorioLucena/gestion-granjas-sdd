'use client';

import { PageHeader } from '@/components/layout/page-header';
import { ConfigNavCard } from '@/components/data-display/config-nav-card';
import { EmptyState } from '@/components/data-display/empty-state';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { useAuth } from '@/lib/auth-context';
import { tenantContextFromUser } from '@/lib/tenant-context';
import { hasPermission } from '@gestion-granjas/shared/permissions';
import { SEGURIDAD_ACCESS_PERMISSIONS, seguridadGroups } from '@/modules/seguridad/catalog';

export default function SeguridadPage() {
  const { user } = useAuth();

  const visibleGroups = seguridadGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        user ? hasPermission(tenantContextFromUser(user), item.permission) : false,
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <PermissionGuard permission={[...SEGURIDAD_ACCESS_PERMISSIONS]}>
      <div className="space-y-6 pb-8">
        <PageHeader
          backHref="/mas"
          backLabel="Mas"
          title="Seguridad"
          description="Administra usuarios, perfiles y permisos del sistema."
        />

        {visibleGroups.length === 0 ? (
          <EmptyState
            title="Sin modulos de seguridad"
            description="Tu perfil no incluye permisos para administrar usuarios o perfiles."
          />
        ) : (
          visibleGroups.map((group) => (
            <section key={group.title} className="space-y-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">{group.title}</h2>
                <p className="text-sm text-muted">{group.description}</p>
              </div>
              <div className="grid gap-3">
                {group.items.map((item) => (
                  <ConfigNavCard key={item.href} {...item} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </PermissionGuard>
  );
}
