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

  // GET: List areas for a project
  if (req.method === 'GET') {
    const url = new URL(req.url || '', 'http://localhost');
    const projectId = url.searchParams.get('projectId');
    if (!projectId) {
      return sendJson(res, 400, { error: 'Parameter projectId wajib disertakan' });
    }

    try {
      const snap = await db.collection('projects').doc(projectId).collection('areas').get();
      const areas = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return sendJson(res, 200, { areas });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat area';
      return sendJson(res, 500, { error: msg });
    }
  }

  // POST: Create or Update an area
  if (req.method === 'POST') {
    try {
      const body = await parseJsonBody<{
        projectId: string;
        name: string;
        areaId?: string;
        active?: boolean;
      }>(req);

      if (!body.projectId || !body.name) {
        return sendJson(res, 400, { error: 'projectId dan name area wajib diisi' });
      }

      const role = await checkProjectRole(body.projectId, user);
      if (role !== 'admin') {
        return sendJson(res, 403, { error: 'Hanya Admin proyek yang dapat mengelola area' });
      }

      const areasCol = db.collection('projects').doc(body.projectId).collection('areas');

      if (body.areaId) {
        // Update existing area
        const areaRef = areasCol.doc(body.areaId);
        const prevDoc = await areaRef.get();
        await areaRef.update({
          name: body.name,
          active: body.active !== undefined ? body.active : true,
        });

        await recordAuditLog(
          user.uid,
          'update_area',
          `projects/${body.projectId}/areas/${body.areaId}`,
          prevDoc.data(),
          { name: body.name, active: body.active }
        );

        return sendJson(res, 200, { success: true, message: 'Area berhasil diperbarui' });
      } else {
        // Create new area
        const newArea = {
          name: body.name,
          active: true,
          createdAt: new Date().toISOString(),
        };
        const docRef = await areasCol.add(newArea);

        await recordAuditLog(
          user.uid,
          'create_area',
          `projects/${body.projectId}/areas/${docRef.id}`,
          null,
          newArea
        );

        return sendJson(res, 201, { id: docRef.id, ...newArea });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses area';
      return sendJson(res, 500, { error: msg });
    }
  }

  return sendJson(res, 405, { error: 'Method not allowed' });
}
