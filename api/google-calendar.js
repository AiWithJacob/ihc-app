// Vercel Serverless Function - Integracja z Google Calendar
// Funkcje do tworzenia, aktualizowania i usuwania wydarzeń w Google Calendar

import { google } from 'googleapis';
import { supabase } from './supabase.js';

// Pobierz access token z refresh token
async function getAccessToken(refreshToken) {
  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel environment variables.');
  }

  // Użyj tego samego redirect URI co przy autoryzacji (lub domyślnego)
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
    'https://ihc-app.vercel.app/api/google-calendar/callback';

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  try {
    console.log('🔍 Próba odświeżenia access token...');
    const { credentials } = await oauth2Client.refreshAccessToken();
    console.log('✅ Access token odświeżony pomyślnie');
    return credentials.access_token;
  } catch (error) {
    console.error('❌ Błąd odświeżania access token:', error);
    console.error('❌ Szczegóły błędu:', {
      message: error.message,
      code: error.code,
      response: error.response?.data
    });
    throw new Error(`Failed to refresh access token: ${error.message}`);
  }
}

// Pobierz refresh token dla chiropraktyka
async function getRefreshTokenForChiropractor(chiropractor) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  console.log(`🔍 Szukam refresh token dla chiropraktyka: "${chiropractor}"`);

  // Najpierw sprawdź w tabeli google_calendar_tokens
  const { data: tokenData, error: tokenError } = await supabase
    .from('google_calendar_tokens')
    .select('refresh_token, calendar_id, chiropractor')
    .eq('chiropractor', chiropractor)
    .single();

  console.log(`🔍 Wynik zapytania google_calendar_tokens:`, {
    found: !tokenError && tokenData,
    error: tokenError?.message,
    chiropractor: tokenData?.chiropractor
  });

  if (!tokenError && tokenData) {
    console.log(`✅ Znaleziono refresh token w google_calendar_tokens dla: "${chiropractor}"`);
    return {
      refreshToken: tokenData.refresh_token,
      calendarId: tokenData.calendar_id || 'primary'
    };
  }

  // Jeśli nie ma w google_calendar_tokens, sprawdź w tabeli users (backward compatibility)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('google_calendar_refresh_token, google_calendar_calendar_id, chiropractor')
    .eq('chiropractor', chiropractor)
    .single();

  console.log(`🔍 Wynik zapytania users:`, {
    found: !userError && userData?.google_calendar_refresh_token,
    error: userError?.message,
    chiropractor: userData?.chiropractor
  });

  if (!userError && userData?.google_calendar_refresh_token) {
    console.log(`✅ Znaleziono refresh token w users dla: "${chiropractor}"`);
    return {
      refreshToken: userData.google_calendar_refresh_token,
      calendarId: userData.google_calendar_calendar_id || 'primary'
    };
  }

  throw new Error(`No Google Calendar refresh token found for chiropractor: ${chiropractor}`);
}

// Utwórz wydarzenie w Google Calendar
export async function createCalendarEvent(booking, chiropractor) {
  try {
    console.log(`📅 Tworzenie wydarzenia w Google Calendar dla chiropraktyka: ${chiropractor}`);

    // Pobierz refresh token
    let refreshTokenData;
    try {
      refreshTokenData = await getRefreshTokenForChiropractor(chiropractor);
      console.log(`✅ Znaleziono refresh token dla: ${chiropractor}`);
    } catch (tokenError) {
      console.error(`❌ Błąd pobierania refresh token dla "${chiropractor}":`, tokenError.message);
      // Spróbuj z 'default' jako fallback
      if (chiropractor !== 'default') {
        console.log(`⚠️ Próbuję z 'default' jako fallback...`);
        try {
          refreshTokenData = await getRefreshTokenForChiropractor('default');
          console.log(`✅ Użyto refresh token z 'default'`);
        } catch (defaultError) {
          throw new Error(`No Google Calendar refresh token found for chiropractor: ${chiropractor} or 'default'. Please authorize Google Calendar first.`);
        }
      } else {
        throw tokenError;
      }
    }
    
    const { refreshToken, calendarId } = refreshTokenData;
    
    // Utwórz OAuth2 client
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
      'https://ihc-app.vercel.app/api/google-calendar/callback';
    
    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }
    
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    
    // Ustaw credentials (refresh token automatycznie odświeży access token)
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
    
    // Utwórz klienta Google Calendar z OAuth2 client
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Przygotuj datę i czas
    const dateStr = booking.date; // Format: YYYY-MM-DD
    const timeFrom = booking.time_from || booking.timeFrom; // Format: HH:MM
    const timeTo = booking.time_to || booking.timeTo || timeFrom; // Format: HH:MM

    // Parsuj datę i czas
    const [year, month, day] = dateStr.split('-');
    const [fromHour, fromMinute] = timeFrom.split(':');
    const [toHour, toMinute] = timeTo.split(':');

    // Utwórz obiekty Date (używamy timezone Europe/Warsaw)
    const startDateTime = new Date(Date.UTC(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(fromHour),
      parseInt(fromMinute)
    ));
    
    const endDateTime = new Date(Date.UTC(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(toHour),
      parseInt(toMinute)
    ));

    // Formatuj dla Google Calendar API (RFC3339)
    const startDateTimeStr = startDateTime.toISOString().replace(/\.\d{3}Z$/, '');
    const endDateTimeStr = endDateTime.toISOString().replace(/\.\d{3}Z$/, '');

    // Przygotuj opis wydarzenia
    let description = '';
    if (booking.description) {
      description += `Opis: ${booking.description}\n`;
    }
    if (booking.notes) {
      description += `Notatki: ${booking.notes}\n`;
    }
    if (booking.lead_id) {
      description += `Lead ID: ${booking.lead_id}\n`;
    }
    if (booking.status) {
      description += `Status: ${booking.status}`;
    }

    // Utwórz wydarzenie
    const event = {
      summary: booking.name ? `Wizyta: ${booking.name}` : 'Wizyta',
      description: description.trim() || 'Wizyta w gabinecie',
      start: {
        dateTime: startDateTimeStr,
        timeZone: 'Europe/Warsaw'
      },
      end: {
        dateTime: endDateTimeStr,
        timeZone: 'Europe/Warsaw'
      },
      location: 'Gabinet chiropraktyka',
      colorId: '1' // Niebieski
    };

    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event
    });

    const eventId = response.data.id;
    console.log(`✅ Wydarzenie utworzone w Google Calendar: ${eventId}`);

    return eventId;
  } catch (error) {
    console.error('❌ Błąd tworzenia wydarzenia w Google Calendar:', error);
    throw error;
  }
}

