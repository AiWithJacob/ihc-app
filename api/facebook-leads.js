// Vercel Serverless Function - Endpoint do odbierania leadów z Zapier/Facebook
export default async function handler(req, res) {
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
    
    // Pobierz chiropraktyka z query string lub body (jeśli Zapier go przekazuje)
    const chiropractor = req.query.chiropractor || leadData.chiropractor || null;
    
    // Utwórz obiekt leada zgodny ze strukturą aplikacji
    const newLead = {
      id: Date.now(),
      name: fullName,
      phone: phone,
      description: description,
      notes: `Źródło: Facebook Ads\nData: ${new Date().toLocaleString('pl-PL')}\nEmail: ${email || 'Brak'}\nID Lead: ${leadData.lead_id || leadData.id || 'N/A'}`,
      status: "Nowy kontakt",
      createdAt: new Date().toISOString(),
      source: 'facebook',
      email: email || undefined, // Dodaj email jeśli jest dostępny
      chiropractor: chiropractor // Przypisz chiropraktyka jeśli dostępny
    };

    // W przyszłości tutaj możesz zapisać do bazy danych (Supabase, MongoDB, itp.)
    // Na razie zwracamy lead - Zapier może go zapisać lub możesz użyć innego serwisu
    
    console.log('Przetworzony lead:', newLead);
    
    // Zapisz lead do endpointu /api/leads
    // Uwaga: W produkcji użyj bazy danych (Supabase, MongoDB) zamiast przechowywania w pamięci
    // W Vercel serverless functions każda instancja ma własną pamięć, więc to rozwiązanie
    // działa tylko dla małych projektów. Dla produkcji użyj bazy danych.
    try {
      // Pobierz URL aplikacji
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : (process.env.VERCEL ? `https://${process.env.VERCEL}` : 'http://localhost:3000');
      
      // Zapisz lead (wywołanie wewnętrzne)
      // W Vercel możemy użyć fetch do własnego API
      const saveUrl = `${baseUrl}/api/leads${chiropractor ? `?chiropractor=${encodeURIComponent(chiropractor)}` : ''}`;
      const saveResponse = await fetch(saveUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead)
      }).catch(err => {
        // W dev mode może nie działać, to OK
        console.log('Nie można zapisać do /api/leads (może być w trybie dev)');
        return null;
      });
      
      if (saveResponse && saveResponse.ok) {
        console.log('Lead zapisany do /api/leads');
      }
    } catch (saveError) {
      // Cicho ignoruj - w dev mode może nie działać
      console.log('Lead otrzymany, zapisywanie pominięte (normalne w niektórych trybach)');
    }
    
    // Zwróć sukces - Zapier będzie wiedział, że lead został odebrany
    return res.status(200).json({ 
      success: true, 
      lead: newLead,
      message: 'Lead received successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Błąd przetwarzania leada:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
