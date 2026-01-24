// POST /api/register – rejestracja do app_users (Supabase)
// Body: { login, email, password }

import { supabase } from '../lib/supabase.js';
import bcrypt from 'bcryptjs';

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
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) { body = {}; }
    }
    const { login, email, password } = body || {};
    if (!login || !email || !password) {
      console.warn('register: brak login/email/hasło. body:', typeof req.body, req.body && typeof req.body === 'object' ? Object.keys(req.body) : '(nie obiekt)');
      return res.status(400).json({ error: 'Brak login, email lub hasła' });
    }

    const loginS = String(login).trim();
    const emailS = String(email).trim().toLowerCase();
    if (!loginS || !emailS) {
      return res.status(400).json({ error: 'Login i email nie mogą być puste' });
    }

    if (!supabase) {
      return res.status(503).json({ error: 'Baza nie skonfigurowana' });
    }

    const { data: existing } = await supabase
      .from('app_users')
      .select('id')
      .or(`login.eq.${loginS},email.eq.${emailS}`)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: 'Użytkownik o tym loginie lub emailu już istnieje' });
    }

    const password_hash = await bcrypt.hash(String(password), 10);

    const { data: inserted, error } = await supabase
      .from('app_users')
      .insert([{ login: loginS, email: emailS, password_hash }])
      .select('id, login, email, created_at')
      .single();

    if (error) {
      console.error('❌ Błąd rejestracji app_users:', error);
      return res.status(500).json({ error: error.message || 'Błąd zapisu' });
    }

    return res.status(201).json({ id: inserted.id, login: inserted.login, email: inserted.email });
  } catch (e) {
    console.error('❌ register:', e);
    return res.status(500).json({ error: e.message || 'Błąd serwera' });
  }
}
