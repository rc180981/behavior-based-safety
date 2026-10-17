import { initializeApp, cert, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore as _getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as _getAuth, type Auth } from 'firebase-admin/auth';
import { getStorage as _getStorage, type Storage } from 'firebase-admin/storage';

let app: App;

export function getFirebaseAdmin(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  // 1. Check if full service account JSON is passed via FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT
  const serviceAccountJson = process.env['FIREBASE_SERVICE_ACCOUNT_KEY'] || process.env['FIREBASE_SERVICE_ACCOUNT'];
  if (serviceAccountJson) {
    try {
      const parsed = typeof serviceAccountJson === 'string' ? JSON.parse(serviceAccountJson) : serviceAccountJson;
      app = initializeApp({
        credential: cert(parsed),
        storageBucket: process.env['FIREBASE_STORAGE_BUCKET'] || `${parsed.project_id}.firebasestorage.app`,
      });
      return app;
    } catch (e) {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON:', e);
    }
  }

  // 2. Check individual environment variables
  const projectId = process.env['FIREBASE_PROJECT_ID'];
  const clientEmail = process.env['FIREBASE_CLIENT_EMAIL'];
  let privateKey = process.env['FIREBASE_PRIVATE_KEY'];

  if (privateKey) {
    privateKey = privateKey.trim();
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.slice(1, -1);
    }
    // Replace escaped \n with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (projectId && clientEmail && privateKey) {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: process.env['FIREBASE_STORAGE_BUCKET'] || `${projectId}.firebasestorage.app`,
    });
  } else {
    // Fallback to default application credentials if running in GCP
    app = initializeApp();
  }

  return app;
}

export function getFirestore(): Firestore {
  return _getFirestore(getFirebaseAdmin());
}

export function getAuth(): Auth {
  return _getAuth(getFirebaseAdmin());
}

export function getStorage(): Storage {
  return _getStorage(getFirebaseAdmin());
}
