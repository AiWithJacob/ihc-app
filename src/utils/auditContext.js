// System pamięci i kontekstu dla Audit Log
// Automatycznie ustawia kontekst użytkownika przed operacjami na bazie

import { createClient } from '@supabase/supabase-js';

// Inicjalizacja Supabase Client (używamy anon key z frontendu)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('⚠️ Brak zmiennych środowiskowych Supabase. Audit log może nie działać poprawnie.');
}

/**
 * Generuje unikalne ID sesji
 */
function getSessionId() {
  let sessionId = sessionStorage.getItem('audit_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('audit_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Pobiera IP klienta (przez zewnętrzny serwis)
 */
async function getClientIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || null;
  } catch (error) {
    console.warn('Nie udało się pobrać IP:', error);
    return null;
  }
}

/**
 * Ustawia kontekst użytkownika w Supabase przed operacjami
 * Musi być wywołane przed każdą operacją INSERT/UPDATE/DELETE
 */
export async function setAuditContext() {
  if (!supabaseClient) {
    console.warn('⚠️ Supabase client nie jest zainicjalizowany');
    return;
  }

  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user.id) {
      console.warn('⚠️ Brak użytkownika w localStorage. Audit log nie będzie zawierał informacji o użytkowniku.');
      return;
    }

    // Pobierz IP i User Agent
    const ipAddress = await getClientIP();
    const userAgent = navigator.userAgent;
    const sessionId = getSessionId();

    // Ustaw kontekst w Supabase przez RPC
    const { error } = await supabaseClient.rpc('set_user_context', {
      p_user_id: user.id,
      p_user_login: user.login || '',
      p_user_email: user.email || '',
      p_chiropractor: user.chiropractor || '',
      p_source: 'ui',
      p_session_id: sessionId,
      p_ip_address: ipAddress,
      p_user_agent: userAgent
    });

    if (error) {
      console.warn('⚠️ Nie udało się ustawić kontekstu audit:', error);
      // Nie rzucamy błędu - aplikacja powinna działać nawet bez audit log
    }
  } catch (error) {
    console.error('❌ Błąd ustawiania kontekstu audit:', error);
  }
}

/**
 * Wrapper dla operacji Supabase z automatycznym kontekstem audit
 * Użyj tego zamiast bezpośrednich wywołań supabase.from()
 * 
 * @example
 * const result = await supabaseWithAudit(async () => {
 *   return await supabase.from('leads').insert([leadData]).select();
 * });
 */
export async function supabaseWithAudit(operation) {
  await setAuditContext();
  return operation();
}

/**
 * Pobiera instancję Supabase Client
 * Użyj tego zamiast bezpośredniego importu
 */
export function getSupabaseClient() {
  if (!supabaseClient) {
    console.error('❌ Supabase client nie jest zainicjalizowany. Sprawdź zmienne środowiskowe.');
  }
  return supabaseClient;
}

/**
 * Inicjalizuje Supabase Client z custom URL i key
 * Przydatne gdy zmienne środowiskowe nie są dostępne
 */
export function initSupabaseClient(url, anonKey) {
  supabaseClient = createClient(url, anonKey);
  return supabaseClient;
}

/**
 * Sprawdza czy audit context jest dostępny
 */
export function isAuditContextAvailable() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return !!user.id && !!supabaseClient;
}
