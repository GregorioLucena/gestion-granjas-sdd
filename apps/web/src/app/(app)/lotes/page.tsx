import { Layers3 } from 'lucide-react';
import { ModulePlaceholder } from '@/components/layout/module-placeholder';

export default function LotesPage() {
  return (
    <ModulePlaceholder
      title="Lotes"
      description="Gestion de grupos productivos por granja: codigo, tipo de animal, finalidad, cantidad inicial, ubicacion y estado."
      specPath="docs/specs/003-gestion-lotes.md"
      icon={Layers3}
      nextSteps={[
        'Crear el ABM de lotes con cards moviles y filtros por estado.',
        'Validar codigo unico por granja, cantidad inicial mayor que cero y acceso del usuario a la granja.',
        'Preparar la ficha basica del lote para conectar luego movimientos, consumo y peso.',
      ]}
    />
  );
}
