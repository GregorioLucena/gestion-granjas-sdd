import {
  BookOpen,
  Building2,
  Factory,
  MapPin,
  PawPrint,
  Shapes,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react';

export type ConfigNavItem = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accentClass: string;
};

export type ConfigNavGroup = {
  title: string;
  description: string;
  items: ConfigNavItem[];
};

export const configuracionGroups: ConfigNavGroup[] = [
  {
    title: 'Organizacion',
    description: 'Estructura de companias y granjas.',
    items: [
      {
        href: '/configuracion/companias',
        title: 'Companias',
        description: 'Organizaciones que administran granjas.',
        icon: Building2,
        accentClass: 'bg-primary/10 text-primary',
      },
      {
        href: '/configuracion/granjas',
        title: 'Granjas',
        description: 'Unidades productivas por compania.',
        icon: Factory,
        accentClass: 'bg-info/10 text-info',
      },
    ],
  },
  {
    title: 'Catalogos',
    description: 'Maestras reutilizables, una pantalla por catalogo.',
    items: [
      {
        href: '/configuracion/maestras',
        title: 'Catalogos maestros',
        description: 'Tipos de animal, razas, ubicaciones y mas.',
        icon: BookOpen,
        accentClass: 'bg-secondary/30 text-primary-dark',
      },
    ],
  },
];

export const maestrasCatalogGroups: ConfigNavGroup[] = [
  {
    title: 'Catalogos productivos',
    description: 'Opciones reutilizables para animales y lotes.',
    items: [
      {
        href: '/configuracion/maestras/tipos-animal',
        title: 'Tipos de animal',
        description: 'Especies o categorias productivas.',
        icon: PawPrint,
        accentClass: 'bg-secondary/30 text-primary-dark',
      },
      {
        href: '/configuracion/maestras/razas',
        title: 'Razas',
        description: 'Clasificacion por tipo de animal.',
        icon: Sparkles,
        accentClass: 'bg-accent/10 text-accent',
      },
      {
        href: '/configuracion/maestras/finalidades',
        title: 'Finalidades productivas',
        description: 'Engorde, reproduccion, cria y mas.',
        icon: Target,
        accentClass: 'bg-success/10 text-success',
      },
    ],
  },
  {
    title: 'Espacios internos',
    description: 'Clasificacion y ubicaciones por granja.',
    items: [
      {
        href: '/configuracion/maestras/tipos-ubicacion',
        title: 'Tipos de ubicacion',
        description: 'Galpon, corral, sala, deposito...',
        icon: Shapes,
        accentClass: 'bg-warning/15 text-warning',
      },
      {
        href: '/configuracion/maestras/ubicaciones',
        title: 'Ubicaciones',
        description: 'Lugares fisicos dentro de cada granja.',
        icon: MapPin,
        accentClass: 'bg-primary/10 text-primary',
      },
    ],
  },
];
