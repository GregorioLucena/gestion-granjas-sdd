import { MaestraSimpleAbm } from '@/modules/configuracion/components/maestra-simple-abm';

export default function MotivosMovimientoUbicacionPage() {
  return (
    <MaestraSimpleAbm
      backHref="/configuracion/maestras"
      backLabel="Catalogos"
      title="Motivos de movimiento de ubicacion"
      description="Causas para mover un lote dentro de la granja."
      apiPath="/motivos-movimiento-ubicacion"
      queryKey="motivos-movimiento-ubicacion"
      nombrePlaceholder="Ej. Limpieza"
      emptyTitle="Aun no hay motivos de movimiento"
    />
  );
}
