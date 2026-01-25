// Vercel Serverless Function - Endpoint do pobierania i zapisywania rezerwacji
// Rezerwacje są zapisywane bezpośrednio w Supabase - działa między wszystkimi instancjami Vercel

import { supabase } from '../lib/supabase.js';
import { setAuditContextForAPI, extractUserContext } from '../lib/auditHelper.js';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from './google-calendar.js';

// Postgres TIME zwraca "HH:MM:SS" – kalendarz porównuje sloty "HH:00". Normalizacja zapobiega
// znikaniu wydarzeń z siatki po sync (np. "12:00" vs "12:00:00").
const toHHMM = (t) => (t != null && String(t).length >= 5) ? String(t).slice(0, 5) : (t != null ? String(t) : '');

export default async function handler(req, res) {
  // Obsługa CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - pobierz rezerwacje z Supabase
  if (req.method === 'GET') {
    try {
      const { chiropractor, since } = req.query;
      
      if (!supabase) {
        console.error('❌ Supabase client nie jest zainicjalizowany!');
        return res.status(500).json({ 
          error: 'Database not configured',
          message: 'Supabase client not initialized. Check environment variables.'
        });
      }
      
      // Buduj zapytanie do Supabase (limit: PostgREST ma domyślny ceiling; bez niego można nie dostać części wizyt)
      let query = supabase
        .from('bookings')
        .select('*')
        .order('date', { ascending: false })
        .limit(5000);
      
      if (chiropractor) {
        query = query.eq('chiropractor', chiropractor);
      }
      if (since) {
        query = query.gt('created_at', since);
      }
      
      const { data: bookings, error } = await query;
      
      if (error) {
        console.error('❌ Błąd pobierania rezerwacji z Supabase:', error);
        return res.status(500).json({ 
          error: 'Database error',
          message: error.message 
        });
      }
      
      // Mapuj dane z bazy (date zawsze YYYY-MM-DD; toHHMM: "12:00:00" → "12:00")
      const mappedBookings = (bookings || []).map(booking => ({
        id: booking.id,
        leadId: booking.lead_id,
        date: String(booking.date || '').slice(0, 10),
        time: toHHMM(booking.time_from) + (booking.time_to ? ` - ${toHHMM(booking.time_to)}` : ''),
        timeFrom: toHHMM(booking.time_from),
        timeTo: toHHMM(booking.time_to),
        name: booking.name || '',
        phone: '', // Phone nie jest w tabeli bookings
        description: booking.description || '',
        chiropractor: booking.chiropractor,
        status: booking.status || 'scheduled',
        createdAt: booking.created_at || new Date().toISOString()
      }));
      
      console.log(`📤 Zwracam ${mappedBookings.length} rezerwacji z Supabase dla chiropraktyka "${chiropractor || 'wszystkie'}"`);
      
      return res.status(200).json({
        success: true,
        bookings: mappedBookings,
        count: mappedBookings.length,
        source: 'supabase'
      });
    } catch (error) {
      console.error('❌ Błąd pobierania rezerwacji:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  // POST - dodaj rezerwację bezpośrednio do Supabase
  if (req.method === 'POST') {
    try {
      const bookingData = req.body;
      
      if (!supabase) {
        return res.status(500).json({ 
          error: 'Database not configured',
          message: 'Supabase client not initialized.'
        });
      }
      
      // Dodaj chiropraktyka jeśli nie ma (z query string)
      if (req.query.chiropractor && !bookingData.chiropractor) {
        bookingData.chiropractor = req.query.chiropractor;
      }
      
      // Ustaw kontekst użytkownika dla audit log
      const userContext = extractUserContext(bookingData);
      userContext.chiropractor = bookingData.chiropractor || req.query.chiropractor || 'default';
      await setAuditContextForAPI(userContext, req);
      
      // Parsuj czas (może być "10:00" lub "10:00 - 11:30")
      const timeParts = (bookingData.time || bookingData.timeFrom || '').split(' - ');
      const timeFrom = timeParts[0];
      const timeTo = timeParts[1] || null;
      
      // Sprawdź czy lead_id istnieje (jeśli jest podany)
      let leadId = null;
      if (bookingData.leadId) {
        // Sprawdź czy lead istnieje w bazie
        const { data: leadExists } = await supabase
          .from('leads')
          .select('id')
          .eq('id', bookingData.leadId)
          .single();
        
        if (leadExists) {
          leadId = bookingData.leadId;
        } else {
          console.warn(`⚠️ Lead ID ${bookingData.leadId} nie istnieje w bazie, ustawiam na null`);
        }
      }
      
      // Mapuj dane na format bazy danych
      const bookingToInsert = {
        lead_id: leadId,
        chiropractor: bookingData.chiropractor || 'default',
        date: bookingData.date,
        time_from: timeFrom,
        time_to: timeTo,
        name: bookingData.name || null,
        description: bookingData.description || null,
        notes: bookingData.notes || null,
        status: bookingData.status || 'scheduled',
        created_at: bookingData.createdAt || new Date().toISOString(),
        // Informacje o użytkowniku (trigger też to ustawi, ale lepiej mieć explicite)
        created_by_user_id: userContext.user_id || null,
        created_by_user_login: userContext.user_login || null,
        created_by_user_email: userContext.user_email || null,
        updated_by_user_id: userContext.user_id || null,
        updated_by_user_login: userContext.user_login || null,
        updated_by_user_email: userContext.user_email || null
      };
      
      const { data: insertedBooking, error } = await supabase
        .from('bookings')
        .insert([bookingToInsert])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Błąd zapisywania rezerwacji do Supabase:', error);
        return res.status(500).json({ 
          error: 'Database error',
          message: error.message 
        });
      }
      
      // Utwórz wydarzenie w Google Calendar (jeśli skonfigurowane)
      let googleCalendarEventId = null;
      try {
        const chiropractorName = insertedBooking.chiropractor;
        console.log(`🔍 Próba utworzenia wydarzenia Google Calendar dla chiropraktyka: "${chiropractorName}"`);
        console.log(`🔍 Booking data:`, {
          id: insertedBooking.id,
          date: insertedBooking.date,
          time_from: insertedBooking.time_from,
          name: insertedBooking.name
        });
        
        googleCalendarEventId = await createCalendarEvent(insertedBooking, chiropractorName);
        
        // Zaktualizuj booking z event_id
        if (googleCalendarEventId) {
          await supabase
            .from('bookings')
            .update({ google_calendar_event_id: googleCalendarEventId })
            .eq('id', insertedBooking.id);
          
          insertedBooking.google_calendar_event_id = googleCalendarEventId;
          console.log(`✅ Wydarzenie Google Calendar utworzone: ${googleCalendarEventId}`);
        } else {
          console.warn('⚠️ createCalendarEvent zwróciło null - brak event_id');
        }
      } catch (gcError) {
        // Nie przerywaj procesu jeśli Google Calendar nie działa
        console.error('❌ Błąd tworzenia wydarzenia w Google Calendar (kontynuuję):', gcError);
        console.error('❌ Szczegóły błędu:', {
          message: gcError.message,
          stack: gcError.stack,
          chiropractor: insertedBooking.chiropractor
        });
      }
      
      // Mapuj z powrotem na format aplikacji (toHHMM dla spójności z siatką kalendarza)
      const mappedBooking = {
        id: insertedBooking.id,
        leadId: insertedBooking.lead_id,
        date: String(insertedBooking.date || '').slice(0, 10),
        time: toHHMM(insertedBooking.time_from) + (insertedBooking.time_to ? ` - ${toHHMM(insertedBooking.time_to)}` : ''),
        timeFrom: toHHMM(insertedBooking.time_from),
        timeTo: toHHMM(insertedBooking.time_to),
        name: insertedBooking.name || '',
        phone: '',
        description: insertedBooking.description || '',
        chiropractor: insertedBooking.chiropractor,
        status: insertedBooking.status,
        createdAt: insertedBooking.created_at,
        googleCalendarEventId: insertedBooking.google_calendar_event_id || null
      };
      
      return res.status(200).json({
        success: true,
        message: 'Booking saved to Supabase',
        booking: mappedBooking,
        isNew: true
      });
    } catch (error) {
      console.error('❌ Błąd zapisywania rezerwacji:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  // PUT - aktualizuj rezerwację
  if (req.method === 'PUT') {
    try {
      const bookingData = req.body;
      const { id } = req.query;
      
      if (!supabase || !id) {
        return res.status(400).json({ 
          error: 'Bad request',
          message: 'Missing booking ID or Supabase not configured.'
        });
      }
      
      // Ustaw kontekst użytkownika dla audit log
      const userContext = extractUserContext(bookingData);
      userContext.chiropractor = bookingData.chiropractor || req.query.chiropractor || 'default';
      await setAuditContextForAPI(userContext, req);
      
      // Parsuj czas
      const timeParts = (bookingData.time || bookingData.timeFrom || '').split(' - ');
      const timeFrom = timeParts[0];
      const timeTo = timeParts[1] || null;
      
      // Mapuj dane na format bazy danych
      const bookingToUpdate = {
        lead_id: bookingData.leadId || null,
        date: bookingData.date,
        time_from: timeFrom,
        time_to: timeTo,
        name: bookingData.name || null,
        description: bookingData.description || null,
        notes: bookingData.notes || null,
        status: bookingData.status || 'scheduled',
        // Informacje o użytkowniku, który aktualizuje (trigger też to ustawi)
        updated_by_user_id: userContext.user_id || null,
        updated_by_user_login: userContext.user_login || null,
        updated_by_user_email: userContext.user_email || null
      };
      
      // Usuń undefined/null wartości
      Object.keys(bookingToUpdate).forEach(key => {
        if (bookingToUpdate[key] === undefined) {
          delete bookingToUpdate[key];
        }
      });
      
      const { data: updatedBooking, error } = await supabase
        .from('bookings')
        .update(bookingToUpdate)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Błąd aktualizacji rezerwacji w Supabase:', error);
        return res.status(500).json({ 
          error: 'Database error',
          message: error.message 
        });
      }
      
      // Aktualizuj wydarzenie w Google Calendar (jeśli istnieje event_id)
      if (updatedBooking.google_calendar_event_id) {
        try {
          const chiropractorName = updatedBooking.chiropractor;
          await updateCalendarEvent(updatedBooking.google_calendar_event_id, updatedBooking, chiropractorName);
          console.log(`✅ Wydarzenie Google Calendar zaktualizowane: ${updatedBooking.google_calendar_event_id}`);
        } catch (gcError) {
          // Nie przerywaj procesu jeśli Google Calendar nie działa
          console.warn('⚠️ Błąd aktualizacji wydarzenia w Google Calendar (kontynuuję):', gcError.message);
        }
      }
      
      // Mapuj z powrotem na format aplikacji (toHHMM dla spójności z siatką kalendarza)
      const mappedBooking = {
        id: updatedBooking.id,
        leadId: updatedBooking.lead_id,
        date: String(updatedBooking.date || '').slice(0, 10),
        time: toHHMM(updatedBooking.time_from) + (updatedBooking.time_to ? ` - ${toHHMM(updatedBooking.time_to)}` : ''),
        timeFrom: toHHMM(updatedBooking.time_from),
        timeTo: toHHMM(updatedBooking.time_to),
        name: updatedBooking.name || '',
        phone: '',
        description: updatedBooking.description || '',
        chiropractor: updatedBooking.chiropractor,
        status: updatedBooking.status,
        createdAt: updatedBooking.created_at,
        googleCalendarEventId: updatedBooking.google_calendar_event_id || null
      };
      
      return res.status(200).json({
        success: true,
        message: 'Booking updated in Supabase',
        booking: mappedBooking
      });
    } catch (error) {
      console.error('❌ Błąd aktualizacji rezerwacji:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  // DELETE - usuń rezerwację
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      if (!supabase || !id) {
        return res.status(400).json({ 
          error: 'Bad request',
          message: 'Missing booking ID or Supabase not configured.'
        });
      }
      
      // Ustaw kontekst użytkownika dla audit log
      const userContext = extractUserContext(req.body || {});
      userContext.chiropractor = userContext.chiropractor || req.query.chiropractor || 'default';
      await setAuditContextForAPI(userContext, req);
      
      // Najpierw pobierz booking aby uzyskać google_calendar_event_id i chiropractor
      const { data: bookingToDelete, error: fetchError } = await supabase
        .from('bookings')
        .select('google_calendar_event_id, chiropractor')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('❌ Błąd pobierania rezerwacji przed usunięciem:', fetchError);
        return res.status(500).json({ 
          error: 'Database error',
          message: fetchError.message 
        });
      }
      
      // Usuń wydarzenie z Google Calendar (jeśli istnieje event_id)
      if (bookingToDelete?.google_calendar_event_id) {
        try {
          const chiropractorName = bookingToDelete.chiropractor || userContext.chiropractor;
          await deleteCalendarEvent(bookingToDelete.google_calendar_event_id, chiropractorName);
          console.log(`✅ Wydarzenie Google Calendar usunięte: ${bookingToDelete.google_calendar_event_id}`);
        } catch (gcError) {
          // Nie przerywaj procesu jeśli Google Calendar nie działa
          console.warn('⚠️ Błąd usuwania wydarzenia z Google Calendar (kontynuuję):', gcError.message);
        }
      }
      
      // Usuń booking z Supabase
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Błąd usuwania rezerwacji z Supabase:', error);
        return res.status(500).json({ 
          error: 'Database error',
          message: error.message 
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Booking deleted from Supabase'
      });
    } catch (error) {
      console.error('❌ Błąd usuwania rezerwacji:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
