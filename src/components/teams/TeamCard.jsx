import { Calendar, MapPin, Users } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

export function TeamCard({ team, membershipRole, requestStatus, onSelect }) {
  const additionalJoined = Math.max(0, (team.member_count || 1) - 1);
  const slotsLeft = Math.max(0, (team.needed_count || 0) - additionalJoined);

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-[var(--em-border)] bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#cbbbe2] hover:shadow-[var(--em-shadow-hover)]">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-lg bg-[var(--em-soft)] px-2.5 py-1 text-xs font-bold text-[var(--em-primary)]">
            {team.category}
          </span>
          <div className="flex items-center gap-2">
            {membershipRole && <StatusBadge status="accepted" />}
            {!membershipRole && requestStatus && <StatusBadge status={requestStatus} />}
            <span className="rounded-lg bg-[var(--em-rail)] px-2.5 py-1 text-xs font-semibold text-[var(--em-muted)]">
              {team.mode}
            </span>
          </div>
        </div>

        <h3 className="mt-3 text-base font-extrabold leading-snug text-[var(--em-ink)]">
          {team.title}
        </h3>
        <p className="mt-1 text-xs font-semibold text-[var(--em-primary)]">
          Tim {team.team_name} · oleh {team.creator?.name || 'Creator'}
        </p>

        <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-[var(--em-muted)]">
          {team.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[var(--em-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {team.city}, {team.region}
          </span>
          {team.deadline && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Batas: {team.deadline}
            </span>
          )}
        </div>

        {team.skills?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {team.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-[var(--em-rail)] px-2 py-1 text-xs font-medium text-[var(--em-ink)]"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--em-border)] pt-3.5">
        <div className="inline-flex items-center gap-1.5 text-xs text-[var(--em-muted)]">
          <Users className="h-4 w-4 shrink-0 text-[var(--em-primary)]" aria-hidden="true" />
          <span className="tabular-nums">
            <strong className="text-[var(--em-ink)]">{team.member_count || 1}</strong> anggota ·{' '}
            <strong className="text-[var(--em-ink)]">{slotsLeft}</strong> slot tersedia
          </span>
        </div>

        <button
          type="button"
          onClick={() => onSelect(team)}
          className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-[var(--em-primary)] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[var(--em-primary-deep)]"
        >
          {membershipRole ? 'Buka Tim' : 'Lihat Detail'}
        </button>
      </div>
    </article>
  );
}
