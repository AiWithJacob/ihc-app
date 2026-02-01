// POST /api/login – logowanie użytkownika z weryfikacją hasła
// Body: { login, password }
// Zwraca dane użytkownika (bez password_hash) po poprawnej weryfikacji

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

    const { login, password } = body || {};

    if (!login || !password) {
      return res.status(400).json({ error: 'Brak loginu lub hasła' });
    }

    const loginS = String(login).trim();
    if (!loginS) {
      return res.status(400).json({ error: 'Login nie może być pusty' });
    }

    if (!supabase) {
      return res.status(503).json({ error: 'Baza nie skonfigurowana' });
    }

    // Pobierz użytkownika z bazy (z password_hash)
    const { data: user, error: fetchError } = await supabase
      .from('app_users')
      .select('id, login, email, password_hash, chiropractor, created_at')
      .eq('login', loginS)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Błąd pobierania użytkownika:', fetchError);
      return res.status(500).json({ error: 'Błąd serwera' });
    }

    if (!user) {
      // Nie zdradzamy czy login istnieje - zwracamy ogólny błąd
      return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });
    }

    // Weryfikuj hasło
    const isPasswordValid = await bcrypt.compare(String(password), user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });
    }

    // Aktualizuj last_login_at i last_seen_at
    const now = new Date().toISOString();
    await supabase
      .from('app_users')
      .update({ last_login_at: now, last_seen_at: now })
      .eq('id', user.id);

    // Zwróć dane użytkownika (bez password_hash)
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        login: user.login,
        email: user.email,
        chiropractor: user.chiropractor || 'default',
        created_at: user.created_at
      }
    });

  } catch (e) {
    console.error('❌ login:', e);
    return res.status(500).json({ error: e.message || 'Błąd serwera' });
  }
}
