import 'dotenv/config';
import { app } from '../backend/app.js';

export function restoreExpressPath(req) {
  const incoming = new URL(req.url || '/', 'http://vercel.internal');
  const apiPath = incoming.searchParams.get('__express_path');

  if (apiPath && apiPath.startsWith('/api/')) {
    incoming.searchParams.delete('__express_path');
    req.url = `${apiPath}${incoming.search ? incoming.search : ''}`;
  }

  return req;
}

export default function handler(req, res) {
  return app(restoreExpressPath(req), res);
}
