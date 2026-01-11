// Vercel Serverless Function - Endpoint do odbierania leadów z Zapier/Facebook
// Leady są zapisywane bezpośrednio w Supabase - działa między wszystkimi instancjami Vercel

import { supabase } from './supabase.js';

export default async function handler(req, res) {
  // Obsługa CORS - DODANE
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Tylko POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const leadData = req.body;
    
    // Logowanie dla debugowania (w produkcji usuń lub użyj loggera)
    console.log('Otrzymano lead z Zapier:', JSON.stringify(leadData, null, 2));
    
    // Przetwórz dane z Zapier/Facebook Lead Ads
    // Zapier może wysłać różne formaty, więc obsługujemy różne warianty
    const firstName = leadData.first_name || leadData.firstName || '';
    const lastName = leadData.last_name || leadData.lastName || '';
    const fullName = leadData.full_name || leadData.fullName || 
                     `${firstName} ${lastName}`.trim() || 
                     leadData.name || 'Brak imienia';
    
    const phone = leadData.phone_number || 
                  leadData.phoneNumber || 
                  leadData.phone || 
                  leadData.mobile || 
                  '';
    
    const email = leadData.email || leadData.email_address || '';
    
    const description = leadData.custom_questions || 
                       leadData.message || 
                       leadData.description ||
                       leadData.additional_info ||
                       'Lead z Facebook Ads';
    
    // Pobierz chiropraktyka z query string, body lub użyj domyślnego
    // UWAGA: W Zapier musisz dodać pole "chiropractor" do danych
    const chiropractor = req.query.chiropractor || leadData.chiropractor || 'default';
    
    // Utwórz obiekt leada zgodny ze strukturą aplikacji
    const newLead = {
      id: Date.now(),
      name: fullName,
      phone: phone,
      description: description,
      notes: '', // Puste notes - email i źródło są w osobnych polach
      status: "Nowy kontakt",
      createdAt: new Date().toISOString(),
      source: 'facebook',
      email: email || undefined, // Dodaj email jeśli jest dostępny
      chiropractor: chiropractor // WAŻNE: Przypisz chiropraktyka
    };

    // W przyszłości tutaj możesz zapisać do bazy danych (Supabase, MongoDB, itp.)
    // Na razie zwracamy lead - Zapier może go zapisać lub możesz użyć innego serwisu
    
    console.log('Przetworzony lead:', newLead);
    
    // Zapisz lead do Supabase
    if (!supabase) {
      console.error('❌ Supabase client nie jest zainicjalizowany! Sprawdź zmienne środowiskowe.');
      return res.status(500).json({ 
        error: 'Database not configured',
        message: 'Supabase client not initialized. Check environment variables.'
      });
    }
    
    try {
      // Sprawdź, czy lead już istnieje (po telefonie i chiropraktyku)
      const { data: existingLeads, error: checkError } = await supabase
        .from('leads')
        .select('id')
        .eq('phone', newLead.phone || '')
        .eq('chiropractor', newLead.chiropractor)
        .limit(1);
      
      if (checkError) {
        console.error('❌ Błąd sprawdzania istniejących leadów:', checkError);
      }
      
      if (existingLeads && existingLeads.length > 0) {
        console.log('⚠️ Lead już istnieje w bazie, pominięto:', newLead.name);
        return res.status(200).json({ 
          success: true, 
          lead: newLead,
          message: 'Lead already exists',
          isNew: false,
          timestamp: new Date().toISOString()
        });
      }
      
      // Zapisz nowy lead do Supabase
      // Mapuj pola z aplikacji na strukturę bazy danych
      const leadToInsert = {
        name: newLead.name,
        phone: newLead.phone || null,
        email: newLead.email || null,
        description: newLead.description || null,
        notes: newLead.notes || null,
        status: newLead.status || 'Nowy kontakt',
        chiropractor: newLead.chiropractor,
        source: newLead.source || 'facebook',
        created_at: newLead.createdAt || new Date().toISOString()
      };
      
      const { data: insertedLead, error: insertError } = await supabase
        .from('leads')
        .insert([leadToInsert])
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Błąd zapisywania leada do Supabase:', insertError);
        return res.status(500).json({ 
          error: 'Database error',
          message: insertError.message
        });
      }
      
      console.log('✅ Lead zapisany w Supabase:', insertedLead.name, 'dla chiropraktyka:', insertedLead.chiropractor);
      console.log('📊 ID leada w bazie:', insertedLead.id);
      
      // Zwróć lead z ID z bazy danych
      return res.status(200).json({ 
        success: true, 
        lead: {
          ...newLead,
          id: insertedLead.id, // Użyj ID z bazy danych
          dbId: insertedLead.id // Dodatkowe pole dla kompatybilności
        },
        message: 'Lead saved to Supabase successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Błąd podczas zapisywania leada:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
    
  } catch (error) {
    console.error('Błąd przetwarzania leada:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
