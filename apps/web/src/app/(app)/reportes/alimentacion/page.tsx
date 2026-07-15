import { PageHeader } from '@/components/layout/page-header';
import { HubSection } from '@/components/layout/hub-section';
import { ConfigNavCard } from '@/components/data-display/config-nav-card';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISOS } from '@gestion-granjas/shared/permissions';
import { reportesAlimentacionItems } from '@/modules/reportes/catalog';

export default function ReportesAlimentacionPage() {
  return (
    <PermissionGuard permission={PERMISOS.REPORTES_ALIMENTACION_VER}>
      <div className="space-y-6 pb-8">
        <PageHeader
          backHref="/mas"
          backLabel="Mas"
          title="Reportes de alimentacion"
          description="Consumos, existencias, movimientos y costos conocidos por granja."
        />

        <HubSection
          title="Consultas"
          description="Una pantalla por reporte. Usa la granja activa y un periodo acotado."
        >
          {reportesAlimentacionItems.map((item) => (
            <ConfigNavCard key={item.href} {...item} />
          ))}
        </HubSection>
      </div>
    </PermissionGuard>
  );
}
