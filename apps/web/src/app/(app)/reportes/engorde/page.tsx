import { PageHeader } from '@/components/layout/page-header';
import { HubSection } from '@/components/layout/hub-section';
import { ConfigNavCard } from '@/components/data-display/config-nav-card';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISOS } from '@gestion-granjas/shared/permissions';
import { reportesEngordeItems } from '@/modules/reportes/catalog';

export default function ReportesEngordePage() {
  return (
    <PermissionGuard permission={PERMISOS.REPORTES_ENGORDE_VER}>
      <div className="space-y-6 pb-8">
        <PageHeader
          backHref="/mas"
          backLabel="Mas"
          title="Reportes de engorde"
          description="Estado, crecimiento, mortalidad y conversion alimenticia basica."
        />

        <HubSection
          title="Consultas"
          description="Una pantalla por reporte. Usa la granja activa y un periodo acotado."
        >
          {reportesEngordeItems.map((item) => (
            <ConfigNavCard key={item.href} {...item} />
          ))}
        </HubSection>
      </div>
    </PermissionGuard>
  );
}
