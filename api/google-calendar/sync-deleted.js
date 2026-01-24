// Sync: usuń z bazy wizyty, które zostały usunięte w Google Calendar
// Wywoływane przez crona co 15 min lub ręcznie (GET)

import { syncDeletedFromGoogle } from '../google-calendar.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Opcjonalna ochrona crona (Vercel ustawia CRON_SECRET)
  const auth = req.headers.authorization;
  const expected = process.env.CRON_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await syncDeletedFromGoogle();
    return res.status(200).json({ ok: true, message: 'sync-deleted done' });
  } catch (e) {
    console.error('❌ sync-deleted endpoint:', e);
    return res.status(500).json({ ok: false, error: e?.message || 'sync failed' });
  }
}
