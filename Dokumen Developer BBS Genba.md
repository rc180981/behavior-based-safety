# Dokumen Developer: Aplikasi Behavior Based Safety (BBS) Genba

PWA multi-proyek untuk observasi perilaku keselamatan · Firebase + GitHub + Vercel · dibangun di Antigravity · 17 Oktober 2026

## 1. Ringkasan

Aplikasi ini menggantikan form kertas BBS (MCS-01). Petugas HSE atau tim lain melakukan Genba ke area proyek dan menilai perilaku (misalnya memakai helm dan safety vest, berjalan di jalur pejalan kaki, tidak memakai HP saat berjalan) sebagai **Positif** atau **Perlu Improvement**. Jika ada temuan, petugas menambahkan foto evidence. Temuan ditindaklanjuti oleh PIC, lalu diverifikasi Supervisor.

Dokumen ini adalah acuan utama untuk developer dan untuk prompt Antigravity di bagian 14. Mockup lengkap ada di kanvas desain: https://claude.ai/artifact/Y6oQupZrnqe3yZtE85GdQc (14 layar).

## 2. Keputusan teknis

| Topik | Keputusan |
| --- | --- |
| Platform | PWA (Angular, versi stabil terbaru), mobile-first untuk petugas, layout desktop untuk Supervisor dan Admin |
| Database | Firebase: Firestore (data), Authentication (login), Cloud Storage (foto evidence) |
| Logika server | Vercel Serverless Functions (folder `/api`) dengan Firebase Admin SDK |
| Kode sumber | GitHub (repo private) |
| Deploy | Vercel, terhubung ke repo GitHub |
| Lingkungan pengembangan | Antigravity |
| Akun | Semua layanan memakai akun rc180981@gmail.com |
| Folder lokal | `D:\FAJAR Apps\Behavior Based Safety` |
| Gaya tampilan web | Mengacu pada Syncfusion Essential UI Kit (tema Tailwind) |
| Gaya tampilan mobile | Mockup yang ada. Repo Flutter Doctor Appointment hanya referensi gaya dan belum dipakai |
| Login | SSO untuk tim HSE, akun lokal (email dan kata sandi) untuk pengguna non-HSE sementara |
| Lokasi | Geofence radius, ditentukan Admin, wajib, tanpa override |
| Offline | Belum diputuskan. Disarankan fase 2 |

## 3. Lingkungan dan akun

**Aturan kerja**

- Seluruh kode berada di `D:\FAJAR Apps\Behavior Based Safety`. Path berisi spasi, jadi selalu beri tanda kutip pada perintah terminal.
- Login ke GitHub, Firebase, dan Vercel dilakukan sendiri oleh pemilik akun lewat `gh auth login`, `firebase login`, dan `vercel login`. Agent tidak boleh meminta atau menyimpan kata sandi.
- **Kunci rahasia tidak boleh masuk ke Git.** Service account Firebase Admin hanya disimpan sebagai environment variable di Vercel dan di file `.env.local` (masuk `.gitignore`). Konfigurasi web Firebase (apiKey dan sejenisnya) memang bersifat publik, tetapi tetap disimpan lewat file environment.
- Simpan dokumen ini dan ekspor mockup (gambar atau PDF) di folder `docs/` pada repo, supaya agent bisa membacanya.

**Persiapan satu kali (dilakukan pemilik akun)**

1. Buat repo GitHub private bernama `behavior-based-safety`.
2. Buat project Firebase. Aktifkan Authentication, Firestore, dan Storage. Periksa paket yang diperlukan (lihat bagian 12).
3. Buat project Vercel dan hubungkan ke repo GitHub.
4. Buat service account Firebase Admin, lalu isi variabel lingkungan di Vercel.

## 4. Arsitektur

