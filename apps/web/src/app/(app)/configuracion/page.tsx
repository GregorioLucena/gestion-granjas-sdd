import { PageHeader } from '@/components/layout/page-header';
import { ConfigNavCard } from '@/components/data-display/config-nav-card';
import { configuracionGroups } from '@/modules/configuracion/catalog';

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        backHref="/mas"
        backLabel="Mas"
        title="Configuracion"
        description="Administra la estructura base del sistema, catalogo por catalogo."
      />

      {configuracionGroups.map((group) => (
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
