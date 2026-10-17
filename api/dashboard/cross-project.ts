import type { IncomingMessage, ServerResponse } from 'http';
import { verifyAuthToken, sendJson } from '../../lib/auth-middleware';
import { getFirestore } from '../../lib/firebase-admin';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const user = await verifyAuthToken(req);
  if (!user) {
    return sendJson(res, 401, { error: 'Unauthorized' });
  }

  const db = getFirestore();

  try {
    // SuperAdmin or project admin check
    const projectsSnap = await db.collection('projects').get();
    const projectsList = projectsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const today = new Date().toISOString().split('T')[0]!;
    const projectStats = [];

    let enterpriseTotalObservations = 0;
    let enterpriseTotalAnswers = 0;
    let enterprisePositiveAnswers = 0;
    let enterpriseTotalOpenFindings = 0;
    let enterpriseTotalOverdue = 0;

    for (const proj of projectsList) {
      const pId = proj.id;

      // 1. Observations count & positivity
      const obsSnap = await db.collection('observations').where('projectId', '==', pId).get();
      const obsCount = obsSnap.size;
      enterpriseTotalObservations += obsCount;

      let pAnswers = 0;
      let pPositive = 0;
      obsSnap.forEach((doc) => {
        const answers = doc.data()['answers'] as Array<{ result: string }> | undefined;
        if (answers && Array.isArray(answers)) {
          for (const a of answers) {
            pAnswers++;
            if (a.result === 'positif') pPositive++;
          }
        }
      });

      enterpriseTotalAnswers += pAnswers;
      enterprisePositiveAnswers += pPositive;
      const percentPositive = pAnswers > 0 ? Math.round((pPositive / pAnswers) * 1000) / 10 : 100;

      // 2. Findings count & overdue
      const findingsSnap = await db.collection('findings').where('projectId', '==', pId).get();
      let openCount = 0;
      let overdueCount = 0;

      findingsSnap.forEach((doc) => {
        const fData = doc.data();
        if (fData['status'] !== 'closed') {
          openCount++;
          if (fData['dueDate'] && (fData['dueDate'] as string) < today) {
            overdueCount++;
          }
        }
      });

      enterpriseTotalOpenFindings += openCount;
      enterpriseTotalOverdue += overdueCount;

      projectStats.push({
        id: pId,
        name: (proj as Record<string, unknown>)['name'] || 'Proyek',
        code: (proj as Record<string, unknown>)['code'] || pId,
        riskLevel: (proj as Record<string, unknown>)['riskLevel'] || 'tinggi',
        totalObservations: obsCount,
        percentPositive,
        openFindings: openCount,
        overdueFindings: overdueCount,
      });
    }

    // Sort by compliance rate descending
    projectStats.sort((a, b) => b.percentPositive - a.percentPositive);

    const enterpriseCompliance = enterpriseTotalAnswers > 0
      ? Math.round((enterprisePositiveAnswers / enterpriseTotalAnswers) * 1000) / 10
      : 100;

    return sendJson(res, 200, {
      summary: {
        totalProjects: projectsList.length,
        totalObservations: enterpriseTotalObservations,
        enterpriseCompliance,
        totalOpenFindings: enterpriseTotalOpenFindings,
        totalOverdue: enterpriseTotalOverdue,
      },
      projects: projectStats,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memuat statistik lintas proyek';
    return sendJson(res, 500, { error: msg });
  }
}
