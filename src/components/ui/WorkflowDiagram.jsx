import { useState } from 'react';
import { Pause, Play } from 'lucide-react';

export function CollabPipelineDiagram() {
  const [paused, setPaused] = useState(false);

  return (
    <div className="rounded-2xl border border-[var(--em-border)] bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--em-primary)]">
            Arsitektur Alur Kolaborasi
          </p>
          <h3 className="text-base font-extrabold text-[var(--em-ink)]">
            Dari pencarian ke kontak terlindungi
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? 'Putar animasi diagram' : 'Jeda animasi diagram'}
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
          viewBox="0 0 680 230"
          className="h-auto w-full min-w-[520px]"
          role="img"
          aria-label="Diagram alur EventMate: Profil dan Tim masuk ke Validasi Dua Arah lalu membuka Member Directory, Contact Information, dan Announcement"
        >
          <rect x="12" y="72" width="154" height="86" rx="14" fill="#f6f2fb" stroke="#d5c9e6" strokeWidth="1.5" />
          <text x="89" y="106" textAnchor="middle" fill="#5425a7" fontSize="11" fontWeight="800">
            INPUT AKUN
          </text>
          <text x="89" y="126" textAnchor="middle" fill="#24163d" fontSize="13" fontWeight="700">
            Profil &amp; Tim
          </text>
          <text x="89" y="143" textAnchor="middle" fill="#5e5370" fontSize="11">
            Skill &amp; Region
          </text>

          <path
            d="M 166 115 L 246 115"
            fill="none"
            stroke="#5425a7"
            strokeWidth="2.2"
            className={paused ? '' : 'em-flow-line'}
          />
          <circle cx="246" cy="115" r="4" fill="#5425a7" />

          <rect x="248" y="54" width="182" height="122" rx="16" fill="#5425a7" />
          <text x="339" y="88" textAnchor="middle" fill="#f3eafa" fontSize="11" fontWeight="700">
            VALIDASI DUA ARAH
          </text>
          <text x="339" y="112" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="800">
            Request &amp; Undangan
          </text>
          <rect x="274" y="128" width="130" height="28" rx="999" fill="#eaf7f0" />
          <text x="339" y="146" textAnchor="middle" fill="#155e3d" fontSize="11" fontWeight="800">
            Status: Accepted
          </text>

          <path
            d="M 430 90 C 468 90, 468 42, 504 42"
            fill="none"
            stroke="#5425a7"
            strokeWidth="2.2"
            className={paused ? '' : 'em-flow-line'}
          />
          <path
            d="M 430 115 L 504 115"
            fill="none"
            stroke="#b82366"
            strokeWidth="2.2"
            className={paused ? '' : 'em-flow-line'}
          />
          <path
            d="M 430 140 C 468 140, 468 188, 504 188"
            fill="none"
            stroke="#155e3d"
            strokeWidth="2.2"
            className={paused ? '' : 'em-flow-line'}
          />

          <rect x="506" y="14" width="162" height="54" rx="12" fill="#ffffff" stroke="#d5c9e6" strokeWidth="1.5" />
          <text x="522" y="37" fill="#24163d" fontSize="12.5" fontWeight="800">
            Member Directory
          </text>
          <text x="522" y="54" fill="#5e5370" fontSize="11">
            Daftar anggota aktif
          </text>

          <rect x="506" y="88" width="162" height="54" rx="12" fill="#ffffff" stroke="#e8b8ce" strokeWidth="1.5" />
          <text x="522" y="111" fill="#b82366" fontSize="12.5" fontWeight="800">
            Contact Information
          </text>
          <text x="522" y="128" fill="#5e5370" fontSize="11">
            WhatsApp, Telegram, Email
          </text>

          <rect x="506" y="162" width="162" height="54" rx="12" fill="#ffffff" stroke="#bde4cd" strokeWidth="1.5" />
          <text x="522" y="185" fill="#155e3d" fontSize="12.5" fontWeight="800">
            Announcement &amp; Aman
          </text>
          <text x="522" y="202" fill="#5e5370" fontSize="11">
            Pengumuman, Review, Block
          </text>
        </svg>
      </div>
    </div>
  );
}
