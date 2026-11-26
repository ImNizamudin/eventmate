import { useCallback, useEffect, useState } from 'react';
import {
  Ban,
  ExternalLink,
  Flag,
  Lock,
  Mail,
  Megaphone,
  MessageSquare,
  Pin,
  Send,
  ShieldCheck,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../ui/StateViews';
import { formatDateId, getInitials } from '../../lib/constants';
import { formatSupabaseError, supabase } from '../../lib/supabaseClient';

export function TeamWorkspace({ team, onTeamUpdated }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('directory');
  const [members, setMembers] = useState([]);
  const [contactsByUser, setContactsByUser] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [teamRequests, setTeamRequests] = useState([]);
  const [myReviewsGiven, setMyReviewsGiven] = useState({});
  const [blockedIds, setBlockedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPinned, setAnnPinned] = useState(false);
  const [postingAnn, setPostingAnn] = useState(false);

  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const [safetyTarget, setSafetyTarget] = useState(null);
  const [reportCategory, setReportCategory] = useState('Penyalahgunaan kontak');
  const [reportDetails, setReportDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);

  const isCreator = team.creator_id === user?.id;

  const fetchWorkspaceData = useCallback(async () => {
    if (!supabase || !user || !team?.id) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const [
        { data: memRows, error: memErr },
        { data: annRows, error: annErr },
        { data: reqRows },
        { data: revRows },
        { data: blockRows },
      ] = await Promise.all([
        supabase
          .from('team_members')
          .select(
            '*, profile:profiles(id, name, username, university, major, skills, avatar_url, verified)'
          )
          .eq('team_id', team.id)
          .order('joined_at', { ascending: true }),
        supabase
          .from('team_announcements')
          .select('*, author:profiles!team_announcements_author_id_fkey(name)')
          .eq('team_id', team.id)
          .order('pinned', { ascending: false })
          .order('created_at', { ascending: false }),
        isCreator
          ? supabase
              .from('join_requests')
              .select('*, applicant:profiles!join_requests_applicant_id_fkey(name, university)')
              .eq('team_id', team.id)
              .order('created_at', { ascending: false })
          : supabase
              .from('join_requests')
              .select('*')
              .eq('team_id', team.id)
              .eq('applicant_id', user.id),
        supabase
          .from('reviews')
          .select('*')
          .eq('team_id', team.id)
          .eq('reviewer_id', user.id),
        supabase.from('user_blocks').select('blocked_id').eq('blocker_id', user.id),
      ]);

      if (memErr) throw memErr;
      if (annErr) throw annErr;

      const memberUserIds = (memRows || []).map((m) => m.user_id);
      let contactMap = {};
      if (memberUserIds.length > 0) {
        const { data: contactRows } = await supabase
          .from('profile_contacts')
          .select('*')
          .in('user_id', memberUserIds);
        (contactRows || []).forEach((c) => {
          contactMap[c.user_id] = c;
        });
      }

      const revMap = {};
      (revRows || []).forEach((r) => {
        revMap[r.reviewee_id] = r;
      });

      setMembers(memRows || []);
      setContactsByUser(contactMap);
      setAnnouncements(annRows || []);
      setTeamRequests(reqRows || []);
      setMyReviewsGiven(revMap);
      setBlockedIds(new Set((blockRows || []).map((b) => b.blocked_id)));
    } catch (err) {
      setErrorMsg(formatSupabaseError(err, 'Gagal memuat ruang kolaborasi tim.'));
    } finally {
      setLoading(false);
    }
  }, [team?.id, user, isCreator]);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  useEffect(() => {
    if (!supabase || !team?.id) return undefined;
    const channel = supabase
      .channel(`workspace-${team.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_members', filter: `team_id=eq.${team.id}` },
        () => fetchWorkspaceData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_announcements',
          filter: `team_id=eq.${team.id}`,
        },
        () => fetchWorkspaceData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_blocks' },
        () => fetchWorkspaceData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [team?.id, fetchWorkspaceData]);

  const handlePostAnnouncement = async (event) => {
    event.preventDefault();
    if (!supabase || !user || !isCreator) return;
    setPostingAnn(true);
    try {
      const { error } = await supabase.from('team_announcements').insert({
        team_id: team.id,
        author_id: user.id,
        title: annTitle.trim(),
        content: annContent.trim(),
        pinned: annPinned,
      });
      if (error) throw error;
      showToast('Pengumuman berhasil dipublikasikan ke seluruh anggota tim.', 'success');
      setAnnTitle('');
      setAnnContent('');
      setAnnPinned(false);
      await fetchWorkspaceData();
    } catch (err) {
      showToast(formatSupabaseError(err, 'Gagal mengirim pengumuman.'), 'error');
    } finally {
      setPostingAnn(false);
    }
  };

  const handleDeleteAnnouncement = async (annId) => {
    if (!supabase || !isCreator) return;
    try {
      const { error } = await supabase.from('team_announcements').delete().eq('id', annId);
      if (error) throw error;
      showToast('Pengumuman dihapus.', 'info');
      await fetchWorkspaceData();
    } catch (err) {
      showToast(formatSupabaseError(err, 'Gagal menghapus pengumuman.'), 'error');
    }
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    if (!supabase || !user || !reviewTarget) return;
    setSubmittingAction(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        team_id: team.id,
        reviewer_id: user.id,
        reviewee_id: reviewTarget.user_id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      if (error) throw error;
      showToast(`Ulasan untuk ${reviewTarget.profile?.name} berhasil disimpan.`, 'success');
      setReviewTarget(null);
      setReviewComment('');
      setReviewRating(5);
      await fetchWorkspaceData();
    } catch (err) {
      showToast(formatSupabaseError(err, 'Gagal menyimpan ulasan.'), 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSafetySubmit = async (event) => {
    event.preventDefault();
    if (!supabase || !user || !safetyTarget) return;
    setSubmittingAction(true);
    try {
      const { error: repErr } = await supabase.from('reports').insert({
        reporter_id: user.id,
        target_user_id: safetyTarget.user_id,
        target_team_id: team.id,
        category: reportCategory,
        details: reportDetails.trim(),
      });
      if (repErr) throw repErr;

      if (alsoBlock) {
        const { error: blkErr } = await supabase.from('user_blocks').upsert(
          {
            blocker_id: user.id,
            blocked_id: safetyTarget.user_id,
            reason: reportCategory,
          },
          { onConflict: 'blocker_id,blocked_id' }
        );
        if (blkErr) throw blkErr;
      }

      showToast(
        alsoBlock
          ? `Laporan dicatat dan ${safetyTarget.profile?.name} diblokir.`
          : 'Laporan penyalahgunaan dicatat.',
        'success'
      );
      setSafetyTarget(null);
      setReportDetails('');
      await fetchWorkspaceData();
    } catch (err) {
      showToast(formatSupabaseError(err, 'Gagal memproses laporan.'), 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleToggleTeamStatus = async () => {
    if (!supabase || !isCreator) return;
    const nextStatus = team.status === 'open' ? 'closed' : 'open';
    try {
      const { error } = await supabase
        .from('teams')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', team.id);
      if (error) throw error;
      showToast(
        nextStatus === 'closed'
          ? 'Pendaftaran tim ditutup dari pencarian publik.'
          : 'Pendaftaran tim dibuka kembali.',
        'success'
      );
      onTeamUpdated?.();
    } catch (err) {
      showToast(formatSupabaseError(err, 'Gagal mengubah status tim.'), 'error');
    }
  };

  return (
    <div className="rounded-3xl border border-[var(--em-border)] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--em-border)] pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-[var(--em-soft)] px-2.5 py-1 text-xs font-bold text-[var(--em-primary)]">
              {team.category}
            </span>
            <span className="rounded-lg bg-[var(--em-rail)] px-2.5 py-1 text-xs font-semibold text-[var(--em-muted)]">
              {team.mode} · {team.city}
            </span>
            <StatusBadge status="accepted" />
          </div>
          <h2 className="mt-2.5 text-xl font-extrabold text-[var(--em-ink)]">{team.team_name}</h2>
          <p className="text-sm text-[var(--em-muted)]">{team.title}</p>
        </div>

        {isCreator && (
          <button
            type="button"
            onClick={handleToggleTeamStatus}
            className="min-h-[42px] rounded-xl border border-[var(--em-border)] bg-[var(--em-rail)] px-3.5 py-2 text-xs font-bold text-[var(--em-ink)] hover:bg-[var(--em-soft)]"
          >
            {team.status === 'open' ? 'Tutup Rekrutmen' : 'Buka Rekrutmen'}
          </button>
        )}
      </div>

      <div role="tablist" aria-label="Bagian workspace tim" className="my-5 flex flex-wrap gap-2">
        {[
          {
            id: 'directory',
            label: `Member Directory & Contact (${members.length})`,
            icon: Users,
          },
          {
            id: 'announcements',
            label: `Announcement (${announcements.length})`,
            icon: Megaphone,
          },
          {
            id: 'status',
            label: 'Application Status',
            icon: ShieldCheck,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
              className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition sm:text-sm ${
                activeTab === item.id
                  ? 'border-[var(--em-primary)] bg-[var(--em-primary)] text-white'
                  : 'border-[var(--em-border)] bg-white text-[var(--em-ink)] hover:bg-[var(--em-rail)]'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingState label="Memuat data anggota dan pengumuman..." />
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={fetchWorkspaceData} />
      ) : (
        <>
          {activeTab === 'directory' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[var(--em-border)] bg-[var(--em-rail)] p-3.5 text-xs text-[var(--em-muted)]">
                <strong className="text-[var(--em-ink)]">Contact Information</strong> hanya
                ditampilkan untuk anggota yang sudah berstatus <strong>Accepted</strong> di tim ini
                dan sesuai persetujuan berbagi kontak masing-masing anggota.
              </div>

              <div className="space-y-3">
                {members.map((member) => {
                  const p = member.profile || {};
                  const isSelf = member.user_id === user?.id;
                  const isBlocked = blockedIds.has(member.user_id);
                  const contact = contactsByUser[member.user_id];
                  const existingReview = myReviewsGiven[member.user_id];

                  return (
                    <article
                      key={member.id}
                      className="rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--em-soft)] text-sm font-extrabold text-[var(--em-primary)]">
                            {p.avatar_url ? (
                              <img
                                src={p.avatar_url}
                                alt={p.name || 'Anggota'}
                                width="44"
                                height="44"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              getInitials(p.name)
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-extrabold text-[var(--em-ink)]">
                                {p.name || 'Anggota'}
                                {isSelf ? ' (Kamu)' : ''}
                              </h3>
                              <span
                                className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                                  member.member_role === 'creator'
                                    ? 'bg-[var(--em-primary)] text-white'
                                    : 'bg-white text-[var(--em-primary)]'
                                }`}
                              >
                                {member.member_role === 'creator' ? 'Team Creator' : 'Anggota'}
                              </span>
                            </div>
                            <p className="text-xs text-[var(--em-muted)]">
                              {p.major || 'Jurusan belum diisi'} ·{' '}
                              {p.university || 'Universitas belum diisi'}
                            </p>
                          </div>
                        </div>

                        {!isSelf && (
                          <div className="flex flex-wrap gap-2">
                            {!existingReview ? (
                              <button
                                type="button"
                                onClick={() => setReviewTarget(member)}
                                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[var(--em-soft)] px-3 py-1.5 text-xs font-bold text-[var(--em-primary)] hover:bg-[#e7dbfa]"
                              >
                                <Star className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Beri Rating</span>
                              </button>
                            ) : (
                              <span className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-[var(--em-border)] bg-white px-3 py-1.5 text-xs font-bold text-[#8a4b00]">
                                <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                                <span>Dinilai {existingReview.rating}/5</span>
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => setSafetyTarget(member)}
                              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#f1c7c7] bg-[#fdeeee] px-3 py-1.5 text-xs font-bold text-[#9e2424] hover:bg-[#fadede]"
                            >
                              <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Report & Block</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {p.skills?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {p.skills.map((s) => (
                            <span
                              key={s}
                              className="rounded-md bg-white px-2 py-1 text-xs font-medium text-[var(--em-ink)]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 rounded-xl border border-[var(--em-border)] bg-white p-3">
                        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[var(--em-ink)]">
                          <Lock className="h-3.5 w-3.5 text-[var(--em-primary)]" aria-hidden="true" />
                          <span>Contact Information</span>
                        </p>

                        {isBlocked ? (
                          <p className="flex items-center gap-1.5 text-xs font-semibold text-[#9e2424]">
                            <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Pengguna ini diblokir. Informasi kontak disembunyikan.</span>
                          </p>
                        ) : !contact ? (
                          <p className="text-xs text-[var(--em-muted)]">
                            Anggota memilih untuk tidak membagikan kontak atau belum mengisi kontak.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-3 text-xs text-[var(--em-ink)]">
                            {contact.whatsapp && (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--em-rail)] px-2.5 py-1.5 font-medium">
                                <MessageSquare className="h-3.5 w-3.5 text-[#155e3d]" aria-hidden="true" />
                                WhatsApp: <strong>{contact.whatsapp}</strong>
                              </span>
                            )}
                            {contact.telegram && (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--em-rail)] px-2.5 py-1.5 font-medium">
                                <Send className="h-3.5 w-3.5 text-[var(--em-primary)]" aria-hidden="true" />
                                Telegram: <strong>{contact.telegram}</strong>
                              </span>
                            )}
                            {contact.public_email && (
                              <a
                                href={`mailto:${contact.public_email}`}
                                className="inline-flex items-center gap-1 rounded-lg bg-[var(--em-rail)] px-2.5 py-1.5 font-medium hover:underline"
                              >
                                <Mail className="h-3.5 w-3.5 text-[var(--em-rose)]" aria-hidden="true" />
                                {contact.public_email}
                              </a>
                            )}
                            {contact.linkedin && (
                              <a
                                href={
                                  contact.linkedin.startsWith('http')
                                    ? contact.linkedin
                                    : `https://${contact.linkedin}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg bg-[var(--em-rail)] px-2.5 py-1.5 font-medium text-[var(--em-primary)] hover:underline"
                              >
                                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                                LinkedIn
                              </a>
                            )}
                            {!contact.whatsapp &&
                              !contact.telegram &&
                              !contact.public_email &&
                              !contact.linkedin && (
                                <span className="text-[var(--em-muted)]">
                                  Belum ada kanal kontak yang ditambahkan.
                                </span>
                              )}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="space-y-5">
              {isCreator && (
                <form
                  onSubmit={handlePostAnnouncement}
                  className="space-y-3 rounded-2xl border border-[var(--em-border)] bg-[var(--em-rail)] p-4"
                >
                  <h3 className="text-sm font-extrabold text-[var(--em-ink)]">
                    Buat Pengumuman Resmi Tim
                  </h3>
                  <div>
                    <label htmlFor="ann-title" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
                      Judul pengumuman
                    </label>
                    <input
                      id="ann-title"
                      required
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="Contoh: Jadwal rapat perdana dan pembagian tugas"
                      className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="ann-content" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
                      Isi pengumuman
                    </label>
                    <textarea
                      id="ann-content"
                      required
                      rows={3}
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      placeholder="Tulis informasi penting, jadwal pertemuan, atau tautan dokumen kerja..."
                      className="w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-xs font-semibold text-[var(--em-ink)]">
                      <input
                        type="checkbox"
                        checked={annPinned}
                        onChange={(e) => setAnnPinned(e.target.checked)}
                        className="h-4 w-4 accent-[var(--em-primary)]"
                      />
                      <span>Sematkan di bagian atas</span>
                    </label>
                    <button
                      type="submit"
                      disabled={postingAnn}
                      className="min-h-[42px] rounded-xl bg-[var(--em-primary)] px-4 py-2 text-xs font-bold text-white transition hover:bg-[var(--em-primary-deep)] disabled:opacity-60"
                    >
                      {postingAnn ? 'Mengirim...' : 'Publikasikan Pengumuman'}
                    </button>
                  </div>
                </form>
              )}

              {announcements.length === 0 ? (
                <EmptyState
                  title="Belum ada pengumuman tim"
                  description={
                    isCreator
                      ? 'Gunakan papan pengumuman di atas untuk membagikan agenda dan arahan tim.'
                      : 'Pengumuman dari Team Creator akan tampil di sini dan memunculkan notifikasi.'
                  }
                />
              ) : (
                <div className="space-y-3">
                  {announcements.map((ann) => (
                    <article
                      key={ann.id}
                      className="rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            {ann.pinned && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--em-soft)] px-2 py-0.5 text-xs font-bold text-[var(--em-primary)]">
                                <Pin className="h-3 w-3" aria-hidden="true" />
                                Disematkan
                              </span>
                            )}
                            <h3 className="text-sm font-extrabold text-[var(--em-ink)]">
                              {ann.title}
                            </h3>
                          </div>
                          <p className="mt-1 text-xs text-[var(--em-muted)]">
                            Oleh {ann.author?.name || 'Creator'} · {formatDateId(ann.created_at)}
                          </p>
                        </div>
                        {isCreator && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAnnouncement(ann.id)}
                            aria-label="Hapus pengumuman"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#9e2424] hover:bg-[#fdeeee]"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--em-ink)]">
                        {ann.content}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'status' && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-[var(--em-ink)]">
                      Status Keanggotaan Kamu di {team.team_name}
                    </h3>
                    <p className="mt-0.5 text-xs text-[var(--em-muted)]">
                      {isCreator
                        ? 'Kamu adalah pembuat tim ini dan berhak meninjau permintaan serta membuat pengumuman.'
                        : 'Permintaan atau undanganmu telah disetujui sehingga Member Directory dan kontak terbuka.'}
                    </p>
                  </div>
                  <StatusBadge status="accepted" />
                </div>
              </div>

              {isCreator && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-[var(--em-ink)]">
                    Riwayat Status Pelamar Tim Ini ({teamRequests.length})
                  </h3>
                  {teamRequests.length === 0 ? (
                    <p className="text-xs text-[var(--em-muted)]">
                      Belum ada permintaan bergabung untuk tim ini.
                    </p>
                  ) : (
                    teamRequests.map((req) => (
                      <div
                        key={req.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--em-border)] bg-white p-3.5 text-xs"
                      >
                        <div>
                          <strong className="text-sm text-[var(--em-ink)]">
                            {req.applicant?.name || 'Pelamar'}
                          </strong>
                          <p className="text-[var(--em-muted)]">
                            {req.applicant?.university || ''} · {formatDateId(req.created_at)}
                          </p>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <Modal
        open={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        title={`Beri Rating & Ulasan untuk ${reviewTarget?.profile?.name || 'Rekan'}`}
        subtitle={`Berdasarkan kolaborasi di tim ${team.team_name}.`}
      >
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div>
            <span className="mb-2 block text-xs font-bold text-[var(--em-ink)]">
              Penilaian (1 sampai 5 bintang)
            </span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setReviewRating(num)}
                  aria-pressed={reviewRating === num}
                  className={`flex h-11 min-w-[48px] items-center justify-center gap-1 rounded-xl border text-sm font-bold transition ${
                    reviewRating >= num
                      ? 'border-[#e0b86b] bg-[#fef6e7] text-[#8a4b00]'
                      : 'border-[var(--em-border)] bg-white text-[var(--em-muted)]'
                  }`}
                >
                  <Star
                    className={`h-4 w-4 ${reviewRating >= num ? 'fill-current' : ''}`}
                    aria-hidden="true"
                  />
                  <span>{num}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="rev-comment" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
              Ulasan kolaborasi
            </label>
            <textarea
              id="rev-comment"
              required
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Ceritakan komunikasi, tanggung jawab, dan kontribusi rekan tim selama kegiatan berlangsung."
              className="w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReviewTarget(null)}
              className="min-h-[44px] rounded-xl border border-[var(--em-border)] bg-white px-4 py-2 text-sm font-bold text-[var(--em-ink)]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submittingAction}
              className="min-h-[44px] rounded-xl bg-[var(--em-primary)] px-5 py-2 text-sm font-bold text-white"
            >
              {submittingAction ? 'Menyimpan...' : 'Kirim Ulasan'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(safetyTarget)}
        onClose={() => setSafetyTarget(null)}
        title={`Report & Block: ${safetyTarget?.profile?.name || 'Anggota'}`}
        subtitle="Lindungi keamanan kontak dan komunikasimu dari penyalahgunaan."
      >
        <form onSubmit={handleSafetySubmit} className="space-y-4">
          <div>
            <label htmlFor="safety-cat" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
              Jenis pelanggaran
            </label>
            <select
              id="safety-cat"
              value={reportCategory}
              onChange={(e) => setReportCategory(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            >
              <option>Penyalahgunaan kontak</option>
              <option>Komunikasi tidak diinginkan / spam</option>
              <option>Perilaku tidak pantas</option>
              <option>Identitas atau informasi palsu</option>
            </select>
          </div>
          <div>
            <label htmlFor="safety-detail" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
              Kronologi singkat
            </label>
            <textarea
              id="safety-detail"
              required
              rows={3}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Jelaskan masalah yang kamu alami agar dapat ditindaklanjuti."
              className="w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2.5 rounded-xl bg-[var(--em-rail)] p-3 text-xs font-semibold text-[var(--em-ink)]">
            <input
              type="checkbox"
              checked={alsoBlock}
              onChange={(e) => setAlsoBlock(e.target.checked)}
              className="h-4 w-4 accent-[#9e2424]"
            />
            <span>
              Blokir pengguna ini sekaligus agar informasi kontak saya langsung disembunyikan darinya
            </span>
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSafetyTarget(null)}
              className="min-h-[44px] rounded-xl border border-[var(--em-border)] bg-white px-4 py-2 text-sm font-bold text-[var(--em-ink)]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submittingAction}
              className="min-h-[44px] rounded-xl bg-[#9e2424] px-5 py-2 text-sm font-bold text-white"
            >
              {submittingAction ? 'Memproses...' : 'Kirim Laporan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
