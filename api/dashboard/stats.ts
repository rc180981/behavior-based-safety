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

  if (!projectId) {
    return sendJson(res, 400, { error: 'Parameter projectId wajib disertakan' });
  }

  const role = await checkProjectRole(projectId, user);
  if (!role) {
    return sendJson(res, 403, { error: 'Akses ditolak: Anda bukan anggota proyek ini' });
  }

  const db = getFirestore();

  try {
    // 1. Fetch Observations for Project
    const obsSnap = await db.collection('observations').where('projectId', '==', projectId).get();
    const totalObservations = obsSnap.size;

    let totalAnswers = 0;
    let positiveAnswers = 0;
    const behaviorStats: Record<string, { total: number; positive: number }> = {};

    obsSnap.forEach((doc) => {
      const data = doc.data();
      const answers = data['answers'] as Array<{ itemId: string; result: string }> | undefined;
      if (answers && Array.isArray(answers)) {
        for (const ans of answers) {
          totalAnswers++;
          if (ans.result === 'positif') {
            positiveAnswers++;
          }

          if (!behaviorStats[ans.itemId]) {
            behaviorStats[ans.itemId] = { total: 0, positive: 0 };
          }
          behaviorStats[ans.itemId]!.total++;
          if (ans.result === 'positif') {
            behaviorStats[ans.itemId]!.positive++;
          }
        }
      }
    });

    const percentPositive = totalAnswers > 0 
      ? Math.round((positiveAnswers / totalAnswers) * 1000) / 10 
      : 100;

    // 2. Fetch Findings for Project
    const findingsSnap = await db.collection('findings').where('projectId', '==', projectId).get();
    const today = new Date().toISOString().split('T')[0]!;

    let openFindings = 0;
    let waitingVerification = 0;
    let closedFindings = 0;
    let overdueFindings = 0;
    const recentFindings: Record<string, unknown>[] = [];

    findingsSnap.forEach((doc) => {
      const data = doc.data();
      const status = data['status'];
      const dueDate = data['dueDate'] as string;
      const isOverdue = status !== 'closed' && dueDate && dueDate < today;

      if (status === 'open') openFindings++;
      else if (status === 'waiting_verification') waitingVerification++;
      else if (status === 'closed') closedFindings++;

      if (isOverdue) overdueFindings++;

      if (recentFindings.length < 5) {
        recentFindings.push({
          id: doc.id,
          ...data,
          isOverdue,
        });
      }
    });

    // 3. Resolve behavior titles for breakdown
    const masterItemsSnap = await db.collection('bbsItems').get();
    const itemTitleMap = new Map<string, string>();
    masterItemsSnap.forEach((d) => itemTitleMap.set(d.id, d.data()['title'] || 'Item BBS'));

    const behaviorBreakdown = Object.entries(behaviorStats).map(([itemId, stat]) => ({
      itemId,
      title: itemTitleMap.get(itemId) || 'Item Perilaku',
      total: stat.total,
      positive: stat.positive,
      percent: stat.total > 0 ? Math.round((stat.positive / stat.total) * 100) : 0,
    }));

    return sendJson(res, 200, {
      kpi: {
        totalObservations,
        percentPositive,
        openFindings,
        waitingVerification,
        closedFindings,
        overdueFindings,
      },
      behaviorBreakdown,
      recentFindings,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memuat statistik dashboard';
    return sendJson(res, 500, { error: msg });
  }
}
