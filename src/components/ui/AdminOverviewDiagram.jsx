import { useState } from 'react';
import { Pause, Play } from 'lucide-react';

export function AdminOverviewDiagram({
  pendingVerifications = 0,
  pendingPayments = 0,
  openReports = 0,
  totalTeams = 0,
}) {
  const [paused, setPaused] = useState(false);

  return (
    <div className="rounded-2xl border border-[var(--em-border)] bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--em-primary)]">
            Alur Tata Kelola Admin
          </p>
          <h3 className="text-base font-extrabold text-[var(--em-ink)]">
            Empat jalur kendali sistem EventMate
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? 'Putar animasi diagram admin' : 'Jeda animasi diagram admin'}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--em-border)] bg-[var(--em-rail)] px-2.5 py-1 text-xs font-bold text-[var(--em-ink)] hover:bg-[var(--em-soft)]"
        >
          {paused ? (
            <>
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Putar</span>
            </>
          ) : (
            <>
              <Pause className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Jeda</span>
            </>
          )}
        </button>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 700 250"
          className="h-auto w-full min-w-[540px]"
          role="img"
          aria-label="Diagram alur tugas Admin EventMate: Verifikasi Identitas, Konfirmasi QRIS Pro, Moderasi Laporan, dan Pengawasan Tim"
        >
          <rect x="16" y="70" width="176" height="110" rx="18" fill="#5425a7" />
          <text x="104" y="106" textAnchor="middle" fill="#f3eafa" fontSize="11" fontWeight="700">
            PUSAT KENDALI
          </text>
          <text x="104" y="130" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="800">
            Role Admin
          </text>
          <text x="104" y="152" textAnchor="middle" fill="#e6d7fa" fontSize="11">
            RLS &amp; Audit Aktif
          </text>

          <path
            d="M 192 95 C 242 95, 242 36, 294 36"
            fill="none"
            stroke="#5425a7"
            strokeWidth="2.2"
            className={paused ? '' : 'em-flow-line'}
          />
          <path
            d="M 192 115 C 242 115, 242 96, 294 96"
            fill="none"
            stroke="#b82366"
            strokeWidth="2.2"
            className={paused ? '' : 'em-flow-line'}
          />
          <path
            d="M 192 135 C 242 135, 242 156, 294 156"
            fill="none"
            stroke="#9e2424"
            strokeWidth="2.2"
            className={paused ? '' : 'em-flow-line'}
          />
          <path
            d="M 192 155 C 242 155, 242 216, 294 216"
            fill="none"
            stroke="#155e3d"
            strokeWidth="2.2"
            className={paused ? '' : 'em-flow-line'}
          />

          <rect x="296" y="12" width="388" height="48" rx="12" fill="#fbf9fd" stroke="#d5c9e6" strokeWidth="1.5" />
          <text x="314" y="34" fill="#24163d" fontSize="13" fontWeight="800">
            1. Verifikasi Identitas Mahasiswa
          </text>
          <text x="314" y="50" fill="#5e5370" fontSize="11">
            Setujui atau tolak lencana Terverifikasi
          </text>
          <rect x="576" y="22" width="94" height="28" rx="999" fill="#f3eafa" />
          <text x="623" y="40" textAnchor="middle" fill="#5425a7" fontSize="11" fontWeight="800">
            {pendingVerifications} antrean
          </text>

          <rect x="296" y="72" width="388" height="48" rx="12" fill="#fbf9fd" stroke="#e8b8ce" strokeWidth="1.5" />
          <text x="314" y="94" fill="#24163d" fontSize="13" fontWeight="800">
            2. Konfirmasi Pembayaran QRIS Pro
          </text>
          <text x="314" y="110" fill="#5e5370" fontSize="11">
            Periksa bukti transfer lalu aktifkan Pro
          </text>
          <rect x="576" y="82" width="94" height="28" rx="999" fill="#fdebf3" />
          <text x="623" y="100" textAnchor="middle" fill="#b82366" fontSize="11" fontWeight="800">
            {pendingPayments} pending
          </text>

          <rect x="296" y="132" width="388" height="48" rx="12" fill="#fbf9fd" stroke="#f1c7c7" strokeWidth="1.5" />
          <text x="314" y="154" fill="#24163d" fontSize="13" fontWeight="800">
            3. Penanganan Laporan &amp; Blokir
          </text>
          <text x="314" y="170" fill="#5e5370" fontSize="11">
            Tindak lanjuti aduan penyalahgunaan kontak
          </text>
          <rect x="576" y="142" width="94" height="28" rx="999" fill="#fdeeee" />
          <text x="623" y="160" textAnchor="middle" fill="#9e2424" fontSize="11" fontWeight="800">
            {openReports} terbuka
          </text>

          <rect x="296" y="192" width="388" height="48" rx="12" fill="#fbf9fd" stroke="#bde4cd" strokeWidth="1.5" />
          <text x="314" y="214" fill="#24163d" fontSize="13" fontWeight="800">
            4. Pengawasan Tim &amp; Akun Pengguna
          </text>
          <text x="314" y="230" fill="#5e5370" fontSize="11">
            Tutup atau hapus tim pelanggar &amp; kelola akun
          </text>
          <rect x="576" y="202" width="94" height="28" rx="999" fill="#eaf7f0" />
          <text x="623" y="220" textAnchor="middle" fill="#155e3d" fontSize="11" fontWeight="800">
            {totalTeams} tim
          </text>
        </svg>
      </div>
    </div>
  );
}
