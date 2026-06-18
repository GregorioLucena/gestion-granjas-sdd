import {
  Boxes,
  ClipboardList,
  Layers,
  Package,
  PackageOpen,
  Shapes,
  Truck,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';

export type InventarioNavItem = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accentClass: string;
};

export type InventarioNavGroup = {
  title: string;
  description: string;
  items: InventarioNavItem[];
};

export const inventarioGroups: InventarioNavGroup[] = [
  {
    title: 'Operacion',
    description: 'Consulta y movimientos de stock en la granja activa.',
    items: [
      {
        href: '/inventario/existencias',
        title: 'Existencias',
        description: 'Stock disponible por almacen y alimento.',
        icon: Boxes,
        accentClass: 'bg-success/10 text-success',
      },
      {
        href: '/inventario/movimientos',
        title: 'Movimientos',
        description: 'Entradas, salidas y ajustes de inventario.',
        icon: ClipboardList,
        accentClass: 'bg-primary/10 text-primary',
      },
    ],
  },
  {
    title: 'Catalogos',
    description: 'Maestras necesarias para operar inventario.',
    items: [
      {
        href: '/inventario/alimentos',
        title: 'Alimentos',
        description: 'Productos alimenticios con tipo, presentacion y unidad.',
        icon: Package,
        accentClass: 'bg-secondary/30 text-primary-dark',
      },
      {
        href: '/inventario/almacenes',
        title: 'Almacenes',
        description: 'Depositos de alimento por granja.',
        icon: Warehouse,
        accentClass: 'bg-info/10 text-info',
      },
      {
        href: '/inventario/proveedores',
        title: 'Proveedores',
        description: 'Contactos para entradas de compra.',
        icon: Truck,
        accentClass: 'bg-accent/10 text-accent',
      },
      {
        href: '/inventario/tipos-alimento',
        title: 'Tipos de alimento',
        description: 'Categorias como iniciador, gestacion o engorde.',
        icon: Layers,
        accentClass: 'bg-warning/15 text-warning',
      },
      {
        href: '/inventario/presentaciones',
        title: 'Presentaciones',
        description: 'Saco, granel, litro y otros formatos.',
        icon: Shapes,
        accentClass: 'bg-primary/10 text-primary',
      },
    ],
  },
];

export const inventarioHubIcon = PackageOpen;
