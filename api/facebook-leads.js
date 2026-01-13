// Vercel Serverless Function - Endpoint do odbierania leadów z Zapier/Facebook
// Leady są zapisywane bezpośrednio w Supabase - działa między wszystkimi instancjami Vercel

import { supabase } from './supabase.js';
import { setAuditContextForAPI, extractUserContext } from './auditHelper.js';

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
    // UWAGA: Zapier czasami dodaje białe znaki (taby, spacje) na końcu nazw pól!
    
    // Funkcja pomocnicza do znajdowania wartości z różnymi wariantami nazw pól
    const getFieldValue = (data, possibleNames) => {
      // Najpierw sprawdź dokładne nazwy
      for (const name of possibleNames) {
        if (data[name] !== undefined && data[name] !== null && data[name] !== '') {
          return data[name];
        }
      }
      // Sprawdź również pola z białymi znakami na końcu (taby, spacje)
      const keys = Object.keys(data);
      for (const key of keys) {
        const trimmedKey = key.trim();
        for (const name of possibleNames) {
          if (trimmedKey === name && data[key] !== undefined && data[key] !== null && data[key] !== '') {
            return data[key];
          }
        }
      }
      return '';
    };

    const firstName = getFieldValue(leadData, [
      'first_name', 
      'firstName', 
      'First_Name', 
      'First Name',
      'firstname'
    ]);

    const lastName = getFieldValue(leadData, [
      'last_name', 
      'lastName', 
      'Last_Name', 
      'Last Name',
      'lastname'
    ]);
    
    // PRIORYTET: Jeśli mamy osobno firstName i lastName, zawsze je łączymy
    let fullName = '';
    if (firstName && lastName) {
      // Mamy oba - połącz je (to jest najlepszy przypadek)
      fullName = `${String(firstName).trim()} ${String(lastName).trim()}`.trim();
    } else if (firstName) {
      // Tylko imię
      fullName = String(firstName).trim();
    } else if (lastName) {
      // Tylko nazwisko - sprawdź czy w innych polach jest pełne imię
      const nameField = leadData.full_name || leadData.fullName || leadData.name || '';
      if (nameField && String(nameField).includes(' ') && String(nameField).trim() !== String(lastName).trim()) {
        // Jeśli name zawiera spację i nie jest tylko nazwiskiem, użyj go
        fullName = String(nameField).trim();
      } else {
        // Tylko nazwisko - użyj go, ale zaloguj ostrzeżenie
        fullName = String(lastName).trim();
        console.warn('⚠️ Tylko nazwisko dostępne:', lastName);
      }
    } else {
      // Brak firstName i lastName - użyj pełnego imienia z innych pól
      fullName = leadData.full_name || leadData.fullName || leadData.name || 'Brak imienia';
    }
    
    // Upewnij się, że mamy przynajmniej coś
    if (!fullName || fullName.trim().length === 0) {
      fullName = 'Brak imienia';
    }
    
    // Logowanie dla debugowania - POMOCNE do diagnozowania problemów
    console.log('📝 Przetworzone imię i nazwisko:', {
      firstName: firstName || '(brak)',
      lastName: lastName || '(brak)',
      fullName: fullName,
      originalData: {
        first_name: leadData.first_name || '(brak)',
        last_name: leadData.last_name || '(brak)',
        firstName: leadData.firstName || '(brak)',
        lastName: leadData.lastName || '(brak)',
        First_Name: leadData.First_Name || '(brak)',
        'First_Name\\t': leadData['First_Name\t'] || '(brak)', // Sprawdź też z tabem
        full_name: leadData.full_name || '(brak)',
        fullName: leadData.fullName || '(brak)',
        name: leadData.name || '(brak)'
      },
      allKeys: Object.keys(leadData) // Pokaż wszystkie klucze, żeby zobaczyć dokładne nazwy
    });
    
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
      
      // Ustaw kontekst użytkownika dla audit log (webhook z Zapier)
      const userContext = {
        id: null, // Webhook nie ma użytkownika
        login: 'zapier_webhook',
        email: null,
        chiropractor: newLead.chiropractor,
        source: 'webhook',
        session_id: `webhook_${Date.now()}`
      };
      await setAuditContextForAPI(userContext, req);
      
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
