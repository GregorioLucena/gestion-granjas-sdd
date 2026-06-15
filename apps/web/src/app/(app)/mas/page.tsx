'use client';

import Link from 'next/link';
import { PERMISOS } from '@gestion-granjas/shared/permissions';
import { useAuth } from '@/lib/auth-context';
import { userHasAnyPermission } from '@/lib/tenant-context';
import { SEGURIDAD_ACCESS_PERMISSIONS } from '@/modules/seguridad/catalog';

const links = [
  {
    href: '/configuracion',
    title: 'Configuracion',
    description: 'Companias, granjas y catalogos maestros.',
    permissions: [
      PERMISOS.COMPANIAS_VER,
      PERMISOS.GRANJAS_VER,
      PERMISOS.MAESTRAS_ADMINISTRAR,
    ],
  },
  {
    href: '/seguridad',
    title: 'Seguridad',
    description: 'Usuarios, perfiles y permisos.',
    permissions: [...SEGURIDAD_ACCESS_PERMISSIONS],
  },
  {
    href: '/dashboard',
    title: 'Dashboard',
    description: 'Resumen operativo.',
    permissions: null,
  },
];

export default function MasPage() {
  const { user, logout } = useAuth();

  const visibleLinks = links.filter((link) => {
    if (!link.permissions) return true;
    return user ? userHasAnyPermission(user, link.permissions) : false;
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-black/5">
        <h1 className="text-2xl font-bold">Mas</h1>
        <p className="text-sm text-muted">Accesos adicionales y administracion.</p>
        {user ? (
          <p className="mt-2 text-sm text-muted">
            Sesion: {user.nombre} ({user.email})
          </p>
        ) : null}
      </div>

      <div className="grid gap-3">
        {visibleLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl bg-surface p-4 ring-1 ring-black/5"
          >
            <h2 className="font-semibold text-primary">{link.title}</h2>
            <p className="text-sm text-muted">{link.description}</p>
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={() => void logout()}
        className="min-h-11 w-full rounded-xl bg-danger/10 px-4 text-sm font-semibold text-danger"
      >
        Cerrar sesion
      </button>
    </div>
  );
}
