// Vercel Serverless Function - Endpoint do pobierania i zapisywania rezerwacji
// Rezerwacje są zapisywane bezpośrednio w Supabase - działa między wszystkimi instancjami Vercel

import { supabase } from './supabase.js';
import { setAuditContextForAPI, extractUserContext } from './auditHelper.js';

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
      
      // Buduj zapytanie do Supabase
      let query = supabase
        .from('bookings')
        .select('*')
        .order('date', { ascending: false });
      
      // Filtruj po chiropraktyku
      if (chiropractor) {
        query = query.eq('chiropractor', chiropractor);
      }
      
      // Filtruj po dacie (od)
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
      
      // Mapuj dane z bazy na format aplikacji
      const mappedBookings = (bookings || []).map(booking => ({
        id: booking.id,
        leadId: booking.lead_id,
        date: booking.date,
        time: booking.time_from + (booking.time_to ? ` - ${booking.time_to}` : ''),
        timeFrom: booking.time_from,
        timeTo: booking.time_to,
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
      
      // Mapuj dane na format bazy danych
      const bookingToInsert = {
        lead_id: bookingData.leadId || null,
        chiropractor: bookingData.chiropractor || 'default',
        date: bookingData.date,
        time_from: timeFrom,
        time_to: timeTo,
        name: bookingData.name || null,
        description: bookingData.description || null,
        notes: bookingData.notes || null,
        status: bookingData.status || 'scheduled',
        created_at: bookingData.createdAt || new Date().toISOString()
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
      
      // Mapuj z powrotem na format aplikacji
      const mappedBooking = {
        id: insertedBooking.id,
        leadId: insertedBooking.lead_id,
        date: insertedBooking.date,
        time: insertedBooking.time_from + (insertedBooking.time_to ? ` - ${insertedBooking.time_to}` : ''),
        timeFrom: insertedBooking.time_from,
        timeTo: insertedBooking.time_to,
        name: insertedBooking.name || '',
        phone: '',
        description: insertedBooking.description || '',
        chiropractor: insertedBooking.chiropractor,
        status: insertedBooking.status,
        createdAt: insertedBooking.created_at
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
        status: bookingData.status || 'scheduled'
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
      
      // Mapuj z powrotem na format aplikacji
      const mappedBooking = {
        id: updatedBooking.id,
        leadId: updatedBooking.lead_id,
        date: updatedBooking.date,
        time: updatedBooking.time_from + (updatedBooking.time_to ? ` - ${updatedBooking.time_to}` : ''),
        timeFrom: updatedBooking.time_from,
        timeTo: updatedBooking.time_to,
        name: updatedBooking.name || '',
        phone: '',
        description: updatedBooking.description || '',
        chiropractor: updatedBooking.chiropractor,
        status: updatedBooking.status,
        createdAt: updatedBooking.created_at
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
      await setAuditContextForAPI(userContext, req);
      
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
