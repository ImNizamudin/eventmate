# Panduan Setup Supabase untuk EventMate

Ikuti langkah berikut secara berurutan agar autentikasi email, sinkronisasi multi-akun, proteksi kontak, notifikasi real-time, dan ulasan berjalan penuh.

## 1. Buat Proyek Supabase Baru
1. Buka dashboard Supabase dan buat proyek baru (pilih region terdekat seperti `ap-southeast-1` Singapore).
2. Tunggu hingga database selesai dibuat.

## 2. Jalankan Skema Database (`supabase/schema.sql`)
1. Di menu kiri Supabase, buka **SQL Editor** lalu klik **New query**.
2. Salin seluruh isi file `supabase/schema.sql` ke editor, lalu klik **Run**.
3. Pastikan statusnya berhasil tanpa error. Skrip ini otomatis membuat:
   - Seluruh tabel (`profiles`, `profile_contacts`, `teams`, `team_members`, `join_requests`, `team_invitations`, `team_announcements`, `notifications`, `reviews`, `user_blocks`, `reports`).
   - Trigger otomatis untuk pembuatan profil, sinkronisasi jumlah anggota tim, notifikasi otomatis, dan keanggotaan tim saat `accepted`.
   - Kebijakan Row Level Security (RLS) agar kontak anggota hanya terlihat setelah status `accepted` dan tidak diblokir.
   - Bucket Storage `avatars` untuk unggah foto profil.
   - Publikasi Realtime untuk sinkronisasi otomatis antar akun.

## 3. Konfigurasi Autentikasi & Email
1. Buka **Authentication -> Sign In / Providers -> Email**:
   - Pastikan **Enable Email provider** aktif.
   - Pastikan **Confirm email** aktif agar pengguna baru wajib mengonfirmasi email setelah registrasi.
2. Buka **Authentication -> URL Configuration**:
   - Isi **Site URL**: `http://localhost:5173` (saat pengembangan lokal, atau URL domain produksi Anda nanti).
   - Pada **Redirect URLs**, tambahkan:
     - `http://localhost:5173/**`
     - `http://localhost:5173/reset-password`
     - `http://localhost:5173/auth`
3. (Opsional untuk produksi) Di **Project Settings -> Authentication -> SMTP Settings**, hubungkan SMTP kustom (Resend/Brevo/Mailgun) jika ingin batas pengiriman email verifikasi & reset password lebih besar daripada bawaan Supabase.

## 4. Isi File `.env` di Proyek
1. Buka **Project Settings -> API** di dashboard Supabase.
2. Salin **Project URL** dan **anon / public key**.
3. Buka file `.env` di root proyek dan isi:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

4. Jalankan ulang server pengembangan (`npm run dev`).

## 5. Pengujian Multi-Akun
1. Buka aplikasi di dua jendela browser berbeda (misalnya Chrome normal dan Incognito/Firefox).
2. Daftarkan **Akun A** sebagai *Team Creator*, konfirmasi email, lengkapi onboarding + kontak, lalu publikasikan tim baru.
3. Daftarkan **Akun B** sebagai *Team Seeker*, konfirmasi email, lengkapi onboarding + kontak.
4. Di **Akun B**, buka **Temukan Tim** (tim dari Akun A langsung muncul), lalu kirim permintaan bergabung.
5. Di **Akun A**, cek notifikasi dan halaman **Permintaan**, lalu klik **Terima** (*Accepted*).
6. Periksa di kedua akun: status menjadi **Accepted**, jumlah anggota bertambah otomatis, dan pada halaman **Tim Saya** sekarang terbuka tab **Announcement**, **Member Directory**, **Contact Information**, **Rating & Review**, serta **Report & Block**.






