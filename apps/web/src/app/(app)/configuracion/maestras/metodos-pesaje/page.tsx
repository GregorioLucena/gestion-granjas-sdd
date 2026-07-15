import { MaestraSimpleAbm } from '@/modules/configuracion/components/maestra-simple-abm';

export default function MetodosPesajePage() {
  return (
    <MaestraSimpleAbm
      backHref="/configuracion/maestras"
      backLabel="Catalogos"
      title="Metodos de pesaje"
      description="Como se obtiene el peso: bascula, estimacion visual u otros."
      apiPath="/metodos-pesaje"
      queryKey="metodos-pesaje"
      nombrePlaceholder="Ej. Estimacion visual"
      emptyTitle="Aun no hay metodos de pesaje"
    />
  );
}
