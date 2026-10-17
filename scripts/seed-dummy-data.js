const fs = require('fs');
const path = require('path');

const envPath = path.resolve('D:/FAJAR Apps/Behavior Based Safety/bbs_import.env');
const content = fs.readFileSync(envPath, 'utf8');

for (const line of content.split('\n')) {
  const idx = line.indexOf('=');
  if (idx > 0) {
    const k = line.substring(0, idx).trim();
    let v = line.substring(idx + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) {
      v = v.slice(1, -1);
    }
    process.env[k] = v;
  }
}

const basePath = 'D:/FAJAR Apps/Behavior Based Safety/node_modules/firebase-admin/lib';
const { initializeApp, cert, getApps, getApp } = require(basePath + '/app/index.js');
const { getFirestore } = require(basePath + '/firestore/index.js');
const { getAuth } = require(basePath + '/auth/index.js');

let privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (privateKey) {
  privateKey = privateKey.trim();
  if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n');
}

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  }),
});

const db = getFirestore(app);
const auth = getAuth(app);

async function seedData() {
  console.log('🚀 Memulai Seeding Data Dummy Siklus Lengkap BBS Genba...');

  // 1. Setup User Admin
  const adminEmail = 'rc180981@gmail.com';
  let adminUid = 'admin-rc180981';
  try {
    const userRecord = await auth.getUserByEmail(adminEmail);
    adminUid = userRecord.uid;
    console.log(`✓ Ditemukan akun Firebase Auth: ${adminEmail} (UID: ${adminUid})`);
  } catch {
    console.log(`ℹ Akun Auth ${adminEmail} belum terdaftar di Firebase Auth (akan otomatis tertaut saat login SSO).`);
  }

  // Simpan info user di koleksi users
  await db.collection('users').doc(adminUid).set({
    email: adminEmail,
    name: 'Fajar Rakhmat C. (HSE Manager)',
    loginType: 'sso',
    superAdmin: true,
    active: true,
    department: 'HSE Corporate',
    createdAt: new Date().toISOString(),
  }, { merge: true });

  const supervisorUid = 'supervisor-budi';
  await db.collection('users').doc(supervisorUid).set({
    email: 'budi.supervisor@perusahaan.com',
    name: 'Budi Santoso (Safety Supervisor)',
    loginType: 'lokal',
    superAdmin: false,
    active: true,
    department: 'HSE Operations',
    createdAt: new Date().toISOString(),
  }, { merge: true });

  const picUid = 'pic-doni';
  await db.collection('users').doc(picUid).set({
    email: 'doni.pic@perusahaan.com',
    name: 'Doni Pratama (PIC Warehouse)',
    loginType: 'lokal',
    superAdmin: false,
    active: true,
    department: 'Logistik & Gudang',
    createdAt: new Date().toISOString(),
  }, { merge: true });

  const petugasUid = 'petugas-agus';
  await db.collection('users').doc(petugasUid).set({
    email: 'agus.safety@perusahaan.com',
    name: 'Agus Setiawan (Petugas Genba)',
    loginType: 'lokal',
    superAdmin: false,
    active: true,
    department: 'HSE Field Officer',
    createdAt: new Date().toISOString(),
  }, { merge: true });

  console.log('✓ Master Pengguna & Role HSE siap.');

  // 2. Master BBS Items
  const bbsItemsData = [
    {
      id: 'bbs-apd-helm-vest',
      title: 'Memasuki area warehouse memakai APD: helm dan safety vest',
      description: 'Petugas dan pekerja wajib menggunakan helm standar dengan tali dagu terikat dan safety vest reflektif sebelum melangkah masuk area pergudangan.',
      standardImagePath: 'standards/default/apd-helm-vest.png',
      version: 1,
      active: true,
    },
    {
      id: 'bbs-walkway',
      title: 'Berjalan pada jalur pejalan kaki yang tersedia (walkway)',
      description: 'Berjalan hanya di dalam garis marka hijau pejalan kaki. Tidak memotong jalur forklift atau alat berat operasional.',
      standardImagePath: 'standards/default/jalur-pejalan-kaki.png',
      version: 1,
      active: true,
    },
    {
      id: 'bbs-no-hp',
      title: 'Tidak menggunakan handphone saat berjalan kaki',
      description: 'Dilarang mengetik, menelpon, atau melihat layar telepon genggam saat sedang berjalan kaki di seluruh zona operasional aktif.',
      standardImagePath: 'standards/default/no-handphone-walk.png',
      version: 1,
      active: true,
    },
    {
      id: 'bbs-jarak-forklift',
      title: 'Menjaga jarak aman minimal 3 meter dari forklift aktif',
      description: 'Pertahankan kontak mata dengan operator forklift dan jangan pernah berdiri di area titik buta (blindspot) alat berat.',
      standardImagePath: 'standards/default/jarak-forklift.png',
      version: 1,
      active: true,
    },
    {
      id: 'bbs-housekeeping',
      title: 'Menyimpan material dan pallet kayu secara rapi dan stabil',
      description: 'Pallet tidak boleh ditumpuk melebihi batas ketinggian 1.8 meter dan tidak boleh menghalangi akses darurat atau hydrant kebakaran.',
      standardImagePath: 'standards/default/housekeeping.png',
      version: 1,
      active: true,
    },
  ];

  for (const item of bbsItemsData) {
    const { id, ...data } = item;
    await db.collection('bbsItems').doc(id).set({
      ...data,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }
  console.log('✓ Master Perilaku Keselamatan (BBS Items) siap.');

  // 3. Proyek 1: Warehouse Cikarang (WH-CKR)
  const proj1Id = 'proj-wh-cikarang';
  await db.collection('projects').doc(proj1Id).set({
    name: 'Warehouse & Logistik Cikarang',
    code: 'WH-CKR',
    status: 'active',
    riskLevel: 'tinggi',
    geofence: {
      lat: -6.2088,
      lng: 106.8456,
      radiusM: 300,
      maxAccuracyM: 50,
      required: false, // fleksibel untuk uji coba dev/lokal
    },
    dueDays: {
      wajib: 3,
      medium: 7,
    },
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    createdBy: adminUid,
  }, { merge: true });

  // Area Proyek 1
  const areas1 = [
    { id: 'area-loading-dock', name: 'Loading Dock & Unloading Area', active: true },
    { id: 'area-rak-highbay', name: 'Zona Rak Bertingkat (High Bay)', active: true },
    { id: 'area-jalur-forklift', name: 'Jalur Utama Forklift & Staging', active: true },
    { id: 'area-workshop', name: 'Bengkel Maintenance & Baterai', active: true },
  ];
  for (const a of areas1) {
    await db.collection('projects').doc(proj1Id).collection('areas').doc(a.id).set(a, { merge: true });
  }

  // Members Proyek 1
  await db.collection('projects').doc(proj1Id).collection('members').doc(adminUid).set({
    role: 'admin',
    active: true,
    email: adminEmail,
    name: 'Fajar Rakhmat C. (HSE Manager)',
  }, { merge: true });

  await db.collection('projects').doc(proj1Id).collection('members').doc(supervisorUid).set({
    role: 'supervisor',
    active: true,
    email: 'budi.supervisor@perusahaan.com',
    name: 'Budi Santoso',
  }, { merge: true });

  await db.collection('projects').doc(proj1Id).collection('members').doc(picUid).set({
    role: 'petugas',
    active: true,
    email: 'doni.pic@perusahaan.com',
    name: 'Doni Pratama',
  }, { merge: true });

  await db.collection('projects').doc(proj1Id).collection('members').doc(petugasUid).set({
    role: 'petugas',
    active: true,
    email: 'agus.safety@perusahaan.com',
    name: 'Agus Setiawan',
  }, { merge: true });

  // Project Items Proyek 1
  const projItems1 = [
    { id: 'pi-1', itemId: 'bbs-apd-helm-vest', areaId: 'area-loading-dock', category: 'wajib', standardVersion: 1, active: true },
    { id: 'pi-2', itemId: 'bbs-walkway', areaId: 'area-jalur-forklift', category: 'wajib', standardVersion: 1, active: true },
    { id: 'pi-3', itemId: 'bbs-no-hp', areaId: 'area-loading-dock', category: 'medium', standardVersion: 1, active: true },
    { id: 'pi-4', itemId: 'bbs-jarak-forklift', areaId: 'area-jalur-forklift', category: 'wajib', standardVersion: 1, active: true },
    { id: 'pi-5', itemId: 'bbs-housekeeping', areaId: 'area-rak-highbay', category: 'medium', standardVersion: 1, active: true },
  ];
  for (const pi of projItems1) {
    await db.collection('projects').doc(proj1Id).collection('projectItems').doc(pi.id).set(pi, { merge: true });
  }
  console.log('✓ Proyek 1 (Warehouse Cikarang) dengan 4 area & master item siap.');

  // 4. Proyek 2: Fabrikasi Surabaya (FAB-SBY)
  const proj2Id = 'proj-fab-surabaya';
  await db.collection('projects').doc(proj2Id).set({
    name: 'Pabrik Fabrikasi & Assembly Surabaya',
    code: 'FAB-SBY',
    status: 'active',
    riskLevel: 'tinggi',
    geofence: {
      lat: -7.2575,
      lng: 112.7521,
      radiusM: 250,
      maxAccuracyM: 50,
      required: false,
    },
    dueDays: {
      wajib: 3,
      medium: 7,
    },
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    createdBy: adminUid,
  }, { merge: true });

  await db.collection('projects').doc(proj2Id).collection('areas').doc('area-welding').set({
    id: 'area-welding',
    name: 'Area Pengelasan & Cutting Fabrikasi',
    active: true,
  }, { merge: true });

  await db.collection('projects').doc(proj2Id).collection('members').doc(adminUid).set({
    role: 'admin',
    active: true,
    email: adminEmail,
    name: 'Fajar Rakhmat C. (HSE Manager)',
  }, { merge: true });

  console.log('✓ Proyek 2 (Fabrikasi Surabaya) siap untuk dashboard lintas proyek.');

  // 5. Dummy Observasi
  const now = new Date();
  const obs1Id = 'obs-2026-001';
  await db.collection('observations').doc(obs1Id).set({
    projectId: proj1Id,
    areaId: 'area-loading-dock',
    observerUid: petugasUid,
    observerName: 'Agus Setiawan',
    submittedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    loc: {
      lat: -6.20882,
      lng: 106.84561,
      accuracyM: 18,
      distanceM: 12,
    },
    answers: [
      { projectItemId: 'pi-1', itemId: 'bbs-apd-helm-vest', category: 'wajib', standardVersion: 1, result: 'improvement' },
      { projectItemId: 'pi-3', itemId: 'bbs-no-hp', category: 'medium', standardVersion: 1, result: 'positif' },
    ],
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  }, { merge: true });

  const obs2Id = 'obs-2026-002';
  await db.collection('observations').doc(obs2Id).set({
    projectId: proj1Id,
    areaId: 'area-jalur-forklift',
    observerUid: adminUid,
    observerName: 'Fajar Rakhmat C.',
    submittedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    loc: {
      lat: -6.20875,
      lng: 106.84555,
      accuracyM: 20,
      distanceM: 15,
    },
    answers: [
      { projectItemId: 'pi-2', itemId: 'bbs-walkway', category: 'wajib', standardVersion: 1, result: 'improvement' },
      { projectItemId: 'pi-4', itemId: 'bbs-jarak-forklift', category: 'wajib', standardVersion: 1, result: 'positif' },
    ],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  }, { merge: true });

  const obs3Id = 'obs-2026-003';
  await db.collection('observations').doc(obs3Id).set({
    projectId: proj1Id,
    areaId: 'area-rak-highbay',
    observerUid: supervisorUid,
    observerName: 'Budi Santoso',
    submittedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    loc: {
      lat: -6.20889,
      lng: 106.84568,
      accuracyM: 15,
      distanceM: 22,
    },
    answers: [
      { projectItemId: 'pi-5', itemId: 'bbs-housekeeping', category: 'medium', standardVersion: 1, result: 'improvement' },
    ],
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  }, { merge: true });

  console.log('✓ 3 Observasi lapangan tersimpan.');

  // 6. Data Dummy Siklus Lengkap Temuan (Findings Lifecycle)
  const todayStr = now.toISOString().split('T')[0];
  const datePast3 = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
  const dateFuture4 = new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0];
  const dateFuture2 = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

  // SIKLUS 1: OPEN - OVERDUE (Terlambat, Wajib, Risiko Tinggi)
  const finding1Id = 'find-overdue-001';
  await db.collection('findings').doc(finding1Id).set({
    observationId: obs1Id,
    projectId: proj1Id,
    areaId: 'area-loading-dock',
    projectItemId: 'pi-1',
    category: 'wajib',
    risk: 'tinggi',
    note: 'Terlihat 2 operator subkontraktor melintas di zona loading dock aktif tanpa mengenakan rompi reflektif (safety vest) dan helm tidak berstandar tali dagu.',
    photosBefore: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    ],
    photosAfter: [],
    picUid: picUid,
    picName: 'Doni Pratama',
    dueDate: datePast3, // TENGGAT TELAH LEWAT 3 HARI LALU -> TRIGGER OVERDUE BADGE!
    status: 'open',
    history: [
      {
        actorUid: petugasUid,
        action: 'created',
        status: 'open',
        note: 'Temuan dibuat saat patroli genba rutin shift pagi.',
        at: new Date(Date.now() - 6 * 86400000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  }, { merge: true });

  // SIKLUS 2: OPEN - ON TRACK (Masih dalam batas waktu, Medium)
  const finding2Id = 'find-open-002';
  await db.collection('findings').doc(finding2Id).set({
    observationId: obs3Id,
    projectId: proj1Id,
    areaId: 'area-rak-highbay',
    projectItemId: 'pi-5',
    category: 'medium',
    risk: 'sedang',
    note: 'Tumpukan pallet kayu kosong diletakkan tidak beraturan di ujung gang rak B-12 sehingga mempersempit manuver hand pallet.',
    photosBefore: [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    ],
    photosAfter: [],
    picUid: picUid,
    picName: 'Doni Pratama',
    dueDate: dateFuture4, // Masih sisa 4 hari lagi
    status: 'open',
    history: [
      {
        actorUid: supervisorUid,
        action: 'created',
        status: 'open',
        note: 'Ditemukan pallet kayu miring dan berpotensi roboh.',
        at: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  }, { merge: true });

  // SIKLUS 3: WAITING_VERIFICATION (PIC sudah submit bukti sesudah, siap diverifikasi Supervisor!)
  const finding3Id = 'find-verify-003';
  await db.collection('findings').doc(finding3Id).set({
    observationId: obs2Id,
    projectId: proj1Id,
    areaId: 'area-jalur-forklift',
    projectItemId: 'pi-2',
    category: 'wajib',
    risk: 'sedang',
    note: 'Potongan besi dan kabel sling terletak di lantai jalur pejalan kaki, memicu bahaya tersandung (tripping hazard).',
    photosBefore: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    ],
    photosAfter: [
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    ],
    picUid: picUid,
    picName: 'Doni Pratama',
    dueDate: dateFuture2,
    status: 'waiting_verification', // SIAP UNTUK VERIFIKASI SUPERVISOR / ADMIN
    followUpNote: 'Kabel sling dan besi sisa potongan telah disingkirkan ke tempat penampungan scrap workshop. Jalur pejalan kaki telah dibersihkan dan disapu.',
    history: [
      {
        actorUid: adminUid,
        action: 'created',
        status: 'open',
        note: 'Temuan dicatat saat observasi bersama manajemen.',
        at: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        actorUid: picUid,
        action: 'followed_up',
        status: 'waiting_verification',
        note: 'Pembersihan area selesai dilakukan oleh tim logistik.',
        at: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    followedUpAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  }, { merge: true });

  // SIKLUS 4: CLOSED (Selesai diverifikasi dan ditutup oleh Supervisor)
  const finding4Id = 'find-closed-004';
  await db.collection('findings').doc(finding4Id).set({
    observationId: obs1Id,
    projectId: proj1Id,
    areaId: 'area-loading-dock',
    projectItemId: 'pi-3',
    category: 'medium',
    risk: 'rendah',
    note: 'Karyawan vendor berjalan di zebra cross sambil bermain telepon genggam dan tidak memperhatikan forklift mundur.',
    photosBefore: [
      'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=800&q=80',
    ],
    photosAfter: [
      'https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?auto=format&fit=crop&w=800&q=80',
    ],
    picUid: picUid,
    picName: 'Doni Pratama',
    dueDate: datePast3,
    status: 'closed', // STATUS CLOSED LENGKAP
    followUpNote: 'Telah dilakukan safety induction dan peneguran langsung kepada pengemudi vendor di pos security.',
    verifiedBy: supervisorUid,
    verifiedByName: 'Budi Santoso',
    verifiedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    history: [
      {
        actorUid: petugasUid,
        action: 'created',
        status: 'open',
        note: 'Temuan dicatat saat genba area docking.',
        at: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
      {
        actorUid: picUid,
        action: 'followed_up',
        status: 'waiting_verification',
        note: 'Tindakan briefing dan teguran tertulis telah diarsipkan.',
        at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        actorUid: supervisorUid,
        action: 'verified',
        status: 'closed',
        note: 'Tindakan korektif diverifikasi memadai. Temuan resmi ditutup.',
        at: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  }, { merge: true });

  console.log('✓ 4 Temuan Siklus Lengkap Berhasil Di-generate:');
  console.log('   1. [OPEN - OVERDUE]              ID: find-overdue-001 (Tenggat lewat 3 hari lalu, badge berkedip merah)');
  console.log('   2. [OPEN - ON TRACK]             ID: find-open-002    (Sisa 4 hari)');
  console.log('   3. [WAITING_VERIFICATION]       ID: find-verify-003  (Bukti sebelum & sesudah siap ditinjau Supervisor)');
  console.log('   4. [CLOSED - SELESAI]           ID: find-closed-004  (Diverifikasi & ditutup oleh Supervisor)');
  console.log('🎉 SEEDING SELESAI DENGAN SUKSES!');
}

seedData().catch(err => {
  console.error('❌ Gagal seeding data:', err);
});
