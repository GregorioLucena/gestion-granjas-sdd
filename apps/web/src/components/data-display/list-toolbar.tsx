'use client';

import { Search } from 'lucide-react';
import { inputClassName } from '@/components/forms/field';

export type EstadoFiltro = 'TODOS' | 'ACTIVO' | 'INACTIVO';

type ListToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filtro: EstadoFiltro;
  onFiltroChange: (value: EstadoFiltro) => void;
  resultCount?: number;
};

const filtros: { value: EstadoFiltro; label: string }[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'ACTIVO', label: 'Activos' },
  { value: 'INACTIVO', label: 'Inactivos' },
];

export function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar por nombre...',
  filtro,
  onFiltroChange,
  resultCount,
}: ListToolbarProps) {
  return (
    <div className="space-y-3 rounded-3xl bg-surface p-4 shadow-sm ring-1 ring-black/5">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className={`${inputClassName} pl-10`}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {filtros.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onFiltroChange(option.value)}
            className={`min-h-9 rounded-full px-3 text-sm font-medium transition ${
              filtro === option.value
                ? 'bg-primary text-white shadow-sm shadow-primary/20'
                : 'bg-background text-muted ring-1 ring-black/10 hover:text-primary hover:ring-primary/20'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {typeof resultCount === 'number' ? (
        <p className="text-xs text-muted">
          {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
        </p>
      ) : null}
    </div>
  );
}
