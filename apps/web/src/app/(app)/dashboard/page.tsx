'use client';

import Link from 'next/link';
import { Building2, Shield, Users } from 'lucide-react';
import { PERMISOS, hasPermission } from '@gestion-granjas/shared/permissions';
import { useAuth } from '@/lib/auth-context';

const metrics = [
  { label: 'Lotes activos', value: '—' },
  { label: 'Stock bajo', value: '—' },
  { label: 'Engordes en curso', value: '—' },
  { label: 'Consumo hoy', value: '—' },
];

type QuickLink = {
  href: string;
  title: string;
  description: string;
  icon: typeof Building2;
};

export default function DashboardPage() {
  const { user } = useAuth();

  const quickLinks: QuickLink[] = [];

  if (user) {
    const ctx = {
      userId: user.id,
      companiaId: user.companiaId,
      granjaIds: user.granjaIds,
      permisos: user.permisos,
      granjaActivaId: user.granjaActivaId,
    };

    if (
      hasPermission(ctx, PERMISOS.COMPANIAS_VER) ||
      hasPermission(ctx, PERMISOS.GRANJAS_VER) ||
      hasPermission(ctx, PERMISOS.MAESTRAS_ADMINISTRAR)
    ) {
      quickLinks.push({
        href: '/configuracion',
        title: 'Configuracion',
        description: 'Companias, granjas y catalogos maestros.',
        icon: Building2,
      });
    }

    if (hasPermission(ctx, PERMISOS.USUARIOS_VER)) {
      quickLinks.push({
        href: '/seguridad/usuarios',
        title: 'Usuarios',
        description: 'Gestionar cuentas y accesos por granja.',
        icon: Users,
      });
    }

    if (hasPermission(ctx, PERMISOS.PERFILES_ADMINISTRAR)) {
      quickLinks.push({
        href: '/seguridad/perfiles',
        title: 'Perfiles',
        description: 'Roles globales y permisos del sistema.',
        icon: Shield,
      });
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted">
          {user
            ? `Hola, ${user.nombre}. Resumen productivo de la granja activa.`
            : 'Resumen productivo de la granja activa.'}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-black/5"
          >
            <p className="text-xs text-muted">{metric.label}</p>
            <p className="mt-2 text-2xl font-bold text-primary">{metric.value}</p>
          </article>
        ))}
      </section>

      {quickLinks.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="font-semibold">Accesos rapidos</h2>
            <p className="text-sm text-muted">Modulos disponibles segun tus permisos.</p>
          </div>
          <div className="grid gap-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-start gap-3 rounded-2xl bg-surface p-4 ring-1 ring-black/5"
                >
                  <span className="rounded-xl bg-primary/10 p-2 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block font-semibold text-primary">{link.title}</span>
                    <span className="mt-1 block text-sm text-muted">{link.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-black/5">
        <h2 className="font-semibold">Proximamente</h2>
        <p className="mt-2 text-sm text-muted">
          Lotes, inventario, consumo y reportes operativos se habilitaran en los siguientes modulos.
        </p>
      </section>
    </div>
  );
}
