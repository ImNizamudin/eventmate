import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  Flag,
  QrCode,
  ShieldCheck,
  Star,
  Trash2,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Modal } from '../components/ui/Modal';
import { AdminOverviewDiagram } from '../components/ui/AdminOverviewDiagram';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateViews';
import { PRO_PRICE_IDR, formatDateId, getInitials } from '../lib/constants';
import { formatSupabaseError, supabase, uniqueChannelName } from '../lib/supabaseClient';

export function AdminPage() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState('overview');
  const [usersList, setUsersList] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reports, setReports] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actingId, setActingId] = useState('');

  const [userSearch, setUserSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [proofModal, setProofModal] = useState(null);
  const [proofSignedUrl, setProofSignedUrl] = useState('');
  const [loadingProof, setLoadingProof] = useState(false);

  const fetchAdminData = useCallback(async () => {
    if (!supabase || !user || profile?.role !== 'admin') return;
    setLoading(true);
    setErrorMsg('');
    try {
      const [profRes, payRes, repRes, teamRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase
          .from('membership_payments')
          .select('*, payer:profiles!membership_payments_user_id_fkey(id, name, email, paid)')
          .order('created_at', { ascending: false }),
        supabase
          .from('reports')
          .select(
            '*, reporter:profiles!reports_reporter_id_fkey(name, email), target_user:profiles!reports_target_user_id_fkey(name, email), target_team:teams(id, team_name, title, status)'
          )
          .order('created_at', { ascending: false }),
        supabase
          .from('teams')
          .select('*, creator:profiles!teams_creator_id_fkey(name, email)')
          .order('created_at', { ascending: false }),
      ]);

      if (profRes.error) throw profRes.error;
      setUsersList(profRes.data || []);
      setPayments(payRes.data || []);
      setReports(repRes.data || []);
      setTeams(teamRes.data || []);
    } catch (err) {
      setErrorMsg(formatSupabaseError(err, 'Gagal memuat data Panel Admin.'));
    } finally {
      setLoading(false);
    }
  }, [user, profile?.role]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  useEffect(() => {
    if (!supabase || !user || profile?.role !== 'admin') return undefined;
    const channel = supabase
      .channel(uniqueChannelName('admin-live-sync'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () =>
        fetchAdminData()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'membership_payments' }, () =>
        fetchAdminData()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () =>
        fetchAdminData()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () =>
        fetchAdminData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile?.role, fetchAdminData]);

  const metrics = useMemo(() => {
    const pendingVerifications = usersList.filter(
      (u) => u.verification_requested && !u.verified
    ).length;
    const pendingPayments = payments.filter((p) => p.status === 'pending').length;
    const openReports = reports.filter((r) => r.status === 'open').length;
    const proUsers = usersList.filter((u) => u.paid).length;
    return {
      totalUsers: usersList.length,
      pendingVerifications,
      pendingPayments,
      openReports,
      totalTeams: teams.length,
      proUsers,
    };
  }, [usersList, payments, reports, teams]);

  const verificationQueue = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return [...usersList]
      .sort((a, b) => {
        const aPending = a.verification_requested && !a.verified ? 0 : 1;
        const bPending = b.verification_requested && !b.verified ? 0 : 1;
        return aPending - bPending;
      })
      .filter((u) => {
        if (!q) return true;
        return [u.name, u.email, u.university, u.major].join(' ').toLowerCase().includes(q);
      });
  }, [usersList, userSearch]);

  const filteredTeams = useMemo(() => {
    const q = teamSearch.trim().toLowerCase();
    return teams.filter((t) => {
      if (!q) return true;
      return [t.team_name, t.title, t.category, t.city, t.creator?.name || '']
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [teams, teamSearch]);

  const handleVerificationDecision = async (targetUser, approve) => {
    if (!supabase) return;
    setActingId(targetUser.id);
    try {
      const patch = approve
        ? { verified: true, verification_requested: false }
        : { verified: false, verification_requested: false };
      const { error } = await supabase.from('profiles').update(patch).eq('id', targetUser.id);
      if (error) throw error;
      showToast(
        approve
          ? `Identitas ${targetUser.name} berhasil diverifikasi.`
          : `Pengajuan verifikasi ${targetUser.name} ditolak/dicabut.`,
        'success'
      );
      await fetchAdminData();
    } catch (err) {
      showToast(formatSupabaseError(err, 'Gagal memperbarui status verifikasi.'), 'error');
    } finally {
      setActingId('');
    }
  };

  const handleTogglePro = async (targetUser) => {
    if (!supabase) return;
    setActingId(targetUser.id);
    try {
      const nextPaid = !targetUser.paid;
      const { error } = await supabase
        .from('profiles')
        .update({ paid: nextPaid, updated_at: new Date().toISOString() })
        .eq('id', targetUser.id);
      if (error) throw error;
      showToast(
        nextPaid
          ? `${targetUser.name} sekarang berstatus EventMate Pro.`
          : `Status Pro untuk ${targetUser.name} dinonaktifkan.`,
        'success'
      );
      await fetchAdminData();
    } catch (err) {
      showToast(formatSupabaseError(err, 'Gagal mengubah status Pro.'), 'error');
    } finally {
      setActingId('');
    }
  };

  const openProofViewer = async (payment) => {
    if (!supabase) return;
    setProofModal(payment);
    setProofSignedUrl('');
    setLoadingProof(true);
    try {
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(payment.proof_path, 300);
      if (error) throw error;
      setProofSignedUrl(data.signedUrl);
    } catch (err) {
      showToast(formatSupabaseError(err, 'Gagal membuka gambar bukti transfer.'), 'error');
    } finally {
      setLoadingProof(false);
    }
  };

  const handlePaymentDecision = async (payment, status) => {
    if (!supabase) return;
    setActingId(payment.id);
    try {
      const { error } = await supabase
        .from('membership_payments')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', payment.id);
      if (error) throw error;
      showToast(
        status === 'approved'
          ? `Pembayaran disetujui! Akun ${payment.payer?.name || 'pengguna'} kini EventMate Pro.`
          : 'Pengajuan pembayaran QRIS ditolak.',
        'success'
      );
      setProofModal(null);
      await fetchAdminData();
    } catch (err) {
      showToast(formatSupabaseError(err, 'Gagal memperbarui status pembayaran.'), 'error');
    } finally {
      setActingId('');
    }
  };

  const handleReportStatus = async (reportId, status) => {
    if (!supabase) return;
    setActingId(reportId);
    try {
      const { error } = await supabase.from('reports').update({ status }).eq('id', reportId);
      if (error) throw error;
      showToast(`Status laporan diperbarui menjadi ${status}.`, 'success');
      await fetchAdminData();
    } catch (err) {
      showToast(formatSupabaseError(err, 'Gagal memperbarui status laporan.'), 'error');
    } finally {
      setActingId('');
    }
  };

  const handleToggleTeamStatus = async (team) => {
    if (!supabase) return;
    setActingId(team.id);
    try {
      const nextStatus = team.status === 'open' ? 'closed' : 'open';
      const { error } = await supabase
        .from('teams')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', team.id);
      if (error) throw error;
      showToast(
        nextStatus === 'closed'
          ? `Tim ${team.team_name} ditutup oleh admin.`
          : `Tim ${team.team_name} dibuka kembali.`,
        'success'
      );
      await fetchAdminData();
    } catch (err) {
      showToast(formatSupabaseError(err, 'Gagal mengubah status tim.'), 'error');
    } finally {
      setActingId('');
    }
  };

  const handleDeleteTeam = async (team) => {
    if (!supabase) return;
    setActingId(team.id);
    try {
      const { error } = await supabase.from('teams').delete().eq('id', team.id);
      if (error) throw error;
      showToast(`Tim ${team.team_name} dihapus permanen.`, 'info');
      await fetchAdminData();
    } catch (err) {
      showToast(formatSupabaseError(err, 'Gagal menghapus tim.'), 'error');
    } finally {
      setActingId('');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel Kontrol Admin"
        description="Pusat kendali verifikasi identitas, konfirmasi pembayaran QRIS Pro, moderasi laporan keamanan, dan pengawasan tim."
      />

      <section className="em-enter rounded-3xl border border-[var(--em-border)] bg-white p-5 sm:p-7">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--em-soft)] px-3 py-1 text-xs font-extrabold text-[var(--em-primary)]">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>ADMINISTRATOR GOVERNANCE</span>
            </div>
            <h2 className="mt-3 text-xl font-extrabold tracking-tight text-[var(--em-ink)] sm:text-2xl">
              Ringkasan tugas aktif &amp; antrean persetujuan
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--em-muted)]">
              Setiap persetujuan admin otomatis memperbarui status di akun pengguna terkait dan
              mengirim notifikasi secara real-time melalui Supabase.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
              <button
                type="button"
                onClick={() => setTab('verifications')}
                className="em-card-lift rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)] p-3.5 text-left"
              >
                <span className="block text-xs font-semibold text-[var(--em-muted)]">
                  Antrean Verifikasi
                </span>
                <strong className="tabular-nums mt-1 block text-2xl font-extrabold text-[var(--em-primary)]">
                  {metrics.pendingVerifications}
                </strong>
              </button>
              <button
                type="button"
                onClick={() => setTab('payments')}
                className="em-card-lift rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)] p-3.5 text-left"
              >
                <span className="block text-xs font-semibold text-[var(--em-muted)]">
                  QRIS Menunggu
                </span>
                <strong className="tabular-nums mt-1 block text-2xl font-extrabold text-[var(--em-rose)]">
                  {metrics.pendingPayments}
                </strong>
              </button>
              <button
                type="button"
                onClick={() => setTab('reports')}
                className="em-card-lift rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)] p-3.5 text-left"
              >
                <span className="block text-xs font-semibold text-[var(--em-muted)]">
                  Laporan Terbuka
                </span>
                <strong className="tabular-nums mt-1 block text-2xl font-extrabold text-[#9e2424]">
                  {metrics.openReports}
                </strong>
              </button>
              <button
                type="button"
                onClick={() => setTab('teams_users')}
                className="em-card-lift rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)] p-3.5 text-left"
              >
                <span className="block text-xs font-semibold text-[var(--em-muted)]">
                  Pengguna / Pro
                </span>
                <strong className="tabular-nums mt-1 block text-2xl font-extrabold text-[#155e3d]">
                  {metrics.totalUsers} / {metrics.proUsers}
                </strong>
              </button>
            </div>
          </div>

          <div className="hidden lg:col-span-4 lg:block">
            <div className="em-photo-frame overflow-hidden rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)]">
              <img
                src="/images/admin-ops.jpg"
                alt="Ilustrasi pusat kontrol verifikasi dan moderasi Admin EventMate"
                width="1200"
                height="669"
                className="aspect-[16/10] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <div role="tablist" aria-label="Menu tugas admin" className="flex flex-wrap gap-2">
        {[
          { id: 'overview', label: 'Ringkasan Tugas', icon: ShieldCheck },
          {
            id: 'verifications',
            label: `Verifikasi Identitas (${metrics.pendingVerifications})`,
            icon: UserCheck,
          },
          {
            id: 'payments',
            label: `Pembayaran QRIS (${metrics.pendingPayments})`,
            icon: QrCode,
          },
          {
            id: 'reports',
            label: `Laporan & Keamanan (${metrics.openReports})`,
            icon: Flag,
          },
          {
            id: 'teams_users',
            label: `Tim & Pengguna (${metrics.totalTeams})`,
            icon: Briefcase,
          },
        ].map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={`em-btn-step inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold sm:text-sm ${
                active
                  ? 'border-[var(--em-primary)] bg-[var(--em-primary)] text-white'
                  : 'border-[var(--em-border)] bg-white text-[var(--em-ink)] hover:bg-[var(--em-rail)]'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingState label="Memuat data kendali admin..." />
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={fetchAdminData} />
      ) : (
        <>
          {tab === 'overview' && (
            <div className="em-panel-swap space-y-6">
              <AdminOverviewDiagram
                pendingVerifications={metrics.pendingVerifications}
                pendingPayments={metrics.pendingPayments}
                openReports={metrics.openReports}
                totalTeams={metrics.totalTeams}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  {
                    targetTab: 'verifications',
                    icon: UserCheck,
                    title: 'Verifikasi Identitas Mahasiswa',
                    desc: 'Memeriksa pengajuan lencana Terverifikasi dari pengguna agar direktori individu lebih dapat dipercaya, lalu menyetujui atau mencabut verifikasi.',
                    cta: `Buka Antrean (${metrics.pendingVerifications})`,
                  },
                  {
                    targetTab: 'payments',
                    icon: QrCode,
                    title: 'Konfirmasi Pembayaran QRIS Pro',
                    desc: 'Melihat pratinjau bukti transfer QRIS Rp15.000 yang diunggah pengguna dan mengaktifkan status EventMate Pro dalam satu klik.',
                    cta: `Periksa Pembayaran (${metrics.pendingPayments})`,
                  },
                  {
                    targetTab: 'reports',
                    icon: Flag,
                    title: 'Penanganan Laporan Penyalahgunaan',
                    desc: 'Meninjau laporan penyalahgunaan kontak, spam, atau profil palsu dan memperbarui status tindak lanjut ke Reviewed atau Resolved.',
                    cta: `Tinjau Laporan (${metrics.openReports})`,
                  },
                  {
                    targetTab: 'teams_users',
                    icon: Users,
                    title: 'Pengawasan Tim & Manajemen Pengguna',
                    desc: 'Menutup atau menghapus tim yang melanggar ketentuan serta mengelola status Pro atau Verifikasi seluruh akun terdaftar.',
                    cta: `Kelola ${metrics.totalTeams} Tim & ${metrics.totalUsers} Akun`,
                  },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <article
                      key={card.targetTab}
                      className="em-card-lift flex flex-col justify-between rounded-2xl border border-[var(--em-border)] bg-white p-5"
                    >
                      <div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--em-soft)] text-[var(--em-primary)]">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <h3 className="mt-3 text-base font-extrabold text-[var(--em-ink)]">
                          {card.title}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-[var(--em-muted)]">
                          {card.desc}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTab(card.targetTab)}
                        className="em-btn-step mt-4 inline-flex min-h-[42px] items-center justify-center self-start rounded-xl bg-[var(--em-rail)] px-4 py-2 text-xs font-bold text-[var(--em-primary)] hover:bg-[var(--em-soft)]"
                      >
                        {card.cta}
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'verifications' && (
            <div className="em-panel-swap space-y-4">
              <div className="rounded-2xl border border-[var(--em-border)] bg-white p-4">
                <label
                  htmlFor="admin-user-search"
                  className="mb-1.5 block text-xs font-bold text-[var(--em-ink)]"
                >
                  Cari pengguna untuk verifikasi identitas
                </label>
                <input
                  id="admin-user-search"
                  type="search"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Cari nama, email, universitas, atau jurusan..."
                  className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
                />
              </div>

              {verificationQueue.length === 0 ? (
                <EmptyState
                  title="Tidak ada pengguna ditemukan"
                  description="Ubah kata kunci pencarian atau tunggu pengguna baru mendaftar."
                />
              ) : (
                <div className="space-y-3">
                  {verificationQueue.map((u) => {
                    const isPending = u.verification_requested && !u.verified;
                    return (
                      <article
                        key={u.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--em-border)] bg-white p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--em-soft)] text-sm font-extrabold text-[var(--em-primary)]">
                            {u.avatar_url ? (
                              <img
                                src={u.avatar_url}
                                alt={u.name}
                                width="44"
                                height="44"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              getInitials(u.name)
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-extrabold text-[var(--em-ink)]">
                                {u.name}
                              </h3>
                              <span className="rounded-md bg-[var(--em-rail)] px-2 py-0.5 text-xs font-bold text-[var(--em-muted)]">
                                {u.role}
                              </span>
                              {u.verified && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf7f0] px-2.5 py-0.5 text-xs font-bold text-[#155e3d]">
                                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                  Terverifikasi
                                </span>
                              )}
                              {isPending && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#fef6e7] px-2.5 py-0.5 text-xs font-bold text-[#8a4b00]">
                                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                  Mengajukan Verifikasi
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--em-muted)]">
                              {u.email} · {u.major || 'Jurusan belum diisi'} ·{' '}
                              {u.university || 'Kampus belum diisi'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {!u.verified ? (
                            <>
                              {isPending && (
                                <button
                                  type="button"
                                  disabled={actingId === u.id}
                                  onClick={() => handleVerificationDecision(u, false)}
                                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#f1c7c7] bg-[#fdeeee] px-3 py-2 text-xs font-bold text-[#9e2424]"
                                >
                                  <X className="h-4 w-4" aria-hidden="true" />
                                  <span>Tolak</span>
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={actingId === u.id}
                                onClick={() => handleVerificationDecision(u, true)}
                                className="em-btn-step inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[var(--em-primary)] px-4 py-2 text-xs font-bold text-white"
                              >
                                <Check className="h-4 w-4" aria-hidden="true" />
                                <span>Setujui Verifikasi</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              disabled={actingId === u.id}
                              onClick={() => handleVerificationDecision(u, false)}
                              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[var(--em-border)] bg-[var(--em-rail)] px-3.5 py-2 text-xs font-bold text-[var(--em-ink)]"
                            >
                              Cabut Verifikasi
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'payments' && (
            <div className="em-panel-swap space-y-3">
              {payments.length === 0 ? (
                <EmptyState
                  title="Belum ada pengajuan pembayaran QRIS"
                  description="Bukti transfer QRIS yang dikirim oleh pengguna di halaman Membership akan tampil di sini."
                />
              ) : (
                payments.map((pay) => (
                  <article
                    key={pay.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--em-border)] bg-white p-5"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-extrabold text-[var(--em-ink)]">
                          {pay.payer?.name || pay.sender_name}
                        </h3>
                        {pay.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf7f0] px-2.5 py-0.5 text-xs font-bold text-[#155e3d]">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Disetujui
                          </span>
                        ) : pay.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#fdeeee] px-2.5 py-0.5 text-xs font-bold text-[#9e2424]">
                            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            Ditolak
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#fef6e7] px-2.5 py-0.5 text-xs font-bold text-[#8a4b00]">
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            Menunggu Konfirmasi
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-[var(--em-muted)]">
                        Akun: {pay.payer?.email || '-'} · Pengirim QRIS: {pay.sender_name} · Nominal
                        Rp{Number(pay.amount || PRO_PRICE_IDR).toLocaleString('id-ID')}
                      </p>
                      {pay.notes && (
                        <p className="mt-1 text-xs text-[var(--em-ink)]">Catatan: {pay.notes}</p>
                      )}
                      <p className="mt-1 text-xs text-[var(--em-muted)]">
                        Dikirim pada {formatDateId(pay.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openProofViewer(pay)}
                        className="em-btn-step inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[var(--em-border)] bg-[var(--em-rail)] px-3.5 py-2 text-xs font-bold text-[var(--em-ink)] hover:bg-[var(--em-soft)]"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        <span>Lihat Bukti</span>
                      </button>

                      {pay.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            disabled={actingId === pay.id}
                            onClick={() => handlePaymentDecision(pay, 'rejected')}
                            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[#f1c7c7] bg-[#fdeeee] px-3.5 py-2 text-xs font-bold text-[#9e2424]"
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                            <span>Tolak</span>
                          </button>
                          <button
                            type="button"
                            disabled={actingId === pay.id}
                            onClick={() => handlePaymentDecision(pay, 'approved')}
                            className="em-btn-step inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[var(--em-primary)] px-4 py-2 text-xs font-bold text-white"
                          >
                            <Check className="h-4 w-4" aria-hidden="true" />
                            <span>Aktifkan Pro</span>
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          {tab === 'reports' && (
            <div className="em-panel-swap space-y-3">
              {reports.length === 0 ? (
                <EmptyState
                  title="Belum ada laporan penyalahgunaan"
                  description="Laporan yang dikirim pengguna dari Member Directory atau Direktori Individu akan tampil di sini."
                />
              ) : (
                reports.map((rep) => (
                  <article
                    key={rep.id}
                    className="rounded-2xl border border-[var(--em-border)] bg-white p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <span className="rounded-md bg-[#fdeeee] px-2.5 py-1 text-xs font-bold text-[#9e2424]">
                          {rep.category}
                        </span>
                        <h3 className="mt-2 text-sm font-extrabold text-[var(--em-ink)]">
                          Pelapor: {rep.reporter?.name || 'Pengguna'} ({rep.reporter?.email || '-'})
                        </h3>
                        <p className="text-xs text-[var(--em-muted)]">
                          Terlapor: {rep.target_user?.name || 'Tidak spesifik'}{' '}
                          {rep.target_team ? `· Tim ${rep.target_team.team_name}` : ''} ·{' '}
                          {formatDateId(rep.created_at)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          rep.status === 'resolved'
                            ? 'bg-[#eaf7f0] text-[#155e3d]'
                            : rep.status === 'reviewed'
                              ? 'bg-[var(--em-soft)] text-[var(--em-primary)]'
                              : 'bg-[#fef6e7] text-[#8a4b00]'
                        }`}
                      >
                        {rep.status === 'resolved'
                          ? 'Resolved'
                          : rep.status === 'reviewed'
                            ? 'Reviewed'
                            : 'Open'}
                      </span>
                    </div>

                    <p className="mt-3 rounded-xl bg-[var(--em-ground)] p-3 text-sm text-[var(--em-ink)]">
                      {rep.details}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-[var(--em-border)] pt-3">
                      {rep.status === 'open' && (
                        <button
                          type="button"
                          disabled={actingId === rep.id}
                          onClick={() => handleReportStatus(rep.id, 'reviewed')}
                          className="min-h-[40px] rounded-xl border border-[var(--em-border)] bg-[var(--em-rail)] px-3.5 py-2 text-xs font-bold text-[var(--em-primary)]"
                        >
                          Tandai Ditinjau
                        </button>
                      )}
                      {rep.status !== 'resolved' && (
                        <button
                          type="button"
                          disabled={actingId === rep.id}
                          onClick={() => handleReportStatus(rep.id, 'resolved')}
                          className="em-btn-step min-h-[40px] rounded-xl bg-[var(--em-primary)] px-4 py-2 text-xs font-bold text-white"
                        >
                          Tandai Selesai
                        </button>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          {tab === 'teams_users' && (
            <div className="em-panel-swap grid grid-cols-1 gap-6 lg:grid-cols-12">
              <section className="space-y-3 lg:col-span-7">
                <div className="rounded-2xl border border-[var(--em-border)] bg-white p-4">
                  <label
                    htmlFor="admin-team-search"
                    className="mb-1.5 block text-xs font-bold text-[var(--em-ink)]"
                  >
                    Pengawasan Tim Terpublikasi ({filteredTeams.length})
                  </label>
                  <input
                    id="admin-team-search"
                    type="search"
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    placeholder="Cari nama tim, judul kegiatan, atau creator..."
                    className="min-h-[42px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
                  />
                </div>

                {filteredTeams.length === 0 ? (
                  <EmptyState
                    title="Belum ada tim"
                    description="Tim yang dipublikasikan oleh Team Creator akan tampil di daftar ini."
                  />
                ) : (
                  filteredTeams.map((t) => (
                    <article
                      key={t.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--em-border)] bg-white p-4"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-extrabold text-[var(--em-ink)]">
                            {t.team_name} · {t.title}
                          </h3>
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                              t.status === 'open'
                                ? 'bg-[#eaf7f0] text-[#155e3d]'
                                : 'bg-[#fdeeee] text-[#9e2424]'
                            }`}
                          >
                            {t.status === 'open' ? 'Open' : 'Closed'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[var(--em-muted)]">
                          Creator: {t.creator?.name || '-'} · {t.category} · {t.member_count || 1}{' '}
                          anggota
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={actingId === t.id}
                          onClick={() => handleToggleTeamStatus(t)}
                          className="min-h-[38px] rounded-xl border border-[var(--em-border)] bg-[var(--em-rail)] px-3 py-1.5 text-xs font-bold text-[var(--em-ink)]"
                        >
                          {t.status === 'open' ? 'Tutup Tim' : 'Buka Tim'}
                        </button>
                        <button
                          type="button"
                          disabled={actingId === t.id}
                          onClick={() => handleDeleteTeam(t)}
                          aria-label={`Hapus tim ${t.team_name}`}
                          className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-[#f1c7c7] bg-[#fdeeee] px-3 py-1.5 text-xs font-bold text-[#9e2424]"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </section>

              <section className="space-y-3 lg:col-span-5">
                <div className="rounded-2xl border border-[var(--em-border)] bg-white p-4">
                  <h3 className="text-sm font-extrabold text-[var(--em-ink)]">
                    Direktori Akun &amp; Status Pro ({usersList.length})
                  </h3>
                  <p className="mt-0.5 text-xs text-[var(--em-muted)]">
                    Kelola aktivasi EventMate Pro langsung untuk setiap akun.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {usersList.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--em-border)] bg-white p-3.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-[var(--em-ink)]">
                          {u.name}
                        </p>
                        <p className="truncate text-xs text-[var(--em-muted)]">
                          {u.email} · {u.role}
                        </p>
                      </div>

                      {u.role !== 'admin' && (
                        <button
                          type="button"
                          disabled={actingId === u.id}
                          onClick={() => handleTogglePro(u)}
                          className={`inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold ${
                            u.paid
                              ? 'bg-[#eaf7f0] text-[#155e3d]'
                              : 'bg-[var(--em-soft)] text-[var(--em-primary)]'
                          }`}
                        >
                          <Star
                            className={`h-3.5 w-3.5 ${u.paid ? 'fill-current' : ''}`}
                            aria-hidden="true"
                          />
                          <span>{u.paid ? 'Pro Aktif' : 'Aktifkan Pro'}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </>
      )}

      <Modal
        open={Boolean(proofModal)}
        onClose={() => setProofModal(null)}
        title={`Bukti Transfer QRIS: ${proofModal?.payer?.name || proofModal?.sender_name || ''}`}
        subtitle={
          proofModal
            ? `Pengirim: ${proofModal.sender_name} · Nominal Rp${Number(
                proofModal.amount || PRO_PRICE_IDR
              ).toLocaleString('id-ID')}`
            : ''
        }
      >
        {proofModal && (
          <div className="space-y-4">
            {loadingProof ? (
              <LoadingState label="Memuat gambar bukti pembayaran..." />
            ) : proofSignedUrl ? (
              <div className="overflow-hidden rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)] p-2">
                <img
                  src={proofSignedUrl}
                  alt="Bukti pembayaran QRIS pengguna"
                  className="max-h-[60vh] w-full rounded-xl object-contain"
                />
              </div>
            ) : (
              <p className="text-sm text-[#9e2424]">
                Gambar bukti pembayaran tidak dapat dimuat. Pastikan bucket payment-proofs dan
                policy admin sudah aktif.
              </p>
            )}

            {proofModal.status === 'pending' && (
              <div className="flex justify-end gap-2.5 border-t border-[var(--em-border)] pt-4">
                <button
                  type="button"
                  disabled={actingId === proofModal.id}
                  onClick={() => handlePaymentDecision(proofModal, 'rejected')}
                  className="min-h-[44px] rounded-xl border border-[#f1c7c7] bg-[#fdeeee] px-4 py-2 text-sm font-bold text-[#9e2424]"
                >
                  Tolak Bukti
                </button>
                <button
                  type="button"
                  disabled={actingId === proofModal.id}
                  onClick={() => handlePaymentDecision(proofModal, 'approved')}
                  className="em-btn-step min-h-[44px] rounded-xl bg-[var(--em-primary)] px-5 py-2 text-sm font-bold text-white"
                >
                  Setujui &amp; Aktifkan Pro
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
