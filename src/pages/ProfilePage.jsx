import { useCallback, useEffect, useState } from 'react';
import { Ban, CheckCircle2, Edit3, LogOut, ShieldCheck, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Modal } from '../components/ui/Modal';
import { EmptyState, LoadingState } from '../components/ui/StateViews';
import { formatDateId, getInitials, parseCommaList } from '../lib/constants';
import { formatSupabaseError, supabase } from '../lib/supabaseClient';

export function ProfilePage() {
  const { user, profile, contacts, updateProfileAndContacts, signOut, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [reviews, setReviews] = useState([]);
  const [teamHistory, setTeamHistory] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingExtras, setLoadingExtras] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [interestsText, setInterestsText] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [telegram, setTelegram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [publicEmail, setPublicEmail] = useState('');
  const [shareContact, setShareContact] = useState(true);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadExtras = useCallback(async () => {
    if (!supabase || !user) return;
    setLoadingExtras(true);
    try {
      const [{ data: revData }, { data: memData }, { data: blkData }] = await Promise.all([
        supabase
          .from('reviews')
          .select('*, reviewer:profiles!reviews_reviewer_id_fkey(name), team:teams(team_name, title)')
          .eq('reviewee_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('team_members')
          .select('member_role, joined_at, team:teams(id, team_name, title, category)')
          .eq('user_id', user.id)
          .order('joined_at', { ascending: false }),
        supabase
          .from('user_blocks')
          .select('id, blocked_id, reason, blocked:profiles!user_blocks_blocked_id_fkey(name, username)')
          .eq('blocker_id', user.id),
      ]);

      setReviews(revData || []);
      setTeamHistory(memData || []);
      setBlockedUsers(blkData || []);
    } finally {
      setLoadingExtras(false);
    }
  }, [user]);

  useEffect(() => {
    loadExtras();
  }, [loadExtras]);

  const openEditModal = () => {
    setName(profile?.name || '');
    setUsername(profile?.username || '');
    setUniversity(profile?.university || '');
    setMajor(profile?.major || '');
    setBio(profile?.bio || '');
    setExperience(profile?.experience || '');
    setSkillsText((profile?.skills || []).join(', '));
    setInterestsText((profile?.interests || []).join(', '));
    setWhatsapp(contacts?.whatsapp || '');
    setTelegram(contacts?.telegram || '');
    setLinkedin(contacts?.linkedin || '');
    setPublicEmail(contacts?.public_email || user?.email || '');
    setShareContact(contacts?.share_with_teammates ?? true);
    setAvatarFile(null);
    setEditOpen(true);
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    if (!supabase || !user) return;
    setSaving(true);
    try {
      let nextAvatarUrl = profile?.avatar_url || '';
      if (avatarFile) {
        if (avatarFile.size > 1048576) {
          throw new Error('Ukuran foto maksimal 1 MB.');
        }
        const ext = avatarFile.name.split('.').pop() || 'png';
        const filePath = `${user.id}/avatar-${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: pubData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        nextAvatarUrl = pubData.publicUrl;
      }

      await updateProfileAndContacts(
        {
          name: name.trim(),
          username: username.trim().replace(/^@/, ''),
          university: university.trim(),
          major: major.trim(),
          bio: bio.trim(),
          experience: experience.trim(),
          skills: parseCommaList(skillsText),
          interests: parseCommaList(interestsText),
          avatar_url: nextAvatarUrl,
          onboarded: true,
        },
        {
          whatsapp: whatsapp.trim(),
          telegram: telegram.trim(),
          linkedin: linkedin.trim(),
          public_email: publicEmail.trim(),
          share_with_teammates: shareContact,
        }
      );

      showToast('Profil dan pengaturan kontak berhasil diperbarui.', 'success');
      setEditOpen(false);
    } catch (err) {
      showToast(formatSupabaseError(err, 'Gagal memperbarui profil.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestVerification = async () => {
    if (!supabase || !user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_requested: true })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      showToast('Permintaan verifikasi identitas telah dicatat.', 'success');
    } catch (err) {
      showToast(formatSupabaseError(err, 'Gagal mencatat permintaan verifikasi.'), 'error');
    }
  };

  const handleUnblock = async (blockId) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('user_blocks').delete().eq('id', blockId);
      if (error) throw error;
      showToast('Blokir pengguna telah dibuka.', 'info');
      await loadExtras();
    } catch (err) {
      showToast(formatSupabaseError(err, 'Gagal membuka blokir.'), 'error');
    }
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil Saya"
        description="Kelola informasi akademik, keahlian, kontak yang dibagikan ke tim, dan riwayat reputasi."
        actions={
          <>
            <button
              type="button"
              onClick={openEditModal}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--em-primary)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--em-primary-deep)]"
            >
              <Edit3 className="h-4 w-4" aria-hidden="true" />
              <span>Edit Profil & Kontak</span>
            </button>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#f1c7c7] bg-[#fdeeee] px-4 py-2 text-sm font-bold text-[#9e2424]"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Keluar</span>
            </button>
          </>
        }
      />

      <section className="rounded-3xl border border-[var(--em-border)] bg-white p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--em-soft)] text-2xl font-extrabold text-[var(--em-primary)]">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  width="80"
                  height="80"
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(profile?.name)
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-extrabold text-[var(--em-ink)]">{profile?.name}</h2>
                {profile?.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--em-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--em-primary)]">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Terverifikasi
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-[var(--em-muted)]">
                @{profile?.username} · {profile?.major || 'Jurusan belum diisi'} ·{' '}
                {profile?.university || 'Universitas belum diisi'}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold">
                <span className="inline-flex items-center gap-1 text-[#8a4b00]">
                  <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                  {avgRating ? `${avgRating}/5 (${reviews.length} ulasan)` : 'Belum ada ulasan'}
                </span>
                <span className="text-[var(--em-muted)]">Email akun: {user?.email}</span>
              </div>
            </div>
          </div>

          {!profile?.verified && (
            <button
              type="button"
              disabled={profile?.verification_requested}
              onClick={handleRequestVerification}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[var(--em-border)] bg-[var(--em-rail)] px-3.5 py-2 text-xs font-bold text-[var(--em-primary)] disabled:opacity-70"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>
                {profile?.verification_requested
                  ? 'Verifikasi Menunggu Pemeriksaan'
                  : 'Ajukan Verifikasi Identitas'}
              </span>
            </button>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 border-t border-[var(--em-border)] pt-5 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-extrabold text-[var(--em-ink)]">Bio & Pengalaman</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--em-muted)]">
              {profile?.bio || 'Tambahkan bio singkat melalui tombol Edit Profil.'}
            </p>
            {profile?.experience && (
              <p className="mt-2 text-xs leading-relaxed text-[var(--em-muted)]">
                <strong className="text-[var(--em-ink)]">Pengalaman:</strong> {profile.experience}
              </p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-extrabold text-[var(--em-ink)]">Keahlian & Minat</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[...(profile?.skills || []), ...(profile?.interests || [])].length === 0 ? (
                <p className="text-xs text-[var(--em-muted)]">Belum ada keahlian atau minat dicatat.</p>
              ) : (
                [...(profile?.skills || []), ...(profile?.interests || [])].map((tag, i) => (
                  <span
                    key={`${tag}-${i}`}
                    className="rounded-md bg-[var(--em-rail)] px-2.5 py-1 text-xs font-medium text-[var(--em-ink)]"
                  >
                    {tag}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold text-[var(--em-ink)]">
              Kontak yang Dibagikan ke Rekan Satu Tim
            </h3>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                contacts?.share_with_teammates
                  ? 'bg-[#eaf7f0] text-[#155e3d]'
                  : 'bg-[#fef6e7] text-[#8a4b00]'
              }`}
            >
              {contacts?.share_with_teammates
                ? 'Aktif dibagikan setelah Accepted'
                : 'Kontak disembunyikan'}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-[var(--em-muted)]">
            <span>WhatsApp: {contacts?.whatsapp || 'Belum diisi'}</span>
            <span>Telegram: {contacts?.telegram || 'Belum diisi'}</span>
            <span>Email tim: {contacts?.public_email || 'Belum diisi'}</span>
            <span>LinkedIn: {contacts?.linkedin || 'Belum diisi'}</span>
          </div>
        </div>
      </section>

      {loadingExtras ? (
        <LoadingState label="Memuat ulasan dan riwayat tim..." />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <section className="rounded-3xl border border-[var(--em-border)] bg-white p-6">
            <h3 className="text-base font-extrabold text-[var(--em-ink)]">
              Rating & Ulasan Diterima ({reviews.length})
            </h3>
            <div className="mt-4 space-y-3">
              {reviews.length === 0 ? (
                <EmptyState
                  title="Belum ada ulasan kolaborasi"
                  description="Ulasan yang diberikan rekan satu tim setelah bekerja bersama akan tampil di sini."
                />
              ) : (
                reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)] p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <strong className="text-sm text-[var(--em-ink)]">
                          {rev.reviewer?.name || 'Rekan Tim'}
                        </strong>
                        <p className="text-xs text-[var(--em-muted)]">
                          Tim {rev.team?.team_name || ''} · {formatDateId(rev.created_at)}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#fef6e7] px-2.5 py-1 text-xs font-bold text-[#8a4b00]">
                        <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                        {rev.rating}/5
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--em-ink)]">{rev.comment}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          <div className="space-y-5">
            <section className="rounded-3xl border border-[var(--em-border)] bg-white p-6">
              <h3 className="text-base font-extrabold text-[var(--em-ink)]">
                Riwayat Tim ({teamHistory.length})
              </h3>
              <div className="mt-4 space-y-2.5">
                {teamHistory.length === 0 ? (
                  <p className="text-sm text-[var(--em-muted)]">Belum ada riwayat tim.</p>
                ) : (
                  teamHistory.map((item, idx) => (
                    <div
                      key={`${item.team?.id}-${idx}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--em-border)] bg-[var(--em-ground)] px-4 py-3 text-sm"
                    >
                      <div>
                        <strong className="text-[var(--em-ink)]">
                          {item.team?.team_name || 'Tim'}
                        </strong>
                        <p className="text-xs text-[var(--em-muted)]">{item.team?.title || ''}</p>
                      </div>
                      <span className="rounded-md bg-[var(--em-soft)] px-2.5 py-1 text-xs font-bold text-[var(--em-primary)]">
                        {item.member_role === 'creator' ? 'Creator' : 'Anggota'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-[var(--em-border)] bg-white p-6">
              <h3 className="text-base font-extrabold text-[var(--em-ink)]">
                Pengguna yang Diblokir ({blockedUsers.length})
              </h3>
              <div className="mt-3 space-y-2.5">
                {blockedUsers.length === 0 ? (
                  <p className="text-xs text-[var(--em-muted)]">
                    Tidak ada pengguna yang sedang diblokir.
                  </p>
                ) : (
                  blockedUsers.map((blk) => (
                    <div
                      key={blk.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[#f1c7c7] bg-[#fdeeee] px-4 py-3 text-xs"
                    >
                      <div className="flex items-center gap-2 text-[#9e2424]">
                        <Ban className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <div>
                          <strong>{blk.blocked?.name || 'Pengguna'}</strong>
                          <p>{blk.reason || 'Diblokir'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnblock(blk.id)}
                        className="min-h-[36px] rounded-lg bg-white px-3 py-1.5 font-bold text-[var(--em-ink)]"
                      >
                        Buka Blokir
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Profil & Kontak"
        subtitle="Perubahan profil langsung tersinkron ke pencarian individu di akun lain."
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label htmlFor="prof-avatar" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
              Foto profil baru (opsional, maks. 1 MB)
            </label>
            <input
              id="prof-avatar"
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              className="w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="prof-name" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
                Nama lengkap
              </label>
              <input
                id="prof-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="prof-username" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
                Username
              </label>
              <input
                id="prof-username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="prof-uni" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
                Universitas
              </label>
              <input
                id="prof-uni"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="prof-major" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
                Jurusan
              </label>
              <input
                id="prof-major"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="prof-bio" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
              Bio
            </label>
            <textarea
              id="prof-bio"
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="prof-exp" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
              Pengalaman lomba atau proyek
            </label>
            <textarea
              id="prof-exp"
              rows={2}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="prof-skills" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
                Keahlian (pisahkan koma)
              </label>
              <input
                id="prof-skills"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="prof-interests" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
                Minat (pisahkan koma)
              </label>
              <input
                id="prof-interests"
                value={interestsText}
                onChange={(e) => setInterestsText(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--em-border)] bg-[var(--em-rail)] p-4">
            <p className="mb-2.5 text-xs font-extrabold text-[var(--em-ink)]">
              Pengaturan Contact Information
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                aria-label="Nomor WhatsApp"
                placeholder="WhatsApp (0812...)"
                className="min-h-[42px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
              />
              <input
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                aria-label="Username Telegram"
                placeholder="Telegram (@username)"
                className="min-h-[42px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
              />
              <input
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                aria-label="URL LinkedIn"
                placeholder="URL LinkedIn"
                className="min-h-[42px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
              />
              <input
                value={publicEmail}
                onChange={(e) => setPublicEmail(e.target.value)}
                aria-label="Email kontak tim"
                placeholder="Email kontak tim"
                className="min-h-[42px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
              />
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-[var(--em-ink)]">
              <input
                type="checkbox"
                checked={shareContact}
                onChange={(e) => setShareContact(e.target.checked)}
                className="h-4 w-4 accent-[var(--em-primary)]"
              />
              <span>Bagikan kontak di atas ke anggota tim yang sudah berstatus Accepted</span>
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="min-h-[44px] rounded-xl border border-[var(--em-border)] bg-white px-4 py-2 text-sm font-bold text-[var(--em-ink)]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] rounded-xl bg-[var(--em-primary)] px-5 py-2 text-sm font-bold text-white"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
