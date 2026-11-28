import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  Compass,
  Inbox,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  Users,
  Briefcase,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getInitials, getTrialDaysLeft, isTrialExpired } from '../../lib/constants';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';

const ROUTE_LABELS = {
  '/discover': 'Temukan Tim',
  '/people': 'Temukan Individu',
  '/requests': 'Permintaan & Status',
  '/teams': 'Tim Saya',
  '/notifications': 'Notifikasi',
  '/profile': 'Profil Saya',
  '/subscription': 'Membership Pro',
  '/admin': 'Panel Admin',
};

export function AppShell() {
  const { user, profile, signOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!profileMenuOpen) return undefined;
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [profileMenuOpen]);

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await signOut();
    showToast('Kamu telah keluar dari akun.', 'info');
    navigate('/auth?tab=login', { replace: true });
  };

  const notificationsState = useRealtimeNotifications(user?.id);
  const { unreadCount, pendingActionCount } = notificationsState;

  const trialDays = getTrialDaysLeft(profile?.trial_started_at);
  const expired = isTrialExpired(profile);
  const isCreator = profile?.role === 'creator';
  const isAdmin = profile?.role === 'admin';
  const currentRouteLabel = ROUTE_LABELS[location.pathname] || 'Workspace';
  const firstName = (profile?.name || user?.email?.split('@')[0] || 'Akun').split(/\s+/)[0];

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
    ...(!isAdmin ? [{ to: '/subscription', label: 'Membership', icon: Star, isMembership: true }] : []),
  ];

  const adminItems = isAdmin ? [{ to: '/admin', label: 'Panel Admin', icon: ShieldCheck }] : [];

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
        className={({ isActive }) => {
          if (item.isMembership) {
            return `group flex min-h-[44px] items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-sm font-extrabold transition ${
              isActive ? 'em-nav-membership-active shadow-xs' : 'em-nav-membership'
            } ${isCompact ? 'justify-center px-2' : ''}`;
          }
          return `group flex min-h-[44px] items-center justify-between gap-2.5 rounded-xl border px-3 py-2 text-sm transition ${
            isActive
              ? 'border-[#d9c8f2] bg-white font-bold text-[var(--em-primary)] shadow-2xs'
              : 'border-transparent font-semibold text-[var(--em-muted)] hover:bg-white/75 hover:text-[var(--em-ink)]'
          } ${isCompact ? 'justify-center px-2' : ''}`;
        }}
      >
        {({ isActive }) => (
          <>
            <span className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                  item.isMembership
                    ? isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-white text-[var(--em-rose)] shadow-2xs'
                    : isActive
                      ? 'bg-[var(--em-primary)] text-white'
                      : 'bg-white/90 text-[var(--em-muted)] group-hover:text-[var(--em-primary)]'
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    item.isMembership ? 'em-star-motion fill-current' : ''
                  }`}
                  aria-hidden="true"
                />
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
        <div className="flex h-[68px] w-full items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka menu navigasi"
              aria-expanded={mobileMenuOpen}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--em-border)] bg-white text-[var(--em-ink)] md:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <Link to="/discover" className="flex items-center">
              <img
                src="/eventmate-logo.png"
                alt="EventMate"
                width="136"
                height="44"
                className="h-9 w-auto object-contain"
              />
            </Link>

            <div className="hidden items-center gap-3 md:flex">
              <span className="h-5 w-px bg-[var(--em-border)]" aria-hidden="true" />
              <span className="text-xs font-semibold text-[var(--em-muted)]">Workspace</span>
              <span className="text-xs text-[var(--em-input-border)]" aria-hidden="true">
                /
              </span>
              <span className="text-sm font-extrabold text-[var(--em-ink)]">
                {currentRouteLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden h-11 items-center gap-1 rounded-xl border border-[var(--em-border)] bg-[var(--em-ground)] p-1 sm:inline-flex">
              <span className="inline-flex h-full items-center gap-1.5 rounded-lg bg-white px-2.5 text-xs font-bold text-[var(--em-ink)] shadow-2xs">
                {isAdmin ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-[#155e3d]" aria-hidden="true" />
                ) : isCreator ? (
                  <Sparkles className="h-3.5 w-3.5 text-[var(--em-rose)]" aria-hidden="true" />
                ) : (
                  <Compass className="h-3.5 w-3.5 text-[var(--em-primary)]" aria-hidden="true" />
                )}
                <span>{isAdmin ? 'Admin' : isCreator ? 'Team Creator' : 'Team Seeker'}</span>
              </span>

              {isAdmin ? (
                <Link
                  to="/admin"
                  className="inline-flex h-full items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-[#155e3d] transition hover:bg-white"
                >
                  <span>Panel Kontrol</span>
                </Link>
              ) : (
                <Link
                  to="/subscription"
                  className={`inline-flex h-full items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition ${
                    profile?.paid
                      ? 'text-[#155e3d] hover:bg-[#eaf7f0]'
                      : expired
                        ? 'text-[#9e2424] hover:bg-[#fdeeee]'
                        : 'text-[var(--em-primary)] hover:bg-white'
                  }`}
                >
                  <span className="tabular-nums">
                    {profile?.paid
                      ? 'Pro Aktif'
                      : expired
                        ? 'Trial Berakhir'
                        : `Trial · ${trialDays} hari`}
                  </span>
                </Link>
              )}
            </div>

            <Link
              to="/notifications"
              aria-label={`Notifikasi (${unreadCount} belum dibaca)`}
              className="em-btn-step relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--em-border)] bg-white text-[var(--em-ink)] hover:bg-[var(--em-rail)]"
            >
              <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="tabular-nums absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--em-rose)] px-1 text-xs font-bold text-white ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </Link>

            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                aria-label="Menu akun"
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
                className="em-btn-step flex h-11 items-center gap-2 rounded-xl border border-[var(--em-border)] bg-white p-1.5 pr-2.5 text-left hover:bg-[var(--em-rail)]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--em-soft)] text-xs font-extrabold text-[var(--em-primary)]">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.name || 'Avatar'}
                      width="32"
                      height="32"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(profile?.name || user?.email)
                  )}
                </span>
                <span className="hidden max-w-[110px] truncate text-xs font-bold text-[var(--em-ink)] md:inline">
                  {firstName}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-[var(--em-muted)] transition-transform duration-200 ${
                    profileMenuOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {profileMenuOpen && (
                <div
                  role="menu"
                  aria-label="Opsi akun"
                  className="em-panel-swap absolute right-0 mt-2 w-56 rounded-2xl border border-[var(--em-border)] bg-white p-2 shadow-[var(--em-shadow-modal)]"
                >
                  <div className="mb-1.5 border-b border-[var(--em-border)] px-2.5 pb-2.5 pt-1">
                    <p className="truncate text-xs font-extrabold text-[var(--em-ink)]">
                      {profile?.name || firstName}
                    </p>
                    <p className="truncate text-xs text-[var(--em-muted)]">{user?.email}</p>
                    <p className="mt-1 text-xs font-bold text-[var(--em-primary)]">
                      {isAdmin ? 'Admin' : isCreator ? 'Team Creator' : 'Team Seeker'}
                    </p>
                  </div>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex min-h-[42px] w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-semibold text-[#155e3d] transition hover:bg-[#eaf7f0]"
                    >
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      <span>Panel Admin</span>
                    </Link>
                  )}

                  <Link
                    to="/profile"
                    role="menuitem"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex min-h-[42px] w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-semibold text-[var(--em-ink)] transition hover:bg-[var(--em-rail)]"
                  >
                    <User className="h-4 w-4 text-[var(--em-primary)]" aria-hidden="true" />
                    <span>Profil Saya</span>
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex min-h-[42px] w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-bold text-[#9e2424] transition hover:bg-[#fdeeee]"
                  >
                    <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        <aside
          aria-label="Navigasi utama"
          className={`hidden shrink-0 border-r border-[var(--em-border)] bg-[var(--em-rail)] transition-[width] duration-200 md:sticky md:top-[68px] md:flex md:h-[calc(100dvh-68px)] md:flex-col md:justify-between ${
            collapsed ? 'w-[80px] px-2.5 py-5' : 'w-[252px] px-3.5 py-5'
          }`}
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

            {isAdmin && (
              <div>
                {!collapsed && (
                  <p className="mb-2 px-3 text-xs font-extrabold uppercase tracking-wider text-[#155e3d]">
                    Administrasi
                  </p>
                )}
                <nav className="space-y-1">
                  {adminItems.map((item) => renderNavItem(item, collapsed))}
                </nav>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            className="em-btn-step mt-6 flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-[var(--em-border)] bg-white px-3 py-2 text-xs font-bold text-[var(--em-muted)] hover:text-[var(--em-ink)]"
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
          <div className="mx-auto w-full max-w-[1320px]">
            <Outlet context={{ notificationsState }} />
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
                  isActive
                    ? 'bg-[var(--em-soft)] font-bold text-[var(--em-primary)]'
                    : 'text-[var(--em-muted)]'
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
              <div className="rounded-xl border border-[var(--em-border)] bg-[var(--em-ground)] p-3 text-xs">
                <p className="font-extrabold text-[var(--em-ink)]">
                  {isCreator ? 'Team Creator' : 'Team Seeker'}
                </p>
                <p className="mt-0.5 text-[var(--em-muted)]">
                  {profile?.paid
                    ? 'Membership Pro Aktif'
                    : expired
                      ? 'Trial 30 hari berakhir'
                      : `Sisa trial ${trialDays} hari`}
                </p>
              </div>
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
              {isAdmin && (
                <div>
                  <p className="mb-2 px-3 text-xs font-extrabold uppercase tracking-wider text-[#155e3d]">
                    Administrasi
                  </p>
                  <nav className="space-y-1">
                    {adminItems.map((item) =>
                      renderNavItem(item, false, () => setMobileMenuOpen(false))
                    )}
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
