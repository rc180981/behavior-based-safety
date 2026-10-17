import * as admin from 'firebase-admin';

let app: admin.app.App;

export function getFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const projectId = process.env['FIREBASE_PROJECT_ID'];
  const clientEmail = process.env['FIREBASE_CLIENT_EMAIL'];
  let privateKey = process.env['FIREBASE_PRIVATE_KEY'];

  if (privateKey) {
    // Replace literal escaped newlines with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (projectId && clientEmail && privateKey) {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: process.env['FIREBASE_STORAGE_BUCKET'] || `${projectId}.appspot.com`,
    });
  } else {
    // Fallback to default application credentials if running in GCP or mock environment
    app = admin.initializeApp();
  }

  return app;
}

export function getFirestore(): admin.firestore.Firestore {
  return getFirebaseAdmin().firestore();
}

export function getAuth(): admin.auth.Auth {
  return getFirebaseAdmin().auth();
}

export function getStorage(): admin.storage.Storage {
  return getFirebaseAdmin().storage();
}
