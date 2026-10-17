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
      action: 'approve' | 'reject';
      note?: string;
    }>(req);

    if (!body.findingId || !body.action) {
      return sendJson(res, 400, { error: 'findingId dan action (approve/reject) wajib diisi' });
    }

    const db = getFirestore();
    const findingRef = db.collection('findings').doc(body.findingId);
    const snap = await findingRef.get();

    if (!snap.exists) {
      return sendJson(res, 404, { error: 'Temuan tidak ditemukan' });
    }

    const finding = snap.data()!;
    const role = await checkProjectRole(finding['projectId'] as string, user);
    
    // Only supervisor or admin can verify findings
    if (role !== 'supervisor' && role !== 'admin') {
      return sendJson(res, 403, {
        error: 'Akses ditolak: Hanya Supervisor atau Admin yang berhak memverifikasi temuan.',
      });
    }

    const newStatus = body.action === 'approve' ? 'closed' : 'open';
    const nowIso = new Date().toISOString();

    const historyEntry = {
      actorUid: user.uid,
      actorName: user.name || user.email || 'Supervisor',
      action: body.action === 'approve' ? 'verified' : 'rejected',
      status: newStatus,
      note: body.note || (body.action === 'approve' ? 'Temuan telah diverifikasi dan ditutup.' : 'Tindak lanjut ditolak, dikembalikan ke PIC.'),
      at: nowIso,
    };

    const currentHistory = finding['history'] || [];
    const updatedHistory = [...currentHistory, historyEntry];

    await findingRef.update({
      status: newStatus,
      history: updatedHistory,
      updatedAt: nowIso,
    });

    await recordAuditLog(
      user.uid,
      body.action === 'approve' ? 'verify_close_finding' : 'reject_finding_to_pic',
      `findings/${body.findingId}`,
      { status: finding['status'] },
      { status: newStatus, note: body.note }
    );

    return sendJson(res, 200, {
      success: true,
      status: newStatus,
      message: body.action === 'approve' 
        ? 'Temuan berhasil diverifikasi dan ditutup (Closed).' 
        : 'Temuan dikembalikan ke PIC untuk perbaikan ulang.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memverifikasi temuan';
    return sendJson(res, 500, { error: msg });
  }
}
