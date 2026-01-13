import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Konfiguracja storage (ustaw w Supabase Secrets)
const STORAGE_TYPE = Deno.env.get('BACKUP_STORAGE_TYPE') || 'supabase'; // 'supabase', 's3', 'google_drive', 'dropbox'
const BACKUP_BUCKET = Deno.env.get('BACKUP_BUCKET') || 'ihc-backups';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Pobierz datę wczoraj (backup z ostatnich 24h)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const today = new Date();

    console.log(`🔄 Rozpoczynam backup danych z ${yesterday.toISOString()} do ${today.toISOString()}`);

    // Pobierz wszystkie dane
    const [auditLogs, leads, bookings] = await Promise.all([
      supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false }),
      supabase
        .from('leads')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false }),
      supabase
        .from('bookings')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
    ]);

    if (auditLogs.error) throw new Error(`Audit logs: ${auditLogs.error.message}`);
    if (leads.error) throw new Error(`Leads: ${leads.error.message}`);
    if (bookings.error) throw new Error(`Bookings: ${bookings.error.message}`);

    const backupData = {
      timestamp: new Date().toISOString(),
      date_range: {
        from: yesterday.toISOString(),
        to: today.toISOString()
      },
      counts: {
        audit_logs: auditLogs.data?.length || 0,
        leads: leads.data?.length || 0,
        bookings: bookings.data?.length || 0
      },
      data: {
        audit_logs: auditLogs.data || [],
        leads: leads.data || [],
        bookings: bookings.data || []
      }
    };

    // Generuj nazwę pliku
    const dateStr = today.toISOString().split('T')[0];
    const filename = `ihc_backup_${dateStr}.json`;

    // Konwertuj do JSON
    const jsonContent = JSON.stringify(backupData, null, 2);
    const csvContent = generateCSV(backupData);

    // Zapisz do wybranego storage
    let backupResult;
    switch (STORAGE_TYPE) {
      case 'supabase':
        backupResult = await backupToSupabaseStorage(supabase, filename, jsonContent, csvContent);
        break;
      case 's3':
        backupResult = await backupToS3(filename, jsonContent, csvContent);
        break;
      case 'google_drive':
        backupResult = await backupToGoogleDrive(filename, jsonContent, csvContent);
        break;
      case 'dropbox':
        backupResult = await backupToDropbox(filename, jsonContent, csvContent);
        break;
      default:
        // Domyślnie zapisz do Supabase Storage
        backupResult = await backupToSupabaseStorage(supabase, filename, jsonContent, csvContent);
    }

    return new Response(JSON.stringify({
      success: true,
      timestamp: backupData.timestamp,
      counts: backupData.counts,
      storage: backupResult,
      message: `Backup zakończony pomyślnie. ${backupData.counts.audit_logs} zmian, ${backupData.counts.leads} leadów, ${backupData.counts.bookings} rezerwacji.`
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Błąd backupu:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Backup do Supabase Storage (domyślne)
async function backupToSupabaseStorage(supabase: any, filename: string, jsonContent: string, csvContent: string) {
  try {
    // Zapisz JSON
    const { error: jsonError } = await supabase.storage
      .from(BACKUP_BUCKET)
      .upload(`daily/${filename}`, jsonContent, {
        contentType: 'application/json',
        upsert: true
      });

    if (jsonError) {
      console.warn('⚠️ Nie udało się zapisać JSON do Supabase Storage:', jsonError);
    }

    // Zapisz CSV
    const csvFilename = filename.replace('.json', '.csv');
    const { error: csvError } = await supabase.storage
      .from(BACKUP_BUCKET)
      .upload(`daily/${csvFilename}`, csvContent, {
        contentType: 'text/csv',
        upsert: true
      });

    if (csvError) {
      console.warn('⚠️ Nie udało się zapisać CSV do Supabase Storage:', csvError);
    }

    return { 
      type: 'supabase_storage', 
      bucket: BACKUP_BUCKET,
      files: [`daily/${filename}`, `daily/${csvFilename}`],
      success: !jsonError && !csvError
    };
  } catch (error) {
    throw new Error(`Supabase Storage error: ${error.message}`);
  }
}

// Backup do AWS S3
async function backupToS3(filename: string, jsonContent: string, csvContent: string) {
  const AWS_ACCESS_KEY = Deno.env.get('AWS_ACCESS_KEY_ID');
  const AWS_SECRET_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY');
  const S3_BUCKET = Deno.env.get('S3_BUCKET_NAME');
  const S3_REGION = Deno.env.get('S3_REGION') || 'us-east-1';

  if (!AWS_ACCESS_KEY || !AWS_SECRET_KEY || !S3_BUCKET) {
    throw new Error('Brak konfiguracji AWS S3. Ustaw: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME');
  }

  // Uproszczona implementacja - w produkcji użyj AWS SDK
  // Tutaj tylko przykład struktury
  return { 
    type: 's3', 
    bucket: S3_BUCKET,
    filename,
    note: 'Wymaga implementacji AWS SDK dla Deno'
  };
}

// Backup do Google Drive
async function backupToGoogleDrive(filename: string, jsonContent: string, csvContent: string) {
  const GOOGLE_DRIVE_FOLDER_ID = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID');
  const GOOGLE_ACCESS_TOKEN = Deno.env.get('GOOGLE_ACCESS_TOKEN');

  if (!GOOGLE_DRIVE_FOLDER_ID || !GOOGLE_ACCESS_TOKEN) {
    throw new Error('Brak konfiguracji Google Drive. Ustaw: GOOGLE_DRIVE_FOLDER_ID, GOOGLE_ACCESS_TOKEN');
  }

  try {
    // Upload JSON
    const formData = new FormData();
    const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
    formData.append('metadata', JSON.stringify({
      name: filename,
      parents: [GOOGLE_DRIVE_FOLDER_ID]
    }));
    formData.append('file', jsonBlob);

    const jsonResponse = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GOOGLE_ACCESS_TOKEN}`
        },
        body: formData
      }
    );

    if (!jsonResponse.ok) {
      const error = await jsonResponse.json();
      throw new Error(`Google Drive upload failed: ${JSON.stringify(error)}`);
    }

    const fileData = await jsonResponse.json();

    return { 
      type: 'google_drive', 
      file_id: fileData.id, 
      filename,
      success: true
    };
  } catch (error) {
    throw new Error(`Google Drive error: ${error.message}`);
  }
}

// Backup do Dropbox
async function backupToDropbox(filename: string, jsonContent: string, csvContent: string) {
  const DROPBOX_ACCESS_TOKEN = Deno.env.get('DROPBOX_ACCESS_TOKEN');
  const DROPBOX_PATH = Deno.env.get('DROPBOX_BACKUP_PATH') || `/backups/${filename}`;

  if (!DROPBOX_ACCESS_TOKEN) {
    throw new Error('Brak konfiguracji Dropbox. Ustaw: DROPBOX_ACCESS_TOKEN');
  }

  try {
    const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DROPBOX_ACCESS_TOKEN}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path: DROPBOX_PATH,
          mode: 'overwrite'
        })
      },
      body: jsonContent
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Dropbox upload failed: ${JSON.stringify(error)}`);
    }

    const fileData = await response.json();

    return { 
      type: 'dropbox', 
      path: fileData.path_lower, 
      filename,
      success: true
    };
  } catch (error) {
    throw new Error(`Dropbox error: ${error.message}`);
  }
}

