// Wspólne przechowywanie leadów dla wszystkich funkcji
// UWAGA: W Vercel każda instancja ma własną pamięć, więc to działa tylko w obrębie jednej instancji
// W produkcji użyj bazy danych (Supabase, MongoDB, itp.)
let storedLeads = [];

export function getLeads(chiropractor, since) {
  let leads = [...storedLeads]; // Zwróć kopię, aby nie modyfikować oryginału
  
  if (chiropractor) {
    leads = leads.filter(l => l.chiropractor === chiropractor);
  }
  
  if (since) {
    const sinceDate = new Date(since);
    leads = leads.filter(l => new Date(l.createdAt) > sinceDate);
  }
  
  return leads;
}

export function addLead(leadData) {
  // Sprawdź czy lead już istnieje (po ID lub telefonie)
  const existingLead = storedLeads.find(
    l => l.id === leadData.id || (l.phone && leadData.phone && l.phone === leadData.phone)
  );
  
  if (!existingLead) {
    storedLeads.push(leadData);
    // Ogranicz do ostatnich 1000 leadów (żeby nie rosło w nieskończoność)
    if (storedLeads.length > 1000) {
      storedLeads = storedLeads.slice(-1000);
    }
    console.log('✅ Zapisano nowy lead:', leadData.name, 'dla chiropraktyka:', leadData.chiropractor || 'brak');
    console.log('📊 Wszystkie leady w pamięci:', storedLeads.length);
    return { success: true, isNew: true, lead: leadData };
  }
  
  console.log('⚠️ Lead już istnieje, pomijam:', leadData.name);
  return { success: true, isNew: false, lead: existingLead };
}

export function getAllLeads() {
  return [...storedLeads]; // Zwróć kopię
}
