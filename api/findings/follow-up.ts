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
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const user = await verifyAuthToken(req);
  if (!user) {
    return sendJson(res, 401, { error: 'Unauthorized' });
  }

  try {
    const body = await parseJsonBody<{
      findingId: string;
      photosAfter: string[];
      note: string;
    }>(req);

    if (!body.findingId || !body.photosAfter || body.photosAfter.length === 0 || !body.note) {
      return sendJson(res, 400, {
        error: 'Data tindak lanjut tidak lengkap. Wajib melampirkan minimal 1 foto perbaikan dan catatan tindak lanjut.',
      });
    }

    const db = getFirestore();
    const findingRef = db.collection('findings').doc(body.findingId);
    const snap = await findingRef.get();

    if (!snap.exists) {
      return sendJson(res, 404, { error: 'Temuan tidak ditemukan' });
    }

    const finding = snap.data()!;
    const role = await checkProjectRole(finding['projectId'] as string, user);
    
    // Authorization: User must be either the designated PIC, or supervisor/admin
    const isPic = finding['picUid'] === user.uid || finding['picUid'] === user.email;
    if (!role || (!isPic && role === 'petugas')) {
      return sendJson(res, 403, {
        error: 'Akses ditolak: Anda bukan PIC yang ditugaskan atau Supervisor/Admin pada proyek ini.',
      });
    }

    const nowIso = new Date().toISOString();
    const historyEntry = {
      actorUid: user.uid,
      actorName: user.name || user.email || 'PIC',
      action: 'followed_up',
      status: 'waiting_verification',
      note: body.note,
      at: nowIso,
    };

    const currentHistory = finding['history'] || [];
    const updatedHistory = [...currentHistory, historyEntry];

    await findingRef.update({
      photosAfter: body.photosAfter,
      status: 'waiting_verification',
      history: updatedHistory,
      updatedAt: nowIso,
    });

    await recordAuditLog(
      user.uid,
      'finding_follow_up',
      `findings/${body.findingId}`,
      { status: finding['status'], photosAfter: finding['photosAfter'] },
      { status: 'waiting_verification', photosAfter: body.photosAfter, note: body.note }
    );

    return sendJson(res, 200, {
      success: true,
      message: 'Tindak lanjut berhasil dikirim. Menunggu verifikasi Supervisor.',
      status: 'waiting_verification',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memproses tindak lanjut';
    return sendJson(res, 500, { error: msg });
  }
}
