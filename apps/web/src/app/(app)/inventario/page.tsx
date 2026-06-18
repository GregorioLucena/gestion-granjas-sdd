import { PageHeader } from '@/components/layout/page-header';
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
          <section
            key={group.title}
            className="space-y-3 rounded-3xl bg-white/55 p-3 ring-1 ring-primary/5"
          >
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
                {group.title}
              </h2>
              <p className="text-sm text-muted">{group.description}</p>
            </div>
            <div className="grid gap-3">
              {group.items.map((item) => (
                <ConfigNavCard key={item.href} {...item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </PermissionGuard>
  );
}
