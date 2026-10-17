import type { IncomingMessage, ServerResponse } from 'http';
import { getAuth, getFirestore } from './firebase-admin';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  name?: string;
  superAdmin?: boolean;
}

export async function verifyAuthToken(req: IncomingMessage): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split('Bearer ')[1];
  if (!token) {
    return null;
  }

  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check superAdmin status from users/{uid} or email
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();

    const isSuperAdmin = 
      userData?.['superAdmin'] === true || 
      decodedToken.email === 'rc180981@gmail.com';

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: (decodedToken['name'] as string | undefined) || (userData?.['name'] as string | undefined),
      superAdmin: isSuperAdmin,
    };
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

export async function checkProjectRole(
  projectId: string,
  user: AuthenticatedUser
): Promise<'admin' | 'supervisor' | 'petugas' | null> {
  if (user.superAdmin || user.email === 'rc180981@gmail.com') {
    return 'admin';
  }

  try {
    const db = getFirestore();
    // 1. Check member document by user.uid
    const memberDoc = await db
      .collection('projects')
      .doc(projectId)
      .collection('members')
      .doc(user.uid)
      .get();

    if (memberDoc.exists) {
      const data = memberDoc.data();
      if (data && data['active'] === true) {
        return data['role'] as 'admin' | 'supervisor' | 'petugas';
      }
      return null;
    }

    // 2. Fallback check by email if pre-assigned before first login
    if (user.email) {
      const emailSnap = await db
        .collection('projects')
        .doc(projectId)
        .collection('members')
        .where('email', '==', user.email)
        .where('active', '==', true)
        .limit(1)
        .get();

      if (!emailSnap.empty) {
        const docData = emailSnap.docs[0]!.data();
        const role = docData['role'] as 'admin' | 'supervisor' | 'petugas';

        // Auto-link UID to this project member doc for future lookups
        await db
          .collection('projects')
          .doc(projectId)
          .collection('members')
          .doc(user.uid)
          .set({ ...docData, uid: user.uid, updatedAt: new Date().toISOString() }, { merge: true });

        return role;
      }
    }

    return null;
  } catch (error) {
    console.error('Error checking project role:', error);
    return null;
  }
}

export async function parseJsonBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', (err) => reject(err));
  });
}

export async function recordAuditLog(
  actorUid: string,
  action: string,
  targetPath: string,
  before: unknown,
  after: unknown
): Promise<void> {
  try {
    const db = getFirestore();
    await db.collection('auditLogs').add({
      actorUid,
      action,
      targetPath,
      before: before ?? null,
      after: after ?? null,
      at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

export function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}