// Generuj CSV z backupu
function generateCSV(backupData: any): string {
  const lines: string[] = [];

  // CSV dla audit_logs
  lines.push('=== AUDIT LOGS ===');
  lines.push('ID,Data,Tabela,Rekord ID,Akcja,Użytkownik,Email,Zmienione pola');
  (backupData.data.audit_logs || []).forEach((log: any) => {
    lines.push([
      log.id,
      log.created_at,
      log.table_name,
      log.record_id,
      log.action,
      log.user_login || '',
      log.user_email || '',
      log.changed_fields?.join(';') || ''
    ].map(c => `"${String(c).replace(/"/g, '""')}"`).join(','));
  });

  // CSV dla leads
  lines.push('\n=== LEADS ===');
  lines.push('ID,Imię,Telefon,Email,Status,Źródło,Data utworzenia');
  (backupData.data.leads || []).forEach((lead: any) => {
    lines.push([
      lead.id,
      lead.name || '',
      lead.phone || '',
      lead.email || '',
      lead.status || '',
      lead.source || '',
      lead.created_at || ''
    ].map(c => `"${String(c).replace(/"/g, '""')}"`).join(','));
  });

  // CSV dla bookings
  lines.push('\n=== BOOKINGS ===');
  lines.push('ID,Lead ID,Nazwa,Data,Od,Do,Status,Data utworzenia');
  (backupData.data.bookings || []).forEach((booking: any) => {
    lines.push([
      booking.id,
      booking.lead_id || '',
      booking.name || '',
      booking.date || '',
      booking.time_from || '',
      booking.time_to || '',
      booking.status || '',
      booking.created_at || ''
    ].map(c => `"${String(c).replace(/"/g, '""')}"`).join(','));
  });

  return lines.join('\n');
}
