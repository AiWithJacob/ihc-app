// Vercel Serverless Function - Integracja z Google Calendar
// Funkcje do tworzenia, aktualizowania i usuwania wydarzeń w Google Calendar

import { google } from 'googleapis';
import { supabase } from '../lib/supabase.js';

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

// Klient Calendar API dla chiropraktyka (do sync i watch)
async function getCalendarClient(chiropractor) {
  const { refreshToken, calendarId } = await getRefreshTokenForChiropractor(chiropractor);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ||
    'https://ihc-app.vercel.app/api/google-calendar/callback';
  if (!clientId || !clientSecret) throw new Error('Google OAuth credentials not configured');
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  return { calendar, calendarId };
}

// Synchronizacja: usuń z bazy wizyty, których wydarzenia już nie ma w Google Calendar
async function syncOneChiropractor(chiropractor) {
  const { calendar, calendarId } = await getCalendarClient(chiropractor);
  const timeMin = new Date();
  timeMin.setDate(timeMin.getDate() - 60);
  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + 400);
  const dMin = timeMin.toISOString().slice(0, 10);
  const dMax = timeMax.toISOString().slice(0, 10);

  const googleEventIds = new Set();
  let pageToken;
  do {
    const res = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      pageToken
    });
    (res.data.items || []).forEach((ev) => { if (ev.id) googleEventIds.add(ev.id); });
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  const { data: bookings, error: fetchErr } = await supabase
    .from('bookings')
    .select('id, google_calendar_event_id')
    .eq('chiropractor', chiropractor)
    .not('google_calendar_event_id', 'is', null)
    .gte('date', dMin)
    .lte('date', dMax);

  if (fetchErr || !bookings || bookings.length === 0) return;
  const toDelete = bookings.filter((b) => !googleEventIds.has(b.google_calendar_event_id));
  if (toDelete.length === 0) return;

  const ids = toDelete.map((b) => b.id);
  const { error: delErr } = await supabase.from('bookings').delete().in('id', ids);
  if (delErr) {
    console.error(`❌ sync-deleted: błąd usuwania bookingów dla ${chiropractor}:`, delErr);
    return;
  }
  console.log(`✅ sync-deleted: usunięto ${toDelete.length} wizyt z bazy (usunięte w Google) dla ${chiropractor}`);
}

// Dla wszystkich chiropractorów z tokenem: usuń z bazy wizyty usunięte w Google
export async function syncDeletedFromGoogle() {
  if (!supabase) return;
  const { data: rows, error } = await supabase
    .from('google_calendar_tokens')
    .select('chiropractor');
  if (error || !rows || rows.length === 0) return;
  for (const { chiropractor } of rows) {
    try {
      await syncOneChiropractor(chiropractor);
    } catch (e) {
      console.warn(`⚠️ sync-deleted: pomijam ${chiropractor}:`, e?.message || e);
    }
  }
}

// Funkcja pomocnicza do sprawdzania czy jest czas letni (DST) w Europe/Warsaw
// Przyjmuje year, month (1-12), day
function isDaylightSavingTime(year, month, day) {
  // Czas letni w Polsce: ostatnia niedziela marca - ostatnia niedziela października
  // month to już wartość 1-12 (nie 0-11)
  if (month < 3 || month > 10) return false; // Styczeń, luty, listopad, grudzień - czas zimowy
  if (month > 3 && month < 10) return true; // Kwiecień-wrzesień - czas letni
  
  // Marzec: sprawdź ostatnią niedzielę (month = 3, ale w Date to index 2)
  if (month === 3) {
    const lastSundayMarch = getLastSunday(year, 2); // 2 = marzec (0-indexed)
    return day >= lastSundayMarch;
  }
  
  // Październik: sprawdź ostatnią niedzielę (month = 10, ale w Date to index 9)
  if (month === 10) {
    const lastSundayOctober = getLastSunday(year, 9); // 9 = październik (0-indexed)
    return day < lastSundayOctober;
  }
  
  return false;
}

// Funkcja pomocnicza do znalezienia ostatniej niedzieli w miesiącu
// month to 0-11 (0 = styczeń)
function getLastSunday(year, month) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  for (let day = lastDay; day >= 1; day--) {
    const date = new Date(year, month, day);
    if (date.getDay() === 0) return day; // 0 = niedziela
  }
  return lastDay;
}

// (year, month 1-12, day, hour, minute) = czas lokalny Europe/Warsaw
// Zwraca RFC3339 z jawnym offsetem: "YYYY-MM-DDTHH:mm:ss+01:00" lub "+02:00"
// Dzięki temu Google interpretuje dokładnie tę godzinę w Warszawie – bez konwersji UTC po naszej stronie
function formatDateTimeForWarsaw(year, month, day, hour, minute) {
  const isDST = isDaylightSavingTime(year, month, day);
  const offset = isDST ? '+02:00' : '+01:00';
  const d = String(day).padStart(2, '0');
  const m = String(month).padStart(2, '0');
  const h = String(hour).padStart(2, '0');
  const min = String(minute ?? 0).padStart(2, '0');
  return `${year}-${m}-${d}T${h}:${min}:00${offset}`;
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

    // Przygotuj datę i czas (fallback: time / "HH:MM - HH:MM")
    const dateStr = booking.date; // Format: YYYY-MM-DD
    const timeFrom = booking.time_from || booking.timeFrom || (booking.time && booking.time.split(' - ')[0]) || '';
    const timeTo = booking.time_to || booking.timeTo || (booking.time && booking.time.split(' - ')[1]) || timeFrom;

    if (!timeFrom || !dateStr) {
      throw new Error('Brak wymaganych pól: date i time_from (lub time) do utworzenia wydarzenia w Google Calendar.');
    }

    // Parsuj datę i czas
    const [year, month, day] = dateStr.split('-').map(Number);
    const [fromHour, fromMinute] = timeFrom.split(':').map(Number);
    const [toHour, toMinute] = (timeTo || timeFrom).split(':').map(Number);

    // Formatuj datę i czas w timezone Europe/Warsaw
    const startDateTimeStr = formatDateTimeForWarsaw(year, month, day, fromHour, fromMinute);
    const endDateTimeStr = formatDateTimeForWarsaw(year, month, day, toHour, toMinute);

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

    // Utwórz wydarzenie (bez lokalizacji)
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
      // Usunięto: location: 'Gabinet chiropraktyka',
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

    // Przygotuj datę i czas (fallback: time / "HH:MM - HH:MM")
    const dateStr = booking.date;
    const timeFrom = booking.time_from || booking.timeFrom || (booking.time && booking.time.split(' - ')[0]) || '';
    const timeTo = booking.time_to || booking.timeTo || (booking.time && booking.time.split(' - ')[1]) || timeFrom;

    if (!timeFrom || !dateStr) {
      throw new Error('Brak wymaganych pól: date i time_from (lub time) do aktualizacji wydarzenia w Google Calendar.');
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    const [fromHour, fromMinute] = timeFrom.split(':').map(Number);
    const [toHour, toMinute] = (timeTo || timeFrom).split(':').map(Number);

    // Formatuj datę i czas w timezone Europe/Warsaw
    const startDateTimeStr = formatDateTimeForWarsaw(year, month, day, fromHour, fromMinute);
    const endDateTimeStr = formatDateTimeForWarsaw(year, month, day, toHour, toMinute);

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

    // Zaktualizuj wydarzenie (bez lokalizacji)
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
      }
      // Usunięto: location: 'Gabinet chiropraktyka'
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
