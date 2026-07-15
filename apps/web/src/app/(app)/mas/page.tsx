'use client';

import { Building2, ChartPie, Gauge, LogOut, PackageOpen, Shield, Weight } from 'lucide-react';
import { PERMISOS } from '@gestion-granjas/shared/permissions';
import { ActionCard } from '@/components/data-display/action-card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { userHasAnyPermission } from '@/lib/tenant-context';
import { SEGURIDAD_ACCESS_PERMISSIONS } from '@/modules/seguridad/catalog';

const links = [
  {
    href: '/pesos',
    title: 'Controles de peso',
    description: 'Historial y controles intermedios del engorde.',
    icon: Weight,
    tone: 'secondary' as const,
    permissions: [PERMISOS.PESOS_VER],
  },
  {
    href: '/reportes/alimentacion',
    title: 'Reportes de alimentacion',
    description: 'Consumos, existencias, movimientos y costos conocidos.',
    icon: ChartPie,
    tone: 'info' as const,
    permissions: [PERMISOS.REPORTES_ALIMENTACION_VER],
  },
  {
    href: '/inventario',
    title: 'Inventario',
    description: 'Alimentos, almacenes, movimientos y existencias.',
    icon: PackageOpen,
    tone: 'secondary' as const,
    permissions: [PERMISOS.INVENTARIO_VER],
  },
  {
    href: '/configuracion',
    title: 'Configuracion',
    description: 'Companias, granjas y catalogos maestros.',
    icon: Building2,
    tone: 'primary' as const,
    permissions: [PERMISOS.COMPANIAS_VER, PERMISOS.GRANJAS_VER, PERMISOS.MAESTRAS_ADMINISTRAR],
  },
  {
    href: '/seguridad',
    title: 'Seguridad',
    description: 'Usuarios, perfiles y permisos.',
    icon: Shield,
    tone: 'info' as const,
    permissions: [...SEGURIDAD_ACCESS_PERMISSIONS],
  },
  {
    href: '/dashboard',
    title: 'Dashboard',
    description: 'Resumen operativo.',
    icon: Gauge,
    tone: 'secondary' as const,
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
    <div className="space-y-5 pb-8">
      <section className="brand-panel relative overflow-hidden rounded-3xl p-5 text-white shadow-lg shadow-primary/20">
        <div className="absolute -right-10 -top-16 size-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
            Menu general
          </p>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight">Mas</h1>
          <p className="mt-1 text-sm leading-6 text-white/80">
            Accesos adicionales y administracion.
          </p>
        </div>
        {user ? (
          <div className="relative mt-4 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
              Sesion activa
            </p>
            <p className="mt-1 text-sm font-semibold">{user.nombre}</p>
            <p className="text-xs text-white/70">{user.email}</p>
          </div>
        ) : null}
      </section>

      <div className="grid gap-3">
        {visibleLinks.map((link) => (
          <ActionCard
            key={link.href}
            href={link.href}
            title={link.title}
            description={link.description}
            icon={link.icon}
            tone={link.tone}
          />
        ))}
      </div>

      <Button
        variant="danger"
        fullWidth
        icon={<LogOut className="size-4" aria-hidden />}
        onClick={() => void logout()}
      >
        Cerrar sesion
      </Button>
    </div>
  );
}
