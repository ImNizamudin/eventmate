import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Compass,
  Lock,
  Megaphone,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SupabaseSetupBanner } from '../components/ui/StateViews';
import { CollabPipelineDiagram } from '../components/ui/WorkflowDiagram';
import { isSupabaseConfigured } from '../lib/supabaseClient';

const SHOWCASE_MODES = [
  {
    id: 'discover-teams',
    label: 'Temukan Tim',
    icon: Compass,
    heading: 'Pencarian tim tersinkron antar akun',
    summary:
      'Setiap tim yang dipublikasikan oleh Team Creator langsung muncul di pencarian dengan jumlah posisi tersisa dan keahlian yang dibutuhkan.',
    image: '/images/hero-collab.jpg',
    imageWidth: 1200,
    imageHeight: 669,
    imageAlt: 'Ilustrasi kolaborator kampus menyusun kartu keahlian dan papan tim EventMate',
    preview: (
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[var(--em-border)] pb-3">
          <div>
            <span className="rounded-md bg-[var(--em-soft)] px-2.5 py-1 text-xs font-bold text-[var(--em-primary)]">
              Kompetisi
            </span>
            <h4 className="mt-2 text-base font-extrabold text-[var(--em-ink)]">
              National Business Plan Competition
            </h4>
            <p className="text-xs font-semibold text-[var(--em-primary)]">
              Tim GrowthMinds · Hybrid · Surabaya
            </p>
          </div>
          <span className="tabular-nums rounded-lg bg-[var(--em-rail)] px-2.5 py-1 text-xs font-bold text-[var(--em-ink)]">
            2 slot tersisa
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['Business Strategy', 'UI/UX Design', 'Pitching'].map((sk) => (
            <span
              key={sk}
              className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-[var(--em-ink)] ring-1 ring-[var(--em-border)]"
            >
              {sk}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-1 text-xs text-[var(--em-muted)]">
          <span>Data tersinkron langsung dari Supabase</span>
          <span className="font-bold text-[var(--em-primary)]">Lihat Detail</span>
        </div>
      </div>
    ),
  },
  {
    id: 'discover-people',
    label: 'Temukan Individu',
    icon: Users,
    heading: 'Direktori rekan berdasarkan keahlian & ulasan',
    summary:
      'Lihat profil akademik, pengalaman lomba, minat kegiatan, serta rata-rata rating sebelum mengirim undangan resmi ke tim Anda.',
    image: '/images/campus-teamwork.jpg',
    imageWidth: 1200,
    imageHeight: 669,
    imageAlt: 'Ilustrasi mahasiswa Indonesia berdiskusi di meja kerja bersama laptop dan sketsa proyek',
    preview: (
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--em-border)] pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--em-soft)] text-sm font-extrabold text-[var(--em-primary)]">
              AR
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-[var(--em-ink)]">Profil Kandidat</h4>
              <p className="text-xs text-[var(--em-muted)]">Sistem Informasi · Malang</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fef6e7] px-2.5 py-1 text-xs font-bold text-[#8a4b00]">
            <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            Rating &amp; Review
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['React', 'Figma', 'Product Research'].map((sk) => (
            <span
              key={sk}
              className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-[var(--em-ink)] ring-1 ring-[var(--em-border)]"
            >
              {sk}
            </span>
          ))}
        </div>
        <p className="text-xs text-[var(--em-muted)]">
          Team Creator dapat mengundang kandidat langsung ke tim yang sedang membuka rekrutmen.
        </p>
      </div>
    ),
  },
  {
    id: 'application-status',
    label: 'Application Status',
    icon: CheckCircle2,
    heading: 'Status permintaan dan undangan dua arah yang jelas',
    summary:
      'Baik pelamar maupun Team Creator memantau status Pending, Accepted, dan Rejected secara serentak disertai notifikasi otomatis.',
    image: '/images/hero-collab.jpg',
    imageWidth: 1200,
    imageHeight: 669,
    imageAlt: 'Ilustrasi pemrosesan permintaan dan undangan tim pada EventMate',
    preview: (
      <div className="space-y-2.5">
        {[
          { role: 'Permintaan Bergabung', team: 'Pixel Pioneers', status: 'accepted' },
          { role: 'Undangan Individu', team: 'EduTech Lab', status: 'pending' },
          { role: 'Permintaan Bergabung', team: 'Kreasi Kolektif', status: 'rejected' },
        ].map((row, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--em-border)] bg-white px-3.5 py-2.5"
          >
            <div>
              <p className="text-xs font-extrabold text-[var(--em-ink)]">{row.team}</p>
              <p className="text-xs text-[var(--em-muted)]">{row.role}</p>
            </div>
            <StatusBadge status={row.status} />
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'member-contact',
    label: 'Member Directory & Kontak',
    icon: Lock,
    heading: 'Kontak anggota terbuka hanya setelah Accepted',
    summary:
      'WhatsApp, Telegram, LinkedIn, dan email tim dilindungi oleh Row Level Security dan hanya tampil untuk rekan satu tim yang diterima.',
    image: '/images/contact-privacy.jpg',
    imageWidth: 960,
    imageHeight: 716,
    imageAlt: 'Ilustrasi perlindungan kartu profil dan pembukaan kontak setelah terverifikasi',
    preview: (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--em-primary)]">
            Member Directory
          </span>
          <StatusBadge status="accepted" />
        </div>
        <div className="rounded-xl border border-[var(--em-border)] bg-white p-3.5">
          <p className="text-sm font-extrabold text-[var(--em-ink)]">Anggota Terverifikasi</p>
          <p className="mt-0.5 text-xs text-[var(--em-muted)]">
            Membagikan kanal kontak yang disetujui pemilik profil:
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2 text-xs font-semibold text-[var(--em-ink)]">
            <span className="rounded-lg bg-[var(--em-rail)] px-2.5 py-1">WhatsApp</span>
            <span className="rounded-lg bg-[var(--em-rail)] px-2.5 py-1">Telegram</span>
            <span className="rounded-lg bg-[var(--em-rail)] px-2.5 py-1">LinkedIn</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'announcement-safety',
    label: 'Announcement & Keamanan',
    icon: ShieldCheck,
    heading: 'Pengumuman resmi creator dan perlindungan Report & Block',
    summary:
      'Team Creator menyebarkan arahan tim melalui papan pengumuman, sementara setiap anggota terlindungi fitur Report dan Block instan.',
    image: '/images/contact-privacy.jpg',
    imageWidth: 960,
    imageHeight: 716,
    imageAlt: 'Ilustrasi perisai keamanan kolaborasi dan pengumuman tim',
    preview: (
      <div className="space-y-2.5">
        <div className="rounded-xl border border-[var(--em-border)] bg-white p-3.5">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--em-primary)]">
            <Megaphone className="h-4 w-4" aria-hidden="true" />
            <span>Announcement dari Team Creator</span>
          </div>
          <p className="mt-1 text-xs text-[var(--em-muted)]">
            Pengumuman yang disematkan mengirim notifikasi otomatis ke seluruh anggota tim aktif.
          </p>
        </div>
        <div className="rounded-xl border border-[#f1c7c7] bg-[#fdeeee] p-3.5">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#9e2424]">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <span>Report &amp; Block Aktif</span>
          </div>
          <p className="mt-1 text-xs text-[#741a1a]">
            Memblokir pengguna langsung menyembunyikan informasi kontak Anda di kedua akun.
          </p>
        </div>
      </div>
    ),
  },
];

