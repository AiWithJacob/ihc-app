// Moduł do połączenia z Supabase
// Używa service_role key dla operacji serwerowych (zapis/odczyt bez ograniczeń RLS)

import { createClient } from '@supabase/supabase-js';

// Pobierz zmienne środowiskowe z Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Brak zmiennych środowiskowych Supabase!');
  console.error('Upewnij się, że dodałeś SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY w Vercel');
}

// Utwórz klienta Supabase z service_role key (dla operacji serwerowych)
export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Funkcja pomocnicza do sprawdzania połączenia
export async function testConnection() {
  if (!supabase) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('count')
      .limit(1);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
