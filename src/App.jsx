import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppShell } from './components/layout/AppShell';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DiscoverTeamsPage } from './pages/DiscoverTeamsPage';
import { DiscoverPeoplePage } from './pages/DiscoverPeoplePage';
import { RequestsPage } from './pages/RequestsPage';
import { TeamsPage } from './pages/TeamsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { AdminPage } from './pages/AdminPage';

function FullScreenLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--em-ground)] px-4">
      <div role="status" className="text-center">
        <img
          src="/eventmate-logo.png"
          alt="EventMate"
          width="140"
          height="46"
          className="mx-auto mb-3 h-10 w-auto object-contain"
        />
        <p className="text-sm font-semibold text-[var(--em-muted)]">Menyiapkan ruang kerja...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, requireOnboarded = true }) {
  const { user, profile, loading } = useAuth();

  if (loading) return <FullScreenLoading />;
  if (!user) return <Navigate to="/auth?tab=login" replace />;
  if (requireOnboarded && profile && !profile.onboarded) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <FullScreenLoading />;
  if (!user) return <Navigate to="/auth?tab=login" replace />;
  if (profile?.role !== 'admin') return <Navigate to="/discover" replace />;
  return children;
}

function PublicEntryRoute() {
  const { user, profile, loading } = useAuth();
  if (loading) return <FullScreenLoading />;
  if (user && profile) {
    if (profile.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to={profile.onboarded ? '/discover' : '/onboarding'} replace />;
  }
  return <LandingPage />;
}

function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--em-ground)] px-4 text-center">
      <h1 className="text-3xl font-extrabold text-[var(--em-ink)]">Halaman tidak ditemukan</h1>
      <p className="mt-2 max-w-md text-sm text-[var(--em-muted)]">
        Alamat yang kamu tuju tidak tersedia di sistem EventMate.
      </p>
      <Link
        to="/"
        className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--em-primary)] px-5 py-2.5 text-sm font-bold text-white"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<PublicEntryRoute />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute requireOnboarded={false}>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />

            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/discover" element={<DiscoverTeamsPage />} />
              <Route path="/people" element={<DiscoverPeoplePage />} />
              <Route path="/requests" element={<RequestsPage />} />
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/subscription" element={<SubscriptionPage />} />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                }
              />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
