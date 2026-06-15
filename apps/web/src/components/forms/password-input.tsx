'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { getInputClassName } from '@/components/forms/field';

type PasswordInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  hasError?: boolean;
  placeholder?: string;
};

export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete = 'current-password',
  hasError,
  placeholder,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${getInputClassName(hasError)} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-foreground"
        aria-label={visible ? 'Ocultar contrasena' : 'Mostrar contrasena'}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
