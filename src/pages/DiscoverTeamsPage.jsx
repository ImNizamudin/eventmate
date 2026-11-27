import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Plus, RotateCcw, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/layout/PageHeader';
import { TeamCard } from '../components/teams/TeamCard';
import { CreateTeamModal } from '../components/teams/CreateTeamModal';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateViews';
import { TEAM_CATEGORIES, TEAM_MODES, TEAM_REGIONS, isTrialExpired } from '../lib/constants';
import { formatSupabaseError, supabase, uniqueChannelName } from '../lib/supabaseClient';

export function DiscoverTeamsPage() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [myMemberships, setMyMemberships] = useState({});
  const [myRequests, setMyRequests] = useState({});
  const [creatorRatings, setCreatorRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');
  const [mode, setMode] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [joinNote, setJoinNote] = useState('');
  const [sendingJoin, setSendingJoin] = useState(false);

  const expired = isTrialExpired(profile);
  const isCreator = profile?.role === 'creator';

  const fetchTeams = useCallback(async () => {
    if (!supabase || !user) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const [
        { data: teamRows, error: teamErr },
        { data: memberRows, error: memErr },
        { data: reqRows, error: reqErr },
        { data: reviewRows },
      ] = await Promise.all([
        supabase
          .from('teams')
          .select('*, creator:profiles!teams_creator_id_fkey(id, name, university, major, verified)')
          .eq('status', 'open')
          .order('created_at', { ascending: false }),
        supabase.from('team_members').select('team_id, member_role').eq('user_id', user.id),
        supabase.from('join_requests').select('team_id, status').eq('applicant_id', user.id),
        supabase.from('reviews').select('reviewee_id, rating'),
      ]);

      if (teamErr) throw teamErr;
      if (memErr) throw memErr;
      if (reqErr) throw reqErr;

      const memMap = {};
      (memberRows || []).forEach((m) => {
        memMap[m.team_id] = m.member_role;
      });

      const reqMap = {};
      (reqRows || []).forEach((r) => {
        reqMap[r.team_id] = r.status;
      });

      const ratingAcc = {};
      (reviewRows || []).forEach((rev) => {
        if (!ratingAcc[rev.reviewee_id]) ratingAcc[rev.reviewee_id] = { sum: 0, count: 0 };
        ratingAcc[rev.reviewee_id].sum += rev.rating;
        ratingAcc[rev.reviewee_id].count += 1;
      });

      setTeams(teamRows || []);
      setMyMemberships(memMap);
      setMyRequests(reqMap);
      setCreatorRatings(ratingAcc);
    } catch (err) {
      setErrorMsg(formatSupabaseError(err, 'Gagal memuat daftar tim.'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    if (!supabase || !user) return undefined;
    const channel = supabase
      .channel(uniqueChannelName('discover-teams-sync'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => fetchTeams())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () =>
        fetchTeams()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'join_requests' }, () =>
        fetchTeams()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTeams]);

  const filteredTeams = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teams.filter((team) => {
      const additionalJoined = Math.max(0, (team.member_count || 1) - 1);
      const slotsLeft = Math.max(0, (team.needed_count || 0) - additionalJoined);
      if (onlyAvailable && slotsLeft <= 0) return false;
      if (category && team.category !== category) return false;
      if (region && team.region !== region && !team.city.toLowerCase().includes(region.toLowerCase())) {
        return false;
      }
      if (mode && team.mode !== mode) return false;
      if (!q) return true;
      const haystack = [
        team.title,
        team.team_name,
        team.description,
        team.city,
        team.region,
        team.creator?.name || '',
        ...(team.skills || []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [teams, query, category, region, mode, onlyAvailable]);

  const resetFilters = () => {
    setQuery('');
    setCategory('');
    setRegion('');
    setMode('');
    setOnlyAvailable(false);
  };

  const handleJoinSubmit = async (event) => {
    event.preventDefault();
    if (!supabase || !user || !selectedTeam) return;
    if (expired) {
      navigate('/subscription');
      return;
    }
    setSendingJoin(true);
    try {
      const { error } = await supabase.from('join_requests').insert({
        team_id: selectedTeam.id,
        applicant_id: user.id,
        note: joinNote.trim() || 'Saya tertarik bergabung dan siap berkontribusi sesuai keahlian.',
        status: 'pending',
      });
      if (error) throw error;
      showToast('Permintaan bergabung terkirim. Creator akan mendapat notifikasi.', 'success');
      setJoinNote('');
      setSelectedTeam(null);
      await fetchTeams();
    } catch (err) {
      showToast(formatSupabaseError(err, 'Gagal mengirim permintaan bergabung.'), 'error');
    } finally {
      setSendingJoin(false);
    }
  };

  if (expired) {
    return (
      <div>
        <PageHeader
          title="Temukan Tim"
          description="Masa uji coba 30 hari telah berakhir. Profil dan riwayatmu tetap tersimpan."
        />
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#e9cfa2] bg-[#fef6e7] p-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[#8a4b00]" aria-hidden="true" />
            <div>
              <h2 className="text-base font-extrabold text-[#683800]">
                Akses pencarian dan pengiriman permintaan dijeda
              </h2>
              <p className="mt-1 text-sm text-[#7a4b10]">
                Lihat informasi membership EventMate untuk mengaktifkan kembali akses penuh.
              </p>
            </div>
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
        title={`Temukan Tim, ${profile?.name?.split(' ')[0] || 'Rekan'}`}
        description={
          isCreator
            ? 'Lihat daftar tim yang sedang terbuka atau publikasikan tim baru milikmu.'
            : 'Jelajahi kesempatan kolaborasi terbaru dari seluruh akun EventMate dan kirim permintaan bergabung.'
        }
        actions={
          isCreator ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="em-btn-step inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--em-primary)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--em-primary-deep)]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Buat Tim Baru</span>
            </button>
          ) : null
        }
      />

      <section className="em-enter mb-6 rounded-3xl border border-[var(--em-border)] bg-white p-5 sm:p-7">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <h2 className="text-xl font-extrabold tracking-tight text-[var(--em-ink)] sm:text-2xl">
              Bangun kolaborasi berbasis keahlian, bukan tebak-tebakan
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--em-muted)]">
              Setiap perubahan tim, kuota anggota, dan status aplikasi langsung tersinkron antar
              akun. Kontak anggota tim terbuka otomatis setelah permintaanmu berstatus Accepted.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-3">
              <div className="rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)] px-3.5 py-3">
                <span className="block text-xs font-semibold text-[var(--em-muted)]">Tim Aktif</span>
                <strong className="tabular-nums mt-0.5 block text-xl font-extrabold text-[var(--em-primary)]">
                  {teams.length}
                </strong>
              </div>
              <div className="rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)] px-3.5 py-3">
                <span className="block text-xs font-semibold text-[var(--em-muted)]">
                  Aplikasi Saya
                </span>
                <strong className="tabular-nums mt-0.5 block text-xl font-extrabold text-[var(--em-ink)]">
                  {Object.keys(myRequests).length}
                </strong>
              </div>
              <div className="rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)] px-3.5 py-3">
                <span className="block text-xs font-semibold text-[var(--em-muted)]">
                  Tim Diikuti
                </span>
                <strong className="tabular-nums mt-0.5 block text-xl font-extrabold text-[#155e3d]">
                  {Object.keys(myMemberships).length}
                </strong>
              </div>
            </div>
          </div>

          <div className="hidden lg:col-span-4 lg:block">
            <div className="em-photo-frame overflow-hidden rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)]">
              <img
                src="/images/hero-collab.jpg"
                alt="Ilustrasi pencarian dan pencocokan tim EventMate"
                width="1200"
                height="669"
                className="aspect-[16/10] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label="Filter pencarian tim"
        className="mb-6 rounded-2xl border border-[var(--em-border)] bg-white p-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label htmlFor="filter-q" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
              Cari tim, kegiatan, atau keahlian
            </label>
            <input
              id="filter-q"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ketik judul, nama tim, UI/UX, Python..."
              className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="filter-cat" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
              Kategori
            </label>
            <select
              id="filter-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            >
              <option value="">Semua kategori</option>
              {TEAM_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-reg" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
              Wilayah
            </label>
            <select
              id="filter-reg"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            >
              <option value="">Semua wilayah</option>
              {TEAM_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-mode" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
              Metode
            </label>
            <select
              id="filter-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            >
              <option value="">Semua metode</option>
              {TEAM_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--em-border)] pt-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-[var(--em-ink)]">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="h-4 w-4 accent-[var(--em-primary)]"
            />
            <span>Hanya tampilkan tim yang masih membuka slot anggota</span>
          </label>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[var(--em-rail)] px-3 py-1.5 text-xs font-bold text-[var(--em-ink)] hover:bg-[var(--em-soft)]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset Filter</span>
          </button>
        </div>
      </section>

      {loading ? (
        <LoadingState label="Memuat daftar tim terbaru..." />
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={fetchTeams} />
      ) : filteredTeams.length === 0 ? (
        <EmptyState
          title={teams.length === 0 ? 'Belum ada tim yang dipublikasikan' : 'Tidak ada tim yang cocok'}
          description={
            teams.length === 0
              ? isCreator
                ? 'Jadilah yang pertama membuat kesempatan tim agar anggota lain dapat bergabung.'
                : 'Belum ada kesempatan tim terbuka saat ini. Tim baru dari Team Creator akan tampil otomatis di sini.'
              : 'Ubah kata kunci atau reset filter pencarian untuk melihat peluang lainnya.'
          }
          actionLabel={
            teams.length === 0 ? (isCreator ? 'Buat Tim Pertama' : undefined) : 'Reset Filter'
          }
          onAction={
            teams.length === 0 ? (isCreator ? () => setCreateOpen(true) : undefined) : resetFilters
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              membershipRole={myMemberships[team.id]}
              requestStatus={myRequests[team.id]}
              onSelect={(chosen) => {
                if (myMemberships[chosen.id]) {
                  navigate(`/teams?team=${chosen.id}`);
                } else {
                  setSelectedTeam(chosen);
                }
              }}
            />
          ))}
        </div>
      )}

      {isCreator && (
        <CreateTeamModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={fetchTeams}
        />
      )}

      <Modal
        open={Boolean(selectedTeam)}
        onClose={() => setSelectedTeam(null)}
        title={selectedTeam?.title || 'Detail Tim'}
        subtitle={
          selectedTeam
            ? `Tim ${selectedTeam.team_name} · ${selectedTeam.category} · ${selectedTeam.mode}`
            : ''
        }
      >
        {selectedTeam && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-[var(--em-ink)]">
              {selectedTeam.description}
            </p>

            <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)] p-4 text-xs">
              <div>
                <dt className="font-bold uppercase tracking-wide text-[var(--em-muted)]">Lokasi</dt>
                <dd className="mt-1 font-bold text-[var(--em-ink)]">
                  {selectedTeam.city}, {selectedTeam.region}
                </dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-wide text-[var(--em-muted)]">Deadline</dt>
                <dd className="mt-1 font-bold text-[var(--em-ink)]">
                  {selectedTeam.deadline || 'Belum ditentukan'}
                </dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-wide text-[var(--em-muted)]">Creator</dt>
                <dd className="mt-1 flex items-center gap-1.5 font-bold text-[var(--em-ink)]">
                  <span>{selectedTeam.creator?.name || 'Creator'}</span>
                  {creatorRatings[selectedTeam.creator_id] && (
                    <span className="inline-flex items-center gap-0.5 text-[#8a4b00]">
                      <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                      {(
                        creatorRatings[selectedTeam.creator_id].sum /
                        creatorRatings[selectedTeam.creator_id].count
                      ).toFixed(1)}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-wide text-[var(--em-muted)]">Kuota</dt>
                <dd className="tabular-nums mt-1 font-bold text-[var(--em-ink)]">
                  {selectedTeam.member_count || 1} anggota aktif ·{' '}
                  {Math.max(
                    0,
                    (selectedTeam.needed_count || 0) -
                      Math.max(0, (selectedTeam.member_count || 1) - 1)
                  )}{' '}
                  slot tersisa
                </dd>
              </div>
            </dl>

            {selectedTeam.skills?.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-bold text-[var(--em-ink)]">
                  Keahlian yang dicari
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTeam.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md bg-[var(--em-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--em-primary)]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {myRequests[selectedTeam.id] ? (
              <div className="flex items-center justify-between rounded-xl border border-[var(--em-border)] bg-[var(--em-rail)] p-4">
                <div>
                  <p className="text-xs font-bold text-[var(--em-ink)]">Status Aplikasi Kamu</p>
                  <p className="mt-0.5 text-xs text-[var(--em-muted)]">
                    Pantau keputusan atau daftar undangan di halaman Permintaan.
                  </p>
                </div>
                <StatusBadge status={myRequests[selectedTeam.id]} />
              </div>
            ) : isCreator ? (
              <div className="rounded-xl border border-[var(--em-border)] bg-[var(--em-rail)] p-4 text-xs text-[var(--em-muted)]">
                Akun dengan peran <strong className="text-[var(--em-ink)]">Team Creator</strong>{' '}
                hanya dapat membuat tim dan mengundang anggota. Hanya akun{' '}
                <strong className="text-[var(--em-ink)]">Team Seeker</strong> yang dapat
                mengirim permintaan bergabung.
              </div>
            ) : (
              <form onSubmit={handleJoinSubmit} className="space-y-3 border-t border-[var(--em-border)] pt-4">
                <div>
                  <label htmlFor="join-note" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
                    Catatan singkat untuk Team Creator
                  </label>
                  <textarea
                    id="join-note"
                    rows={3}
                    value={joinNote}
                    onChange={(e) => setJoinNote(e.target.value)}
                    placeholder="Perkenalkan peran atau keahlian yang ingin kamu kontribusikan di tim ini..."
                    className="w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedTeam(null)}
                    className="min-h-[44px] rounded-xl border border-[var(--em-border)] bg-white px-4 py-2 text-sm font-bold text-[var(--em-ink)]"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={sendingJoin}
                    className="min-h-[44px] rounded-xl bg-[var(--em-primary)] px-5 py-2 text-sm font-bold text-white transition hover:bg-[var(--em-primary-deep)] disabled:opacity-60"
                  >
                    {sendingJoin ? 'Mengirim...' : 'Kirim Permintaan Bergabung'}
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
