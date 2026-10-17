import type { IncomingMessage, ServerResponse } from 'http';
import { 
  verifyAuthToken, 
  checkProjectRole, 
  parseJsonBody, 
  recordAuditLog, 
  sendJson 
} from '../lib/auth-middleware';
import { getFirestore, getAuth } from '../lib/firebase-admin';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const user = await verifyAuthToken(req);
  if (!user) {
    return sendJson(res, 401, { error: 'Unauthorized' });
  }

  const db = getFirestore();

  // GET: List members of a project
  if (req.method === 'GET') {
    const url = new URL(req.url || '', 'http://localhost');
    const projectId = url.searchParams.get('projectId');

    if (!projectId) {
      return sendJson(res, 400, { error: 'Parameter projectId wajib disertakan' });
    }

    try {
      const snap = await db.collection('projects').doc(projectId).collection('members').get();
      const members = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      return sendJson(res, 200, { members });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat anggota';
      return sendJson(res, 500, { error: msg });
    }
  }

  // POST: Assign or update member role in project
  if (req.method === 'POST') {
    try {
      const body = await parseJsonBody<{
        projectId: string;
        targetUid?: string;
        targetEmail?: string;
        role: 'petugas' | 'supervisor' | 'admin';
        active?: boolean;
      }>(req);

      if (!body.projectId || (!body.targetUid && !body.targetEmail) || !body.role) {
        return sendJson(res, 400, { error: 'projectId, email/uid, dan role wajib diisi' });
      }

      const currentRole = await checkProjectRole(body.projectId, user);
      if (currentRole !== 'admin') {
        return sendJson(res, 403, { error: 'Hanya Admin proyek yang dapat mengelola hak akses anggota' });
      }

      let uid = body.targetUid;
      let email = body.targetEmail || '';
      let name = '';

      // If email provided without targetUid, resolve from Auth or users collection
      if (!uid && email) {
        try {
          const authUser = await getAuth().getUserByEmail(email);
          uid = authUser.uid;
          name = authUser.displayName || '';
        } catch {
          // If not in Auth yet, find or create user doc
          const userSnap = await db.collection('users').where('email', '==', email).limit(1).get();
          if (!userSnap.empty) {
            uid = userSnap.docs[0]!.id;
            name = userSnap.docs[0]!.data()['name'] || '';
          } else {
            // Pre-create placeholder user
            const newDoc = await db.collection('users').add({
              email,
              name: email.split('@')[0],
              loginType: 'lokal',
              active: true,
              superAdmin: false,
              createdAt: new Date().toISOString(),
            });
            uid = newDoc.id;
            name = email.split('@')[0] || '';
          }
        }
      }

      if (!uid) {
        return sendJson(res, 400, { error: 'Pengguna tidak dapat diidentifikasi' });
      }

      const memberRef = db.collection('projects').doc(body.projectId).collection('members').doc(uid);
      const prevDoc = await memberRef.get();

      const memberData = {
        role: body.role,
        active: body.active !== undefined ? body.active : true,
        email,
        name,
        updatedAt: new Date().toISOString(),
      };

      await memberRef.set(memberData, { merge: true });

      await recordAuditLog(
        user.uid,
        'assign_project_member',
        `projects/${body.projectId}/members/${uid}`,
        prevDoc.exists ? prevDoc.data() : null,
        memberData
      );

      return sendJson(res, 200, { success: true, uid, ...memberData });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses penugasan anggota';
      return sendJson(res, 500, { error: msg });
    }
  }

  // DELETE: Remove member from project
  if (req.method === 'DELETE') {
    const url = new URL(req.url || '', 'http://localhost');
    const projectId = url.searchParams.get('projectId');
    const targetUid = url.searchParams.get('uid');

    if (!projectId || !targetUid) {
      return sendJson(res, 400, { error: 'Parameter projectId dan uid wajib disertakan' });
    }

    try {
      const role = await checkProjectRole(projectId, user);
      if (role !== 'admin') {
        return sendJson(res, 403, { error: 'Hanya Admin proyek yang dapat menghapus anggota' });
      }

      // Prevent admin from removing themselves if they are the only admin
      if (targetUid === user.uid) {
        const adminsSnap = await db
          .collection('projects')
          .doc(projectId)
          .collection('members')
          .where('role', '==', 'admin')
          .where('active', '==', true)
          .get();

        if (adminsSnap.size <= 1) {
          return sendJson(res, 400, {
            error: 'Anda tidak dapat menghapus diri sendiri karena Anda satu-satunya Admin aktif di proyek ini',
          });
        }
      }

      const memberRef = db.collection('projects').doc(projectId).collection('members').doc(targetUid);
      const prevDoc = await memberRef.get();
      if (!prevDoc.exists) {
        return sendJson(res, 404, { error: 'Anggota tidak ditemukan' });
      }

      await memberRef.delete();

      await recordAuditLog(
        user.uid,
        'remove_project_member',
        `projects/${projectId}/members/${targetUid}`,
        prevDoc.data(),
        null
      );

      return sendJson(res, 200, { success: true, message: 'Anggota berhasil dihapus dari proyek' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus anggota';
      return sendJson(res, 500, { error: msg });
    }
  }

  return sendJson(res, 405, { error: 'Method not allowed' });
}

