import { PageHeader } from '@/components/layout/page-header';
import { ConfigNavCard } from '@/components/data-display/config-nav-card';
import { maestrasCatalogGroups } from '@/modules/configuracion/catalog';

export default function MaestrasHubPage() {
  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        backHref="/configuracion"
        backLabel="Configuracion"
        title="Catalogos maestros"
        description="Cada catalogo tiene su propia pantalla para mantener el sistema ordenado."
      />

      {maestrasCatalogGroups.map((group) => (
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
  );
}
