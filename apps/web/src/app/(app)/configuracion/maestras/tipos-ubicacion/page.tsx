import { MaestraSimpleAbm } from '@/modules/configuracion/components/maestra-simple-abm';

export default function TiposUbicacionPage() {
  return (
    <MaestraSimpleAbm
      backHref="/configuracion/maestras"
      backLabel="Catalogos"
      title="Tipos de ubicacion"
      description="Clasificacion de espacios: galpon, corral, sala, deposito..."
      apiPath="/tipos-ubicacion"
      queryKey="tipos-ubicacion"
      nombrePlaceholder="Ej. Galpon"
      emptyTitle="Aun no hay tipos de ubicacion"
    />
  );
}
