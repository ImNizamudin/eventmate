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

export const TRIAL_DURATION_DAYS = 30;
export const PRO_PRICE_IDR = 15000;

export function parseCommaList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatDateId(isoValue, includeTime = true) {
  if (!isoValue) return '';
  try {
    const options = includeTime
      ? {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }
      : {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        };
    return new Intl.DateTimeFormat('id-ID', options).format(new Date(isoValue));
  } catch {
    return '';
  }
}

export function getTrialStatus(profile) {
  const isAdmin = profile?.role === 'admin';
  const isPaid = Boolean(profile?.paid) || isAdmin;
  const startMs = profile?.trial_started_at
    ? new Date(profile.trial_started_at).getTime()
    : Date.now();
  const totalMs = TRIAL_DURATION_DAYS * 86400000;
  const endMs = startMs + totalMs;
  const nowMs = Date.now();
  const remainingMs = Math.max(0, endMs - nowMs);
  const daysLeft = Math.max(0, Math.ceil(remainingMs / 86400000));
  const daysUsed = Math.min(TRIAL_DURATION_DAYS, Math.max(0, TRIAL_DURATION_DAYS - daysLeft));
  const progressPct = Math.min(100, Math.max(0, Math.round((daysLeft / TRIAL_DURATION_DAYS) * 100)));
  const expired = !isPaid && remainingMs <= 0;

  return {
    isAdmin,
    isPaid,
    expired,
    daysLeft,
    daysUsed,
    progressPct,
    startedAtIso: new Date(startMs).toISOString(),
    expiresAtIso: new Date(endMs).toISOString(),
  };
}

export function getTrialDaysLeft(trialStartedAt) {
  return getTrialStatus({ trial_started_at: trialStartedAt, paid: false }).daysLeft;
}

export function isTrialExpired(profile) {
  return getTrialStatus(profile).expired;
}

export function getInitials(name) {
  const clean = String(name || 'M').trim();
  if (!clean) return 'M';
  const parts = clean.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || '').join('');
}
