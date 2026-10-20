import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const replyJson = (code: number, data: unknown) => {
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

  if (req.url && req.url.includes('ping=true')) {
    const fbKeys = Object.keys(process.env).filter(k => k.toUpperCase().includes('FIREBASE'));
    return replyJson(200, {
      status: 'online',
      node: process.version,
      firebaseEnvKeysFound: fbKeys,
    });
  }

  try {
    const { 
      verifyAuthToken, 
      checkProjectRole, 
      parseJsonBody, 
      recordAuditLog, 
      sendJson 
    } = await import('../../lib/auth-middleware');
    const { getFirestore } = await import('../../lib/firebase-admin');

    const user = await verifyAuthToken(req);
    if (!user) {
      return sendJson(res, 401, { error: 'Sesi login tidak valid atau telah berakhir. Silakan login kembali.' });
    }

    const db = getFirestore();

    // GET: List all projects user has access to, or all if superAdmin
    if (req.method === 'GET') {
      if (user.superAdmin) {
        const snap = await db.collection('projects').get();
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          userRole: 'admin',
        }));
        return sendJson(res, 200, { projects: list });
      }

      // Find projects where user is an active member (by UID or email)
      const projectsSnap = await db.collection('projects').where('status', '==', 'active').get();
      const accessibleProjects = [];

      for (const pDoc of projectsSnap.docs) {
        let memberDoc = await pDoc.ref.collection('members').doc(user.uid).get();
        let userRole = memberDoc.data()?.['role'];
        let isActive = memberDoc.data()?.['active'] === true;

        if (!memberDoc.exists && user.email) {
          const emailSnap = await pDoc.ref.collection('members')
            .where('email', '==', user.email)
            .where('active', '==', true)
            .limit(1)
            .get();

          if (!emailSnap.empty) {
            userRole = emailSnap.docs[0]!.data()['role'];
            isActive = true;
          }
        }

        if (isActive) {
          accessibleProjects.push({
            id: pDoc.id,
            ...pDoc.data(),
            userRole: userRole || 'petugas',
          });
        }
      }

      return sendJson(res, 200, { projects: accessibleProjects });
    }

    // POST: Create new project
    if (req.method === 'POST') {
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
        name: body.name.trim(),
        code: body.code.trim().toUpperCase(),
        status: 'active',
        riskLevel: body.riskLevel || 'tinggi',
        geofence: body.geofence || {
          lat: -6.2088,
          lng: 106.8456,
          radiusM: 200,
          maxAccuracyM: 50,
          required: false,
        },
        dueDays: body.dueDays || { wajib: 3, medium: 7 },
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
      };

      const docRef = await db.collection('projects').add(newProject);

      // Auto-assign creator as admin member
      await docRef.collection('members').doc(user.uid).set({
        role: 'admin',
        active: true,
        name: user.name || user.email?.split('@')[0] || 'Admin',
        email: user.email || '',
        assignedAt: new Date().toISOString(),
      });

      await recordAuditLog(user.uid, 'create_project', `projects/${docRef.id}`, null, newProject);

      return sendJson(res, 201, { id: docRef.id, ...newProject, userRole: 'admin' });
    }

    // PATCH: Update project or geofence settings
    if (req.method === 'PATCH') {
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
        code?: string;
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
      updateData['updatedAt'] = new Date().toISOString();

      await projectRef.update(updateData);

      await recordAuditLog(user.uid, 'update_project_settings', `projects/${body.projectId}`, prevDoc.data(), updateData);

      return sendJson(res, 200, { success: true, message: 'Pengaturan proyek berhasil diperbarui' });
    }

    return sendJson(res, 405, { error: 'Method not allowed' });
  } catch (err: unknown) {
    console.error('Unhandled error in /api/admin/projects:', err);
    const msg = err instanceof Error ? err.stack || err.message : String(err);
    replyJson(500, { error: msg });
  }
}
