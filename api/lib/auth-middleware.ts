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
    
    // Check superAdmin status from users/{uid}
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || (userData?.['name'] as string | undefined),
      superAdmin: userData?.['superAdmin'] === true,
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
  if (user.superAdmin) {
    return 'admin';
  }

  try {
    const db = getFirestore();
    const memberDoc = await db
      .collection('projects')
      .doc(projectId)
      .collection('members')
      .doc(user.uid)
      .get();

    if (!memberDoc.exists) {
      return null;
    }

    const data = memberDoc.data();
    if (!data || data['active'] !== true) {
      return null;
    }

    return data['role'] as 'admin' | 'supervisor' | 'petugas';
  } catch (error) {
    console.error('Error checking project role:', error);
    return null;
  }
}

export function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}
