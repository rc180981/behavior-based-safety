# Spesifikasi Kolom Formulir & Alur Proses: Panel Administrasi HSE & Manajemen Pengguna

Dokumen ini merinci secara komprehensif **seluruh kolom formulir (*form fields*)**, tipe input, nilai default, validasi, serta penjelasan operasional untuk:
* **Point 1**: Panel Administrasi HSE (Urutan: Tahap 0 → Tahap 2 → Tahap 3 → Tahap 1)
* **Point 2**: Modul Mandiri Manajemen Pengguna & Hak Akses (*RBAC*)

---

# POINT 1: PANEL ADMINISTRASI HSE (URUTAN 0 → 2 → 3 → 1)

```
Panel Administrasi HSE
├── [Header Card] Tahap 0: Pemilihan & Pembuatan Proyek
└── [Navigasi 3 Tab Saja]:
    ├── Tab 1 (Tahap 2): 🏷️ Area Proyek & QR Titik Genba
    ├── Tab 2 (Tahap 3): 📋 Standar Item HSE & Kategori
    └── Tab 3 (Tahap 1): 📍 Geofence & Parameter Proyek
```

---

### A. TAHAP 0: Formulir Pembuatan & Kontrol Proyek
Formulir ini muncul pada modal **"+ Buat Proyek Baru"** dan bar kontrol atas (*Header Control Card*).

| Kolom Input | Tipe Input | Default / Contoh | Validasi | Penjelasan & Fungsi |
| :--- | :--- | :--- | :--- | :--- |
| **Nama Proyek** | Teks | `Proyek PLTU Cilegon Unit 3` | Wajib (Min. 3 karakter) | Nama resmi proyek yang menjadi identitas utama pada header, laporan harian, dan dashboard. |
| **Kode Proyek** | Teks (Kapital) | `PLTU-03` | Wajib (3-10 karakter alfanumerik) | Singkatan unik kode proyek untuk pengelompokan data, QR code payload, dan prefix penomoran temuan. |
| **Tingkat Risiko Proyek** | Dropdown Seleksi | `Tinggi` | Wajib (`tinggi` / `medium`) | Menentukan ambang batas profil risiko lingkungan kerja. Proyek berisiko *Tinggi* memicu peringatan ketat pada observasi tidak aman. |
| **Dropdown Proyek Aktif** | Seleksi Cepat | Proyek terakhir tersimpan | Wajib | Memilih konteks proyek yang sedang dikonfigurasi. Seluruh konfigurasi di Tab 1, 2, dan 3 akan langsung menyesuaikan dengan proyek terpilih. |

---

### B. TAHAP 2 (TAB 1): Formulir Area Proyek & QR Titik Genba
Formulir ini digunakan untuk mendefinisikan zonasi fisik lapangan dan menghasilkan QR Code titik inspeksi.

#### 1. Form Tambah Area Baru
| Kolom Input | Tipe Input | Default / Contoh | Validasi | Penjelasan & Fungsi |
| :--- | :--- | :--- | :--- | :--- |
| **Nama Area Kerja** | Teks | `Workshop Fabrikasi Lantai 1` | Wajib (Min. 3 karakter) | Menamai lokasi spesifik tempat pekerja melakukan aktivitas. Nama ini yang akan dibaca petugas saat memindai QR code di lapangan. |
| **Tombol Aksi: Tambah Area** | Button Submit | `+ Tambahkan Area` | Aktif jika nama terisi | Mendaftarkan area ke database dan seketika membuat QR code unik berbasis hash ID area. |

#### 2. Kartu Area & Kontrol Aksi (Per Item Area)
| Elemen / Aksi | Jenis Kontrol | Tampilan / Aksi | Penjelasan & Fungsi |
| :--- | :--- | :--- | :--- |
| **Thumbnail QR Code** | Preview Gambar | Kanvas QR Code mini | Memberikan kepastian visual bahwa QR code untuk area ini telah ter-generate sempurna. |
| **Nama Area** | Teks Heading | Judul area kerja | Menampilkan identitas area yang dapat diubah kapan saja via tombol edit. |
| **Tombol: Lihat & Cetak QR** | Button (Modal) | Ikon Mata / Cetak | Membuka kartu siap cetak berukuran standar dengan kop nama proyek dan instruksi scan untuk dipasang di tiang/dinding area. |
| **Tombol: Unduh PNG** | Button Download | Ikon Unduh | Mengunduh file gambar QR Code beresolusi tinggi (PNG) untuk dicetak mandiri di percetakan/stiker akrilik. |
| **Tombol: Ubah Nama** | Button Edit | Ikon Pensil | Mengubah nama area jika ada pergantian fungsi ruangan tanpa merusak riwayat observasi sebelumnya. |
| **Tombol: Hapus Area** | Button Hapus | Ikon Tong Sampah (Merah) | Menghapus area jika zona kerja tersebut sudah selesai dibongkar/dinonaktifkan. |