export function LandingPage() {
  const [activeId, setActiveId] = useState(SHOWCASE_MODES[0].id);
  const activeMode = SHOWCASE_MODES.find((m) => m.id === activeId) || SHOWCASE_MODES[0];

  return (
    <div className="min-h-dvh bg-white text-[var(--em-ink)]">
      <a href="#main-landing" className="skip-link">
        Lewati ke konten utama
      </a>

      <header className="sticky top-0 z-40 border-b border-[var(--em-border)] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[74px] max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center">
              <img
                src="/eventmate-logo.png"
                alt="EventMate"
                width="148"
                height="48"
                fetchPriority="high"
                className="h-10 w-auto object-contain"
              />
            </Link>

            <nav aria-label="Navigasi halaman" className="hidden items-center gap-6 md:flex">
              <a
                href="#fitur-utama"
                className="em-underline-link text-sm font-semibold text-[var(--em-muted)] transition hover:text-[var(--em-ink)]"
              >
                Fitur Sistem
              </a>
              <a
                href="#alur-kerja"
                className="em-underline-link text-sm font-semibold text-[var(--em-muted)] transition hover:text-[var(--em-ink)]"
              >
                Alur Kolaborasi
              </a>
              <a
                href="#keamanan-kontak"
                className="em-underline-link text-sm font-semibold text-[var(--em-muted)] transition hover:text-[var(--em-ink)]"
              >
                Keamanan Kontak
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/auth?tab=login"
              className="em-btn-step inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--em-border)] bg-white px-4 py-2 text-sm font-bold text-[var(--em-ink)] hover:bg-[var(--em-rail)]"
            >
              Masuk
            </Link>
            <Link
              to="/auth?tab=signup"
              className="em-btn-step inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--em-primary)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--em-primary-deep)]"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      </header>

      <main id="main-landing">
        {!isSupabaseConfigured && (
          <div className="mx-auto max-w-6xl px-5 pt-6 sm:px-8">
            <SupabaseSetupBanner />
          </div>
        )}

        <section id="fitur-utama" className="bg-white pb-16 pt-12 sm:pb-24 sm:pt-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="em-enter text-4xl font-extrabold leading-[1.08] tracking-tight text-[var(--em-ink)] sm:text-6xl">
                Semua kolaborasi tim.
                <span className="mt-1 block text-[var(--em-primary)]">Satu sistem terpercaya.</span>
              </h1>
              <p className="em-enter em-enter-1 mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[var(--em-muted)] sm:text-lg">
                Temukan tim atau rekan berdasarkan keahlian nyata, kelola status permintaan secara
                real-time, dan buka informasi kontak anggota hanya setelah diterima.
              </p>

              <div className="em-enter em-enter-2 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/auth?tab=signup"
                  className="em-btn-step inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--em-primary)] px-6 py-3 text-sm font-bold text-white hover:bg-[var(--em-primary-deep)] sm:w-auto"
                >
                  <span>Mulai 30 Hari Gratis</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/auth?tab=login"
                  className="em-btn-step inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[var(--em-border)] bg-white px-6 py-3 text-sm font-bold text-[var(--em-ink)] hover:bg-[var(--em-rail)] sm:w-auto"
                >
                  Masuk ke Akun
                </Link>
              </div>
            </div>

            <div
              role="tablist"
              aria-label="Eksplorasi modul EventMate"
              className="em-enter em-enter-3 mt-12 flex flex-wrap items-center justify-center gap-2.5"
            >
              {SHOWCASE_MODES.map((item) => {
                const Icon = item.icon;
                const active = item.id === activeId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveId(item.id)}
                    className={`em-btn-step inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold sm:text-sm ${
                      active
                        ? 'border-[var(--em-ink)] bg-[var(--em-ink)] text-white shadow-sm'
                        : 'border-[var(--em-border)] bg-white text-[var(--em-muted)] hover:border-[var(--em-input-border)] hover:text-[var(--em-ink)]'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div
              key={activeMode.id}
              className="em-panel-swap mt-7 grid grid-cols-1 items-center gap-8 rounded-3xl border border-[var(--em-border)] bg-[var(--em-ground)] p-5 shadow-[var(--em-shadow-frame)] sm:p-8 lg:grid-cols-12"
            >
              <div className="space-y-5 lg:col-span-5">
                <div>
                  <h2 className="text-xl font-extrabold text-[var(--em-ink)] sm:text-2xl">
                    {activeMode.heading}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--em-muted)]">
                    {activeMode.summary}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--em-border)] bg-[var(--em-rail)] p-4">
                  {activeMode.preview}
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="em-photo-frame overflow-hidden rounded-2xl border border-[var(--em-border)] bg-white">
                  <img
                    src={activeMode.image}
                    alt={activeMode.imageAlt}
                    width={activeMode.imageWidth}
                    height={activeMode.imageHeight}
                    className="aspect-[16/10] w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="alur-kerja"
          className="border-t border-[var(--em-border)] bg-[var(--em-ground)] py-16 sm:py-24"
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-extrabold tracking-tight text-[var(--em-ink)] sm:text-4xl">
                Sinkronisasi antar akun tanpa celah data
              </h2>
              <p className="mt-3 text-base leading-relaxed text-[var(--em-muted)]">
                Setiap perubahan profil, lowongan tim, keputusan aplikasi, dan pengumuman tersimpan
                permanen di PostgreSQL Supabase dan langsung diperbarui ke akun terkait.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <div className="em-photo-frame overflow-hidden rounded-3xl border border-[var(--em-border)] bg-white p-2">
                  <img
                    src="/images/campus-teamwork.jpg"
                    alt="Mahasiswa bekerja sama menyusun rencana kompetisi dan proyek menggunakan laptop"
                    width="1200"
                    height="669"
                    className="aspect-[16/10] w-full rounded-2xl object-cover"
                  />
                </div>
              </div>

              <div className="lg:col-span-7">
                <CollabPipelineDiagram />
              </div>
            </div>
          </div>
        </section>

        <section
          id="keamanan-kontak"
          className="border-t border-[var(--em-border)] bg-white py-16 sm:py-24"
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-6">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-[var(--em-ink)] sm:text-4xl">
                    Kolaborasi lebih aman daripada grup chat terbuka
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-[var(--em-muted)]">
                    EventMate menggantikan grup chat acak dengan struktur kontrol akses yang jelas
                    untuk melindungi privasi nomor dan akun media sosial setiap anggota.
                  </p>
                </div>

                <dl className="space-y-4">
                  {[
                    {
                      icon: CheckCircle2,
                      title: 'Application Status transparan',
                      desc: 'Pantau status Pending, Accepted, dan Rejected untuk setiap permintaan bergabung dan undangan tim.',
                    },
                    {
                      icon: Lock,
                      title: 'Contact Information berbasis persetujuan',
                      desc: 'Kontak WhatsApp, Telegram, LinkedIn, atau Email hanya terbaca oleh anggota tim yang diterima dan diizinkan pemiliknya.',
                    },
                    {
                      icon: Bell,
                      title: 'Notifikasi & Announcement real-time',
                      desc: 'Team Creator mempublikasikan pengumuman resmi tim, dan seluruh anggota menerima notifikasi secara langsung.',
                    },
                    {
                      icon: ShieldCheck,
                      title: 'Report, Block, serta Rating & Review',
                      desc: 'Laporkan atau blokir penyalahgunaan kontak dalam satu klik, serta bangun reputasi lewat ulasan rekan satu tim.',
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="em-card-lift flex items-start gap-3.5 rounded-2xl border border-[var(--em-border)] bg-[var(--em-ground)] p-4"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--em-soft)] text-[var(--em-primary)]">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                          <dt className="text-sm font-extrabold text-[var(--em-ink)]">
                            {item.title}
                          </dt>
                          <dd className="mt-1 text-sm leading-relaxed text-[var(--em-muted)]">
                            {item.desc}
                          </dd>
                        </div>
                      </div>
                    );
                  })}
                </dl>
              </div>

              <div className="lg:col-span-6">
                <div className="em-photo-frame overflow-hidden rounded-3xl border border-[var(--em-border)] bg-[var(--em-ground)] p-3">
                  <img
                    src="/images/contact-privacy.jpg"
                    alt="Ilustrasi perisai verifikasi yang menghubungkan dua profil anggota EventMate"
                    width="960"
                    height="716"
                    className="aspect-[4/3] w-full rounded-2xl object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--em-border)] bg-[var(--em-ground)] py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="em-hero-surface flex flex-col items-start justify-between gap-6 rounded-3xl p-8 sm:flex-row sm:items-center sm:p-10">
              <div className="max-w-xl">
                <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                  Siap membentuk tim untuk kompetisi berikutnya?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/90">
                  Daftarkan akun dengan email aktif, verifikasi otomatis, dan coba seluruh fitur
                  EventMate gratis selama 30 hari pertama.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Link
                  to="/auth?tab=signup"
                  className="em-btn-step inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-extrabold text-[var(--em-primary)] hover:bg-[var(--em-soft)]"
                >
                  Buat Akun EventMate
                </Link>
                <Link
                  to="/auth?tab=login"
                  className="em-btn-step inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/35 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/20"
                >
                  Masuk
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--em-border)] bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 text-sm text-[var(--em-muted)] sm:flex-row sm:items-center sm:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/eventmate-logo.png"
              alt="EventMate"
              width="112"
              height="36"
              className="h-7 w-auto object-contain"
            />
            <span className="font-semibold text-[var(--em-ink)]">
              Find Your Team, Create Your Moment
            </span>
          </div>
          <div className="flex gap-5">
            <Link to="/auth?tab=login" className="font-semibold hover:text-[var(--em-primary)]">
              Masuk
            </Link>
            <Link to="/auth?tab=signup" className="font-semibold hover:text-[var(--em-primary)]">
              Daftar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
