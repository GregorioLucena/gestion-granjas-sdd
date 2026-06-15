'use client';

import { useEffect } from 'react';

type FeedbackBannerProps = {
  message: string | null;
  tone?: 'success' | 'error';
  onDismiss?: () => void;
};

export function FeedbackBanner({
  message,
  tone = 'success',
  onDismiss,
}: FeedbackBannerProps) {
  useEffect(() => {
    if (!message || !onDismiss) return;
    const timer = window.setTimeout(onDismiss, 4000);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  const styles =
    tone === 'error'
      ? 'bg-danger/10 text-danger ring-danger/20'
      : 'bg-success/10 text-success ring-success/20';

  return (
    <p className={`rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-inset ${styles}`}>
      {message}
    </p>
  );
}
