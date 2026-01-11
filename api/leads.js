// Vercel Serverless Function - Endpoint do pobierania leadów
// W przyszłości można podłączyć bazę danych (Supabase, MongoDB)

// Tymczasowe przechowywanie leadów w pamięci (w produkcji użyj bazy danych)
// Uwaga: To działa tylko w obrębie jednej instancji funkcji
let storedLeads = [];

export default async function handler(req, res) {
  // Obsługa CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - pobierz leady
  if (req.method === 'GET') {
    try {
      const { chiropractor, since } = req.query;
      
      let leads = storedLeads;
      
      // Filtruj po chiropraktyku jeśli podano
      if (chiropractor) {
        leads = leads.filter(l => l.chiropractor === chiropractor);
      }
      
      // Filtruj po dacie jeśli podano (pobierz tylko nowe)
      if (since) {
        const sinceDate = new Date(since);
        leads = leads.filter(l => new Date(l.createdAt) > sinceDate);
      }
      
      return res.status(200).json({
        success: true,
        leads: leads,
        count: leads.length
      });
    } catch (error) {
      console.error('Błąd pobierania leadów:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST - dodaj lead (używane przez endpoint facebook-leads lub bezpośrednio)
  if (req.method === 'POST') {
    try {
      const leadData = req.body;
      
      // Dodaj chiropraktyka jeśli nie ma (z query string)
      if (req.query.chiropractor && !leadData.chiropractor) {
        leadData.chiropractor = req.query.chiropractor;
      }
      
      // Sprawdź czy lead już istnieje (po ID lub telefonie)
      const existingLead = storedLeads.find(
        l => l.id === leadData.id || (l.phone && leadData.phone && l.phone === leadData.phone)
      );
      
      if (!existingLead) {
        storedLeads.push(leadData);
        console.log('Zapisano nowy lead:', leadData.name);
        // Ogranicz do ostatnich 1000 leadów (żeby nie rosło w nieskończoność)
        if (storedLeads.length > 1000) {
          storedLeads = storedLeads.slice(-1000);
        }
      } else {
        console.log('Lead już istnieje, pomijam:', leadData.name);
      }
      
      return res.status(200).json({
        success: true,
        message: 'Lead saved',
        lead: leadData,
        isNew: !existingLead
      });
    } catch (error) {
      console.error('Błąd zapisywania leada:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
