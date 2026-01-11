// Endpoint do zapisywania leadów w localStorage aplikacji
// To rozwiązuje problem z różnymi instancjami Vercel (każda ma własną pamięć)
// Aplikacja będzie odbierać leady z tego endpointu i zapisywać je w localStorage

export default async function handler(req, res) {
  // Obsługa CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - zwróć leady zapisane w localStorage aplikacji
  // Aplikacja będzie je pobierać i zapisywać w localStorage
  if (req.method === 'GET') {
    try {
      const { chiropractor, since } = req.query;
      
      // Pobierz leady z shared-storage (jeśli są)
      // W przyszłości można użyć bazy danych
      const { getAllLeads } = await import('./shared-storage.js');
      const allLeads = getAllLeads();
      
      let leads = allLeads;
      
      if (chiropractor) {
        leads = leads.filter(l => l.chiropractor === chiropractor);
      }
      
      if (since) {
        const sinceDate = new Date(since);
        leads = leads.filter(l => new Date(l.createdAt) > sinceDate);
      }
      
      console.log(`📤 Zwracam ${leads.length} leadów dla chiropraktyka "${chiropractor || 'wszystkie'}" (z localStorage)`);
      
      return res.status(200).json({
        success: true,
        leads: leads,
        count: leads.length,
        source: 'localStorage'
      });
    } catch (error) {
      console.error('Błąd pobierania leadów z localStorage:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST - zapisz lead (używane przez endpoint facebook-leads)
  if (req.method === 'POST') {
    try {
      const leadData = req.body;
      
      // Zwróć lead - aplikacja zapisze go w localStorage
      console.log('📦 Lead do zapisania w localStorage:', leadData.name);
      
      return res.status(200).json({
        success: true,
        message: 'Lead ready to be saved in app localStorage',
        lead: leadData
      });
    } catch (error) {
      console.error('Błąd przygotowania leada do zapisania:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
