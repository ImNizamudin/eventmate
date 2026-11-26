import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { session, updatePassword } = useAuth();
  const { showToast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg('');
    if (password.length < 6) {
      setErrorMsg('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(password);
      showToast('Kata sandi berhasil diperbarui. Selamat datang kembali.', 'success');
      navigate('/discover', { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memperbarui kata sandi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[var(--em-ground)] px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-md rounded-3xl border border-[var(--em-border)] bg-white p-6 shadow-sm sm:p-7">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--em-soft)] text-[var(--em-primary)]">
          <KeyRound className="h-5 w-5" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-extrabold text-[var(--em-ink)]">Atur Kata Sandi Baru</h1>
        <p className="mt-1 text-sm text-[var(--em-muted)]">
          Masukkan kata sandi baru untuk mengamankan akun EventMate kamu.
        </p>

        {!session ? (
          <div className="mt-5 space-y-4 rounded-xl border border-[#e9cfa2] bg-[#fef6e7] p-4 text-sm text-[#683800]">
            <p className="font-medium">
              Sesi pemulihan tidak ditemukan atau tautan sudah kedaluwarsa. Silakan minta tautan
              reset kata sandi baru.
            </p>
            <Link
              to="/auth?tab=forgot"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--em-primary)] px-4 py-2 text-sm font-bold text-white"
            >
              Minta Tautan Reset Baru
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {errorMsg && (
              <div
                role="alert"
                className="rounded-xl border border-[#f1c7c7] bg-[#fdeeee] p-3 text-sm text-[#9e2424]"
              >
                {errorMsg}
              </div>
            )}
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-xs font-bold text-[var(--em-ink)]">
                Kata sandi baru
              </label>
              <input
                id="new-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="confirm-password"
                className="mb-1.5 block text-xs font-bold text-[var(--em-ink)]"
              >
                Ulangi kata sandi baru
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang kata sandi baru"
                className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[46px] w-full rounded-xl bg-[var(--em-primary)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--em-primary-deep)] disabled:opacity-60"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
