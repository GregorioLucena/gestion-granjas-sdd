'use client';

import {
  AlertTriangle,
  Building2,
  ClipboardList,
  Layers3,
  PackageOpen,
  Scale,
  Shield,
  TrendingUp,
  Users,
  Wheat,
} from 'lucide-react';
import { PERMISOS, hasPermission } from '@gestion-granjas/shared/permissions';
import { ActionCard } from '@/components/data-display/action-card';
import { MetricCard } from '@/components/data-display/metric-card';
import { useAuth } from '@/lib/auth-context';

const metrics = [
  {
    label: 'Lotes activos',
    value: '—',
    helper: 'Pendiente de conectar con el modulo de lotes.',
    icon: Layers3,
    tone: 'primary' as const,
  },
  {
    label: 'Stock bajo',
    value: '—',
    helper: 'Se activara con inventario de alimentos.',
    icon: AlertTriangle,
    tone: 'warning' as const,
  },
  {
    label: 'Engordes en curso',
    value: '—',
    helper: 'Disponible al implementar engorde.',
    icon: TrendingUp,
    tone: 'success' as const,
  },
  {
    label: 'Consumo hoy',
    value: '—',
    helper: 'Resumen diario por granja activa.',
    icon: Wheat,
    tone: 'accent' as const,
  },
];

type QuickLink = {
  href: string;
  title: string;
  description: string;
  icon: typeof Building2;
  tone?: 'primary' | 'secondary' | 'accent' | 'success' | 'info';
};

const operationalLinks: QuickLink[] = [
  {
    href: '/lotes',
    title: 'Crear o revisar lotes',
    description: 'Gestiona grupos productivos, cantidades y ubicacion actual.',
    icon: Layers3,
    tone: 'primary',
  },
  {
    href: '/inventario',
    title: 'Registrar alimento',
    description: 'Prepara entradas, salidas, ajustes y existencias.',
    icon: PackageOpen,
    tone: 'secondary',
  },
  {
    href: '/consumo',
    title: 'Registrar consumo',
    description: 'Flujo rapido para descontar alimento por lote.',
    icon: Wheat,
    tone: 'accent',
  },
  {
    href: '/lotes',
    title: 'Registrar peso',
    description: 'Base para medir avance y conversion del engorde.',
    icon: Scale,
    tone: 'success',
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  const adminLinks: QuickLink[] = [];

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
      adminLinks.push({
        href: '/configuracion',
        title: 'Configuracion',
        description: 'Companias, granjas y catalogos maestros.',
        icon: Building2,
        tone: 'primary',
      });
    }

    if (hasPermission(ctx, PERMISOS.USUARIOS_VER)) {
      adminLinks.push({
        href: '/seguridad/usuarios',
        title: 'Usuarios',
        description: 'Gestionar cuentas y accesos por granja.',
        icon: Users,
        tone: 'info',
      });
    }

    if (hasPermission(ctx, PERMISOS.PERFILES_ADMINISTRAR)) {
      adminLinks.push({
        href: '/seguridad/perfiles',
        title: 'Perfiles',
        description: 'Roles globales y permisos del sistema.',
        icon: Shield,
        tone: 'secondary',
      });
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[1.75rem] bg-primary p-5 text-white shadow-lg shadow-primary/15">
        <div className="relative">
          <div className="absolute -right-12 -top-16 size-40 rounded-full bg-secondary/25 blur-2xl" />
          <div className="absolute -bottom-16 left-12 size-32 rounded-full bg-accent/20 blur-2xl" />
          <div className="relative space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/15">
              <ClipboardList className="size-4" aria-hidden />
              Centro operativo
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {user ? `Hola, ${user.nombre}` : 'Dashboard'}
              </h1>
              <p className="mt-1 max-w-xl text-sm leading-6 text-white/80">
                Resumen diario de la granja activa. Los indicadores operativos se conectaran al
                avanzar con lotes, inventario, consumo y engorde.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            icon={metric.icon}
            tone={metric.tone}
          />
        ))}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-semibold">Acciones productivas</h2>
          <p className="text-sm text-muted">
            Atajos preparados para el flujo principal del MVP v1.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {operationalLinks.map((link) => (
            <ActionCard key={link.title} {...link} tone={link.tone} />
          ))}
        </div>
      </section>

      {adminLinks.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="font-semibold">Administracion</h2>
            <p className="text-sm text-muted">Modulos disponibles segun tus permisos.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {adminLinks.map((link) => (
              <ActionCard key={link.href} {...link} tone={link.tone} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl bg-warning/10 p-4 ring-1 ring-warning/20">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <AlertTriangle className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-semibold text-foreground">Siguiente hito sugerido</h2>
            <p className="mt-1 text-sm text-muted">
              Implementar lotes y luego inventario para que estas metricas pasen de placeholder a
              indicadores reales.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
