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
    helper: 'Se conectara con el listado de lotes.',
    icon: Layers3,
    tone: 'primary' as const,
  },
  {
    label: 'Stock bajo',
    value: '—',
    helper: 'Alertas desde existencias de alimento.',
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
    description: 'Grupos productivos, cantidades y ubicacion actual.',
    icon: Layers3,
    tone: 'primary',
  },
  {
    href: '/inventario',
    title: 'Registrar alimento',
    description: 'Entradas, salidas, ajustes y existencias.',
    icon: PackageOpen,
    tone: 'secondary',
  },
  {
    href: '/consumo',
    title: 'Registrar consumo',
    description: 'Descuenta alimento por lote en pocos toques.',
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
      <section className="brand-panel relative overflow-hidden rounded-[1.85rem] p-5 text-white shadow-lg shadow-primary/20 sm:p-6">
        <div className="absolute -right-8 -top-12 size-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-14 left-6 size-32 rounded-full bg-black/10 blur-3xl" />
        <div className="relative space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
            <ClipboardList className="size-3.5" aria-hidden />
            Centro operativo
          </span>
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {user ? `Hola, ${user.nombre}` : 'Dashboard'}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">
              Resumen de la granja activa. Usa los atajos para registrar lo del dia sin perder
              el ritmo en campo.
            </p>
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
          <h2 className="text-lg font-semibold text-foreground">Acciones productivas</h2>
          <p className="text-sm text-muted">Atajos del flujo principal del MVP.</p>
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
            <h2 className="text-lg font-semibold text-foreground">Administracion</h2>
            <p className="text-sm text-muted">Modulos disponibles segun tus permisos.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {adminLinks.map((link) => (
              <ActionCard key={link.href} {...link} tone={link.tone} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl bg-secondary/20 p-4 ring-1 ring-secondary/35">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/40 text-primary-dark">
            <TrendingUp className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-semibold text-foreground">Siguiente hito</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Controles de peso y engorde para cerrar el ciclo productivo del MVP v1.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
