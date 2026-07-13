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
    <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-background/80 p-1.5 ring-1 ring-primary/10 sm:gap-2.5 sm:pl-2 sm:pr-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-sm shadow-primary/25"
          aria-hidden
        >
          {initials}
        </span>
        <div className="hidden min-w-0 text-left sm:block">
          <p className="text-[11px] font-semibold tracking-wide text-muted">Tu sesion</p>
          <p className="max-w-[10rem] truncate text-sm font-semibold leading-tight text-foreground lg:max-w-[12rem]">
            {displayName}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void logout()}
        className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-muted transition hover:bg-danger/10 hover:text-danger sm:px-3"
        aria-label="Cerrar sesion"
      >
        <LogOut className="size-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">Salir</span>
      </button>
    </div>
  );
}