---

### C. TAHAP 3 (TAB 2): Formulir Standar Item HSE & Kategori Kepatuhan
Formulir ini digunakan untuk mengatur checklist kriteria keselamatan yang diawasi di lapangan.

| Kolom Input / Kontrol | Tipe Input | Pilihan / Contoh | Penjelasan & Fungsi |
| :--- | :--- | :--- | :--- |
| **Search Bar (Pencarian)** | Input Teks | `Cari APD, Scaffolding...` | Memfilter daftar item perilaku secara instan tanpa perlu reload halaman. |
| **Filter Tab Kategori** | Tombol Pill | `Semua`, `Wajib`, `Medium` | Memilah tampilan item berdasarkan tingkat keketatan kriteria kepatuhan. |
| **Judul Item Perilaku** | Teks Display | `Kepatuhan Penggunaan Full Body Harness` | Menjelaskan perilaku spesifik yang diamati oleh petugas saat inspeksi. |
| **Deskripsi Standar** | Teks Paragraf | `Pekerja di ketinggian > 1.8m wajib mengaitkan lanyard ganda ke anchor point kuat.` | Panduan operasional yang muncul sebagai referensi di aplikasi petugas saat melakukan genba. |
| **Dropdown Kategori Item** | Dropdown Seleksi | 🔴 **Wajib** / 🟡 **Medium** | **Kritis**: <br>• **Wajib (Ketat)**: Pelanggaran item ini langsung menjadi temuan *Risiko Tinggi* dengan target SLA perbaikan 3 hari.<br>• **Medium (Standar)**: Observasi pembiasaan dan kedisiplinan kerja standar (SLA 7 hari). |
| **Versi Standar** | Badge Angka | `v1`, `v2` | Menjaga integritas data; jika kriteria diubah, observasi lama tetap mengacu pada versi saat observasi dilakukan. |

---

### D. TAHAP 1 (TAB 3): Formulir Geofence & Parameter Proyek
Formulir ini mengunci koordinat GPS perimeter kerja dan aturan target SLA penyelesaian temuan.

| Kolom Input | Tipe Input | Default / Contoh | Validasi | Penjelasan & Fungsi |
| :--- | :--- | :--- | :--- | :--- |
| **Latitude Pusat (Lintang)** | Angka Desimal | `-6.208800` | Antara -90 s/d 90 | Titik koordinat garis lintang pusat proyek untuk validasi posisi petugas di server. |
| **Longitude Pusat (Bujur)** | Angka Desimal | `106.845600` | Antara -180 s/d 180 | Titik koordinat garis bujur pusat proyek. |
| **Radius Toleransi (Meter)** | Angka Bulat | `200` (Meter) | Min. 10m s/d 5000m | Jarak lingkaran aman dari titik pusat proyek di mana petugas diperbolehkan mengisi formulir. |
| **Akurasi GPS Maksimal (Meter)** | Angka Bulat | `50` (Meter) | Min. 5m s/d 200m | Batas toleransi error sensor GPS smartphone petugas (mencegah manipulasi mock location / sinyal lemah). |
| **Toggle Validasi Geofence** | Switch (On/Off) | `Aktif` / `Nonaktif` | Boolean | Jika **Aktif**, server akan menolak pengiriman form dari luar perimeter. Dapat di-nonaktifkan sementara saat masa uji coba/training. |
| **SLA Temuan Wajib (Hari)** | Angka Bulat | `3` (Hari) | Min. 1 hari | Batas waktu maksimal PIC untuk menindaklanjuti temuan kategori Wajib sebelum statusnya berubah menjadi *Overdue* (merah). |
| **SLA Temuan Medium (Hari)** | Angka Bulat | `7` (Hari) | Min. 1 hari | Batas waktu penyelesaian temuan kategori Medium sebelum *Overdue*. |
| **Tombol: Simpan Parameter** | Button Submit | `Simpan Pengaturan Proyek` | Aktif jika form valid | Mengirimkan perubahan ke API `/api/admin/projects` dengan umpan balik toast notifikasi. |

