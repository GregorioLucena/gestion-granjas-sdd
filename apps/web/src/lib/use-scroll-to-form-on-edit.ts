import { useEffect, useRef } from 'react';

type FormModeWithEdit = { type: 'edit' } | { type: string } | null;

export function useScrollToFormOnEdit(formMode: FormModeWithEdit) {
  const formSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (formMode?.type !== 'edit') return;

    const section = formSectionRef.current;
    if (!section) return;

    section.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    const focusTimer = window.setTimeout(() => {
      const firstField = section.querySelector<HTMLElement>(
        'input:not([type="checkbox"]), select, textarea',
      );
      firstField?.focus({ preventScroll: true });
    }, 350);

    return () => window.clearTimeout(focusTimer);
  }, [formMode]);

  return formSectionRef;
}
