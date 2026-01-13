// Helper do ustawiania kontekstu użytkownika w API endpoints
// Używany przez Vercel Serverless Functions

import { supabase } from './supabase.js';

/**
 * Ustawia kontekst użytkownika w Supabase przed operacjami
 * @param {Object} userContext - Kontekst użytkownika z request body
 * @param {Object} req - Request object (dla IP i User Agent)
 */
export async function setAuditContextForAPI(userContext, req = null) {
  if (!supabase) {
    console.warn('⚠️ Supabase client nie jest zainicjalizowany');
    return;
  }

  try {
    // Pobierz IP z request headers
    const ipAddress = req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
                     req?.headers?.['x-real-ip'] ||
                     req?.connection?.remoteAddress ||
                     null;

    // Pobierz User Agent
    const userAgent = req?.headers?.['user-agent'] || null;

    // Wywołaj funkcję RPC do ustawienia kontekstu
    const { error } = await supabase.rpc('set_user_context', {
      p_user_id: userContext?.id || null,
      p_user_login: userContext?.login || null,
      p_user_email: userContext?.email || null,
      p_chiropractor: userContext?.chiropractor || null,
      p_source: userContext?.source || 'api',
      p_session_id: userContext?.session_id || null,
      p_ip_address: ipAddress,
      p_user_agent: userAgent
    });

    if (error) {
      console.warn('⚠️ Nie udało się ustawić kontekstu audit:', error);
    }
  } catch (error) {
    console.error('❌ Błąd ustawiania kontekstu audit:', error);
  }
}

/**
 * Wyodrębnia kontekst użytkownika z request body
 * @param {Object} body - Request body
 * @returns {Object} Kontekst użytkownika
 */
export function extractUserContext(body) {
  return {
    id: body.user_id || body.userId || null,
    login: body.user_login || body.userLogin || null,
    email: body.user_email || body.userEmail || null,
    chiropractor: body.chiropractor || null,
    source: body.source || 'api',
    session_id: body.session_id || body.sessionId || null
  };
}
