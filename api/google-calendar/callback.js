// Vercel Serverless Function - OAuth Callback dla Google Calendar
// Obsługuje redirect z Google OAuth i zapisuje refresh token

import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

// Inicjalizacja Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

export default async function handler(req, res) {
  // Tylko GET requests (OAuth redirect)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error } = req.query;

  // Sprawdź czy jest błąd z Google
  if (error) {
    console.error('❌ Błąd OAuth:', error);
    return res.status(400).send(`
      <html>
        <head><title>Błąd autoryzacji</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1>❌ Błąd autoryzacji</h1>
          <p>Wystąpił błąd podczas autoryzacji: ${error}</p>
          <p><a href="/">Wróć do aplikacji</a></p>
        </body>
      </html>
    `);
  }

  // Sprawdź czy jest kod autoryzacyjny
  if (!code) {
    return res.status(400).send(`
      <html>
        <head><title>Brak kodu autoryzacyjnego</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1>❌ Brak kodu autoryzacyjnego</h1>
          <p>Nie otrzymano kodu autoryzacyjnego z Google.</p>
          <p><a href="/">Wróć do aplikacji</a></p>
        </body>
      </html>
    `);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
      `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/google-calendar/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Utwórz OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // Wymień kod na tokeny
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.refresh_token) {
      throw new Error('No refresh token received. Make sure you revoked previous access and requested offline access.');
    }

    // Pobierz informacje o użytkowniku
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // state powinien zawierać chiropractor name (zostanie dodane w przyszłości)
    const chiropractor = state || 'default';

    // Zapisz refresh token w Supabase
    if (supabase) {
      const { error: insertError } = await supabase
        .from('google_calendar_tokens')
        .upsert({
          chiropractor: chiropractor,
          refresh_token: tokens.refresh_token,
          calendar_id: 'primary',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'chiropractor'
        });

      if (insertError) {
        console.error('❌ Błąd zapisywania refresh token:', insertError);
        throw insertError;
      }
    }

    console.log(`✅ Refresh token zapisany dla chiropraktyka: ${chiropractor}`);

    // Sukces - pokaż stronę sukcesu
    return res.status(200).send(`
      <html>
        <head>
          <title>Autoryzacja zakończona</title>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0;">
          <div style="background: rgba(255, 255, 255, 0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);">
            <h1 style="font-size: 48px; margin: 0 0 20px 0;">✅</h1>
            <h2 style="margin: 0 0 20px 0;">Autoryzacja zakończona pomyślnie!</h2>
            <p style="font-size: 18px; margin: 0 0 30px 0; opacity: 0.9;">
              Google Calendar został połączony z Twoją aplikacją.<br>
              Możesz teraz zamknąć to okno.
            </p>
            <a href="/" style="display: inline-block; padding: 12px 24px; background: white; color: #667eea; text-decoration: none; border-radius: 8px; font-weight: 600; transition: transform 0.2s;" 
               onmouseover="this.style.transform='scale(1.05)'" 
               onmouseout="this.style.transform='scale(1)'">
              Wróć do aplikacji
            </a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('❌ Błąd w callback:', error);
    return res.status(500).send(`
      <html>
        <head><title>Błąd</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1>❌ Błąd</h1>
          <p>Wystąpił błąd podczas przetwarzania autoryzacji:</p>
          <pre style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: left; max-width: 600px; margin: 20px auto;">
${error.message}
          </pre>
          <p><a href="/">Wróć do aplikacji</a></p>
        </body>
      </html>
    `);
  }
}