---

# POINT 2: MODUL MANDIRI MANAJEMEN PENGGUNA & HAK AKSES (RBAC)

Modul ini **terpisah dari Panel Administrasi HSE** (dapat diakses via navigasi **"Kelola Pengguna & Tim"** atau URL `/admin/users`).

---

### A. Formulir Pendaftaran & Penugasan Pengguna Baru
Formulir ini dipakai oleh Admin untuk mendaftarkan akun baru ke Firebase Authentication dan menetapkan perannya.

| Kolom Input | Tipe Input | Default / Contoh | Validasi | Penjelasan & Fungsi |
| :--- | :--- | :--- | :--- | :--- |
| **Nama Lengkap (Account Name)** | Teks | `Budi Santoso, S.T.` | Wajib (Min. 3 karakter) | Nama identitas pengguna yang akan ditampilkan pada dashboard, watermark foto observasi, dan kartu temuan. |
| **Email Pengguna (ID Akun)** | Email / ID | `budi.supervisor@perusahaan.com` | Wajib (Format email valid) | Menjadi ID unik untuk login ke sistem BBS Genba. Format email mandiri perusahaan, tidak bergantung pada Google Mail. |
| **Departemen / Divisi** | Dropdown Seleksi | `HSE Operations` | Wajib | Pengelompokan divisi kerja pengguna: <br>• *HSE Operations (K3L)*<br>• *Operasional Lapangan*<br>• *Konstruksi & Sipil*<br>• *Mekanikal & Elektrikal*<br>• *Logistik & Gudang*<br>• *Manajemen Proyek* |
| **Kata Sandi Awal** | Password / Teks | `Password123!` | Min. 6 karakter | Kata sandi awal yang diberikan kepada pengguna. Jika dikosongkan, sistem otomatis mengisikan sandi standar: `Password123!`. |
| **Peran yang Dibutuhkan (Role)** | Dropdown Seleksi | 👷 `Petugas` | Wajib | Menentukan batas wewenang pengguna dalam sistem: <br>• 👷 **Petugas**: Pengisi observasi lapangan & pemantau temuan pribadi.<br>• 🔍 **Supervisor**: Verifikator perbaikan & validator penutupan temuan (*Close Finding*).<br>• ⚙️ **Admin**: Pengendali penuh konfigurasi proyek, area, dan item HSE. |
| **Penugasan Proyek (Assign Project)** | Dropdown / Multi-Select | `Proyek PLTU Cilegon Unit 3` | Wajib minimal 1 proyek | Menentukan proyek mana saja yang dapat diakses oleh pengguna tersebut. |
| **Tombol: Daftarkan Akun** | Button Submit | `Daftarkan & Berikan Akses` | Aktif jika form valid | Mendaftarkan akun ke Firebase Auth, membuat profil di `users/{uid}`, dan menugaskan role ke proyek terkait. |

---

### B. Tabel Manajemen & Kontrol Status Pengguna
Tabel ini menampilkan daftar seluruh pengguna aktif beserta aksi cepat pengelolaan.

| Kolom Tabel | Jenis Komponen | Contoh Data | Penjelasan & Fungsi |
| :--- | :--- | :--- | :--- |
| **Pengguna** | Avatar + Nama + Email | 👤 **Budi Santoso**<br><span style="color:#64748b">budi@perusahaan.com</span> | Menampilkan identitas nama lengkap dan email akun. |
| **Departemen** | Badge Teks | `HSE Operations` | Menunjukkan divisi asal pengguna. |
| **Proyek Terdaftar** | Badge Proyek | `PLTU-03`, `MRT-JKS` | Daftar proyek yang telah ditugaskan kepada pengguna. |
| **Peran (Role)** | Inline Dropdown Seleksi | 🔍 `Supervisor` | Admin dapat mengubah wewenang pengguna secara langsung tanpa membuka modal terpisah. |
| **Status Akun** | Badge Status / Toggle | 🟢 `Aktif` / ⚪ `Nonaktif` | Admin dapat menonaktifkan akun sementara (misal: pekerja cuti/mutasi) tanpa menghapus data historisnya. |
| **Aksi Cepat** | Button Menu | 🔑 Reset Sandi, 🗑️ Hapus Akses | • **Reset Sandi**: Mengembalikan kata sandi ke standar jika pengguna lupa.<br>• **Hapus Akses**: Menghapus penugasan pengguna dari proyek terkait. |
