import {
  ChartPie,
  Layers3,
  Package,
  Scale,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';

export type ReporteNavItem = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accentClass: string;
};

export const reportesAlimentacionItems: ReporteNavItem[] = [
  {
    href: '/reportes/alimentacion/consumo-lotes',
    title: 'Consumo por lote',
    description: 'Cantidades y costo conocido por lote y alimento.',
    icon: Layers3,
    accentClass: 'bg-primary/10 text-primary',
  },
  {
    href: '/reportes/alimentacion/consumo-alimentos',
    title: 'Consumo por alimento',
    description: 'Agregado por alimento, lotes y cobertura de costo.',
    icon: Package,
    accentClass: 'bg-secondary/30 text-primary-dark',
  },
  {
    href: '/reportes/alimentacion/existencias',
    title: 'Existencias',
    description: 'Stock actual por almacen y alimento.',
    icon: Warehouse,
    accentClass: 'bg-success/10 text-success',
  },
  {
    href: '/reportes/alimentacion/movimientos',
    title: 'Movimientos',
    description: 'Detalle de entradas, salidas y ajustes del periodo.',
    icon: Scale,
    accentClass: 'bg-warning/15 text-warning',
  },
  {
    href: '/reportes/alimentacion/resumen',
    title: 'Resumen de movimientos',
    description: 'Totales por tipo de movimiento en el periodo.',
    icon: ChartPie,
    accentClass: 'bg-info/10 text-info',
  },
];
