// POST /api/user-heartbeat – aktualizacja last_seen_at i chiropractor (użytkownik ma otwartą aplikację)
// Body: { login, chiropractor? }

import { supabase } from '../lib/supabase.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const login = req.body?.login != null ? String(req.body.login).trim() : '';
    if (!login) return res.status(400).json({ error: 'Brak login' });

    if (!supabase) return res.status(503).json({ error: 'Baza nie skonfigurowana' });

    const payload = { last_seen_at: new Date().toISOString() };
    const ch = req.body?.chiropractor;
    if (ch != null && String(ch).trim() !== '') payload.chiropractor = String(ch).trim();

    const { error } = await supabase
      .from('app_users')
      .update(payload)
      .eq('login', login);

    if (error) {
      console.warn('⚠️ user-heartbeat update error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('❌ user-heartbeat:', e);
    return res.status(500).json({ error: e.message || 'Błąd serwera' });
  }
}