- **Klien (Angular PWA)** membaca data langsung dari Firestore sesuai Security Rules, dan mengunggah foto langsung ke Cloud Storage.
- **Semua penulisan penting melalui API Vercel**: kirim observasi, tindak lanjut temuan, verifikasi temuan, dan pengaturan admin. API memverifikasi token Firebase, role, dan aturan bisnis (geofence, item wajib, evidence) sebelum menulis ke Firestore memakai Admin SDK.
- **Security Rules menolak penulisan langsung dari klien** pada koleksi `observations`, `findings`, dan `auditLogs`. Alasannya, validasi lokasi harus dilakukan di server, sedangkan Rules tidak cocok untuk perhitungan jarak.
- Waktu pengiriman memakai waktu server, bukan jam perangkat.

## 5. Peran dan hak akses

Role melekat pada pengguna **per proyek**. Satu orang bisa Supervisor di proyek A dan Petugas di proyek B. Tersedia juga penanda `superAdmin` (HSE pusat) yang melihat semua proyek.

| Fitur | Petugas | Supervisor | Admin |
| --- | --- | --- | --- |
| Mengisi observasi | Ya | Ya | Ya |
| Melihat riwayat sendiri | Ya | Ya | Ya |
| Melihat data semua petugas di proyeknya | Tidak | Ya | Ya |
| Verifikasi atau menutup temuan | Tidak | Ya | Ya |
| Menindaklanjuti temuan sebagai PIC | Ya (jika ditunjuk) | Ya | Ya |
| Dashboard proyek | Milik sendiri | Ya | Ya |
| Dashboard lintas proyek | Tidak | Tidak | Ya |
| Kelola proyek, geofence, area, item HSE, pengguna | Tidak | Tidak | Ya |
| Kelola master perilaku dan standar kartu | Tidak | Tidak | Ya |

Pengecekan role dilakukan di API dan di Security Rules, bukan hanya dengan menyembunyikan menu.

## 6. Model data Firestore

- `users/{uid}`: `name`, `email`, `department`, `loginType` (sso atau lokal), `active`, `superAdmin`.
- `projects/{projectId}`: `name`, `code`, `status`, `riskLevel` (tinggi atau medium), `geofence` {`lat`, `lng`, `radiusM`, `maxAccuracyM`, `required`}, `dueDays` {`wajib`, `medium`}.
- `projects/{projectId}/members/{uid}`: `role` (petugas, supervisor, admin), `active`.
- `projects/{projectId}/areas/{areaId}`: `name`, `active`. Daftar area dikelola Admin.
- `bbsItems/{itemId}` (master pusat): `title`, `description`, `standardImagePath`, `version`, `active`.
- `projects/{projectId}/projectItems/{id}`: `itemId`, `areaId`, `category` (wajib atau medium), `standardVersion`, `active`, `categoryChangeReason`.
- `observations/{observationId}`: `projectId`, `areaId`, `observerUid`, `submittedAt` (waktu server), `loc` {`lat`, `lng`, `accuracyM`, `distanceM`}, `answers[]` (`projectItemId`, `itemId`, `category`, `standardVersion`, `result`: positif atau improvement).
- `findings/{findingId}`: `observationId`, `projectId`, `areaId`, `projectItemId`, `category`, `risk` (rendah, sedang, tinggi), `note`, `photosBefore[]`, `photosAfter[]`, `picUid`, `dueDate`, `status` (open, waiting\_verification, closed), `history[]`.
- `auditLogs/{id}`: `actorUid`, `action`, `targetPath`, `before`, `after`, `at`.

Catatan model data:

- Status **Overdue** tidak disimpan. Dihitung dari `dueDate` yang sudah lewat selama status belum closed.
- Setiap jawaban menyimpan `category` dan `standardVersion` saat itu, sehingga laporan lama tetap bisa ditelusuri setelah standar atau kategori berubah.
- Foto disimpan di Storage dengan path `evidence/{projectId}/{findingId}/...`. Dokumen hanya menyimpan path.