#
Persiapan Awal
Pastikan npm run dev sedang berjalan dan bisa diakses di http://localhost:5173.
Buka 3 jendela browser terpisah agar sesi login tidak saling menimpa:
Jendela 1 (Chrome Normal) -> untuk Akun 1 (Team Creator)
Jendela 2 (Chrome Incognito) -> untuk Akun 2 (Team Seeker)
Jendela 3 (Firefox / Edge / Profil Chrome berbeda) -> untuk Akun 3 (Team Seeker)
Siapkan 3 email aktif yang bisa menerima email konfirmasi (tip: jika memakai Gmail, Anda bisa memakai alias +, misalnya emailanda+akun1@gmail.com, emailanda+akun2@gmail.com, dan emailanda+akun3@gmail.com sehingga semua email masuk ke satu kotak masuk).
Tahap 1: Registrasi, Konfirmasi Email, & Lupa Password
Akun 1 (Jendela 1):
Buka http://localhost:5173 -> klik Buat Akun -> pilih peran Team Creator.
Daftar dengan Email 1. Pastikan muncul layar Periksa email kamu untuk konfirmasi.
Uji login sebelum konfirmasi: klik Sudah Konfirmasi? Masuk Sekarang, coba login. Harus muncul pesan bahwa email belum dikonfirmasi beserta tombol Kirim ulang email verifikasi.
Coba klik Kirim ulang email verifikasi, lalu buka kotak masuk Email 1 dan klik tautan konfirmasinya.
Login ulang dengan Email 1, lalu isi halaman Onboarding (Universitas, Jurusan, Skill Product Management, Pitching, serta isi WhatsApp & Telegram dan centang izin berbagi kontak).
Akun 2 (Jendela 2):
Daftar sebagai Team Seeker dengan Email 2, konfirmasi email, lalu masuk.
Uji Lupa Kata Sandi: klik Keluar di menu Profil Saya -> di halaman masuk klik tab Lupa Sandi -> masukkan Email 2 -> klik Kirim Email Pemulihan.
Buka email pemulihan dan klik tautannya. Pastikan langsung masuk ke /reset-password -> masukkan kata sandi baru -> klik Simpan Kata Sandi Baru.
Selesaikan Onboarding Akun 2 (Skill UI/UX Design, React, isi WhatsApp & Email Kontak Tim, centang izin berbagi kontak).
Akun 3 (Jendela 3):
Daftar sebagai Team Seeker dengan Email 3, konfirmasi email, dan selesaikan Onboarding (Skill Marketing, Copywriting, jangan centang izin berbagi kontak terlebih dahulu untuk menguji privasi).
Tahap 2: Sinkronisasi Tim & Pencarian Antar Akun
Di Akun 1: buka Tim Saya atau Temukan Tim -> klik Buat Tim Baru.
Isi detail tim (mis. nama tim Pixel Pioneers, kuota 2 slot anggota, skill UI/UX Design, Marketing) lalu klik Publikasikan Tim.
Di Akun 2 & Akun 3: tanpa perlu daftar ulang atau membuat ulang, buka halaman Temukan Tim (atau refresh sekali jika belum muncul).
Hasil yang diharapkan: Tim Pixel Pioneers buatan Akun 1 otomatis muncul di halaman pencarian Akun 2 dan Akun 3 dengan keterangan 1 anggota · 2 slot tersedia.
Uji Edit Profil Sinkron:
Di Akun 2, buka Profil Saya -> Edit Profil & Kontak, tambahkan skill baru misalnya Figma, lalu simpan.
Di Akun 1, buka Temukan Individu dan cari nama Akun 2.
Hasil yang diharapkan: Skill Figma dan perubahan profil Akun 2 langsung terlihat di Akun 1.
Tahap 3: Permintaan Bergabung (Pending -> Accepted & Rejected)
Di Akun 2: buka Temukan Tim -> klik Lihat Detail pada Pixel Pioneers -> tulis catatan lamaran -> klik Kirim Permintaan Bergabung.
Di Akun 3: lakukan hal yang sama ke tim Pixel Pioneers (kirim permintaan bergabung).
Cek tab Application Status Saya di halaman Permintaan pada Akun 2 dan Akun 3:
Hasil yang diharapkan: Status keduanya tampil sebagai Pending.
Di Akun 1:
Periksa ikon lonceng Notifikasi di kanan atas dan halaman Notifikasi: harus ada 2 notifikasi permintaan bergabung baru.
Buka halaman Permintaan -> tab Permintaan Masuk:
Pada lamaran Akun 2, klik Terima Anggota (Accepted).
Pada lamaran Akun 3, klik Tolak (Rejected).
Verifikasi di semua akun:
Akun 2: menerima notifikasi diterima, status di Application Status Saya berubah menjadi Accepted, dan jumlah anggota tim Pixel Pioneers bertambah menjadi 2 anggota · 1 slot tersedia.
Akun 3: menerima notifikasi ditolak, dan status di Application Status Saya berubah menjadi Rejected.
Tahap 4: Undangan Individu Dua Arah
Di Akun 1: buka Temukan Individu -> klik Profil & Undang pada kartu Akun 3.
Pilih tim Pixel Pioneers, tulis pesan ajakan, lalu klik Kirim Undangan Tim.
Di Akun 3:
Cek Notifikasi (muncul pemberitahuan undangan baru).
Buka Permintaan -> tab Undangan Masuk -> klik Terima Undangan.
Hasil yang diharapkan:
Status undangan berubah menjadi Accepted di Akun 1 (Undangan Terkirim) dan Akun 3 (Undangan Masuk).
Jumlah anggota Pixel Pioneers menjadi 3 anggota · 0 slot tersedia.
Tahap 5: Workspace Tim (Pengganti Chat Grup)