// Aktualizuj wydarzenie w Google Calendar
export async function updateCalendarEvent(eventId, booking, chiropractor) {
  try {
    console.log(`📅 Aktualizowanie wydarzenia w Google Calendar: ${eventId}`);

    if (!eventId) {
      throw new Error('Event ID is required for update');
    }

    // Pobierz refresh token
    const { refreshToken, calendarId } = await getRefreshTokenForChiropractor(chiropractor);
    
    // Utwórz OAuth2 client
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
      'https://ihc-app.vercel.app/api/google-calendar/callback';
    
    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }
    
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    
    // Ustaw credentials (refresh token automatycznie odświeży access token)
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
    
    // Utwórz klienta Google Calendar z OAuth2 client
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Przygotuj datę i czas
    const dateStr = booking.date;
    const timeFrom = booking.time_from || booking.timeFrom;
    const timeTo = booking.time_to || booking.timeTo || timeFrom;

    const [year, month, day] = dateStr.split('-');
    const [fromHour, fromMinute] = timeFrom.split(':');
    const [toHour, toMinute] = timeTo.split(':');

    const startDateTime = new Date(Date.UTC(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(fromHour),
      parseInt(fromMinute)
    ));
    
    const endDateTime = new Date(Date.UTC(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(toHour),
      parseInt(toMinute)
    ));

    const startDateTimeStr = startDateTime.toISOString().replace(/\.\d{3}Z$/, '');
    const endDateTimeStr = endDateTime.toISOString().replace(/\.\d{3}Z$/, '');

    // Przygotuj opis wydarzenia
    let description = '';
    if (booking.description) {
      description += `Opis: ${booking.description}\n`;
    }
    if (booking.notes) {
      description += `Notatki: ${booking.notes}\n`;
    }
    if (booking.lead_id) {
      description += `Lead ID: ${booking.lead_id}\n`;
    }
    if (booking.status) {
      description += `Status: ${booking.status}`;
    }

    // Pobierz istniejące wydarzenie
    const existingEvent = await calendar.events.get({
      calendarId: calendarId,
      eventId: eventId
    });

    // Zaktualizuj wydarzenie
    const updatedEvent = {
      ...existingEvent.data,
      summary: booking.name ? `Wizyta: ${booking.name}` : 'Wizyta',
      description: description.trim() || 'Wizyta w gabinecie',
      start: {
        dateTime: startDateTimeStr,
        timeZone: 'Europe/Warsaw'
      },
      end: {
        dateTime: endDateTimeStr,
        timeZone: 'Europe/Warsaw'
      },
      location: 'Gabinet chiropraktyka'
    };

    await calendar.events.update({
      calendarId: calendarId,
      eventId: eventId,
      requestBody: updatedEvent
    });

    console.log(`✅ Wydarzenie zaktualizowane w Google Calendar: ${eventId}`);
    return true;
  } catch (error) {
    console.error('❌ Błąd aktualizacji wydarzenia w Google Calendar:', error);
    // Jeśli wydarzenie nie istnieje (np. zostało usunięte ręcznie), nie rzucaj błędu
    if (error.code === 404) {
      console.warn(`⚠️ Wydarzenie ${eventId} nie istnieje w Google Calendar, pomijam aktualizację`);
      return false;
    }
    throw error;
  }
}

// Usuń wydarzenie z Google Calendar
export async function deleteCalendarEvent(eventId, chiropractor) {
  try {
    console.log(`📅 Usuwanie wydarzenia z Google Calendar: ${eventId}`);

    if (!eventId) {
      console.warn('⚠️ Brak event ID, pomijam usuwanie z Google Calendar');
      return false;
    }

    // Pobierz refresh token
    const { refreshToken, calendarId } = await getRefreshTokenForChiropractor(chiropractor);
    
    // Utwórz OAuth2 client
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
      'https://ihc-app.vercel.app/api/google-calendar/callback';
    
    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }
    
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    
    // Ustaw credentials (refresh token automatycznie odświeży access token)
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
    
    // Utwórz klienta Google Calendar z OAuth2 client
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Usuń wydarzenie
    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId
    });

    console.log(`✅ Wydarzenie usunięte z Google Calendar: ${eventId}`);
    return true;
  } catch (error) {
    console.error('❌ Błąd usuwania wydarzenia z Google Calendar:', error);
    // Jeśli wydarzenie nie istnieje, nie rzucaj błędu
    if (error.code === 404) {
      console.warn(`⚠️ Wydarzenie ${eventId} nie istnieje w Google Calendar, pomijam usuwanie`);
      return false;
    }
    throw error;
  }
}
