import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { parseCommaList } from '../lib/constants';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, profile, contacts, updateProfileAndContacts } = useAuth();
  const { showToast } = useToast();

  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [interestsText, setInterestsText] = useState('');
  const [bio, setBio] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [telegram, setTelegram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [publicEmail, setPublicEmail] = useState('');
  const [shareContact, setShareContact] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (profile) {
      setUniversity(profile.university || '');
      setMajor(profile.major || '');
      setSkillsText((profile.skills || []).join(', '));
      setInterestsText((profile.interests || []).join(', '));
      setBio(profile.bio || '');
    }
    if (contacts) {
      setWhatsapp(contacts.whatsapp || '');
      setTelegram(contacts.telegram || '');
      setLinkedin(contacts.linkedin || '');
      setPublicEmail(contacts.public_email || user?.email || '');
      setShareContact(contacts.share_with_teammates ?? true);
    }
  }, [profile, contacts, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await updateProfileAndContacts(
        {
          university: university.trim(),
          major: major.trim(),
          skills: parseCommaList(skillsText),
          interests: parseCommaList(interestsText),
          bio: bio.trim(),
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
      showToast('Profil selesai diatur. Selamat datang di EventMate!', 'success');
      navigate(
        profile?.role === 'admin'
          ? '/admin'
          : profile?.role === 'creator'
            ? '/teams'
            : '/discover',
        { replace: true }
      );
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan profil onboarding.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[var(--em-ground)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl rounded-3xl border border-[var(--em-border)] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-[var(--em-border)] pb-5">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--em-primary)]">
              Personalisasi Profil
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-[var(--em-ink)]">
              Lengkapi identitas kolaborasi, {profile?.name?.split(' ')[0] || 'rekan'}
            </h1>
            <p className="mt-1 text-sm text-[var(--em-muted)]">
              Data akademik dan keahlianmu tampil di direktori pencarian; informasi kontak tetap
              tersembunyi sampai permintaan atau undangan berstatus Accepted.
            </p>
          </div>
          <img
            src="/eventmate-logo.png"
            alt="EventMate"
            width="110"
            height="36"
            className="hidden h-9 w-auto object-contain sm:block"
          />
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-[#f1c7c7] bg-[#fdeeee] p-3.5 text-sm text-[#9e2424]"
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ob-uni" className="mb-1.5 block text-xs font-bold text-[var(--em-ink)]">
                Universitas / Institusi
              </label>
              <input
                id="ob-uni"
                required
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="Contoh: Universitas Negeri Malang"
                className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="ob-major" className="mb-1.5 block text-xs font-bold text-[var(--em-ink)]">
                Jurusan / Program Studi
              </label>
              <input
                id="ob-major"
                required
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="Contoh: Sistem Informasi"
                className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="ob-skills" className="mb-1.5 block text-xs font-bold text-[var(--em-ink)]">
              Keahlian (pisahkan dengan koma)
            </label>
            <input
              id="ob-skills"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="UI/UX Design, React, Marketing, Pitching"
              className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="ob-interests" className="mb-1.5 block text-xs font-bold text-[var(--em-ink)]">
              Minat Kegiatan (pisahkan dengan koma)
            </label>
            <input
              id="ob-interests"
              value={interestsText}
              onChange={(e) => setInterestsText(e.target.value)}
              placeholder="Kompetisi, Penelitian, Volunteer"
              className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="ob-bio" className="mb-1.5 block text-xs font-bold text-[var(--em-ink)]">
              Bio singkat
            </label>
            <textarea
              id="ob-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ceritakan pengalaman lomba, proyek, atau peran yang biasa kamu ambil dalam tim."
              className="w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="rounded-2xl border border-[var(--em-border)] bg-[var(--em-rail)] p-4">
            <h2 className="text-sm font-extrabold text-[var(--em-ink)]">
              Kontak untuk Rekan Satu Tim (Opsional)
            </h2>
            <p className="mt-1 text-xs text-[var(--em-muted)]">
              Kontak ini hanya ditampilkan di Member Directory bagi pengguna yang sudah diterima di
              tim yang sama.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="ob-wa" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
                  WhatsApp
                </label>
                <input
                  id="ob-wa"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Contoh: 0812xxxx"
                  className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="ob-tg" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
                  Telegram
                </label>
                <input
                  id="ob-tg"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="@username"
                  className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="ob-li" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
                  LinkedIn URL
                </label>
                <input
                  id="ob-li"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="ob-email" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
                  Email Kontak Tim
                </label>
                <input
                  id="ob-email"
                  type="email"
                  value={publicEmail}
                  onChange={(e) => setPublicEmail(e.target.value)}
                  placeholder="email@domain.com"
                  className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>

            <label className="mt-3 flex items-center gap-2.5 text-sm font-medium text-[var(--em-ink)]">
              <input
                type="checkbox"
                checked={shareContact}
                onChange={(e) => setShareContact(e.target.checked)}
                className="h-4 w-4 accent-[var(--em-primary)]"
              />
              <span>Izinkan anggota tim yang sudah Accepted melihat kontak di atas</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="min-h-[46px] w-full rounded-xl bg-[var(--em-primary)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--em-primary-deep)] disabled:opacity-60"
          >
            {submitting ? 'Menyimpan profil...' : 'Simpan Profil & Masuk Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}
