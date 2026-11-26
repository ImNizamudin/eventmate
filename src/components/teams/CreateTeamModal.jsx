import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { TEAM_CATEGORIES, TEAM_MODES, TEAM_REGIONS, parseCommaList } from '../../lib/constants';
import { formatSupabaseError, supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export function CreateTeamModal({ open, onClose, onCreated }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [teamName, setTeamName] = useState('');
  const [category, setCategory] = useState('Kompetisi');
  const [mode, setMode] = useState('Hybrid');
  const [region, setRegion] = useState('Jawa Timur');
  const [city, setCity] = useState('');
  const [neededCount, setNeededCount] = useState(2);
  const [deadline, setDeadline] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const resetForm = () => {
    setTitle('');
    setTeamName('');
    setCategory('Kompetisi');
    setMode('Hybrid');
    setRegion('Jawa Timur');
    setCity('');
    setNeededCount(2);
    setDeadline('');
    setSkillsText('');
    setDescription('');
    setErrorMsg('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!supabase || !user) return;
    setErrorMsg('');
    setSubmitting(true);
    try {
      const resolvedTeamName =
        teamName.trim() || title.trim().split(/\s+/).slice(0, 2).join(' ');
      const { data, error } = await supabase
        .from('teams')
        .insert({
          creator_id: user.id,
          team_name: resolvedTeamName,
          title: title.trim(),
          category,
          mode,
          region,
          city: city.trim(),
          needed_count: Math.max(1, Number(neededCount) || 1),
          deadline: deadline.trim(),
          skills: parseCommaList(skillsText),
          description: description.trim(),
        })
        .select('*')
        .single();

      if (error) throw error;
      showToast('Tim berhasil dipublikasikan dan langsung muncul di halaman pencarian.', 'success');
      resetForm();
      onCreated?.(data);
      onClose();
    } catch (err) {
      setErrorMsg(formatSupabaseError(err, 'Gagal mempublikasikan tim.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Publikasikan Kesempatan Tim"
      subtitle="Tim yang dipublikasikan langsung terlihat oleh seluruh pengguna terdaftar."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div
            role="alert"
            className="rounded-xl border border-[#f1c7c7] bg-[#fdeeee] p-3 text-sm text-[#9e2424]"
          >
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="team-title" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
              Nama kegiatan atau kompetisi
            </label>
            <input
              id="team-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: National Business Plan Competition"
              className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="team-name" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
              Nama tim
            </label>
            <input
              id="team-name"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Contoh: Pixel Pioneers"
              className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="team-category" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
              Kategori
            </label>
            <select
              id="team-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            >
              {TEAM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="team-mode" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
              Metode kolaborasi
            </label>
            <select
              id="team-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            >
              {TEAM_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="team-region" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
              Wilayah (Region)
            </label>
            <select
              id="team-region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            >
              {TEAM_REGIONS.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="team-city" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
              Kota / Lokasi
            </label>
            <input
              id="team-city"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Contoh: Malang atau Online"
              className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="team-needed" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
              Slot anggota dicari (selain creator)
            </label>
            <input
              id="team-needed"
              type="number"
              min={1}
              max={50}
              required
              value={neededCount}
              onChange={(e) => setNeededCount(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="team-deadline" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
              Batas pendaftaran
            </label>
            <input
              id="team-deadline"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              placeholder="Contoh: 20 Des 2026"
              className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="team-skills" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
              Keahlian dibutuhkan (pisahkan koma)
            </label>
            <input
              id="team-skills"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="UI/UX Design, Pitching, Frontend React"
              className="min-h-[44px] w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="team-desc" className="mb-1 block text-xs font-bold text-[var(--em-ink)]">
              Deskripsi tujuan tim & kebutuhan peran
            </label>
            <textarea
              id="team-desc"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan target lomba/proyek, ritme kerja tim, dan kontribusi yang diharapkan."
              className="w-full rounded-lg border border-[var(--em-input-border)] bg-white px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-xl border border-[var(--em-border)] bg-white px-4 py-2 text-sm font-bold text-[var(--em-ink)]"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[44px] rounded-xl bg-[var(--em-primary)] px-5 py-2 text-sm font-bold text-white transition hover:bg-[var(--em-primary-deep)] disabled:opacity-60"
          >
            {submitting ? 'Mempublikasikan...' : 'Publikasikan Tim'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
