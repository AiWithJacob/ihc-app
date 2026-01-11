// Vercel Serverless Function - Endpoint do pobierania leadów
// W przyszłości można podłączyć bazę danych (Supabase, MongoDB)
import { getLeads, addLead } from './shared-storage.js';

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
      
      const leads = getLeads(chiropractor, since);
      
      if (chiropractor) {
        console.log(`🔍 Filtrowanie leadów dla chiropraktyka "${chiropractor}": znaleziono ${leads.length}`);
      }
      
      if (since) {
        console.log(`📅 Filtrowanie po dacie (od ${since}): ${leads.length} leadów`);
      }
      
      console.log(`📤 Zwracam ${leads.length} leadów dla chiropraktyka "${chiropractor || 'wszystkie'}"`);
      
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
      
      // Użyj wspólnego modułu do zapisywania
      const saveResult = addLead(leadData);
      
      return res.status(200).json({
        success: true,
        message: 'Lead saved',
        lead: saveResult.lead,
        isNew: saveResult.isNew
      });
    } catch (error) {
      console.error('Błąd zapisywania leada:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
