import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/layout/PageHeader';
import { CreateTeamModal } from '../components/teams/CreateTeamModal';
import { TeamWorkspace } from '../components/teams/TeamWorkspace';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateViews';
import { formatSupabaseError, supabase } from '../lib/supabaseClient';

export function TeamsPage() {
  const { user, profile } = useAuth();
  const isCreator = profile?.role === 'creator';
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTeamId = searchParams.get('team');

  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(requestedTeamId || '');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const fetchMyTeams = useCallback(async () => {
    if (!supabase || !user) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const { data: memberships, error: memErr } = await supabase
        .from('team_members')
        .select('team_id, member_role, team:teams(*)')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (memErr) throw memErr;

      const list = (memberships || [])
        .filter((m) => m.team)
        .map((m) => ({
          ...m.team,
          myRole: m.member_role,
        }));

      setTeams(list);
      if (list.length > 0) {
        const match =
          list.find((t) => t.id === requestedTeamId) ||
          list.find((t) => t.id === selectedTeamId) ||
          list[0];
        setSelectedTeamId(match.id);
      } else {
        setSelectedTeamId('');
      }
    } catch (err) {
      setErrorMsg(formatSupabaseError(err, 'Gagal memuat daftar tim kamu.'));
    } finally {
      setLoading(false);
    }
  }, [user, requestedTeamId, selectedTeamId]);

  useEffect(() => {
    fetchMyTeams();
  }, [fetchMyTeams]);

  const activeTeam = teams.find((t) => t.id === selectedTeamId) || teams[0] || null;

  return (
    <div>
      <PageHeader
        title="Tim Saya & Ruang Kolaborasi"
        description={
          isCreator
            ? 'Kelola tim yang kamu buat, pengumuman resmi, Member Directory, serta ulasan dan keamanan.'
            : 'Lihat tim yang sudah menerima kamu, baca pengumuman creator, serta akses Member Directory dan kontak anggota.'
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

      {loading ? (
        <LoadingState label="Memuat tim yang kamu ikuti..." />
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={fetchMyTeams} />
      ) : teams.length === 0 ? (
        <EmptyState
          title="Kamu belum tergabung dalam tim mana pun"
          description={
            isCreator
              ? 'Buat tim baru sebagai Team Creator untuk mulai membuka rekrutmen dan mengundang kandidat.'
              : 'Kirim permintaan bergabung ke tim di halaman Temukan Tim atau terima undangan dari Team Creator.'
          }
          actionLabel={isCreator ? 'Buat Tim Baru' : 'Cari Tim Sekarang'}
          onAction={isCreator ? () => setCreateOpen(true) : undefined}
          actionTo={!isCreator ? '/discover' : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <aside className="space-y-2 lg:col-span-4" aria-label="Daftar tim saya">
            {teams.map((item) => {
              const isSelected = activeTeam?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedTeamId(item.id);
                    setSearchParams({ team: item.id });
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    isSelected
                      ? 'border-2 border-[var(--em-primary)] bg-[var(--em-soft)]'
                      : 'border-[var(--em-border)] bg-white hover:bg-[var(--em-rail)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--em-primary)]">
                      {item.myRole === 'creator' ? 'Creator' : 'Anggota'}
                    </span>
                    <span className="tabular-nums text-xs text-[var(--em-muted)]">
                      {item.member_count || 1} anggota
                    </span>
                  </div>
                  <h3 className="mt-1 text-base font-extrabold text-[var(--em-ink)]">
                    {item.team_name}
                  </h3>
                  <p className="mt-0.5 line-clamp-1 text-xs text-[var(--em-muted)]">{item.title}</p>
                </button>
              );
            })}
          </aside>

          <div className="lg:col-span-8">
            {activeTeam && <TeamWorkspace team={activeTeam} onTeamUpdated={fetchMyTeams} />}
          </div>
        </div>
      )}

      {isCreator && (
        <CreateTeamModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={(created) => {
            if (created?.id) {
              setSelectedTeamId(created.id);
              setSearchParams({ team: created.id });
            }
            fetchMyTeams();
          }}
        />
      )}
    </div>
  );
}
