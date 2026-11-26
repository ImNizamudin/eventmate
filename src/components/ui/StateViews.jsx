import { AlertTriangle, FolderOpen, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LoadingState({ label = 'Memuat data...' }) {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <p className="text-sm font-medium text-[var(--em-muted)]">{label}</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="animate-pulse rounded-2xl border border-[var(--em-border)] bg-white p-5"
          >
            <div className="mb-3 flex justify-between">
              <div className="h-5 w-24 rounded-md bg-[var(--em-soft)]" />
              <div className="h-5 w-16 rounded-md bg-[var(--em-rail)]" />
            </div>
            <div className="mb-2 h-5 w-3/4 rounded-md bg-[var(--em-soft)]" />
            <div className="mb-4 h-4 w-full rounded-md bg-[var(--em-rail)]" />
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-md bg-[var(--em-rail)]" />
              <div className="h-6 w-20 rounded-md bg-[var(--em-rail)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ title, description, actionLabel, onAction, actionTo }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#cbbbe2] bg-white px-6 py-10 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--em-soft)] text-[var(--em-primary)]">
        <FolderOpen className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="text-base font-bold text-[var(--em-ink)]">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[var(--em-muted)]">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--em-primary)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--em-primary-deep)]"
        >
          {actionLabel}
        </button>
      )}
      {actionLabel && actionTo && !onAction && (
        <Link
          to={actionTo}
          className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--em-primary)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--em-primary-deep)]"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function ErrorState({ title = 'Gagal memuat data', message, onRetry }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#f1c7c7] bg-[#fdeeee] p-5 sm:flex-row sm:items-center"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#9e2424]" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-bold text-[#9e2424]">{title}</h3>
          <p className="mt-1 text-sm text-[#741a1a]">
            {message || 'Koneksi ke database terputus. Periksa jaringan atau konfigurasi Supabase lalu coba lagi.'}
          </p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl border border-[#e3adad] bg-white px-4 py-2 text-sm font-bold text-[#9e2424] hover:bg-[#fff7f7]"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Coba lagi
        </button>
      )}
    </div>
  );
}

export function SupabaseSetupBanner() {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-[#e9cfa2] bg-[#fef6e7] p-5 text-[#683800]"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#8a4b00]" aria-hidden="true" />
        <div className="space-y-1.5 text-sm">
          <p className="font-bold">Konfigurasi Supabase belum diisi di file .env</p>
          <p className="leading-relaxed">
            Isi <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code> pada file{' '}
            <code>.env</code> lalu jalankan skema SQL di <code>supabase/schema.sql</code> mengikuti
            langkah pada <code>SUPABASE_SETUP.md</code> untuk mengaktifkan autentikasi email dan
            sinkronisasi multi-akun.
          </p>
        </div>
      </div>
    </div>
  );
}
