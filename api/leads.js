// Vercel Serverless Function - Endpoint do pobierania leadów
// Pobiera leady z Supabase - działa między wszystkimi instancjami Vercel

import { supabase } from '../lib/supabase.js';
import { setAuditContextForAPI, extractUserContext } from '../lib/auditHelper.js';

export default async function handler(req, res) {
  // Obsługa CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - pobierz leady z Supabase
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
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Filtruj po chiropraktyku
      if (chiropractor) {
        query = query.eq('chiropractor', chiropractor);
      }
      
      // Filtruj po dacie (od)
      if (since) {
        query = query.gt('created_at', since);
      }
      
      const { data: leads, error } = await query;
      
      if (error) {
        console.error('❌ Błąd pobierania leadów z Supabase:', error);
        return res.status(500).json({ 
          error: 'Database error',
          message: error.message 
        });
      }
      
      // Mapuj dane z bazy na format aplikacji
      const mappedLeads = (leads || []).map(lead => ({
        id: lead.id,
        name: lead.name,
        phone: lead.phone || '',
        email: lead.email || '',
        description: lead.description || '',
        notes: lead.notes || '',
        status: lead.status || 'Nowy kontakt',
        chiropractor: lead.chiropractor,
        source: lead.source || 'manual',
        createdAt: lead.created_at || new Date().toISOString()
      }));
      
      console.log(`📤 Zwracam ${mappedLeads.length} leadów z Supabase dla chiropraktyka "${chiropractor || 'wszystkie'}"`);
      if (since) {
        console.log(`📅 Filtrowanie po dacie (od ${since}): ${mappedLeads.length} leadów`);
      }
      
      return res.status(200).json({
        success: true,
        leads: mappedLeads,
        count: mappedLeads.length,
        source: 'supabase'
      });
    } catch (error) {
      console.error('❌ Błąd pobierania leadów:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  // PUT - aktualizuj lead
  if (req.method === 'PUT') {
    try {
      const leadData = req.body;
      const id = req.query.id || leadData.id;
      if (!supabase || !id) {
        return res.status(400).json({ error: 'Bad request', message: 'Brak ID leada (query: id).' });
      }
      const userContext = extractUserContext(leadData);
      userContext.chiropractor = leadData.chiropractor || req.query.chiropractor || 'default';
      await setAuditContextForAPI(userContext, req);

      const toUpdate = {};
      if (leadData.name !== undefined) toUpdate.name = leadData.name;
      if (leadData.phone !== undefined) toUpdate.phone = leadData.phone || null;
      if (leadData.email !== undefined) toUpdate.email = leadData.email || null;
      if (leadData.description !== undefined) toUpdate.description = leadData.description || null;
      if (leadData.notes !== undefined) toUpdate.notes = leadData.notes || null;
      if (leadData.status !== undefined) toUpdate.status = leadData.status || 'Nowy kontakt';

      if (Object.keys(toUpdate).length === 0) {
        return res.status(400).json({ error: 'Bad request', message: 'Brak pól do aktualizacji.' });
      }

      let query = supabase.from('leads').update(toUpdate).eq('id', id);
      if (userContext.chiropractor) query = query.eq('chiropractor', userContext.chiropractor);
      const { data: updated, error } = await query.select().single();

      if (error) {
        console.error('❌ Błąd aktualizacji leada:', error);
        return res.status(500).json({ error: 'Database error', message: error.message });
      }

      const mapped = {
        id: updated.id,
        name: updated.name,
        phone: updated.phone || '',
        email: updated.email || '',
        description: updated.description || '',
        notes: updated.notes || '',
        status: updated.status,
        chiropractor: updated.chiropractor,
        source: updated.source || 'manual',
        createdAt: updated.created_at || new Date().toISOString()
      };
      return res.status(200).json({ success: true, message: 'Lead zaktualizowany', lead: mapped });
    } catch (e) {
      console.error('❌ Błąd PUT /api/leads:', e);
      return res.status(500).json({ error: 'Internal server error', message: e.message });
    }
  }

  // DELETE - usuń lead
  if (req.method === 'DELETE') {
    try {
      const id = req.query.id || (req.body && req.body.id);
      if (!supabase || !id) {
        return res.status(400).json({ error: 'Bad request', message: 'Brak ID leada (query: id).' });
      }
      const userContext = extractUserContext(req.body || {});
      userContext.chiropractor = userContext.chiropractor || req.query.chiropractor || 'default';
      await setAuditContextForAPI(userContext, req);

      let query = supabase.from('leads').delete().eq('id', id);
      if (userContext.chiropractor) query = query.eq('chiropractor', userContext.chiropractor);
      const { error } = await query;

      if (error) {
        console.error('❌ Błąd usuwania leada:', error);
        return res.status(500).json({ error: 'Database error', message: error.message });
      }
      return res.status(200).json({ success: true, message: 'Lead usunięty' });
    } catch (e) {
      console.error('❌ Błąd DELETE /api/leads:', e);
      return res.status(500).json({ error: 'Internal server error', message: e.message });
    }
  }

  // POST - dodaj lead bezpośrednio do Supabase
  if (req.method === 'POST') {
    try {
      const leadData = req.body;
      
      if (!supabase) {
        return res.status(500).json({ 
          error: 'Database not configured',
          message: 'Supabase client not initialized.'
        });
      }
      
      // Dodaj chiropraktyka jeśli nie ma (z query string)
      if (req.query.chiropractor && !leadData.chiropractor) {
        leadData.chiropractor = req.query.chiropractor;
      }
      
      // Ustaw kontekst użytkownika dla audit log
      const userContext = extractUserContext(leadData);
      userContext.chiropractor = leadData.chiropractor || req.query.chiropractor || 'default';
      await setAuditContextForAPI(userContext, req);
      
      // Mapuj dane na format bazy danych
      const leadToInsert = {
        name: leadData.name,
        phone: leadData.phone || null,
        email: leadData.email || null,
        description: leadData.description || null,
        notes: leadData.notes || null,
        status: leadData.status || 'Nowy kontakt',
        chiropractor: leadData.chiropractor || 'default',
        source: leadData.source || 'manual',
        created_at: leadData.createdAt || new Date().toISOString()
      };
      
      const { data: insertedLead, error } = await supabase
        .from('leads')
        .insert([leadToInsert])
        .select()
        .single();

      if (error) {
        console.error('❌ Błąd zapisywania leada do Supabase:', error);
        console.error('   leadToInsert:', JSON.stringify(leadToInsert));
        const msg = error.message + (error.message?.includes('does not exist')
          ? ' → Uruchom 000_leads_table.sql w Supabase (SQL Editor).'
          : '');
        return res.status(500).json({ error: 'Database error', message: msg });
      }
      
      // Mapuj z powrotem na format aplikacji
      const mappedLead = {
        id: insertedLead.id,
        name: insertedLead.name,
        phone: insertedLead.phone || '',
        email: insertedLead.email || '',
        description: insertedLead.description || '',
        notes: insertedLead.notes || '',
        status: insertedLead.status,
        chiropractor: insertedLead.chiropractor,
        source: insertedLead.source,
        createdAt: insertedLead.created_at
      };
      
      console.log('✅ POST /api/leads: lead zapisany w Supabase:', insertedLead.id, insertedLead.name, 'dla', insertedLead.chiropractor);
      return res.status(200).json({
        success: true,
        message: 'Lead saved to Supabase',
        lead: mappedLead,
        isNew: true
      });
    } catch (error) {
      console.error('❌ Błąd zapisywania leada:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
