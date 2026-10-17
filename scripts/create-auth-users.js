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
const { initializeApp, cert } = require(basePath + '/app/index.js');
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

const auth = getAuth(app);
const db = getFirestore(app);

const usersToCreate = [
  {
    email: 'rc180981@gmail.com',
    password: 'Password123!',
    displayName: 'Fajar Rakhmat C. (HSE Manager)',
    role: 'admin',
    superAdmin: true,
  },
  {
    email: 'budi.supervisor@perusahaan.com',
    password: 'Password123!',
    displayName: 'Budi Santoso (Safety Supervisor)',
    role: 'supervisor',
    superAdmin: false,
  },
  {
    email: 'agus.safety@perusahaan.com',
    password: 'Password123!',
    displayName: 'Agus Setiawan (Petugas Genba)',
    role: 'petugas',
    superAdmin: false,
  },
  {
    email: 'doni.pic@perusahaan.com',
    password: 'Password123!',
    displayName: 'Doni Pratama (PIC Warehouse)',
    role: 'petugas',
    superAdmin: false,
  },
];

async function createAuthUsers() {
  console.log('🚀 Mendaftarkan Akun ke Firebase Authentication...');

  for (const u of usersToCreate) {
    let uid;
    try {
      // Check if user already exists
      const existing = await auth.getUserByEmail(u.email);
      uid = existing.uid;
      // Update password to ensure it matches
      await auth.updateUser(uid, {
        password: u.password,
        displayName: u.displayName,
      });
      console.log(`✓ Akun ${u.email} diperbarui (UID: ${uid})`);
    } catch (e) {
      // If user does not exist, create new user
      const created = await auth.createUser({
        email: u.email,
        password: u.password,
        displayName: u.displayName,
      });
      uid = created.uid;
      console.log(`✓ Akun ${u.email} berhasil dibuat di Firebase Auth (UID: ${uid})`);
    }

    // Pastikan dokumen di Firestore collection users
    await db.collection('users').doc(uid).set({
      email: u.email,
      name: u.displayName,
      superAdmin: u.superAdmin,
      active: true,
      loginType: 'lokal',
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Link UID to project members in proj-wh-cikarang
    const projId = 'proj-wh-cikarang';
    await db.collection('projects').doc(projId).collection('members').doc(uid).set({
      uid: uid,
      email: u.email,
      name: u.displayName,
      role: u.role,
      active: true,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // If superAdmin or admin, also link to proj-fab-surabaya
    if (u.superAdmin || u.role === 'admin') {
      await db.collection('projects').doc('proj-fab-surabaya').collection('members').doc(uid).set({
        uid: uid,
        email: u.email,
        name: u.displayName,
        role: 'admin',
        active: true,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }
  }

  console.log('\n🎉 Seluruh Akun Berhasil Didaftarkan dan Siap Digunakan!');
}

createAuthUsers().catch(err => {
  console.error('❌ Gagal:', err);
});
