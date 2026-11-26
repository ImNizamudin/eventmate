import { useState } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import {
  Bell,
  Compass,
  CreditCard,
  Inbox,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Repeat,
  User,
  Users,
  Briefcase,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getInitials, getTrialDaysLeft, isTrialExpired } from '../../lib/constants';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';

export function AppShell() {
  const { user, profile, switchRole } = useAuth();
  const { showToast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  const { unreadCount, pendingActionCount } = useRealtimeNotifications(user?.id);

  const trialDays = getTrialDaysLeft(profile?.trial_started_at);
  const expired = isTrialExpired(profile);

  const handleRoleSwitch = async () => {
    if (switchingRole) return;
    setSwitchingRole(true);
    try {
      const nextRole = await switchRole();
      showToast(
        `Mode aktif diubah ke ${nextRole === 'creator' ? 'Team Creator' : 'Team Seeker'}.`,
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Gagal mengganti peran.', 'error');
    } finally {
      setSwitchingRole(false);
    }
  };

  const workspaceItems = [
    { to: '/discover', label: 'Temukan Tim', icon: Compass },
    { to: '/people', label: 'Temukan Individu', icon: Users },
    {
      to: '/requests',
      label: 'Permintaan',
      icon: Inbox,
      badge: pendingActionCount > 0 ? pendingActionCount : null,
    },
    { to: '/teams', label: 'Tim Saya', icon: Briefcase },
    {
      to: '/notifications',
      label: 'Notifikasi',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
    },
  ];

  const accountItems = [
    { to: '/profile', label: 'Profil Saya', icon: User },
    { to: '/subscription', label: 'Membership', icon: CreditCard },
  ];

  const mobilePrimaryItems = [
    { to: '/discover', label: 'Tim', icon: Compass },
    { to: '/people', label: 'Individu', icon: Users },
    {
      to: '/requests',
      label: 'Status',
      icon: Inbox,
      badge: pendingActionCount > 0 ? pendingActionCount : null,
    },
    { to: '/teams', label: 'Tim Saya', icon: Briefcase },
    { to: '/profile', label: 'Profil', icon: User },
  ];

  const renderNavItem = (item, isCompact = false, onSelect) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        onClick={onSelect}
        title={isCompact ? item.label : undefined}
        className={({ isActive }) =>
          `group flex min-h-[44px] items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            isActive
              ? 'bg-[var(--em-soft)] font-bold text-[var(--em-primary)]'
              : 'text-[var(--em-muted)] hover:bg-[var(--em-rail)] hover:text-[var(--em-ink)]'
          } ${isCompact ? 'justify-center px-2' : ''}`
        }
      >
        {({ isActive }) => (
          <>
            <span className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                  isActive
                    ? 'bg-[var(--em-primary)] text-white'
                    : 'bg-white text-[var(--em-muted)] group-hover:text-[var(--em-primary)]'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              {!isCompact && <span>{item.label}</span>}
            </span>
            {!isCompact && item.badge && (
              <span className="tabular-nums rounded-full bg-[var(--em-rose)] px-2 py-0.5 text-xs font-bold text-white">
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <div className="min-h-dvh bg-[var(--em-ground)] text-[var(--em-ink)]">
      <a href="#main-content" className="skip-link">
        Lewati ke konten utama
      </a>

      <header className="sticky top-0 z-30 border-b border-[var(--em-border)] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka menu navigasi"
              aria-expanded={mobileMenuOpen}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--em-border)] bg-white text-[var(--em-ink)] md:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <Link to="/discover" className="flex items-center gap-2.5">
              <img
                src="/eventmate-logo.png"
                alt="EventMate"
                width="140"
                height="46"
                className="h-10 w-auto object-contain"
              />
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span
              className={`hidden rounded-full px-3 py-1 text-xs font-bold sm:inline-flex ${
                profile?.paid
                  ? 'bg-[#eaf7f0] text-[#155e3d]'
                  : expired
                    ? 'bg-[#fdeeee] text-[#9e2424]'
                    : 'bg-[var(--em-soft)] text-[var(--em-primary)]'
              }`}
            >
              {profile?.paid
                ? 'Membership Aktif'
                : expired
                  ? 'Trial Berakhir'
                  : `Free Trial: ${trialDays} hari`}
            </span>

            <button
              type="button"
              onClick={handleRoleSwitch}
              disabled={switchingRole}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--em-border)] bg-white px-3 py-2 text-xs font-bold text-[var(--em-ink)] transition hover:bg-[var(--em-rail)] sm:text-sm"
            >
              <Repeat className="h-4 w-4 text-[var(--em-primary)]" aria-hidden="true" />
              <span className="hidden sm:inline">
                Peran: {profile?.role === 'creator' ? 'Team Creator' : 'Team Seeker'}
              </span>
              <span className="sm:hidden">
                {profile?.role === 'creator' ? 'Creator' : 'Seeker'}
              </span>
            </button>

            <Link
              to="/notifications"
              aria-label={`Notifikasi (${unreadCount} belum dibaca)`}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--em-border)] bg-white text-[var(--em-ink)] transition hover:bg-[var(--em-rail)]"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="tabular-nums absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--em-rose)] px-1 text-xs font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>

            <Link
              to="/profile"
              aria-label="Buka profil saya"
              className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--em-border)] bg-[var(--em-soft)] text-sm font-extrabold text-[var(--em-primary)]"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name || 'Avatar'}
                  width="44"
                  height="44"
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(profile?.name || user?.email)
              )}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        <aside
          aria-label="Navigasi utama"
          className={`hidden shrink-0 border-r border-[var(--em-border)] bg-[var(--em-rail)] md:flex md:flex-col md:justify-between ${
            collapsed ? 'w-[84px] px-3 py-5' : 'w-[252px] px-4 py-6'
          } min-h-[calc(100dvh-72px)]`}
        >
          <div className="space-y-6">
            <div>
              {!collapsed && (
                <p className="mb-2 px-3 text-xs font-extrabold uppercase tracking-wider text-[var(--em-muted)]">
                  Workspace
                </p>
              )}
              <nav className="space-y-1">
                {workspaceItems.map((item) => renderNavItem(item, collapsed))}
              </nav>
            </div>

            <div>
              {!collapsed && (
                <p className="mb-2 px-3 text-xs font-extrabold uppercase tracking-wider text-[var(--em-muted)]">
                  Akun
                </p>
              )}
              <nav className="space-y-1">
                {accountItems.map((item) => renderNavItem(item, collapsed))}
              </nav>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            className="mt-6 flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[var(--em-border)] bg-white px-3 py-2 text-xs font-bold text-[var(--em-muted)] transition hover:text-[var(--em-ink)]"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
                <span>Ciutkan menu</span>
              </>
            )}
          </button>
        </aside>

        <main
          id="main-content"
          className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-6 md:px-8 md:py-8 md:pb-12"
        >
          <div className="mx-auto max-w-[1100px]">
            <Outlet />
          </div>
        </main>
      </div>

      <nav
        aria-label="Navigasi cepat mobile"
        className="fixed bottom-0 left-0 right-0 z-30 flex h-[68px] items-center justify-around border-t border-[var(--em-border)] bg-white px-2 pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {mobilePrimaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-xs font-semibold ${
                  isActive ? 'bg-[var(--em-soft)] font-bold text-[var(--em-primary)]' : 'text-[var(--em-muted)]'
                }`
              }
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="tabular-nums absolute right-1.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--em-rose)] px-1 text-xs font-bold text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi lengkap"
        >
          <div
            className="fixed inset-0 bg-[#180c2d]/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 flex w-[280px] max-w-[85vw] flex-col bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <img
                src="/eventmate-logo.png"
                alt="EventMate"
                width="132"
                height="44"
                className="h-9 w-auto object-contain"
              />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Tutup menu"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--em-rail)] text-[var(--em-ink)]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-5 overflow-y-auto">
              <div>
                <p className="mb-2 px-3 text-xs font-extrabold uppercase tracking-wider text-[var(--em-muted)]">
                  Workspace
                </p>
                <nav className="space-y-1">
                  {workspaceItems.map((item) =>
                    renderNavItem(item, false, () => setMobileMenuOpen(false))
                  )}
                </nav>
              </div>
              <div>
                <p className="mb-2 px-3 text-xs font-extrabold uppercase tracking-wider text-[var(--em-muted)]">
                  Akun
                </p>
                <nav className="space-y-1">
                  {accountItems.map((item) =>
                    renderNavItem(item, false, () => setMobileMenuOpen(false))
                  )}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
