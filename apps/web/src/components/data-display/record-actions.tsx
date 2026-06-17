'use client';

type RecordActionsProps = {
  onEdit?: () => void;
  onInactivate?: () => void;
  inactivateLabel?: string;
};

export function RecordActions({
  onEdit,
  onInactivate,
  inactivateLabel = 'Inactivar',
}: RecordActionsProps) {
  if (!onEdit && !onInactivate) {
    return null;
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="min-h-10 cursor-pointer rounded-lg px-2.5 text-sm font-semibold text-primary transition hover:bg-primary/10"
        >
          Editar
        </button>
      ) : null}
      {onInactivate ? (
        <button
          type="button"
          onClick={onInactivate}
          className="min-h-10 cursor-pointer rounded-lg px-2.5 text-sm font-semibold text-warning transition hover:bg-warning/10"
        >
          {inactivateLabel}
        </button>
      ) : null}
    </div>
  );
}