## 7. Aturan bisnis

### 7.1 Validasi lokasi (geofence)

- Titik pusat (`lat`, `lng`), `radiusM`, dan `maxAccuracyM` ditentukan **hanya oleh Admin** per proyek.
- Saat petugas membuka form, aplikasi meminta izin lokasi dan menampilkan status. Saat mengirim, koordinat dan akurasi dikirim ke API.
- API menghitung jarak (rumus Haversine). Pengiriman diterima jika jarak kurang dari atau sama dengan `radiusM` **dan** akurasi kurang dari atau sama dengan `maxAccuracyM`.
- Jika di luar radius, pengiriman ditolak. **Tidak ada override.** Layar menampilkan status terkunci dan tombol Cek Lokasi Ulang.
- Kegagalan validasi dicatat (pengguna, waktu, jarak) untuk membantu menyetel radius.
- Petugas tidak bisa mengetik atau mengubah lokasi. Area di dalam proyek dipilih dari daftar milik Admin.
- Keterbatasan: PWA tidak bisa mencegah fake GPS sepenuhnya. Mitigasinya adalah validasi server, foto evidence dengan cap waktu, dan pemantauan pola janggal.

### 7.2 Kategori item HSE

- Level risiko proyek (tinggi atau medium) menentukan nilai awal kategori item baru. Pada proyek tinggi, item baru otomatis **Wajib**.
- Admin menentukan kategori setiap item saat membuat aktivitas HSE di area proyek. Satu proyek boleh berisi campuran Wajib dan Medium.
- Menurunkan item Wajib ke Medium memerlukan catatan alasan dan dicatat di audit log.
- Perubahan kategori hanya berlaku untuk observasi berikutnya.

| Aspek | Wajib | Medium |
| --- | --- | --- |
| Dijawab sebelum kirim | Ya, dan tombol Kirim terkunci sampai semua item Wajib terjawab | Ya, tetapi tidak mengunci tombol Kirim |
| Evidence jika Perlu Improvement | Wajib | Wajib foto atau catatan sesuai kebijakan |
| Tenggat tindak lanjut | Singkat (usulan 1–3 hari) | Lebih longgar (usulan 7 hari) |
| Eskalasi jika overdue | Otomatis ke Supervisor dan Admin | Notifikasi ke PIC |
| Dashboard | Dihitung terpisah (kepatuhan item Wajib) | Termasuk persentase umum |

Angka tenggat dan perilaku Medium adalah usulan yang harus dikonfirmasi tim HSE (bagian 13).

### 7.3 Alur temuan

1. Petugas memilih Perlu Improvement. Sistem mewajibkan foto, tingkat risiko, catatan, PIC, dan target selesai. Tenggat awal dihitung dari kategori.
2. Status **open**. PIC menindaklanjuti dan mengunggah foto sesudah perbaikan, lalu status menjadi **waiting\_verification**.
3. Supervisor atau Admin memeriksa. Jika sesuai, status menjadi **closed**. Jika belum, temuan dikembalikan ke PIC dengan catatan.
4. Setiap perubahan status ditulis ke `history[]`.

### 7.4 Standar kartu

- Setiap penilaian punya tombol Lihat standar atau Sembunyikan standar yang menampilkan gambar kartu dan deskripsi, dengan zoom saat gambar diketuk.
- Terbuka otomatis untuk 5 observasi pertama pengguna, setelah itu tertutup. Pilihan show atau hide diingat per pengguna.
- Admin mengunggah gambar dan deskripsi di master perilaku, dengan nomor versi.

## 8. Keamanan

