import { PERMISOS } from '@gestion-granjas/shared/permissions';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { MaestraSimpleAbm } from '@/modules/configuracion/components/maestra-simple-abm';

export default function PresentacionesPage() {
  return (
    <PermissionGuard permission={PERMISOS.INVENTARIO_VER}>
      <MaestraSimpleAbm
        backHref="/inventario"
        backLabel="Inventario"
        title="Presentaciones"
        description="Formatos comerciales o de manejo del alimento."
        apiPath="/presentaciones-alimento"
        queryKey="presentaciones-alimento"
        nombrePlaceholder="Ej. Saco 40 kg"
        emptyTitle="Aun no hay presentaciones"
      />
    </PermissionGuard>
  );
}
