// Vercel Serverless Function - OAuth Authorization URL Generator
// Generuje URL do autoryzacji Google Calendar

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
    `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/google-calendar/callback`;
  const state = req.query.state || 'default'; // chiropractor name

  if (!clientId) {
    return res.status(500).json({ 
      error: 'Google OAuth credentials not configured',
      details: 'GOOGLE_CLIENT_ID is missing in environment variables'
    });
  }

  const scope = 'https://www.googleapis.com/auth/calendar';
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `access_type=offline&` +
    `prompt=consent&` +
    `state=${encodeURIComponent(state)}`;

  // Debug info
  const debugInfo = {
    clientId: clientId ? `${clientId.substring(0, 20)}...` : 'MISSING',
    redirectUri: redirectUri,
    scope: scope,
    authUrl: authUrl
  };

  // Jeśli jest parametr ?debug=true, zwróć JSON z informacjami
  if (req.query.debug === 'true') {
    return res.status(200).json(debugInfo);
  }

  // W przeciwnym razie przekieruj do Google
  return res.redirect(authUrl);
}
