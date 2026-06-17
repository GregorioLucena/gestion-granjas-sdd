import { Wheat } from 'lucide-react';
import { ModulePlaceholder } from '@/components/layout/module-placeholder';

export default function ConsumoPage() {
  return (
    <ModulePlaceholder
      title="Consumo"
      description="Registro rapido de alimento consumido por lote, descontando inventario desde el almacen origen."
      specPath="docs/specs/007-consumo-alimento.md"
      icon={Wheat}
      nextSteps={[
        'Diseñar el flujo en pocos pasos: lote, alimento, cantidad, stock disponible y confirmacion.',
        'Crear el consumo y el movimiento de inventario en una transaccion.',
        'Permitir historial por lote y anulacion con motivo cuando corresponda.',
      ]}
    />
  );
}