- Firestore Rules: pengguna hanya membaca data proyek tempat ia punya dokumen `members` aktif. `superAdmin` membaca semua. Penulisan langsung ke `observations`, `findings`, dan `auditLogs` ditolak.
- Storage Rules: unggah dan baca foto hanya untuk anggota proyek terkait, dengan batas ukuran dan tipe berkas (gambar).
- API Vercel: setiap endpoint memverifikasi ID token Firebase, lalu mengecek role pada proyek yang diminta.
- Pengaturan geofence, role, dan kategori item hanya bisa diubah Admin, dan setiap perubahan ditulis ke `auditLogs` (siapa, kapan, nilai lama, nilai baru).
- Foto diberi kompresi di klien sebelum diunggah.
- Lokasi hanya diambil saat form dibuka atau dikirim, tidak dilacak terus-menerus. Beri tahu petugas dan sepakati dengan HR.

## 9. Endpoint API (Vercel Functions)

| Endpoint | Fungsi | Role |
| --- | --- | --- |
| `POST /api/observations` | Validasi geofence, item Wajib, evidence; tulis observasi dan temuan | Petugas ke atas |
| `POST /api/findings/{id}/follow-up` | PIC mengirim tindak lanjut dan foto sesudah | PIC, Supervisor, Admin |
| `POST /api/findings/{id}/verify` | Tutup atau tolak temuan | Supervisor, Admin |
| `POST /api/admin/projects` dan `PATCH` | Kelola proyek, geofence, level risiko | Admin |
| `POST /api/admin/project-items` | Kelola item HSE dan kategori | Admin |
| `POST /api/admin/members` | Tugaskan pengguna dan role per proyek | Admin |
| `POST /api/admin/areas` | Kelola area proyek | Admin |
| `POST /api/admin/bbs-items` | Kelola master perilaku dan standar kartu | Admin |

## 10. Daftar layar dan route

| Route | Layar | Mockup |
| --- | --- | --- |
| `/login` | Login (SSO dan akun lokal) | 4 |
| `/observasi/baru` | Form observasi dengan status lokasi, kategori, standar kartu | 1, 11 |
| `/observasi/baru` (status terkunci) | Di luar area | 6 |
| `/temuan/baru` (bagian dari form) | Evidence temuan | 2 |
| `/temuan-saya` | Temuan untuk PIC (mobile) | 14 |
| `/dashboard` | Dashboard proyek (mobile dan web) | 3, 7 |
| `/temuan` | Daftar temuan (web) | 9 |
| `/temuan/:id` | Detail dan verifikasi temuan | 13 |
| `/admin/proyek/:id/geofence` | Titik lokasi dan radius | 5 |
| `/admin/proyek/:id/item-hse` | Item HSE per proyek dan kategori | 10 |
| `/admin/pengguna` | Pengguna dan role | 12 |
| `/observasi` (web) | Form observasi versi desktop | 8 |

Belum ada mockup: riwayat observasi petugas, master area per proyek, master perilaku dan unggah standar kartu. Ketiganya tetap dibangun mengikuti pola layar yang sudah ada.

## 11. Fase pengembangan

**Fase 0, fondasi (1–2 hari)**

- Inisialisasi proyek Angular PWA, Tailwind, struktur folder, koneksi Firebase dan Vercel, `.gitignore`, `.env.example`, CI sederhana (lint dan build).

**Fase 1, MVP (pilot satu proyek)**

- Login, pemilihan proyek, form observasi, validasi geofence di API, evidence temuan, riwayat sendiri.
- Admin: proyek, geofence, area, item HSE dan kategori, pengguna dan role.
- Security Rules dan audit log.

**Fase 2**

- Alur temuan lengkap (PIC, verifikasi, overdue dan eskalasi), notifikasi, dashboard, export Excel atau PDF.
- Mode offline (antrean pengiriman) jika diputuskan.

**Fase 3**

- SSO penuh, QR lokasi, penyempurnaan dashboard lintas proyek.

Setiap fase berhenti untuk dites dan disetujui sebelum lanjut.

## 12. Risiko dan hal yang perlu diverifikasi

