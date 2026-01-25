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

    const lastSeen = { last_seen_at: new Date().toISOString() };
    const ch = req.body?.chiropractor;
    const payload = ch != null && String(ch).trim() !== ''
      ? { ...lastSeen, chiropractor: String(ch).trim() }
      : lastSeen;

    let { error } = await supabase
      .from('app_users')
      .update(payload)
      .eq('login', login);

    // Gdy kolumna chiropractor nie istnieje (migracja 006 nie uruchomiona), próbuj tylko last_seen_at
    if (error && payload.chiropractor != null && /chiropractor/i.test(error.message) && /schema cache/i.test(error.message)) {
      const { error: err2 } = await supabase
        .from('app_users')
        .update(lastSeen)
        .eq('login', login);
      if (!err2) {
        console.warn('⚠️ user-heartbeat: zaktualizowano last_seen_at (chiropractor pominięty – uruchom migrację 006_app_users_chiropractor.sql)');
        return res.status(200).json({ ok: true });
      }
      error = err2;
    }

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
