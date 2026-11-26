import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, subtitle, children, maxWidth = 'max-w-xl' }) {
  const closeBtnRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    previousFocusRef.current = document.activeElement;
    const timer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 20);

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#180c2d]/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-heading"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`em-scrollbar max-h-[90dvh] w-full ${maxWidth} overflow-y-auto rounded-3xl border border-[var(--em-border)] bg-white p-6 shadow-[var(--em-shadow-modal)]`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="modal-heading" className="text-lg font-extrabold text-[var(--em-ink)]">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm text-[var(--em-muted)]">{subtitle}</p>
            )}
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--em-rail)] text-[var(--em-ink)] transition hover:bg-[var(--em-soft)]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
