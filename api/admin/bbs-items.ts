import type { IncomingMessage, ServerResponse } from 'http';
import { 
  verifyAuthToken, 
  parseJsonBody, 
  recordAuditLog, 
  sendJson 
} from '../../lib/auth-middleware';
import { getFirestore } from '../../lib/firebase-admin';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const user = await verifyAuthToken(req);
  if (!user) {
    return sendJson(res, 401, { error: 'Unauthorized' });
  }

  const db = getFirestore();

  // GET: List all master BBS items
  if (req.method === 'GET') {
    try {
      const snap = await db.collection('bbsItems').where('active', '==', true).get();
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // If database is brand new and empty, seed the initial 3 behaviors
      if (items.length === 0) {
        const initialItems = [
          {
            title: 'Memasuki area warehouse memakai APD: helm dan safety vest',
            description: 'Petugas dan pekerja wajib menggunakan helm standar dengan tali dagu terikat dan safety vest reflektif sebelum melangkah masuk area pergudangan.',
            standardImagePath: 'standards/default/apd-helm-vest.png',
            version: 1,
            active: true,
          },
          {
            title: 'Berjalan pada jalur pejalan kaki yang tersedia',
            description: 'Berjalan hanya di dalam garis marka pejalan kaki (pedestrian walkway). Tidak memotong jalur forklift atau alat berat operasional.',
            standardImagePath: 'standards/default/jalur-pejalan-kaki.png',
            version: 1,
            active: true,
          },
          {
            title: 'Tidak menggunakan handphone saat berjalan kaki',
            description: 'Dilarang mengetik, menelpon, atau melihat layar telepon genggam saat sedang berjalan kaki di seluruh area operasional.',
            standardImagePath: 'standards/default/no-handphone-walk.png',
            version: 1,
            active: true,
          },
        ];

        const seeded = [];
        for (const item of initialItems) {
          const docRef = await db.collection('bbsItems').add({
            ...item,
            createdAt: new Date().toISOString(),
          });
          seeded.push({ id: docRef.id, ...item });
        }
        return sendJson(res, 200, { items: seeded, seeded: true });
      }

      return sendJson(res, 200, { items });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat master perilaku';
      return sendJson(res, 500, { error: msg });
    }
  }

  // POST: Create or update BBS item with standard card
  if (req.method === 'POST') {
    if (!user.superAdmin) {
      return sendJson(res, 403, { error: 'Hanya SuperAdmin yang dapat mengelola master perilaku pusat' });
    }

    try {
      const body = await parseJsonBody<{
        itemId?: string;
        title: string;
        description: string;
        standardImagePath?: string;
        version?: number;
        active?: boolean;
      }>(req);

      if (!body.title || !body.description) {
        return sendJson(res, 400, { error: 'Judul dan deskripsi perilaku wajib diisi' });
      }

      const col = db.collection('bbsItems');

      if (body.itemId) {
        const itemRef = col.doc(body.itemId);
        const prevDoc = await itemRef.get();
        const prevData = prevDoc.data() || {};
        const newVersion = (prevData['version'] || 1) + 1;

        const updatedData = {
          title: body.title,
          description: body.description,
          standardImagePath: body.standardImagePath || prevData['standardImagePath'] || '',
          version: newVersion,
          active: body.active !== undefined ? body.active : true,
          updatedAt: new Date().toISOString(),
        };

        await itemRef.update(updatedData);

        await recordAuditLog(
          user.uid,
          'update_bbs_master_item',
          `bbsItems/${body.itemId}`,
          prevData,
          updatedData
        );

        return sendJson(res, 200, { id: body.itemId, ...updatedData });
      } else {
        const newItem = {
          title: body.title,
          description: body.description,
          standardImagePath: body.standardImagePath || '',
          version: 1,
          active: true,
          createdAt: new Date().toISOString(),
        };

        const docRef = await col.add(newItem);

        await recordAuditLog(
          user.uid,
          'create_bbs_master_item',
          `bbsItems/${docRef.id}`,
          null,
          newItem
        );

        return sendJson(res, 201, { id: docRef.id, ...newItem });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan master item';
      return sendJson(res, 500, { error: msg });
    }
  }

  return sendJson(res, 405, { error: 'Method not allowed' });
}
