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
  try {
    const user = await verifyAuthToken(req);
    if (!user) {
      return sendJson(res, 401, { error: 'Unauthorized: Sesi tidak valid' });
    }

    const db = getFirestore();

    // GET: List members of a project
    if (req.method === 'GET') {
      const url = new URL(req.url || '', 'http://localhost');
      const projectId = url.searchParams.get('projectId');

      if (!projectId) {
        return sendJson(res, 400, { error: 'Parameter projectId wajib disertakan' });
      }

      const snap = await db.collection('projects').doc(projectId).collection('members').get();
      const members = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      return sendJson(res, 200, { members });
    }

    // POST: Assign or update member role in project (and create Auth account if new)
    if (req.method === 'POST') {
      const body = await parseJsonBody<{
        projectId: string;
        targetUid?: string;
        targetEmail?: string;
        name?: string;
        password?: string;
        department?: string;
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
      const email = (body.targetEmail || '').trim().toLowerCase();
      let name = (body.name || '').trim();
      const department = (body.department || 'HSE Operations').trim();

      // If email provided, resolve or create Auth account
      if (email) {
        try {
          const authUser = await getAuth().getUserByEmail(email);
          uid = authUser.uid;
          name = name || authUser.displayName || email.split('@')[0];

          // If password provided, update user password and display name
          if (body.password && body.password.length >= 6) {
            await getAuth().updateUser(uid, {
              password: body.password,
              displayName: name,
            });
          }
        } catch {
          // If user does not exist in Auth, create new account in Firebase Auth
          const newPassword = body.password && body.password.length >= 6 ? body.password : 'Password123!';
          const createdAuth = await getAuth().createUser({
            email,
            password: newPassword,
            displayName: name || email.split('@')[0],
          });
          uid = createdAuth.uid;
          name = createdAuth.displayName || name || email.split('@')[0];
        }

        // Upsert user profile in Firestore users/{uid}
        await db.collection('users').doc(uid).set({
          uid,
          email,
          name,
          department,
          loginType: 'lokal',
          active: true,
          superAdmin: false,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }

      if (!uid) {
        return sendJson(res, 400, { error: 'Pengguna tidak dapat diidentifikasi' });
      }

      const memberRef = db.collection('projects').doc(body.projectId).collection('members').doc(uid);
      const prevDoc = await memberRef.get();

      const memberData = {
        uid,
        role: body.role,
        active: body.active !== undefined ? body.active : true,
        email,
        name: name || email.split('@')[0],
        department,
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

      return sendJson(res, 200, { success: true, ...memberData });
    }

    // DELETE: Remove member from project
    if (req.method === 'DELETE') {
      const url = new URL(req.url || '', 'http://localhost');
      const projectId = url.searchParams.get('projectId');
      const targetUid = url.searchParams.get('uid');

      if (!projectId || !targetUid) {
        return sendJson(res, 400, { error: 'Parameter projectId dan uid wajib disertakan' });
      }

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
    }

    return sendJson(res, 405, { error: 'Method not allowed' });
  } catch (err: unknown) {
    console.error('API Error in /api/admin/members:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return sendJson(res, 500, { error: msg });
  }
}
