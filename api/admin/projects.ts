import type { IncomingMessage, ServerResponse } from 'http';
import { 
  verifyAuthToken, 
  checkProjectRole, 
  parseJsonBody, 
  recordAuditLog, 
  sendJson 
} from '../lib/auth-middleware';
import { getFirestore } from '../lib/firebase-admin';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const user = await verifyAuthToken(req);
  if (!user) {
    return sendJson(res, 401, { error: 'Unauthorized' });
  }

  const db = getFirestore();

  // GET: List all projects user has access to, or all if superAdmin
  if (req.method === 'GET') {
    try {
      if (user.superAdmin) {
        const snap = await db.collection('projects').get();
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        return sendJson(res, 200, { projects: list });
      }

      // Find projects where user is an active member
      const projectsSnap = await db.collection('projects').where('status', '==', 'active').get();
      const accessibleProjects = [];

      for (const pDoc of projectsSnap.docs) {
        const memberDoc = await pDoc.ref.collection('members').doc(user.uid).get();
        if (memberDoc.exists && memberDoc.data()?.['active'] === true) {
          accessibleProjects.push({
            id: pDoc.id,
            ...pDoc.data(),
            userRole: memberDoc.data()?.['role'],
          });
        }
      }

      return sendJson(res, 200, { projects: accessibleProjects });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch projects';
      return sendJson(res, 500, { error: msg });
    }
  }

  // POST: Create new project (Admin only)
  if (req.method === 'POST') {
    if (!user.superAdmin) {
      // Allow if no projects exist yet or user has admin role
      const anyProjectSnap = await db.collection('projects').limit(1).get();
      if (!anyProjectSnap.empty) {
        // Check if user is admin in any existing project
        const projectsSnap = await db.collection('projects').get();
        let isAdmin = false;
        for (const p of projectsSnap.docs) {
          const m = await p.ref.collection('members').doc(user.uid).get();
          if (m.exists && m.data()?.['role'] === 'admin' && m.data()?.['active'] === true) {
            isAdmin = true;
            break;
          }
        }
        if (!isAdmin) {
          return sendJson(res, 403, { error: 'Hanya Admin atau SuperAdmin yang dapat membuat proyek baru' });
        }
      }
    }

    try {
      const body = await parseJsonBody<{
        name: string;
        code: string;
        riskLevel?: 'tinggi' | 'medium';
        geofence?: {
          lat: number;
          lng: number;
          radiusM: number;
          maxAccuracyM: number;
          required: boolean;
        };
        dueDays?: { wajib: number; medium: number };
      }>(req);

      if (!body.name || !body.code) {
        return sendJson(res, 400, { error: 'Nama dan kode proyek wajib diisi' });
      }

      const newProject = {
        name: body.name,
        code: body.code.toUpperCase(),
        status: 'active',
        riskLevel: body.riskLevel || 'tinggi',
        geofence: body.geofence || {
          lat: -6.2088,
          lng: 106.8456,
          radiusM: 200,
          maxAccuracyM: 50,
          required: true,
        },
        dueDays: body.dueDays || { wajib: 3, medium: 7 },
        createdAt: new Date().toISOString(),
      };

      const docRef = await db.collection('projects').add(newProject);

      // Auto-assign creator as admin member
      await docRef.collection('members').doc(user.uid).set({
        role: 'admin',
        active: true,
        name: user.name || 'Admin',
        email: user.email || '',
      });

      await recordAuditLog(user.uid, 'create_project', `projects/${docRef.id}`, null, newProject);

      return sendJson(res, 201, { id: docRef.id, ...newProject });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create project';
      return sendJson(res, 500, { error: msg });
    }
  }

  // PATCH: Update project or geofence settings
  if (req.method === 'PATCH') {
    try {
      const body = await parseJsonBody<{
        projectId: string;
        geofence?: {
          lat: number;
          lng: number;
          radiusM: number;
          maxAccuracyM: number;
          required: boolean;
        };
        riskLevel?: 'tinggi' | 'medium';
        dueDays?: { wajib: number; medium: number };
        name?: string;
      }>(req);

      if (!body.projectId) {
        return sendJson(res, 400, { error: 'projectId wajib diisi' });
      }

      const role = await checkProjectRole(body.projectId, user);
      if (role !== 'admin') {
        return sendJson(res, 403, { error: 'Hanya Admin proyek yang dapat mengubah pengaturan proyek & geofence' });
      }

      const projectRef = db.collection('projects').doc(body.projectId);
      const prevDoc = await projectRef.get();
      if (!prevDoc.exists) {
        return sendJson(res, 404, { error: 'Proyek tidak ditemukan' });
      }

      const updateData: Record<string, unknown> = {};
      if (body.geofence) updateData['geofence'] = body.geofence;
      if (body.riskLevel) updateData['riskLevel'] = body.riskLevel;
      if (body.dueDays) updateData['dueDays'] = body.dueDays;
      if (body.name) updateData['name'] = body.name;
      if (body.code) updateData['code'] = body.code.toUpperCase();

      await projectRef.update(updateData);

      await recordAuditLog(user.uid, 'update_project_settings', `projects/${body.projectId}`, prevDoc.data(), updateData);

      return sendJson(res, 200, { success: true, message: 'Pengaturan proyek berhasil diperbarui' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update project';
      return sendJson(res, 500, { error: msg });
    }
  }

  return sendJson(res, 405, { error: 'Method not allowed' });
}
