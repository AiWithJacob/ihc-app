// POST /api/register – rejestracja do app_users (Supabase)
// Body: { login, email, password }

import { supabase } from './supabase.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { login, email, password } = req.body || {};
    if (!login || !email || !password) {
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
