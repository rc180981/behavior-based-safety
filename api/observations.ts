import type { IncomingMessage, ServerResponse } from 'http';
import { 
  verifyAuthToken, 
  checkProjectRole, 
  parseJsonBody, 
  recordAuditLog, 
  sendJson 
} from './lib/auth-middleware';
import { getFirestore } from './lib/firebase-admin';
import { validateGeofence } from './lib/geofence';
import { FieldValue } from 'firebase-admin/firestore';

interface ObservationPayload {
  projectId: string;
  areaId: string;
  loc: {
    lat: number;
    lng: number;
    accuracyM: number;
  };
  answers: Array<{
    projectItemId: string;
    itemId: string;
    category: 'wajib' | 'medium';
    standardVersion: number;
    result: 'positif' | 'improvement';
    // Evidence if result === 'improvement'
    finding?: {
      risk: 'rendah' | 'sedang' | 'tinggi';
      note: string;
      photosBefore: string[];
      picUid: string;
      dueDate: string;
    };
  }>;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    // 1. Verify Authentication
    const user = await verifyAuthToken(req);
    if (!user) {
      return sendJson(res, 401, { error: 'Unauthorized: Token tidak valid atau sesi telah berakhir' });
    }

    const body = await parseJsonBody<ObservationPayload>(req);
    const { projectId, areaId, loc, answers } = body;

    if (!projectId || !areaId || !loc || !answers || !Array.isArray(answers)) {
      return sendJson(res, 400, { error: 'Data observasi tidak lengkap' });
    }

    // 2. Check Project Role (petugas, supervisor, admin)
    const role = await checkProjectRole(projectId, user);
    if (!role) {
      return sendJson(res, 403, { error: 'Akses ditolak: Anda bukan anggota aktif di proyek ini' });
    }

    const db = getFirestore();

    // 3. Retrieve Project Geofence and Settings
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return sendJson(res, 404, { error: 'Proyek tidak ditemukan' });
    }

    const projectData = projectDoc.data()!;
    const geofence = projectData['geofence'] || {
      lat: 0,
      lng: 0,
      radiusM: 200,
      maxAccuracyM: 50,
      required: true,
    };

    // 4. Validate Geofence if required
    if (geofence.required !== false) {
      const geoResult = validateGeofence(
        loc.lat,
        loc.lng,
        loc.accuracyM,
        geofence.lat,
        geofence.lng,
        geofence.radiusM,
        geofence.maxAccuracyM
      );

      if (!geoResult.valid) {
        // Record failure for audit & calibration
        await recordAuditLog(
          user.uid,
          'geofence_violation',
          `projects/${projectId}/observations`,
          null,
          {
            userLat: loc.lat,
            userLng: loc.lng,
            accuracyM: loc.accuracyM,
            distanceM: geoResult.distanceM,
            radiusM: geofence.radiusM,
            reason: geoResult.reason,
          }
        );

        return sendJson(res, 400, {
          error: geoResult.reason,
          distanceM: geoResult.distanceM,
          radiusM: geofence.radiusM,
        });
      }
    }

    // 5. Validate Required Items & Evidence
    for (const ans of answers) {
      if (ans.category === 'wajib' && !ans.result) {
        return sendJson(res, 400, {
          error: 'Semua item berkategori Wajib harus dinilai sebelum mengirim observasi.',
        });
      }

      if (ans.result === 'improvement') {
        const finding = ans.finding;
        if (!finding) {
          return sendJson(res, 400, {
            error: 'Item "Perlu Improvement" wajib melampirkan evidence temuan.',
          });
        }
        if (!finding.photosBefore || finding.photosBefore.length === 0) {
          return sendJson(res, 400, {
            error: 'Temuan wajib menyertakan minimal 1 foto evidence.',
          });
        }
        if (!finding.risk || !finding.note || !finding.picUid || !finding.dueDate) {
          return sendJson(res, 400, {
            error: 'Detail temuan tidak lengkap (Tingkat risiko, catatan, PIC, atau tenggat target belum diisi).',
          });
        }
      }
    }

    // 6. Write Observation & Findings in a Batch
    const batch = db.batch();
    const obsRef = db.collection('observations').doc();
    const nowIso = new Date().toISOString();

    const cleanAnswers = answers.map((ans) => ({
      projectItemId: ans.projectItemId,
      itemId: ans.itemId,
      category: ans.category,
      standardVersion: ans.standardVersion || 1,
      result: ans.result,
    }));

    batch.set(obsRef, {
      projectId,
      areaId,
      observerUid: user.uid,
      observerName: user.name || user.email || 'Petugas',
      submittedAt: FieldValue.serverTimestamp(),
      submittedAtIso: nowIso,
      loc: {
        lat: loc.lat,
        lng: loc.lng,
        accuracyM: Math.round(loc.accuracyM),
      },
      answers: cleanAnswers,
    });

    const createdFindingIds: string[] = [];

    // Create findings for answers with 'improvement'
    for (const ans of answers) {
      if (ans.result === 'improvement' && ans.finding) {
        const findingRef = db.collection('findings').doc();
        createdFindingIds.push(findingRef.id);

        batch.set(findingRef, {
          observationId: obsRef.id,
          projectId,
          areaId,
          projectItemId: ans.projectItemId,
          category: ans.category,
          risk: ans.finding.risk,
          note: ans.finding.note,
          photosBefore: ans.finding.photosBefore,
          photosAfter: [],
          picUid: ans.finding.picUid,
          dueDate: ans.finding.dueDate,
          status: 'open',
          history: [
            {
              actorUid: user.uid,
              action: 'created',
              status: 'open',
              note: 'Temuan baru dicatat saat observasi BBS',
              at: nowIso,
            },
          ],
        });
      }
    }

    await batch.commit();

    // 7. Record Audit Log
    await recordAuditLog(
      user.uid,
      'create_observation',
      `observations/${obsRef.id}`,
      null,
      {
        observationId: obsRef.id,
        projectId,
        findingsCount: createdFindingIds.length,
      }
    );

    return sendJson(res, 201, {
      success: true,
      observationId: obsRef.id,
      findingIds: createdFindingIds,
      message: 'Observasi berhasil dikirim dan diverifikasi.',
    });
  } catch (error: unknown) {
    console.error('Error submitting observation:', error);
    const msg = error instanceof Error ? error.message : 'Terjadi kesalahan server saat menyimpan observasi';
    return sendJson(res, 500, { error: msg });
  }
}
