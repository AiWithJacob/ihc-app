// POST /api/user-heartbeat – aktualizacja last_seen_at (użytkownik ma otwartą aplikację)
// Body: { login }

import { supabase } from './supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const login = req.body?.login != null ? String(req.body.login).trim() : '';
    if (!login) return res.status(400).json({ error: 'Brak login' });

    if (!supabase) return res.status(503).json({ error: 'Baza nie skonfigurowana' });

    const { error } = await supabase
      .from('app_users')
      .update({ last_seen_at: new Date().toISOString() })
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
