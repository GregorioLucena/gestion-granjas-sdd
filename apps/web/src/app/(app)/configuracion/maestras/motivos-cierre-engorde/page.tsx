import { MaestraSimpleAbm } from '@/modules/configuracion/components/maestra-simple-abm';

export default function MotivosCierreEngordePage() {
  return (
    <MaestraSimpleAbm
      backHref="/configuracion/maestras"
      backLabel="Catalogos"
      title="Motivos de cierre de engorde"
      description="Causas de cierre del ciclo: venta, sacrificio, fin de ciclo..."
      apiPath="/motivos-cierre-engorde"
      queryKey="motivos-cierre-engorde"
      nombrePlaceholder="Ej. Venta"
      emptyTitle="Aun no hay motivos de cierre"
    />
  );
}
