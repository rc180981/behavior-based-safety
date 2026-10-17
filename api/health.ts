import type { IncomingMessage, ServerResponse } from 'http';
import { sendJson } from './lib/auth-middleware';

export default function handler(req: IncomingMessage, res: ServerResponse): void {
  sendJson(res, 200, {
    status: 'ok',
    app: 'BBS Genba API',
    timestamp: new Date().toISOString(),
  });
}
