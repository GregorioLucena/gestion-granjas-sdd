import { PackageOpen } from 'lucide-react';
import { ModulePlaceholder } from '@/components/layout/module-placeholder';

export default function InventarioPage() {
  return (
    <ModulePlaceholder
      title="Inventario"
      description="Control de alimentos, proveedores, almacenes, movimientos y existencias disponibles por granja."
      specPath="docs/specs/005-inventario-alimentos.md"
      icon={PackageOpen}
      nextSteps={[
        'Completar maestras necesarias: alimentos, unidades, presentaciones, proveedores y almacenes.',
        'Implementar movimientos de entrada, salida y ajuste con costo manual cuando aplique.',
        'Bloquear inventario negativo y mostrar bajo stock como estado visual prioritario.',
      ]}
    />
  );
}
