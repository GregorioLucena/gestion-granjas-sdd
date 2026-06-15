import { Shield, Users } from 'lucide-react';
import { PERMISOS } from '@gestion-granjas/shared/permissions';
import type { ConfigNavGroup } from '@/modules/configuracion/catalog';

export type SeguridadNavItem = ConfigNavGroup['items'][number] & {
  permission: string;
};

export type SeguridadNavGroup = Omit<ConfigNavGroup, 'items'> & {
  items: SeguridadNavItem[];
};

export const seguridadGroups: SeguridadNavGroup[] = [
  {
    title: 'Administracion',
    description: 'Usuarios, perfiles y permisos del sistema.',
    items: [
      {
        href: '/seguridad/usuarios',
        title: 'Usuarios',
        description: 'Altas, accesos por granja y estados de cuenta.',
        icon: Users,
        accentClass: 'bg-primary/10 text-primary',
        permission: PERMISOS.USUARIOS_VER,
      },
      {
        href: '/seguridad/perfiles',
        title: 'Perfiles',
        description: 'Roles globales y permisos asignados.',
        icon: Shield,
        accentClass: 'bg-info/10 text-info',
        permission: PERMISOS.PERFILES_ADMINISTRAR,
      },
    ],
  },
];

export const SEGURIDAD_ACCESS_PERMISSIONS = [
  PERMISOS.USUARIOS_VER,
  PERMISOS.PERFILES_ADMINISTRAR,
] as const;
