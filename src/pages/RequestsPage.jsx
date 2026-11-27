import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateViews';
import { formatDateId } from '../lib/constants';
import { formatSupabaseError, supabase, uniqueChannelName } from '../lib/supabaseClient';

export function RequestsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState('incoming_requests');
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [incomingInvites, setIncomingInvites] = useState([]);
  const [outgoingInvites, setOutgoingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actingId, setActingId] = useState(null);

  const fetchAllRequests = useCallback(async () => {
    if (!supabase || !user) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const { data: myOwnedTeams, error: ownedErr } = await supabase
        .from('teams')
        .select('id')
        .eq('creator_id', user.id);
      if (ownedErr) throw ownedErr;

      const ownedTeamIds = (myOwnedTeams || []).map((t) => t.id);

      const [inReqRes, outReqRes, inInvRes, outInvRes] = await Promise.all([
        ownedTeamIds.length > 0
          ? supabase
              .from('join_requests')
              .select(
                '*, applicant:profiles!join_requests_applicant_id_fkey(id, name, university, major, skills), team:teams(id, team_name, title)'
              )
              .in('team_id', ownedTeamIds)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from('join_requests')
          .select('*, team:teams(id, team_name, title, category, mode, city, region)')
          .eq('applicant_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('team_invitations')
          .select(
            '*, inviter:profiles!team_invitations_inviter_id_fkey(id, name, university), team:teams(id, team_name, title, category, mode)'
          )
          .eq('invitee_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('team_invitations')
          .select(
            '*, invitee:profiles!team_invitations_invitee_id_fkey(id, name, university, major), team:teams(id, team_name, title)'
          )
          .eq('inviter_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (inReqRes.error) throw inReqRes.error;
      if (outReqRes.error) throw outReqRes.error;
      if (inInvRes.error) throw inInvRes.error;
      if (outInvRes.error) throw outInvRes.error;

      setIncomingRequests(inReqRes.data || []);
      setMyApplications(outReqRes.data || []);
      setIncomingInvites(inInvRes.data || []);
      setOutgoingInvites(outInvRes.data || []);
    } catch (err) {
      setErrorMsg(formatSupabaseError(err, 'Gagal memuat daftar permintaan dan undangan.'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAllRequests();
  }, [fetchAllRequests]);

  useEffect(() => {
    if (!supabase || !user) return undefined;
    const channel = supabase
      .channel(uniqueChannelName('requests-live-sync'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'join_requests' }, () =>
        fetchAllRequests()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_invitations' }, () =>
        fetchAllRequests()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAllRequests]);

  const decideJoinRequest = async (requestId, status) => {
    if (!supabase || !user) return;
    setActingId(requestId);
    try {
      const { error } = await supabase
        .from('join_requests')
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);
      if (error) throw error;
      showToast(
        status === 'accepted'
          ? 'Permintaan diterima. Anggota otomatis masuk ke Member Directory tim.'
          : 'Permintaan bergabung ditolak.',
        'success'
      );
      await fetchAllRequests();
    } catch (err) {
      showToast(formatSupabaseError(err, 'Gagal memperbarui status permintaan.'), 'error');
    } finally {
      setActingId(null);
    }
  };

  const decideInvitation = async (inviteId, status) => {
    if (!supabase || !user) return;
    setActingId(inviteId);
    try {
      const { error } = await supabase
        .from('team_invitations')
        .update({
          status,
          responded_at: new Date().toISOString(),
        })
        .eq('id', inviteId);
      if (error) throw error;
      showToast(
        status === 'accepted'
          ? 'Undangan diterima! Kamu kini tergabung di workspace tim.'
          : 'Undangan tim ditolak.',
        'success'
      );
      await fetchAllRequests();
    } catch (err) {
      showToast(formatSupabaseError(err, 'Gagal merespons undangan.'), 'error');
    } finally {
      setActingId(null);
    }
  };

  const pendingIncomingReqCount = incomingRequests.filter((r) => r.status === 'pending').length;
  const pendingIncomingInvCount = incomingInvites.filter((i) => i.status === 'pending').length;

  return (
    <div>
      <PageHeader
        title="Permintaan & Status Aplikasi"
        description="Kelola permintaan bergabung masuk, pantau Application Status (Pending, Accepted, Rejected), dan jawab undangan individu."
      />

      <div role="tablist" aria-label="Kategori permintaan" className="mb-6 flex flex-wrap gap-2">
        {[
          {
            id: 'incoming_requests',
            label: `Permintaan Masuk (${pendingIncomingReqCount})`,
          },
          {
            id: 'my_applications',
            label: `Application Status Saya (${myApplications.length})`,
          },
          {
            id: 'incoming_invites',
            label: `Undangan Masuk (${pendingIncomingInvCount})`,
          },
          {
            id: 'outgoing_invites',
            label: `Undangan Terkirim (${outgoingInvites.length})`,
          },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`min-h-[44px] rounded-xl border px-4 py-2 text-xs font-bold transition sm:text-sm ${
              tab === item.id
                ? 'border-[var(--em-primary)] bg-[var(--em-primary)] text-white'
                : 'border-[var(--em-border)] bg-white text-[var(--em-ink)] hover:bg-[var(--em-rail)]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState label="Memuat status permintaan dan undangan..." />
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={fetchAllRequests} />
      ) : (
        <>
          {tab === 'incoming_requests' && (
            <div className="em-panel-swap space-y-3">
              {incomingRequests.length === 0 ? (
                <EmptyState
                  title="Belum ada permintaan bergabung masuk"
                  description="Saat individu mengajukan diri ke tim yang kamu buat, permintaannya akan muncul di sini."
                  actionLabel="Lihat Tim Saya"
                  actionTo="/teams"
                />
              ) : (
                incomingRequests.map((req) => (
                  <article
                    key={req.id}
                    className="rounded-2xl border border-[var(--em-border)] bg-white p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-extrabold text-[var(--em-ink)]">
                          {req.applicant?.name || 'Kandidat'}
                        </h2>
                        <p className="text-xs text-[var(--em-muted)]">
                          {req.applicant?.major || 'Jurusan belum diisi'} ·{' '}
                          {req.applicant?.university || 'Universitas belum diisi'}
                        </p>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>

                    <p className="mt-3 rounded-xl bg-[var(--em-ground)] p-3 text-sm text-[var(--em-ink)]">
                      {req.note || 'Tidak ada catatan tambahan.'}
                    </p>

                    {req.applicant?.skills?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {req.applicant.skills.map((s) => (
                          <span
                            key={s}
                            className="rounded-md bg-[var(--em-rail)] px-2 py-1 text-xs font-medium text-[var(--em-ink)]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--em-border)] pt-3">
                      <div className="text-xs text-[var(--em-muted)]">
                        Melamar ke{' '}
                        <strong className="text-[var(--em-ink)]">
                          {req.team?.team_name} ({req.team?.title})
                        </strong>{' '}
                        · {formatDateId(req.created_at)}
                      </div>

                      {req.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={actingId === req.id}
                            onClick={() => decideJoinRequest(req.id, 'rejected')}
                            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[#f1c7c7] bg-[#fdeeee] px-3.5 py-2 text-xs font-bold text-[#9e2424] hover:bg-[#fadede]"
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                            <span>Tolak</span>
                          </button>
                          <button
                            type="button"
                            disabled={actingId === req.id}
                            onClick={() => decideJoinRequest(req.id, 'accepted')}
                            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[var(--em-primary)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--em-primary-deep)]"
                          >
                            <Check className="h-4 w-4" aria-hidden="true" />
                            <span>Terima Anggota</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          {tab === 'my_applications' && (
            <div className="em-panel-swap space-y-3">
              {myApplications.length === 0 ? (
                <EmptyState
                  title="Kamu belum mengirim permintaan bergabung"
                  description="Cari tim yang sesuai keahlianmu di halaman Temukan Tim untuk mulai mengajukan diri."
                  actionLabel="Jelajahi Tim"
                  actionTo="/discover"
                />
              ) : (
                myApplications.map((app) => (
                  <article
                    key={app.id}
                    className="rounded-2xl border border-[var(--em-border)] bg-white p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-extrabold text-[var(--em-ink)]">
                          {app.team?.title || 'Tim'}
                        </h2>
                        <p className="text-xs font-semibold text-[var(--em-primary)]">
                          Tim {app.team?.team_name} · {app.team?.category} · {app.team?.mode}
                        </p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="mt-2.5 text-sm text-[var(--em-muted)]">{app.note}</p>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--em-border)] pt-3 text-xs text-[var(--em-muted)]">
                      <span>Dikirim pada {formatDateId(app.created_at)}</span>
                      {app.status === 'accepted' && (
                        <Link
                          to={`/teams?team=${app.team_id}`}
                          className="inline-flex min-h-[40px] items-center rounded-xl bg-[var(--em-soft)] px-3.5 py-2 font-bold text-[var(--em-primary)] hover:bg-[#e7dbfa]"
                        >
                          Buka Member Directory & Kontak
                        </Link>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          {tab === 'incoming_invites' && (
            <div className="em-panel-swap space-y-3">
              {incomingInvites.length === 0 ? (
                <EmptyState
                  title="Belum ada undangan bergabung"
                  description="Lengkapi profil dan keahlianmu agar Team Creator dapat menemukan dan mengundangmu ke tim."
                  actionLabel="Perbarui Profil"
                  actionTo="/profile"
                />
              ) : (
                incomingInvites.map((inv) => (
                  <article
                    key={inv.id}
                    className="rounded-2xl border border-[var(--em-border)] bg-white p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-extrabold text-[var(--em-ink)]">
                          Undangan ke {inv.team?.team_name}
                        </h2>
                        <p className="text-xs text-[var(--em-muted)]">
                          {inv.team?.title} · diundang oleh{' '}
                          <strong className="text-[var(--em-ink)]">
                            {inv.inviter?.name || 'Creator'}
                          </strong>
                        </p>
                      </div>
                      <StatusBadge status={inv.status} />
                    </div>
                    {inv.message && (
                      <p className="mt-3 rounded-xl bg-[var(--em-ground)] p-3 text-sm text-[var(--em-ink)]">
                        {inv.message}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--em-border)] pt-3">
                      <span className="text-xs text-[var(--em-muted)]">
                        Diterima pada {formatDateId(inv.created_at)}
                      </span>
                      {inv.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={actingId === inv.id}
                            onClick={() => decideInvitation(inv.id, 'rejected')}
                            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[#f1c7c7] bg-[#fdeeee] px-3.5 py-2 text-xs font-bold text-[#9e2424]"
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                            <span>Tolak</span>
                          </button>
                          <button
                            type="button"
                            disabled={actingId === inv.id}
                            onClick={() => decideInvitation(inv.id, 'accepted')}
                            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[var(--em-primary)] px-4 py-2 text-xs font-bold text-white"
                          >
                            <Check className="h-4 w-4" aria-hidden="true" />
                            <span>Terima Undangan</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          {tab === 'outgoing_invites' && (
            <div className="em-panel-swap space-y-3">
              {outgoingInvites.length === 0 ? (
                <EmptyState
                  title="Belum ada undangan terkirim"
                  description="Cari kandidat yang cocok di halaman Temukan Individu dan kirim undangan ke tim yang kamu kelola."
                  actionLabel="Cari Individu"
                  actionTo="/people"
                />
              ) : (
                outgoingInvites.map((inv) => (
                  <article
                    key={inv.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--em-border)] bg-white p-5"
                  >
                    <div>
                      <h2 className="text-sm font-extrabold text-[var(--em-ink)]">
                        {inv.invitee?.name || 'Kandidat'} · {inv.team?.team_name}
                      </h2>
                      <p className="mt-0.5 text-xs text-[var(--em-muted)]">
                        {inv.invitee?.major || ''} · {inv.invitee?.university || ''} ·{' '}
                        {formatDateId(inv.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={inv.status} />
                  </article>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
