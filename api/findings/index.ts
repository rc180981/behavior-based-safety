import type { IncomingMessage, ServerResponse } from 'http';
import { 
  verifyAuthToken, 
  checkProjectRole, 
  sendJson 
} from '../../lib/auth-middleware';
import { getFirestore } from '../../lib/firebase-admin';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const user = await verifyAuthToken(req);
  if (!user) {
    return sendJson(res, 401, { error: 'Unauthorized' });
  }

  const url = new URL(req.url || '', 'http://localhost');
  const projectId = url.searchParams.get('projectId');
  const status = url.searchParams.get('status');
  const picUid = url.searchParams.get('picUid');
  const findingId = url.searchParams.get('id');

  if (!projectId && !findingId) {
    return sendJson(res, 400, { error: 'Parameter projectId atau id wajib disertakan' });
  }

  const db = getFirestore();

  try {
    // 1. Single finding detail query
    if (findingId) {
      const docSnap = await db.collection('findings').doc(findingId).get();
      if (!docSnap.exists) {
        return sendJson(res, 404, { error: 'Temuan tidak ditemukan' });
      }

      const findingData = { id: docSnap.id, ...docSnap.data() } as Record<string, unknown>;
      const role = await checkProjectRole(findingData['projectId'] as string, user);
      if (!role) {
        return sendJson(res, 403, { error: 'Akses ditolak' });
      }

      return sendJson(res, 200, { finding: findingData });
    }

    // 2. Project findings list query
    const role = await checkProjectRole(projectId!, user);
    if (!role) {
      return sendJson(res, 403, { error: 'Akses ditolak' });
    }

    let query: FirebaseFirestore.Query = db.collection('findings').where('projectId', '==', projectId);

    if (status) {
      query = query.where('status', '==', status);
    }

    if (picUid) {
      query = query.where('picUid', '==', picUid);
    }

    const snap = await query.get();
    const findings = snap.docs.map((d) => {
      const data = d.data();
      const today = new Date().toISOString().split('T')[0]!;
      const dueDate = data['dueDate'] as string;
      const isOverdue = data['status'] !== 'closed' && dueDate && dueDate < today;

      return {
        id: d.id,
        ...data,
        isOverdue,
      };
    });

    return sendJson(res, 200, { findings });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memuat temuan';
    return sendJson(res, 500, { error: msg });
  }
}
