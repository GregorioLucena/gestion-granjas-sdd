import { PERMISOS } from '@gestion-granjas/shared/permissions';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { MaestraSimpleAbm } from '@/modules/configuracion/components/maestra-simple-abm';

export default function TiposAlimentoPage() {
  return (
    <PermissionGuard permission={PERMISOS.INVENTARIO_VER}>
      <MaestraSimpleAbm
        backHref="/inventario"
        backLabel="Inventario"
        title="Tipos de alimento"
        description="Categorias reutilizables para clasificar alimentos."
        apiPath="/tipos-alimento"
        queryKey="tipos-alimento"
        nombrePlaceholder="Ej. Engorde"
        emptyTitle="Aun no hay tipos de alimento"
      />
    </PermissionGuard>
  );
}
