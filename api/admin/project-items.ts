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

  // GET: List all project items for a given project (and optionally area)
  if (req.method === 'GET') {
    const url = new URL(req.url || '', 'http://localhost');
    const projectId = url.searchParams.get('projectId');
    const areaId = url.searchParams.get('areaId');

    if (!projectId) {
      return sendJson(res, 400, { error: 'Parameter projectId wajib disertakan' });
    }

    try {
      let query: FirebaseFirestore.Query = db
        .collection('projects')
        .doc(projectId)
        .collection('projectItems')
        .where('active', '==', true);

      if (areaId) {
        query = query.where('areaId', '==', areaId);
      }

      const snap = await query.get();
      const projectItems = [];

      // Fetch master items metadata for denormalization
      const bbsItemsSnap = await db.collection('bbsItems').get();
      const bbsItemsMap = new Map<string, FirebaseFirestore.DocumentData>();
      bbsItemsSnap.forEach((d) => bbsItemsMap.set(d.id, d.data()));

      for (const d of snap.docs) {
        const itemData = d.data();
        const master = bbsItemsMap.get(itemData['itemId']) || {};
        projectItems.push({
          id: d.id,
          ...itemData,
          title: master['title'] || 'Item Perilaku BBS',
          description: master['description'] || '',
          standardImagePath: master['standardImagePath'] || '',
          standardVersion: itemData['standardVersion'] || master['version'] || 1,
        });
      }

      return sendJson(res, 200, { projectItems });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat item proyek';
      return sendJson(res, 500, { error: msg });
    }
  }

  // POST: Add or update project item
  if (req.method === 'POST') {
    try {
      const body = await parseJsonBody<{
        projectId: string;
        id?: string;
        itemId: string;
        areaId: string;
        category: 'wajib' | 'medium';
        categoryChangeReason?: string;
        active?: boolean;
      }>(req);

      const role = await checkProjectRole(body.projectId, user);
      if (role !== 'admin') {
        return sendJson(res, 403, { error: 'Hanya Admin proyek yang dapat mengelola item HSE' });
      }

      const col = db.collection('projects').doc(body.projectId).collection('projectItems');

      // Special action: Sync master BBS items to project if missing
      if ((body as { action?: string }).action === 'sync_master') {
        let bbsSnap = await db.collection('bbsItems').where('active', '==', true).get();
        if (bbsSnap.empty) {
          // Trigger initial seeding in bbs-items if empty
          const seedItems = [
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
          for (const item of seedItems) {
            await db.collection('bbsItems').add({ ...item, createdAt: new Date().toISOString() });
          }
          bbsSnap = await db.collection('bbsItems').where('active', '==', true).get();
        }

        const existingSnap = await col.get();
        const existingItemIds = new Set(existingSnap.docs.map((d) => d.data()['itemId']));

        const areasSnap = await db.collection('projects').doc(body.projectId).collection('areas').get();
        const defaultAreaId = !areasSnap.empty ? areasSnap.docs[0]!.id : 'ALL';

        let addedCount = 0;
        let index = 0;
        for (const bDoc of bbsSnap.docs) {
          if (!existingItemIds.has(bDoc.id)) {
            await col.add({
              itemId: bDoc.id,
              areaId: defaultAreaId,
              category: index < 2 ? 'wajib' : 'medium',
              standardVersion: bDoc.data()['version'] || 1,
              active: true,
              createdAt: new Date().toISOString(),
            });
            addedCount++;
          }
          index++;
        }

        return sendJson(res, 200, { success: true, addedCount, message: `${addedCount} item master berhasil disinkronkan ke proyek` });
      }

      if (!body.itemId || !body.areaId || !body.category) {
        return sendJson(res, 400, { error: 'itemId, areaId, dan category wajib diisi' });
      }

      if (body.id) {
        const itemRef = col.doc(body.id);
        const prevDoc = await itemRef.get();
        if (!prevDoc.exists) {
          return sendJson(res, 404, { error: 'Project item tidak ditemukan' });
        }

        const prevData = prevDoc.data()!;
        
        // Rule: Menurunkan item Wajib ke Medium memerlukan catatan alasan dan dicatat di audit log
        if (prevData['category'] === 'wajib' && body.category === 'medium') {
          if (!body.categoryChangeReason || body.categoryChangeReason.trim().length < 5) {
            return sendJson(res, 400, {
              error: 'Menurunkan kategori dari Wajib ke Medium memerlukan alasan yang jelas (minimal 5 karakter).',
            });
          }
        }

        const updateData: Record<string, unknown> = {
          category: body.category,
          areaId: body.areaId,
          active: body.active !== undefined ? body.active : true,
          updatedAt: new Date().toISOString(),
        };

        if (body.categoryChangeReason) {
          updateData['categoryChangeReason'] = body.categoryChangeReason;
        }

        await itemRef.update(updateData);

        await recordAuditLog(
          user.uid,
          'update_project_item_category',
          `projects/${body.projectId}/projectItems/${body.id}`,
          prevData,
          updateData
        );

        return sendJson(res, 200, { success: true, message: 'Item berhasil diperbarui' });
      } else {
        // Fetch current master version
        const masterDoc = await db.collection('bbsItems').doc(body.itemId).get();
        const standardVersion = masterDoc.exists ? masterDoc.data()?.['version'] || 1 : 1;

        const newItem = {
          itemId: body.itemId,
          areaId: body.areaId,
          category: body.category,
          standardVersion,
          active: true,
          createdAt: new Date().toISOString(),
        };

        const docRef = await col.add(newItem);

        await recordAuditLog(
          user.uid,
          'create_project_item',
          `projects/${body.projectId}/projectItems/${docRef.id}`,
          null,
          newItem
        );

        return sendJson(res, 201, { id: docRef.id, ...newItem });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan item proyek';
      return sendJson(res, 500, { error: msg });
    }
  }

  return sendJson(res, 405, { error: 'Method not allowed' });
}
