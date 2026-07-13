import { PageHeader } from '@/components/layout/page-header';
import { HubSection } from '@/components/layout/hub-section';
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
        <HubSection key={group.title} title={group.title} description={group.description}>
          {group.items.map((item) => (
            <ConfigNavCard key={item.href} {...item} />
          ))}
        </HubSection>
      ))}
    </div>
  );
}
