import { CheckCircle2, Clock, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    bg: 'bg-[#fef6e7]',
    text: 'text-[#8a4b00]',
    border: 'border-[#f1dab0]',
    Icon: Clock,
  },
  accepted: {
    label: 'Accepted',
    bg: 'bg-[#eaf7f0]',
    text: 'text-[#155e3d]',
    border: 'border-[#bde4cd]',
    Icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    bg: 'bg-[#fdeeee]',
    text: 'text-[#9e2424]',
    border: 'border-[#f1c7c7]',
    Icon: XCircle,
  },
};

export function StatusBadge({ status }) {
  const key = String(status || 'pending').toLowerCase();
  const cfg = STATUS_CONFIG[key] || STATUS_CONFIG.pending;
  const Icon = cfg.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{cfg.label}</span>
    </span>
  );
}
