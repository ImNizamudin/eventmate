import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Lock, RotateCcw, ShieldAlert, Star, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Modal } from '../components/ui/Modal';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateViews';
import { formatDateId, getInitials, isTrialExpired } from '../lib/constants';
import { formatSupabaseError, supabase, uniqueChannelName } from '../lib/supabaseClient';

export function DiscoverPeoplePage() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [people, setPeople] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [blockedIds, setBlockedIds] = useState(new Set());
  const [reviewsByUser, setReviewsByUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [query, setQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [interestFilter, setInterestFilter] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const [selectedPerson, setSelectedPerson] = useState(null);
  const [inviteTeamId, setInviteTeamId] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [reportMode, setReportMode] = useState(false);
  const [reportCategory, setReportCategory] = useState('Profil mencurigakan');
  const [reportDetails, setReportDetails] = useState('');

  const expired = isTrialExpired(profile);
  const isCreator = profile?.role === 'creator';

  const fetchPeople = useCallback(async () => {
    if (!supabase || !user) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const [
        { data: profRows, error: profErr },
        { data: teamRows, error: teamErr },
        { data: blockRows },
        { data: reviewRows },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .order('updated_at', { ascending: false }),
        supabase
          .from('teams')
          .select('id, team_name, title')
          .eq('creator_id', user.id)
          .eq('status', 'open')
          .order('created_at', { ascending: false }),
        supabase.from('user_blocks').select('blocked_id').eq('blocker_id', user.id),
        supabase
          .from('reviews')
          .select('*, reviewer:profiles!reviews_reviewer_id_fkey(name), team:teams(team_name)')
          .order('created_at', { ascending: false }),
      ]);

      if (profErr) throw profErr;
      if (teamErr) throw teamErr;

      const blockedSet = new Set((blockRows || []).map((b) => b.blocked_id));
      const revMap = {};
      (reviewRows || []).forEach((rev) => {
        if (!revMap[rev.reviewee_id]) revMap[rev.reviewee_id] = [];
        revMap[rev.reviewee_id].push(rev);
      });

      setBlockedIds(blockedSet);
      setPeople(profRows || []);
      setMyTeams(teamRows || []);
      if (teamRows?.length && !inviteTeamId) {
        setInviteTeamId(teamRows[0].id);
      }
      setReviewsByUser(revMap);
    } catch (err) {
      setErrorMsg(formatSupabaseError(err, 'Gagal memuat direktori individu.'));
    } finally {
      setLoading(false);
    }
  }, [user, inviteTeamId]);

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  useEffect(() => {
    if (!supabase || !user) return undefined;
    const channel = supabase
      .channel(uniqueChannelName('discover-people-sync'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () =>
        fetchPeople()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () =>
        fetchPeople()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchPeople]);

  const getRatingSummary = useCallback(
    (personId) => {
      const list = reviewsByUser[personId] || [];
      if (!list.length) return { avg: 0, count: 0 };
      const sum = list.reduce((acc, item) => acc + item.rating, 0);
      return { avg: sum / list.length, count: list.length };
    },
    [reviewsByUser]
  );

  const filteredPeople = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sk = skillFilter.trim().toLowerCase();
    const it = interestFilter.trim().toLowerCase();

    const list = people.filter((person) => {
      if (blockedIds.has(person.id)) return false;
      if (sk && !(person.skills || []).join(' ').toLowerCase().includes(sk)) return false;
      if (it && !(person.interests || []).join(' ').toLowerCase().includes(it)) return false;
      if (!q) return true;
      const haystack = [
        person.name,
        person.username,
        person.university,
        person.major,
        person.bio,
        person.experience,
        ...(person.skills || []),
        ...(person.interests || []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    if (sortBy === 'rating') {
      return [...list].sort((a, b) => getRatingSummary(b.id).avg - getRatingSummary(a.id).avg);
    }
    return list;
  }, [people, blockedIds, query, skillFilter, interestFilter, sortBy, getRatingSummary]);

  const handleSendInvite = async (event) => {
    event.preventDefault();
    if (!supabase || !user || !selectedPerson || !inviteTeamId) return;
    setSendingInvite(true);
    try {
      const { error } = await supabase.from('team_invitations').insert({
        team_id: inviteTeamId,
        inviter_id: user.id,
        invitee_id: selectedPerson.id,
        message: inviteMessage.trim() || 'Kami mengundangmu untuk berkolaborasi bersama tim kami.',
        status: 'pending',
      });
      if (error) throw error;
      showToast(`Undangan berhasil dikirim ke ${selectedPerson.name}.`, 'success');
      setInviteMessage('');
      setSelectedPerson(null);
    } catch (err) {
      showToast(formatSupabaseError(err, 'Gagal mengirim undangan.'), 'error');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleBlockAndReport = async (event) => {
    event.preventDefault();
    if (!supabase || !user || !selectedPerson) return;
    setSendingInvite(true);
    try {
      await supabase.from('reports').insert({
        reporter_id: user.id,
        target_user_id: selectedPerson.id,
        category: reportCategory,
        details: reportDetails.trim(),
      });
      await supabase.from('user_blocks').upsert(
        {
          blocker_id: user.id,
          blocked_id: selectedPerson.id,
          reason: reportCategory,
        },
        { onConflict: 'blocker_id,blocked_id' }
      );
      showToast(`${selectedPerson.name} telah dilaporkan dan diblokir.`, 'success');
      setReportMode(false);
      setReportDetails('');
      setSelectedPerson(null);
      await fetchPeople();
    } catch (err) {
      showToast(formatSupabaseError(err, 'Gagal mengirim laporan.'), 'error');
    } finally {
      setSendingInvite(false);
    }
  };

  if (expired) {
    return (
      <div>
        <PageHeader
          title="Temukan Individu"
          description="Masa uji coba 30 hari telah berakhir. Aktifkan membership untuk melanjutkan pencarian kandidat."
        />
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#e9cfa2] bg-[#fef6e7] p-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[#8a4b00]" aria-hidden="true" />
            <p className="text-sm font-medium text-[#683800]">
              Fitur undangan dan pencarian individu dijeda sampai membership aktif.
            </p>
          </div>
          <Link
            to="/subscription"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--em-primary)] px-4 py-2 text-sm font-bold text-white"
          >
            Lihat Membership
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Temukan Individu"
        description="Cari rekan berdasarkan keahlian, minat, pengalaman, serta riwayat rating kolaborasi."
      />

      <section
        aria-label="Filter pencarian individu"
        className="mb-6 rounded-2xl border border-[var(--em-border)] bg-white p-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="ppl-q" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
              Cari nama, kampus, atau jurusan
            </label>
            <input
              id="ppl-q"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Contoh: Sistem Informasi, Malang..."
              className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="ppl-skill" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
              Filter keahlian
            </label>
            <input
              id="ppl-skill"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              placeholder="Contoh: UI/UX, React, Pitching"
              className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="ppl-interest" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
              Filter minat
            </label>
            <input
              id="ppl-interest"
              value={interestFilter}
              onChange={(e) => setInterestFilter(e.target.value)}
              placeholder="Contoh: Kompetisi, Riset"
              className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="ppl-sort" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
              Urutkan
            </label>
            <div className="flex gap-2">
              <select
                id="ppl-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="min-h-[44px] flex-1 rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
              >
                <option value="recent">Terbaru diperbarui</option>
                <option value="rating">Rating tertinggi</option>
              </select>
              <button
                type="button"
                aria-label="Reset filter individu"
                onClick={() => {
                  setQuery('');
                  setSkillFilter('');
                  setInterestFilter('');
                  setSortBy('recent');
                }}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[var(--em-rail)] px-3 text-[var(--em-ink)] hover:bg-[var(--em-soft)]"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <LoadingState label="Memuat direktori individu..." />
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={fetchPeople} />
      ) : filteredPeople.length === 0 ? (
        <EmptyState
          title="Belum ada profil individu yang cocok"
          description={
            people.length === 0
              ? 'Pengguna lain yang mendaftar dan melengkapi profil akan otomatis tampil di halaman ini.'
              : 'Coba ubah kata kunci atau filter keahlian untuk melihat calon rekan lainnya.'
          }
          actionLabel={people.length > 0 ? 'Reset Filter' : undefined}
          onAction={
            people.length > 0
              ? () => {
                  setQuery('');
                  setSkillFilter('');
                  setInterestFilter('');
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPeople.map((person) => {
            const rating = getRatingSummary(person.id);
            return (
              <article
                key={person.id}
                className="em-card-lift flex flex-col justify-between rounded-2xl border border-[var(--em-border)] bg-white p-5"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--em-soft)] text-sm font-extrabold text-[var(--em-primary)]">
                      {person.avatar_url ? (
                        <img
                          src={person.avatar_url}
                          alt={person.name}
                          width="48"
                          height="48"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getInitials(person.name)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="truncate text-base font-extrabold text-[var(--em-ink)]">
                          {person.name}
                        </h3>
                        {person.verified && (
                          <CheckCircle2
                            className="h-4 w-4 shrink-0 text-[var(--em-primary)]"
                            aria-label="Terverifikasi"
                          />
                        )}
                      </div>
                      <p className="truncate text-xs text-[var(--em-muted)]">
                        @{person.username || 'member'} · {person.major || 'Mahasiswa'}
                      </p>
                      <p className="truncate text-xs font-semibold text-[var(--em-ink)]">
                        {person.university || 'Institusi belum diisi'}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--em-muted)]">
                    {person.bio || 'Belum menambahkan bio kolaborasi.'}
                  </p>

                  {person.skills?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {person.skills.slice(0, 5).map((sk) => (
                        <span
                          key={sk}
                          className="rounded-md bg-[var(--em-rail)] px-2 py-1 text-xs font-medium text-[var(--em-ink)]"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-[var(--em-border)] pt-3.5">
                  <div className="inline-flex items-center gap-1 text-xs font-bold text-[#8a4b00]">
                    <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                    <span className="tabular-nums">
                      {rating.count > 0 ? `${rating.avg.toFixed(1)} (${rating.count})` : 'Belum ada ulasan'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPerson(person);
                      setReportMode(false);
                    }}
                    className="em-btn-step inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[var(--em-soft)] px-3.5 py-2 text-xs font-bold text-[var(--em-primary)] hover:bg-[#e7dbfa]"
                  >
                    <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{isCreator ? 'Profil & Undang' : 'Lihat Profil'}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(selectedPerson)}
        onClose={() => setSelectedPerson(null)}
        title={selectedPerson?.name || 'Profil Individu'}
        subtitle={
          selectedPerson
            ? `@${selectedPerson.username || 'member'} · ${selectedPerson.major || ''} · ${selectedPerson.university || ''}`
            : ''
        }
      >
        {selectedPerson && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)] p-4">
              <p className="text-sm leading-relaxed text-[var(--em-ink)]">
                {selectedPerson.bio || 'Pengguna belum menambahkan bio.'}
              </p>
              {selectedPerson.experience && (
                <div className="mt-3 border-t border-[var(--em-border)] pt-3">
                  <p className="text-xs font-bold text-[var(--em-ink)]">Pengalaman</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--em-muted)]">
                    {selectedPerson.experience}
                  </p>
                </div>
              )}
              <p className="mt-2 text-xs text-[var(--em-muted)]">
                Informasi kontak pribadi hanya terbuka setelah pengguna menerima undangan atau
                permintaan bergabung ke dalam satu tim.
              </p>
            </div>

            {selectedPerson.skills?.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-bold text-[var(--em-ink)]">Keahlian</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPerson.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-md bg-[var(--em-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--em-primary)]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-bold text-[var(--em-ink)]">
                Rating & Ulasan Kolaborasi ({(reviewsByUser[selectedPerson.id] || []).length})
              </p>
              {(reviewsByUser[selectedPerson.id] || []).length === 0 ? (
                <p className="text-xs text-[var(--em-muted)]">
                  Belum ada ulasan dari kolaborasi sebelumnya.
                </p>
              ) : (
                <div className="space-y-2">
                  {(reviewsByUser[selectedPerson.id] || []).slice(0, 4).map((rev) => (
                    <div
                      key={rev.id}
                      className="rounded-xl border border-[var(--em-border)] bg-white p-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[var(--em-ink)]">
                          {rev.reviewer?.name || 'Rekan Tim'} · {rev.team?.team_name || 'Tim'}
                        </span>
                        <span className="font-bold text-[#8a4b00]">{rev.rating}/5</span>
                      </div>
                      <p className="mt-1 text-[var(--em-muted)]">{rev.comment}</p>
                      <p className="mt-1 text-xs text-[var(--em-muted)]">
                        {formatDateId(rev.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!reportMode ? (
              <div className="border-t border-[var(--em-border)] pt-4">
                {!isCreator ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-[var(--em-muted)]">
                      Hanya akun dengan peran <strong className="text-[var(--em-ink)]">Team Creator</strong>{' '}
                      yang dapat mengirim undangan bergabung ke tim.
                    </p>
                    <button
                      type="button"
                      onClick={() => setReportMode(true)}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#9e2424] hover:bg-[#fdeeee]"
                    >
                      <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                      <span>Laporkan / Blokir</span>
                    </button>
                  </div>
                ) : myTeams.length > 0 ? (
                  <form onSubmit={handleSendInvite} className="space-y-3">
                    <div>
                      <label
                        htmlFor="invite-team-select"
                        className="mb-1 block text-xs font-bold text-[var(--em-ink)]"
                      >
                        Pilih tim yang kamu kelola
                      </label>
                      <select
                        id="invite-team-select"
                        value={inviteTeamId}
                        onChange={(e) => setInviteTeamId(e.target.value)}
                        className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
                      >
                        {myTeams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.team_name} ({t.title})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="invite-msg"
                        className="mb-1 block text-xs font-bold text-[var(--em-ink)]"
                      >
                        Pesan ajakan
                      </label>
                      <textarea
                        id="invite-msg"
                        rows={2}
                        value={inviteMessage}
                        onChange={(e) => setInviteMessage(e.target.value)}
                        placeholder="Jelaskan posisi atau peran yang cocok untuk kandidat ini..."
                        className="w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setReportMode(true)}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#9e2424] hover:bg-[#fdeeee]"
                      >
                        <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                        <span>Laporkan / Blokir</span>
                      </button>
                      <button
                        type="submit"
                        disabled={sendingInvite}
                        className="min-h-[44px] rounded-xl bg-[var(--em-primary)] px-5 py-2 text-sm font-bold text-white transition hover:bg-[var(--em-primary-deep)] disabled:opacity-60"
                      >
                        {sendingInvite ? 'Mengirim...' : 'Kirim Undangan Tim'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-[var(--em-muted)]">
                      Buat tim terlebih dahulu di halaman Tim Saya untuk mengundang individu.
                    </p>
                    <button
                      type="button"
                      onClick={() => setReportMode(true)}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#9e2424] hover:bg-[#fdeeee]"
                    >
                      <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                      <span>Laporkan / Blokir</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <form
                onSubmit={handleBlockAndReport}
                className="space-y-3 rounded-2xl border border-[#f1c7c7] bg-[#fdeeee] p-4"
              >
                <p className="text-xs font-bold text-[#9e2424]">
                  Laporkan & Blokir Pengguna
                </p>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  aria-label="Kategori laporan"
                  className="min-h-[42px] w-full rounded-lg border border-[#e3adad] bg-white px-3 py-2 text-sm"
                >
                  <option>Profil mencurigakan</option>
                  <option>Penyalahgunaan kontak</option>
                  <option>Perilaku tidak pantas</option>
                  <option>Lainnya</option>
                </select>
                <textarea
                  required
                  rows={2}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Jelaskan masalah yang terjadi..."
                  className="w-full rounded-lg border border-[#e3adad] bg-white px-3 py-2 text-sm"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReportMode(false)}
                    className="min-h-[40px] rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-[var(--em-ink)]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={sendingInvite}
                    className="min-h-[40px] rounded-xl bg-[#9e2424] px-4 py-2 text-xs font-bold text-white"
                  >
                    Kirim & Blokir
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