- **Paket Firebase:** periksa apakah Cloud Storage dan fitur lain yang dipakai memerlukan paket berbayar (Blaze) pada project baru. Logika server sengaja ditaruh di Vercel Functions, tetapi paket Storage tetap perlu dicek sebelum memulai.
- **SSO:** Microsoft atau Google lewat Firebase Authentication. Jika perusahaan memakai OIDC atau SAML khusus, fitur Identity Platform mungkin diperlukan. Tentukan penyedia SSO dan siapa yang mengurus konfigurasinya.
- **Lisensi Syncfusion:** blok UI gratis, tetapi komponen Syncfusion di dalamnya (grid, chart) memerlukan lisensi. Jika belum ada, pakai Tailwind murni atau library lain.
- **Akurasi GPS di dalam gedung:** tanpa override, radius dan batas akurasi harus diuji di lapangan saat pilot. Titik awal yang disarankan: radius 150–250 m, batas akurasi sekitar 50 m.
- **Fake GPS** tidak bisa dicegah penuh di PWA.
- **Dashboard:** untuk fase 1 cukup memakai query Firestore. Jika data membesar, tambahkan dokumen ringkasan terhitung.
- **Kata sandi dan kunci:** jangan simpan di repo, di dokumen ini, atau di prompt.

## 13. Pertanyaan terbuka untuk tim HSE

1. Apakah dua kategori (Wajib dan Medium) sudah cukup, atau perlu kategori Rendah?
2. Berapa hari tenggat tindak lanjut untuk Wajib dan Medium?
3. Apakah item Medium boleh dikosongkan atau tetap harus dijawab?
4. Apakah petugas non-HSE memakai SSO atau akun lokal yang dibuat Admin?
5. Apakah mode offline masuk fase 1?
6. Siapa PIC tindak lanjut, dan apakah PIC cukup memakai akun petugas?
7. Nilai radius dan batas akurasi GPS per proyek (ditentukan lewat pilot).
8. Penyedia SSO yang dipakai dan siapa yang mengatur konfigurasinya.

## 14. Prompt untuk Antigravity

Salin prompt berikut langsung ke Antigravity. Prompt ini berdiri sendiri: semua ketentuan penting sudah ada di dalamnya, jadi folder `docs/` tidak wajib disiapkan lebih dulu. Untuk hasil tampilan yang lebih mirip mockup, lampirkan ekspor layar dari kanvas desain.