Sekarang Akun 1, Akun 2, dan Akun 3 semuanya resmi tergabung di tim Pixel Pioneers. Uji seluruh tab pada halaman Tim Saya:

Application Status:
Buka tab Application Status di Tim Saya: Akun 2 & Akun 3 melihat status keanggotaan Accepted; Akun 1 melihat riwayat status pelamar timnya.
Member Directory & Contact Information:
Buka tab Member Directory & Contact (3):
Akun 1 dan Akun 2 sama-sama dapat melihat kontak WhatsApp/Telegram/Email masing-masing.
Pada baris Akun 3 (yang tadi tidak mencentang berbagi kontak), tertulis bahwa anggota memilih tidak membagikan kontak.
Uji ubah izin di Akun 3: buka Profil Saya -> Edit Profil & Kontak -> isi nomor WhatsApp dan centang Bagikan kontak, simpan -> cek ulang Member Directory di Akun 1 & Akun 2: kontak Akun 3 kini muncul.
(Opsional cek keamanan): Akun yang tidak diterima di suatu tim tidak bisa melihat kontak anggota tim tersebut.
Announcement:
Di Akun 1 (sebagai Creator), buka tab Announcement -> buat pengumuman baru (mis. "Jadwal Rapat Perdana"), centang Sematkan di bagian atas, lalu klik Publikasikan Pengumuman.
Di Akun 2 & Akun 3: pastikan muncul notifikasi pengumuman baru, dan saat membuka tab Announcement di Tim Saya, pengumuman Akun 1 langsung terbaca (dan tombol tulis pengumuman hanya muncul untuk Creator).
Tahap 6: Rating & Review Antar Anggota
Di Akun 1: pada tab Member Directory & Contact, klik Beri Rating di baris Akun 2 -> pilih bintang (mis. 5) dan tulis ulasan -> Kirim Ulasan.
Di Akun 2: beri rating & ulasan untuk Akun 1.
Verifikasi:
Buka Profil Saya di Akun 2 (dan cari Akun 2 lewat Temukan Individu di Akun 3): rata-rata rating dan isi ulasan tampil permanen di profil Akun 2.
Muat ulang halaman (F5 / Ctrl+R) di seluruh browser untuk memastikan semua data tetap tersimpan dari database Supabase.
Tahap 7: Report & Block (Perlindungan Kontak)
Di Akun 2: pada Member Directory & Contact, klik Report & Block pada baris Akun 3 -> pilih kategori pelanggaran, isi kronologi, pastikan opsi Blokir pengguna ini sekaligus tercentang -> klik Kirim Laporan.
Verifikasi efek blokir:
Di Akun 2: pada baris Akun 3 di Member Directory, kontak Akun 3 langsung disembunyikan dengan status pengguna diblokir; di Temukan Individu, profil Akun 3 tidak lagi tampil.
Di Akun 3: buka kembali Member Directory di Pixel Pioneers -> kontak Akun 2 kini ikut disembunyikan oleh RLS Supabase.
Uji Buka Blokir:
Di Akun 2, buka Profil Saya -> bagian Pengguna yang Diblokir -> klik Buka Blokir pada Akun 3. Visibilitas kontak kembali normal.