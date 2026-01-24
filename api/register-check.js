// GET /api/register-check – diagnostyka: czy Supabase jest skonfigurowane na Vercel

import { supabase } from './supabase.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseOk = !!(supabase != null);
  let appUsersOk = false;
  let appUsersError = null;

  if (supabaseOk) {
    try {
      const { count, error } = await supabase.from('app_users').select('id', { count: 'exact', head: true }).limit(1);
      appUsersOk = !error;
      appUsersError = error ? error.message : null;
    } catch (e) {
      appUsersError = e?.message || String(e);
    }
  }

  return res.status(200).json({
    ok: supabaseOk && appUsersOk,
    supabase: supabaseOk,
    app_users_table: appUsersOk ? 'ok' : (appUsersError || 'brak SUPABASE_URL/SERVICE_ROLE_KEY'),
    message: !supabaseOk
      ? 'W Vercel ustaw SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY (Settings → Environment Variables), potem Redeploy.'
      : !appUsersOk
        ? 'Supabase OK, ale app_users niedostępne: ' + (appUsersError || '?')
        : 'Supabase i app_users OK. Rejestracja powinna zapisywać do bazy.',
  });
}
