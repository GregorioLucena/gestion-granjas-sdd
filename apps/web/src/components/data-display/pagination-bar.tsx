'use client';

type PaginationBarProps = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
};

export function PaginationBar({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  loading = false,
}: PaginationBarProps) {
  if (total === 0) return null;

  const showingFrom = (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3 ring-1 ring-primary/10">
      <p className="text-sm text-muted">
        {showingFrom}-{showingTo} de {total} · pagina {page}/{totalPages}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
          className="min-h-10 rounded-xl border border-primary/15 px-3 text-sm font-semibold disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(page + 1)}
          className="min-h-10 rounded-xl border border-primary/15 px-3 text-sm font-semibold disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
