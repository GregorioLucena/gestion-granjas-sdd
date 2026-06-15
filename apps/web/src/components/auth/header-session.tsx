'use client';

import { LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

function getInitials(nombre: string, apellido?: string | null): string {
  const first = nombre.trim().charAt(0);
  const last = apellido?.trim().charAt(0) ?? '';
  return (first + last).toUpperCase() || '?';
}

function getDisplayName(nombre: string, apellido?: string | null): string {
  return [nombre.trim(), apellido?.trim()].filter(Boolean).join(' ');
}

export function HeaderSession() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const displayName = getDisplayName(user.nombre, user.apellido);
  const initials = getInitials(user.nombre, user.apellido);

  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-sm font-bold text-primary ring-2 ring-primary/10"
          aria-hidden
        >
          {initials}
        </span>
        <div className="min-w-0 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Tu sesion</p>
          <p className="truncate text-sm font-semibold leading-tight text-foreground max-w-[7.5rem] sm:max-w-[11rem]">
            {displayName}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void logout()}
        className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-background px-2.5 text-sm font-semibold text-muted ring-1 ring-black/10 transition hover:bg-danger/8 hover:text-danger hover:ring-danger/20 sm:px-3"
        aria-label="Cerrar sesion"
      >
        <LogOut className="size-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">Salir</span>
      </button>
    </div>
  );
}
