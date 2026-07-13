'use client';

type ReactivateFieldProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function ReactivateField({ checked, onChange }: ReactivateFieldProps) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-primary/15 bg-background/60 px-3.5 transition hover:border-primary/25 hover:bg-primary/[0.03]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-primary"
      />
      <span className="text-sm font-semibold text-foreground">Reactivar registro</span>
    </label>
  );
}
