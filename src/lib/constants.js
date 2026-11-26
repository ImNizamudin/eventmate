export const TEAM_CATEGORIES = [
  'Kompetisi',
  'Volunteer',
  'Seminar',
  'Penelitian',
  'Proyek Kreatif',
  'Organisasi',
];

export const TEAM_MODES = ['Online', 'Offline', 'Hybrid'];

export const TEAM_REGIONS = [
  'Jawa Timur',
  'DKI Jakarta',
  'Jawa Barat',
  'Jawa Tengah',
  'DI Yogyakarta',
  'Banten',
  'Sumatera Utara',
  'Sulawesi Selatan',
  'Bali',
  'Seluruh Indonesia',
];

export function parseCommaList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatDateId(isoValue) {
  if (!isoValue) return '';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoValue));
  } catch {
    return '';
  }
}

export function getTrialDaysLeft(trialStartedAt) {
  if (!trialStartedAt) return 30;
  const elapsedDays = Math.floor((Date.now() - new Date(trialStartedAt).getTime()) / 86400000);
  return Math.max(0, 30 - elapsedDays);
}

export function isTrialExpired(profile) {
  if (!profile || profile.paid) return false;
  return getTrialDaysLeft(profile.trial_started_at) <= 0;
}

export function getInitials(name) {
  const clean = String(name || 'M').trim();
  if (!clean) return 'M';
  const parts = clean.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || '').join('');
}
