import { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  QrCode,
  ShieldCheck,
  Star,
  Upload,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/layout/PageHeader';
import { LoadingState } from '../components/ui/StateViews';
import {
  PRO_PRICE_IDR,
  TRIAL_DURATION_DAYS,
  formatDateId,
  getTrialStatus,
} from '../lib/constants';
import { formatSupabaseError, supabase } from '../lib/supabaseClient';

export function SubscriptionPage() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const trial = getTrialStatus(profile);

  const [showQrisFlow, setShowQrisFlow] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    if (profile?.name && !senderName) {
      setSenderName(profile.name);
    }
  }, [profile?.name, senderName]);

  useEffect(() => {
    return () => {
      if (proofPreviewUrl) URL.revokeObjectURL(proofPreviewUrl);
    };
  }, [proofPreviewUrl]);

  const fetchPayments = useCallback(async () => {
    if (!supabase || !user) {
      setLoadingPayments(false);
      return;
    }
    setLoadingPayments(true);
    try {
      const { data, error } = await supabase
        .from('membership_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) {
        setPayments(data || []);
      }
    } finally {
      setLoadingPayments(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const latestPayment = payments[0] || null;
  const hasPendingPayment = latestPayment?.status === 'pending';

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setErrorMsg('');
    if (!file) {
      setProofFile(null);
      setProofPreviewUrl('');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg('Ukuran file bukti pembayaran maksimal 3 MB.');
      return;
    }
    setProofFile(file);
    if (file.type.startsWith('image/')) {
      setProofPreviewUrl(URL.createObjectURL(file));
    } else {
      setProofPreviewUrl('');
    }
  };

  const handleSubmitProof = async (event) => {
    event.preventDefault();
    if (!supabase || !user) return;
    if (!proofFile) {
      setErrorMsg('Unggah gambar bukti pembayaran QRIS terlebih dahulu.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);
    try {
      const ext = proofFile.name.split('.').pop() || 'jpg';
      const filePath = `${user.id}/qris-proof-${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, proofFile, { upsert: false });

      if (uploadErr) {
        throw new Error(
          uploadErr.message.includes('Bucket not found')
            ? 'Bucket storage "payment-proofs" belum dibuat di Supabase. Jalankan file supabase/migration_membership_payments.sql di SQL Editor Supabase.'
            : formatSupabaseError(uploadErr)
        );
      }

      const { error: insertErr } = await supabase.from('membership_payments').insert({
        user_id: user.id,
        amount: PRO_PRICE_IDR,
        payment_method: 'QRIS',
        sender_name: senderName.trim() || profile?.name || 'Pengguna EventMate',
        notes: notes.trim(),
        proof_path: filePath,
        status: 'pending',
      });

      if (insertErr) {
        throw new Error(
          insertErr.message.includes('relation') && insertErr.message.includes('does not exist')
            ? 'Tabel "membership_payments" belum dibuat di Supabase. Jalankan supabase/migration_membership_payments.sql di SQL Editor Supabase.'
            : formatSupabaseError(insertErr)
        );
      }

      setJustSubmitted(true);
      setShowQrisFlow(false);
      setProofFile(null);
      setProofPreviewUrl('');
      setNotes('');
      await fetchPayments();
      showToast('Terima kasih! Bukti pembayaran diterima dan menunggu konfirmasi admin.', 'success');
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mengirim bukti pembayaran.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Membership EventMate Pro"
        description="Pantau sisa masa uji coba gratis 30 hari dan tingkatkan akun ke EventMate Pro melalui QRIS."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="em-enter em-pro-banner flex flex-col justify-between rounded-3xl p-6 sm:p-8 lg:col-span-7">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold tracking-wide text-white">
              <Star className="em-star-motion h-3.5 w-3.5 fill-current" aria-hidden="true" />
              <span>EVENTMATE PRO</span>
            </div>

            <h2 className="mt-4 text-2xl font-extrabold text-white sm:text-3xl">
              {trial.isPaid
                ? 'Akun EventMate Pro kamu sudah aktif'
                : 'Lanjutkan kolaborasi tanpa batas setelah masa trial'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/90">
              Setiap akun baru mendapat masa uji coba gratis {TRIAL_DURATION_DAYS} hari penuh.
              Setelah itu, aktifkan paket EventMate Pro lewat pembayaran QRIS.
            </p>

            <div className="mt-5 flex items-baseline gap-2">
              <span className="tabular-nums text-3xl font-extrabold text-white sm:text-4xl">
                {trial.isPaid ? 'PRO AKTIF' : 'Rp15.000'}
              </span>
              <span className="text-sm text-white/85">
                {trial.isPaid ? 'Terverifikasi admin' : '/ bulan'}
              </span>
            </div>

            <ul className="mt-6 space-y-2.5 text-sm text-white/95">
              {[
                'Akses penuh pencarian tim dan direktori individu',
                'Pengiriman permintaan bergabung dan undangan dua arah',
                'Member Directory, Contact Information terlindungi, dan Announcement',
                'Penilaian, ulasan kolaborasi, serta perlindungan Report & Block',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {!trial.isPaid && !hasPendingPayment && (
            <div className="mt-7 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowQrisFlow(true);
                  setJustSubmitted(false);
                }}
                className="em-btn-step inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-extrabold text-[var(--em-primary)] shadow-sm hover:bg-[var(--em-soft)] sm:w-auto"
              >
                <QrCode className="h-4 w-4" aria-hidden="true" />
                <span>{showQrisFlow ? 'Tampilan QRIS Terbuka' : 'Upgrade ke Pro via QRIS'}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </section>

        <section className="em-enter em-enter-1 flex flex-col justify-between rounded-3xl border border-[var(--em-border)] bg-white p-6 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-extrabold text-[var(--em-ink)]">
                Perhitungan Masa Trial
              </h3>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  trial.isPaid
                    ? 'bg-[#eaf7f0] text-[#155e3d]'
                    : trial.expired
                      ? 'bg-[#fdeeee] text-[#9e2424]'
                      : 'bg-[var(--em-soft)] text-[var(--em-primary)]'
                }`}
              >
                {trial.isPaid ? 'PRO ACTIVE' : trial.expired ? 'TRIAL BERAKHIR' : 'FREE TRIAL'}
              </span>
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)] p-4">
              {trial.isPaid ? (
                <div className="flex items-center gap-3 text-[#155e3d]">
                  <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-extrabold">Membership Pro Aktif</p>
                    <p className="text-xs">Seluruh fitur kolaborasi aktif tanpa batas waktu trial.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-bold text-[var(--em-ink)]">
                      {trial.expired
                        ? 'Masa gratis 30 hari berakhir'
                        : `Sisa ${trial.daysLeft} hari lagi`}
                    </span>
                    <span className="tabular-nums text-xs font-bold text-[var(--em-primary)]">
                      {trial.daysLeft} / {TRIAL_DURATION_DAYS} hari
                    </span>
                  </div>

                  <div
                    role="progressbar"
                    aria-valuenow={trial.daysLeft}
                    aria-valuemin={0}
                    aria-valuemax={TRIAL_DURATION_DAYS}
                    aria-label="Sisa hari masa uji coba"
                    className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-[var(--em-border)]"
                  >
                    <div
                      className="h-full rounded-full bg-[var(--em-primary)] transition-all duration-500"
                      style={{ width: `${trial.progressPct}%` }}
                    />
                  </div>

                  <dl className="mt-3.5 grid grid-cols-2 gap-2 border-t border-[var(--em-border)] pt-3 text-xs">
                    <div>
                      <dt className="text-[var(--em-muted)]">Mulai trial</dt>
                      <dd className="mt-0.5 font-bold text-[var(--em-ink)]">
                        {formatDateId(trial.startedAtIso, false)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[var(--em-muted)]">Berakhir pada</dt>
                      <dd className="mt-0.5 font-bold text-[var(--em-ink)]">
                        {formatDateId(trial.expiresAtIso, false)}
                      </dd>
                    </div>
                  </dl>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[var(--em-border)] bg-[var(--em-rail)] p-4 text-xs leading-relaxed text-[var(--em-muted)]">
            <div className="flex items-start gap-2.5">
              <ShieldCheck
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--em-primary)]"
                aria-hidden="true"
              />
              <p>
                Jika masa gratis berakhir, seluruh profil, tim, dan ulasan tetap tersimpan aman dan
                kembali terbuka setelah pembayaran QRIS dikonfirmasi oleh admin.
              </p>
            </div>
          </div>
        </section>
      </div>

      {(justSubmitted || hasPendingPayment) && !trial.isPaid && (
        <section
          role="status"
          className="em-enter rounded-3xl border border-[#bde4cd] bg-[#eaf7f0] p-6 text-[#155e3d]"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#155e3d] shadow-xs">
                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#155e3d]">
                  Terima kasih! Bukti pembayaran kamu telah kami terima
                </h3>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#144c33]">
                  Mohon tunggu sebentar untuk proses verifikasi dan aktivasi akun menjadi{' '}
                  <strong>EventMate Pro</strong>. Konfirmasi akan dikirimkan oleh admin setelah
                  pembayaran QRIS berhasil diperiksa.
                </p>
                {latestPayment && (
                  <p className="mt-2 text-xs font-semibold text-[#144c33]">
                    Pengirim: {latestPayment.sender_name} · Dikirim pada{' '}
                    {formatDateId(latestPayment.created_at)}
                  </p>
                )}
              </div>
            </div>

            <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-[#8a4b00]">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              Menunggu Konfirmasi Admin
            </span>
          </div>
        </section>
      )}

      {showQrisFlow && !trial.isPaid && !hasPendingPayment && (
        <section
          aria-label="Pembayaran QRIS dan unggah bukti"
          className="em-panel-swap rounded-3xl border border-[var(--em-border)] bg-white p-6 shadow-[var(--em-shadow-frame)] sm:p-8"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--em-border)] pb-4">
            <div>
              <h3 className="text-xl font-extrabold text-[var(--em-ink)]">
                Pembayaran QRIS &amp; Konfirmasi Bukti
              </h3>
              <p className="mt-1 text-sm text-[var(--em-muted)]">
                Pindai kode QRIS di bawah senilai Rp15.000, lalu unggah tangkapan layar bukti
                pembayaran Anda.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowQrisFlow(false)}
              className="min-h-[40px] rounded-xl border border-[var(--em-border)] bg-[var(--em-rail)] px-3.5 py-2 text-xs font-bold text-[var(--em-ink)] hover:bg-[var(--em-soft)]"
            >
              Tutup Panel QRIS
            </button>
          </div>

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-5">
              <div className="em-photo-frame mx-auto max-w-[320px] overflow-hidden rounded-2xl border border-[var(--em-border)] bg-white p-3 shadow-sm">
                <img
                  src="/qris.jpeg"
                  alt="QRIS Pembayaran EventMate Pro"
                  width="767"
                  height="1080"
                  className="h-auto w-full rounded-xl object-contain"
                />
              </div>

              <div className="rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)] p-4 text-xs text-[var(--em-ink)]">
                <p className="font-extrabold">Langkah pembayaran QRIS:</p>
                <ol className="mt-2 list-inside list-decimal space-y-1 text-[var(--em-muted)]">
                  <li>Buka aplikasi e-wallet atau mobile banking berlogo QRIS.</li>
                  <li>
                    Pindai kode QRIS di atas dan masukkan nominal{' '}
                    <strong className="text-[var(--em-ink)]">Rp15.000</strong>.
                  </li>
                  <li>Simpan atau screenshot struk transaksi berhasil, lalu unggah di form.</li>
                </ol>
              </div>
            </div>

            <form onSubmit={handleSubmitProof} className="space-y-4 lg:col-span-7">
              {errorMsg && (
                <div
                  role="alert"
                  className="rounded-xl border border-[#f1c7c7] bg-[#fdeeee] p-3.5 text-sm text-[#9e2424]"
                >
                  {errorMsg}
                </div>
              )}

              <div>
                <label
                  htmlFor="pay-sender"
                  className="mb-1.5 block text-xs font-bold text-[var(--em-ink)]"
                >
                  Nama pengirim / akun e-wallet atau bank
                </label>
                <input
                  id="pay-sender"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Contoh: Budi Santoso (GoPay)"
                  className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="pay-proof"
                  className="mb-1.5 block text-xs font-bold text-[var(--em-ink)]"
                >
                  Upload bukti pembayaran (JPG, PNG, atau WEBP maks. 3 MB)
                </label>
                <label
                  htmlFor="pay-proof"
                  className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--em-input-border)] bg-[var(--em-ground)] p-5 text-center transition hover:border-[var(--em-primary)] hover:bg-[var(--em-soft)]"
                >
                  <Upload className="h-6 w-6 text-[var(--em-primary)]" aria-hidden="true" />
                  <span className="text-sm font-bold text-[var(--em-ink)]">
                    {proofFile ? proofFile.name : 'Pilih atau jatuhkan gambar bukti transfer QRIS'}
                  </span>
                  <span className="text-xs text-[var(--em-muted)]">
                    {proofFile
                      ? `${Math.round(proofFile.size / 1024)} KB siap dikirim`
                      : 'Pastikan nominal Rp15.000 dan status berhasil terlihat jelas'}
                  </span>
                  <input
                    id="pay-proof"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>

                {proofPreviewUrl && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-[var(--em-border)] bg-white p-2">
                    <img
                      src={proofPreviewUrl}
                      alt="Pratinjau bukti pembayaran yang dipilih"
                      className="max-h-56 w-auto rounded-lg object-contain"
                    />
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="pay-notes"
                  className="mb-1.5 block text-xs font-bold text-[var(--em-ink)]"
                >
                  Catatan tambahan (opsional)
                </label>
                <textarea
                  id="pay-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Transfer lewat BCA Mobile pukul 09.15 WIB"
                  className="w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="em-btn-step inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--em-primary)] px-6 py-3 text-sm font-bold text-white hover:bg-[var(--em-primary-deep)] disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>{submitting ? 'Mengunggah bukti...' : 'Konfirmasi & Kirim Bukti Pembayaran'}</span>
              </button>
            </form>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-[var(--em-border)] bg-white p-6">
        <h3 className="text-base font-extrabold text-[var(--em-ink)]">
          Riwayat Pengajuan Pembayaran QRIS
        </h3>
        {loadingPayments ? (
          <div className="mt-4">
            <LoadingState label="Memeriksa riwayat pembayaran..." />
          </div>
        ) : payments.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--em-muted)]">
            Belum ada bukti pembayaran QRIS yang dikirimkan untuk akun ini.
          </p>
        ) : (
          <div className="mt-4 space-y-2.5">
            {payments.map((pay) => (
              <div
                key={pay.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)] px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-bold text-[var(--em-ink)]">
                    QRIS EventMate Pro · Rp{Number(pay.amount || PRO_PRICE_IDR).toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-[var(--em-muted)]">
                    Pengirim: {pay.sender_name} · {formatDateId(pay.created_at)}
                  </p>
                </div>
                {pay.status === 'approved' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf7f0] px-3 py-1 text-xs font-bold text-[#155e3d]">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Disetujui Admin
                  </span>
                ) : pay.status === 'rejected' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fdeeee] px-3 py-1 text-xs font-bold text-[#9e2424]">
                    <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    Ditolak Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fef6e7] px-3 py-1 text-xs font-bold text-[#8a4b00]">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    Menunggu Konfirmasi Admin
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
