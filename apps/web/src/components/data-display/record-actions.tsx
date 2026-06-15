'use client';

type RecordActionsProps = {
  onEdit: () => void;
  onInactivate?: () => void;
  inactivateLabel?: string;
};

export function RecordActions({
  onEdit,
  onInactivate,
  inactivateLabel = 'Inactivar',
}: RecordActionsProps) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={onEdit}
        className="min-h-10 cursor-pointer rounded-lg px-2.5 text-sm font-medium text-primary hover:bg-primary/5"
      >
        Editar
      </button>
      {onInactivate ? (
        <button
          type="button"
          onClick={onInactivate}
          className="min-h-10 cursor-pointer rounded-lg px-2.5 text-sm font-medium text-warning hover:bg-warning/10"
        >
          {inactivateLabel}
        </button>
      ) : null}
    </div>
  );
}
