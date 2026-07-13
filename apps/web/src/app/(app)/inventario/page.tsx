import { PageHeader } from '@/components/layout/page-header';
import { HubSection } from '@/components/layout/hub-section';
import { ConfigNavCard } from '@/components/data-display/config-nav-card';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISOS } from '@gestion-granjas/shared/permissions';
import { inventarioGroups } from '@/modules/inventario/catalog';

export default function InventarioPage() {
  return (
    <PermissionGuard permission={PERMISOS.INVENTARIO_VER}>
      <div className="space-y-6 pb-8">
        <PageHeader
          backHref="/dashboard"
          backLabel="Inicio"
          title="Inventario"
          description="Control de alimentos, almacenes, movimientos y existencias por granja."
        />

        {inventarioGroups.map((group) => (
          <HubSection key={group.title} title={group.title} description={group.description}>
            {group.items.map((item) => (
              <ConfigNavCard key={item.href} {...item} />
            ))}
          </HubSection>
        ))}
      </div>
    </PermissionGuard>
  );
}
