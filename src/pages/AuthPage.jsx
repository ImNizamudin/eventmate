import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, MailCheck, RefreshCw, Search, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SupabaseSetupBanner } from '../components/ui/StateViews';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'login';
  const [tab, setTab] = useState(
    ['login', 'signup', 'forgot', 'verify'].includes(initialTab) ? initialTab : 'login'
  );

  const navigate = useNavigate();
  const { user, profile, signIn, signUp, resendVerificationEmail, sendPasswordResetEmail } =
    useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('seeker');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const paramTab = searchParams.get('tab');
    if (paramTab && ['login', 'signup', 'forgot', 'verify'].includes(paramTab)) {
      setTab(paramTab);
      setErrorMsg('');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && profile) {
      navigate(profile.onboarded ? '/discover' : '/onboarding', { replace: true });
    }
  }, [user, profile, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const switchTab = (nextTab) => {
    setTab(nextTab);
    setErrorMsg('');
    setInfoMsg('');
    setSearchParams({ tab: nextTab });
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setSubmitting(true);
    try {
      await signIn({ email, password });
      showToast('Berhasil masuk ke akun EventMate.', 'success');
    } catch (err) {
      const msg = err.message || 'Gagal masuk ke akun.';
      setErrorMsg(msg);
      if (msg.toLowerCase().includes('belum dikonfirmasi')) {
        setPendingVerifyEmail(email.trim());
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await signUp({ name, email, password, role });
      if (res.needsEmailConfirmation) {
        setPendingVerifyEmail(email.trim());
        setResendCooldown(45);
        switchTab('verify');
        showToast('Tautan verifikasi dikirim ke email kamu.', 'success');
      } else {
        showToast('Akun dibuat. Lanjutkan pengisian profil.', 'success');
        navigate('/onboarding', { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Registrasi gagal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(email);
      setInfoMsg(
        `Tautan pemulihan kata sandi telah dikirim ke ${email.trim()}. Buka email kamu lalu klik tautan tersebut untuk mengatur kata sandi baru.`
      );
      showToast('Email pemulihan kata sandi terkirim.', 'success');
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mengirim email pemulihan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    const targetEmail = (pendingVerifyEmail || email).trim();
    if (!targetEmail) {
      setErrorMsg('Masukkan alamat email terlebih dahulu.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    try {
      await resendVerificationEmail(targetEmail);
      setResendCooldown(60);
      setInfoMsg(`Email verifikasi baru dikirim ulang ke ${targetEmail}.`);
      showToast('Email verifikasi dikirim ulang.', 'success');
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mengirim ulang email verifikasi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[var(--em-ground)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-2 text-sm font-bold text-[var(--em-muted)] hover:text-[var(--em-primary)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Beranda</span>
          </Link>
          <img
            src="/eventmate-logo.png"
            alt="EventMate"
            width="132"
            height="44"
            className="h-9 w-auto object-contain"
          />
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-5">
            <SupabaseSetupBanner />
          </div>
        )}

        <div className="rounded-3xl border border-[var(--em-border)] bg-white p-6 shadow-sm sm:p-7">
          {tab !== 'verify' && (
            <div
              role="tablist"
              aria-label="Pilihan autentikasi"
              className="mb-6 grid grid-cols-3 gap-1.5 rounded-xl bg-[var(--em-rail)] p-1"
            >
              {[
                { id: 'login', label: 'Masuk' },
                { id: 'signup', label: 'Daftar' },
                { id: 'forgot', label: 'Lupa Sandi' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  onClick={() => switchTab(item.id)}
                  className={`min-h-[40px] rounded-lg px-2 py-2 text-xs font-bold transition sm:text-sm ${
                    tab === item.id
                      ? 'bg-[var(--em-primary)] text-white'
                      : 'text-[var(--em-muted)] hover:text-[var(--em-ink)]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-[#f1c7c7] bg-[#fdeeee] p-3.5 text-sm text-[#9e2424]"
            >
              <p className="font-medium">{errorMsg}</p>
              {pendingVerifyEmail && tab === 'login' && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={submitting || resendCooldown > 0}
                  className="mt-2 inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#9e2424] underline"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  {resendCooldown > 0
                    ? `Kirim ulang dalam ${resendCooldown}d`
                    : 'Kirim ulang email verifikasi'}
                </button>
              )}
            </div>
          )}

          {infoMsg && (
            <div
              role="status"
              className="mb-4 rounded-xl border border-[#bde4cd] bg-[#eaf7f0] p-3.5 text-sm text-[#155e3d]"
            >
              {infoMsg}
            </div>
          )}

          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <h1 className="text-xl font-extrabold text-[var(--em-ink)]">
                  Masuk ke akun EventMate
                </h1>
                <p className="mt-1 text-sm text-[var(--em-muted)]">
                  Gunakan email dan kata sandi yang sudah terdaftar dan terverifikasi.
                </p>
              </div>

              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-xs font-bold text-[var(--em-ink)]">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm text-[var(--em-ink)]"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="login-password" className="text-xs font-bold text-[var(--em-ink)]">
                    Kata sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => switchTab('forgot')}
                    className="text-xs font-bold text-[var(--em-primary)] hover:underline"
                  >
                    Lupa kata sandi?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 pr-11 text-sm text-[var(--em-ink)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                    className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-[var(--em-muted)] hover:bg-[var(--em-rail)]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !isSupabaseConfigured}
                className="min-h-[46px] w-full rounded-xl bg-[var(--em-primary)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--em-primary-deep)] disabled:opacity-60"
              >
                {submitting ? 'Memeriksa akun...' : 'Masuk ke Workspace'}
              </button>
            </form>
          )}

          {tab === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <h1 className="text-xl font-extrabold text-[var(--em-ink)]">
                  Daftar akun baru
                </h1>
                <p className="mt-1 text-sm text-[var(--em-muted)]">
                  Setelah mendaftar, kami akan mengirim tautan konfirmasi ke email kamu.
                </p>
              </div>

              <div>
                <label htmlFor="signup-name" className="mb-1.5 block text-xs font-bold text-[var(--em-ink)]">
                  Nama lengkap
                </label>
                <input
                  id="signup-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama lengkap kamu"
                  className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm text-[var(--em-ink)]"
                />
              </div>

              <div>
                <label htmlFor="signup-email" className="mb-1.5 block text-xs font-bold text-[var(--em-ink)]">
                  Email aktif
                </label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm text-[var(--em-ink)]"
                />
              </div>

              <div>
                <label htmlFor="signup-password" className="mb-1.5 block text-xs font-bold text-[var(--em-ink)]">
                  Kata sandi (minimal 6 karakter)
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 pr-11 text-sm text-[var(--em-ink)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                    className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-[var(--em-muted)] hover:bg-[var(--em-rail)]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-bold text-[var(--em-ink)]">
                  Peran awal (dapat diganti kapan saja di aplikasi)
                </span>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setRole('seeker')}
                    aria-pressed={role === 'seeker'}
                    className={`rounded-xl border p-3.5 text-left transition ${
                      role === 'seeker'
                        ? 'border-2 border-[var(--em-primary)] bg-[var(--em-soft)]'
                        : 'border-[var(--em-border)] bg-white hover:bg-[var(--em-rail)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-bold text-[var(--em-ink)]">
                      <Search className="h-4 w-4 text-[var(--em-primary)]" aria-hidden="true" />
                      <span>Team Seeker</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--em-muted)]">
                      Cari tim dan ajukan permintaan bergabung.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('creator')}
                    aria-pressed={role === 'creator'}
                    className={`rounded-xl border p-3.5 text-left transition ${
                      role === 'creator'
                        ? 'border-2 border-[var(--em-primary)] bg-[var(--em-soft)]'
                        : 'border-[var(--em-border)] bg-white hover:bg-[var(--em-rail)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-bold text-[var(--em-ink)]">
                      <Sparkles className="h-4 w-4 text-[var(--em-rose)]" aria-hidden="true" />
                      <span>Team Creator</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--em-muted)]">
                      Buat tim dan undang anggota yang sesuai.
                    </p>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !isSupabaseConfigured}
                className="min-h-[46px] w-full rounded-xl bg-[var(--em-primary)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--em-primary-deep)] disabled:opacity-60"
              >
                {submitting ? 'Mendaftarkan akun...' : 'Buat Akun & Kirim Verifikasi'}
              </button>
            </form>
          )}

          {tab === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <h1 className="text-xl font-extrabold text-[var(--em-ink)]">
                  Pemulihan kata sandi
                </h1>
                <p className="mt-1 text-sm text-[var(--em-muted)]">
                  Masukkan email akun EventMate kamu untuk menerima tautan pengaturan ulang kata
                  sandi.
                </p>
              </div>

              <div>
                <label htmlFor="forgot-email" className="mb-1.5 block text-xs font-bold text-[var(--em-ink)]">
                  Email terdaftar
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm text-[var(--em-ink)]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !isSupabaseConfigured}
                className="min-h-[46px] w-full rounded-xl bg-[var(--em-primary)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--em-primary-deep)] disabled:opacity-60"
              >
                {submitting ? 'Mengirim tautan...' : 'Kirim Email Pemulihan'}
              </button>
            </form>
          )}

          {tab === 'verify' && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--em-soft)] text-[var(--em-primary)]">
                <MailCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-[var(--em-ink)]">
                  Periksa email kamu untuk konfirmasi
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-[var(--em-muted)]">
                  Kami telah mengirim tautan verifikasi ke{' '}
                  <strong className="text-[var(--em-ink)]">{pendingVerifyEmail || email}</strong>.
                  Klik tautan di kotak masuk atau folder spam, lalu masuk kembali.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={submitting || resendCooldown > 0}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[var(--em-border)] bg-[var(--em-soft)] px-4 py-2.5 text-sm font-bold text-[var(--em-primary)] transition hover:bg-[#e8dbfa] disabled:opacity-60"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  {resendCooldown > 0
                    ? `Kirim ulang tersedia dalam ${resendCooldown} detik`
                    : 'Kirim Ulang Email Verifikasi'}
                </button>
                <button
                  type="button"
                  onClick={() => switchTab('login')}
                  className="min-h-[44px] w-full rounded-xl bg-[var(--em-primary)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--em-primary-deep)]"
                >
                  Sudah Konfirmasi? Masuk Sekarang
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
