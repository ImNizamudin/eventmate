import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';
import { PageHeader } from '../components/layout/PageHeader';
import { EmptyState, LoadingState } from '../components/ui/StateViews';
import { formatDateId } from '../lib/constants';

export function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useRealtimeNotifications(user?.id);
  const [filter, setFilter] = useState('all');

  const visible =
    filter === 'unread' ? notifications.filter((item) => !item.is_read) : notifications;

  const handleOpen = async (item) => {
    if (!item.is_read) {
      await markAsRead(item.id);
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <div>
      <PageHeader
        title="Notifikasi"
        description="Pemberitahuan otomatis untuk permintaan bergabung, undangan tim, pengumuman creator, dan ulasan."
        actions={
          unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--em-border)] bg-white px-4 py-2 text-sm font-bold text-[var(--em-primary)] hover:bg-[var(--em-soft)]"
            >
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
              <span>Tandai Semua Dibaca</span>
            </button>
          )
        }
      />

      <div className="mb-5 flex gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`min-h-[42px] rounded-xl border px-4 py-2 text-xs font-bold ${
            filter === 'all'
              ? 'border-[var(--em-primary)] bg-[var(--em-primary)] text-white'
              : 'border-[var(--em-border)] bg-white text-[var(--em-ink)]'
          }`}
        >
          Semua ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`min-h-[42px] rounded-xl border px-4 py-2 text-xs font-bold ${
            filter === 'unread'
              ? 'border-[var(--em-primary)] bg-[var(--em-primary)] text-white'
              : 'border-[var(--em-border)] bg-white text-[var(--em-ink)]'
          }`}
        >
          Belum Dibaca ({unreadCount})
        </button>
      </div>

      {loading && notifications.length === 0 ? (
        <LoadingState label="Memuat notifikasi..." />
      ) : visible.length === 0 ? (
        <EmptyState
          title="Tidak ada notifikasi"
          description="Aktivitas baru seperti permintaan bergabung, status diterima/ditolak, undangan, atau pengumuman tim akan langsung muncul di sini."
          actionLabel="Jelajahi Tim"
          actionTo="/discover"
        />
      ) : (
        <div className="space-y-2.5">
          {visible.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleOpen(item)}
              className={`flex w-full items-start justify-between gap-4 rounded-2xl border p-4 text-left transition hover:border-[#cbbbe2] ${
                item.is_read
                  ? 'border-[var(--em-border)] bg-white'
                  : 'border-[#c8b3eb] bg-[var(--em-soft)]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    item.is_read
                      ? 'bg-[var(--em-rail)] text-[var(--em-muted)]'
                      : 'bg-[var(--em-primary)] text-white'
                  }`}
                >
                  <Bell className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-extrabold text-[var(--em-ink)]">{item.title}</h2>
                    {!item.is_read && (
                      <span className="rounded-full bg-[var(--em-rose)] px-2 py-0.5 text-xs font-bold text-white">
                        Baru
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[var(--em-muted)]">{item.body}</p>
                  <p className="mt-1.5 text-xs text-[var(--em-muted)]">
                    {formatDateId(item.created_at)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