```
PERAN
Kamu adalah senior full-stack engineer. Bangun aplikasi web PWA multi-proyek bernama "BBS Genba (Behavior Based Safety)" untuk menggantikan form kertas observasi perilaku keselamatan (MCS-01). Petugas HSE atau tim lain melakukan Genba ke area proyek dan menilai perilaku sebagai Positif atau Perlu Improvement. Jika ada temuan, petugas menambahkan foto evidence. Temuan ditindaklanjuti oleh PIC lalu diverifikasi Supervisor.

Perilaku awal yang dinilai (dari form kertas):
1. Memasuki area warehouse memakai APD: helm dan safety vest.
2. Berjalan pada jalur pejalan kaki yang tersedia.
3. Tidak menggunakan handphone saat berjalan kaki.
Setiap perilaku punya kartu gambar standar (gambar dan deskripsi) yang diunggah Admin.

LINGKUNGAN
- Folder kerja lokal: D:\FAJAR Apps\Behavior Based Safety (path berisi spasi, selalu beri tanda kutip di perintah terminal).
- Semua layanan memakai akun rc180981@gmail.com. Saya login sendiri lewat gh auth login, firebase login, dan vercel login. Jangan pernah meminta, menulis, atau menyimpan kata sandi.
- Kode sumber di GitHub (repo private: behavior-based-safety). Deploy ke Vercel. Database dan auth di Firebase.

TECH STACK (wajib)
- Angular versi stabil terbaru, standalone components, TypeScript strict, Tailwind CSS, PWA (service worker, manifest, bisa dipasang di layar utama).
- Firebase: Authentication, Firestore, Cloud Storage.
- Logika server: Vercel Serverless Functions di folder /api memakai Firebase Admin SDK. Semua penulisan penting (kirim observasi, tindak lanjut temuan, verifikasi, pengaturan admin) lewat API ini. Firestore Rules menolak penulisan langsung dari klien ke koleksi observations, findings, dan auditLogs.
- Tampilan web: gaya Tailwind (indigo, kartu, tabel, sidebar). Tampilan mobile: mobile-first, header navy, kartu putih, tombol besar. Jangan memakai komponen Syncfusion kecuali saya konfirmasi lisensinya.
- Bahasa antarmuka: Bahasa Indonesia. Area sentuh minimal 44px.

ROLE
Role per proyek: petugas, supervisor, admin (dokumen projects/{id}/members/{uid}), ditambah penanda superAdmin untuk HSE pusat.
- Petugas: isi observasi, lihat riwayat sendiri, tindak lanjut temuan jika ditunjuk sebagai PIC.
- Supervisor: semua hak petugas, lihat data semua petugas di proyeknya, verifikasi dan tutup temuan.
- Admin: semua hak supervisor, kelola proyek, geofence, area, item HSE dan kategori, pengguna dan role, master perilaku dan standar kartu.
- Cek role di API dan di Security Rules, bukan hanya menyembunyikan menu.

LOGIN
- SSO (Firebase Auth, penyedia Microsoft atau Google, jadikan konfigurasi) untuk tim HSE.
- Akun lokal (email dan kata sandi) sementara untuk pengguna non-HSE, dibuat Admin.
- Setelah login, pengguna memilih proyek dari daftar proyek yang ditugaskan kepadanya.

MODEL DATA FIRESTORE
- users/{uid}: name, email, department, loginType, active, superAdmin
- projects/{projectId}: name, code, status, riskLevel (tinggi atau medium), geofence {lat, lng, radiusM, maxAccuracyM, required}, dueDays {wajib, medium}
- projects/{projectId}/members/{uid}: role, active
- projects/{projectId}/areas/{areaId}: name, active (dikelola Admin)
- bbsItems/{itemId}: title, description, standardImagePath, version, active (master pusat)
- projects/{projectId}/projectItems/{id}: itemId, areaId, category (wajib atau medium), standardVersion, active, categoryChangeReason
- observations/{id}: projectId, areaId, observerUid, submittedAt (waktu server), loc {lat, lng, accuracyM, distanceM}, answers[] {projectItemId, itemId, category, standardVersion, result: positif atau improvement}
- findings/{id}: observationId, projectId, areaId, projectItemId, category, risk (rendah, sedang, tinggi), note, photosBefore[], photosAfter[], picUid, dueDate, status (open, waiting_verification, closed), history[]
- auditLogs/{id}: actorUid, action, targetPath, before, after, at
- Foto disimpan di Storage path evidence/{projectId}/{findingId}/..., dokumen hanya menyimpan path.
- Status overdue tidak disimpan, dihitung dari dueDate yang lewat dan status belum closed.

ATURAN BISNIS
1. Geofence: titik lat/lng, radius, dan batas akurasi GPS ditentukan hanya oleh Admin per proyek. Petugas tidak bisa mengubah lokasi. Saat kirim, klien mengirim koordinat dan akurasi ke API. API menghitung jarak (Haversine) dan hanya menerima jika jarak <= radiusM dan akurasi <= maxAccuracyM. Di luar radius ditolak. TIDAK ADA override. Layar menampilkan status terkunci dan tombol Cek Lokasi Ulang. Catat kegagalan validasi (pengguna, waktu, jarak).
2. Area di dalam proyek dipilih petugas dari daftar milik Admin, bukan diketik.
3. Kategori item HSE: Admin menentukan kategori (Wajib atau Medium) tiap item saat membuat aktivitas HSE di area proyek. Pada proyek riskLevel tinggi, item baru otomatis Wajib. Menurunkan Wajib ke Medium butuh catatan alasan dan masuk auditLogs. Perubahan hanya berlaku untuk observasi berikutnya.
4. Item Wajib: harus dijawab, tombol Kirim terkunci sampai semua item Wajib terjawab, temuan wajib evidence, tenggat singkat (default 3 hari), eskalasi otomatis ke Supervisor dan Admin jika overdue. Item Medium: tetap dijawab tetapi tidak mengunci tombol Kirim, tenggat lebih longgar (default 7 hari), notifikasi ke PIC jika overdue. Nilai default tenggat bisa diubah Admin lewat dueDays proyek.
5. Temuan: bila hasil Perlu Improvement, wajib foto, risiko, catatan, PIC, dan target selesai. Alur: open, PIC tindak lanjut dan unggah foto sesudah lalu waiting_verification, Supervisor atau Admin verifikasi lalu closed atau dikembalikan ke PIC dengan catatan. Setiap perubahan status ditulis ke history[].
6. Standar kartu: di setiap penilaian ada tombol Lihat standar atau Sembunyikan standar yang menampilkan gambar kartu dan deskripsi, dengan zoom saat gambar diketuk. Terbuka otomatis untuk 5 observasi pertama pengguna, setelah itu tertutup. Pilihan show atau hide diingat per pengguna.
7. Simpan category dan standardVersion pada setiap jawaban agar laporan lama tetap bisa ditelusuri.
8. Waktu pengiriman memakai waktu server. Semua perubahan admin ditulis ke auditLogs. Lokasi hanya diambil saat form dibuka atau dikirim, tidak dilacak terus-menerus.

KEAMANAN
- Firestore Rules: pengguna hanya membaca data proyek tempat ia punya dokumen members aktif. superAdmin membaca semua. Penulisan langsung ke observations, findings, auditLogs ditolak.
- Storage Rules: unggah dan baca foto hanya untuk anggota proyek terkait, batasi ukuran dan tipe (gambar). Kompres foto di klien sebelum unggah.
- Setiap endpoint API memverifikasi ID token Firebase lalu mengecek role pada proyek yang diminta.
- Jangan commit rahasia. Buat .env.example, isi .env.local placeholder, pastikan .env* ada di .gitignore. Service account Firebase Admin hanya lewat environment variable Vercel.

ENDPOINT API
- POST /api/observations: validasi geofence, item Wajib, evidence; tulis observasi dan temuan.
- POST /api/findings/{id}/follow-up: PIC kirim tindak lanjut dan foto sesudah.
- POST /api/findings/{id}/verify: tutup atau tolak (supervisor, admin).
- /api/admin/projects, /project-items, /members, /areas, /bbs-items: kelola data (admin), tulis auditLogs.

LAYAR (route)
Mobile (petugas):
- /login: judul "Masuk ke BBS Genba", kolom NIK atau email, kata sandi, tombol Masuk, tombol "Masuk dengan SSO perusahaan".
- /observasi/baru: header navy dengan nama proyek dan status "Lokasi terverifikasi, 18 m dari titik proyek", dropdown Area, tanggal dan jam otomatis, daftar item dengan lencana Wajib (merah) atau Medium (kuning), tombol Positif (hijau) dan Perlu Improvement (oranye), tombol Lihat standar, tombol Kirim Observasi yang terkunci sampai item Wajib terjawab. Item Perlu Improvement membuka bagian Evidence: foto (maks 5), tingkat risiko, catatan, PIC, target selesai.
- Status di luar area: pesan "Lokasi tidak sesuai", item terkunci, tombol Cek Lokasi Ulang.
- /temuan-saya: tab Open, Verifikasi, Closed. Kartu temuan dengan lencana sisa hari atau Overdue (merah), unggah foto bukti perbaikan, tombol Kirim Tindak Lanjut.
- /dashboard (mobile): ringkasan dan filter proyek.
- /observasi/riwayat: riwayat observasi petugas.
Web (supervisor dan admin), layout sidebar kiri, header berisi pemilih proyek:
- /dashboard: 4 kartu (total observasi, persen positif, temuan open, overdue), grafik persen positif per perilaku, tabel temuan terbaru.
- /temuan: filter (cari, status, risiko, area), tabel, export Excel.
- /temuan/:id: foto sebelum dan sesudah, catatan, informasi PIC dan lokasi pelapor, riwayat status, tombol Verifikasi dan Tutup atau Tolak.
- /admin/proyek/:id/geofence: peta pratinjau radius, kolom lat, lng, radius, batas akurasi, sakelar wajib validasi.
- /admin/proyek/:id/item-hse: level risiko proyek, tabel item per area dengan kategori, form tambah item (nama, area, kategori Wajib atau Medium, unggah kartu standar).
- /admin/pengguna: tabel pengguna (jenis login, proyek dan role), form tugaskan ke proyek dan role.
- /admin/area dan /admin/master-perilaku: kelola area proyek, master perilaku dan unggah standar kartu dengan versi.

CARA KERJA
- Mulai dengan membuat rencana implementasi dan daftar tugas per fase, lalu tunggu persetujuan saya sebelum menulis kode.
- Fase 0 (fondasi): Angular PWA, Tailwind, struktur folder (src/app/features, core, shared; api/), ESLint, .gitignore, .env.example, git init dan hubungkan ke GitHub (branch main dan dev), firebase init (Firestore, Storage, rules), vercel.json, halaman awal dan login kosong yang bisa di-deploy sebagai bukti alur deploy berjalan.
- Fase 1 (MVP, pilot satu proyek): login, pilih proyek, form observasi, validasi geofence di API, evidence temuan, riwayat sendiri, admin (proyek, geofence, area, item HSE dan kategori, pengguna dan role), Security Rules, audit log.
- Fase 2: alur temuan lengkap (PIC, verifikasi, overdue dan eskalasi), notifikasi, dashboard, export Excel atau PDF. Mode offline hanya jika saya minta.
- Fase 3: SSO penuh, QR lokasi, dashboard lintas proyek.
- Setelah tiap fase: jalankan lint dan build, ringkas apa yang selesai, tulis cara menjalankannya, lalu berhenti dan minta konfirmasi sebelum lanjut.
- Commit kecil dan sering dengan pesan jelas. Branch dev untuk pengembangan, main untuk rilis.
- Hal yang butuh tindakan manual dari saya (membuat project Firebase, mengisi environment variable, login) tulis sebagai daftar langkah yang jelas. Jangan dilewati atau dikarang. Jika ada yang tidak jelas, tanyakan sebelum menebak.

KRITERIA SELESAI FASE 1
- Petugas login, memilih proyek, mengisi perilaku, dan mengirim observasi hanya jika berada di dalam radius.
- Di luar radius: form terkunci dan pengiriman ditolak server.
- Item Wajib yang belum dijawab mengunci tombol Kirim.
- Temuan tanpa foto ditolak.
- Admin dapat mengatur proyek, geofence, area, item HSE dan kategori, serta pengguna dan role.
- Security Rules dan audit log aktif. Pengguna tidak bisa membaca data proyek yang bukan miliknya.
```

## 15. Langkah berikutnya

1. Ekspor mockup (gambar atau PDF) dan dokumen ini ke folder `docs/` pada folder proyek.
2. Siapkan repo GitHub, project Firebase, dan project Vercel (bagian 3).
3. Jalankan prompt di bagian 14 di Antigravity, mulai dari rencana dan Fase 0.
4. Konfirmasi pertanyaan terbuka (bagian 13) dengan tim HSE sebelum Fase 1 dimulai.
