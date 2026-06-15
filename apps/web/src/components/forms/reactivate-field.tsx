'use client';

type ReactivateFieldProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function ReactivateField({ checked, onChange }: ReactivateFieldProps) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-black/10 px-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-primary"
      />
      <span className="text-sm font-medium">Reactivar registro</span>
    </label>
  );
}
