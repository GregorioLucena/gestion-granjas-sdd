import { MaestraSimpleAbm } from '@/modules/configuracion/components/maestra-simple-abm';

export default function FinalidadesPage() {
  return (
    <MaestraSimpleAbm
      backHref="/configuracion/maestras"
      backLabel="Catalogos"
      title="Finalidades productivas"
      description="Proposito de animales o lotes: engorde, reproduccion, cria..."
      apiPath="/finalidades-productivas"
      queryKey="finalidades-productivas"
      nombrePlaceholder="Ej. Engorde"
      emptyTitle="Aun no hay finalidades"
    />
  );
}
