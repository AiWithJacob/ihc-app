import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Konfiguracja storage (ustaw w Supabase Secrets)
const STORAGE_TYPE = Deno.env.get('BACKUP_STORAGE_TYPE') || 'supabase'; // 'supabase', 's3', 'google_drive', 'dropbox'
const BACKUP_BUCKET = Deno.env.get('BACKUP_BUCKET') || 'ihc-backups';
const BACKUP_MODE = Deno.env.get('BACKUP_MODE') || 'full'; // 'full' lub 'incremental'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Określ zakres dat
    let dateFrom: Date;
    let dateTo = new Date();
    
    // Sprawdź czy request ma parametr mode
    const body = await req.json().catch(() => ({}));
    const requestMode = body.mode || BACKUP_MODE;
    
    if (requestMode === 'incremental') {
      // Backup tylko z ostatnich 24h
      dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - 1);
    } else {
      // Pełny backup wszystkich danych
      dateFrom = new Date(0); // Początek czasu Unix
    }

    console.log(`🔄 Rozpoczynam ${requestMode} backup danych z ${dateFrom.toISOString()} do ${dateTo.toISOString()}`);

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
      version: '2.0',
      mode: requestMode,
      timestamp: new Date().toISOString(),
      date_range: {
        from: dateFrom.toISOString(),
        to: dateTo.toISOString()
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
    const dateStr = dateTo.toISOString().split('T')[0];
    const modePrefix = requestMode === 'full' ? 'full' : 'daily';
    const filename = `ihc_backup_${modePrefix}_${dateStr}.json`;
    const csvFilename = `ihc_backup_${modePrefix}_${dateStr}.csv`;

    // Konwertuj do JSON i CSV
    const jsonContent = JSON.stringify(backupData, null, 2);
    const csvContent = generateCSV(backupData);

    // Zapisz do wybranego storage
    let backupResult;
    switch (STORAGE_TYPE) {
      case 'supabase':
        backupResult = await backupToSupabaseStorage(supabase, filename, csvFilename, jsonContent, csvContent, requestMode);
        break;
      case 's3':
        backupResult = await backupToS3(filename, csvFilename, jsonContent, csvContent, requestMode);
        break;
      case 'google_drive':
        backupResult = await backupToGoogleDrive(filename, csvFilename, jsonContent, csvContent, requestMode);
        break;
      case 'dropbox':
        backupResult = await backupToDropbox(filename, csvFilename, jsonContent, csvContent, requestMode);
        break;
      default:
        // Domyślnie zapisz do Supabase Storage
        backupResult = await backupToSupabaseStorage(supabase, filename, csvFilename, jsonContent, csvContent, requestMode);
    }

    return new Response(JSON.stringify({
      success: true,
      mode: requestMode,
      timestamp: backupData.timestamp,
      counts: backupData.counts,
      storage: backupResult,
      message: `✅ Backup zakończony pomyślnie. ${backupData.counts.audit_logs} zmian, ${backupData.counts.leads} leadów, ${backupData.counts.bookings} rezerwacji.`
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
async function backupToSupabaseStorage(
  supabase: any, 
  jsonFilename: string, 
  csvFilename: string, 
  jsonContent: string, 
  csvContent: string,
  mode: string
) {
  try {
    const folder = mode === 'full' ? 'full' : 'daily';
    
    // Zapisz JSON
    const { error: jsonError } = await supabase.storage
      .from(BACKUP_BUCKET)
      .upload(`${folder}/${jsonFilename}`, jsonContent, {
        contentType: 'application/json',
        upsert: true
      });

    if (jsonError) {
      console.warn('⚠️ Nie udało się zapisać JSON:', jsonError);
    }

    // Zapisz CSV
    const { error: csvError } = await supabase.storage
      .from(BACKUP_BUCKET)
      .upload(`${folder}/${csvFilename}`, csvContent, {
        contentType: 'text/csv',
        upsert: true
      });

    if (csvError) {
      console.warn('⚠️ Nie udało się zapisać CSV:', csvError);
    }

    return { 
      type: 'supabase_storage', 
      bucket: BACKUP_BUCKET,
      folder,
      files: [`${folder}/${jsonFilename}`, `${folder}/${csvFilename}`],
      success: !jsonError && !csvError
    };
  } catch (error) {
    throw new Error(`Supabase Storage error: ${error.message}`);
  }
}

// Backup do AWS S3
async function backupToS3(
  jsonFilename: string, 
  csvFilename: string, 
  jsonContent: string, 
  csvContent: string,
  mode: string
) {
  const AWS_ACCESS_KEY = Deno.env.get('AWS_ACCESS_KEY_ID');
  const AWS_SECRET_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY');
  const S3_BUCKET = Deno.env.get('S3_BUCKET_NAME');
  const S3_REGION = Deno.env.get('S3_REGION') || 'us-east-1';

  if (!AWS_ACCESS_KEY || !AWS_SECRET_KEY || !S3_BUCKET) {
    throw new Error('Brak konfiguracji AWS S3. Ustaw: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME');
  }

  // Uproszczona implementacja - w produkcji użyj AWS SDK
  // Tutaj tylko przykład struktury
  const folder = mode === 'full' ? 'full' : 'daily';
  return { 
    type: 's3', 
    bucket: S3_BUCKET,
    folder,
    files: [`${folder}/${jsonFilename}`, `${folder}/${csvFilename}`],
    note: 'Wymaga implementacji AWS SDK dla Deno'
  };
}

// Backup do Google Drive (z obsługą refresh token)
async function backupToGoogleDrive(
  jsonFilename: string, 
  csvFilename: string, 
  jsonContent: string, 
  csvContent: string,
  mode: string
) {
  const GOOGLE_DRIVE_FOLDER_ID = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID');
  const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
  const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const GOOGLE_REFRESH_TOKEN = Deno.env.get('GOOGLE_REFRESH_TOKEN');
  const GOOGLE_ACCESS_TOKEN = Deno.env.get('GOOGLE_ACCESS_TOKEN');

  // Jeśli mamy refresh token, użyj go do uzyskania access token
  let accessToken = GOOGLE_ACCESS_TOKEN;
  
  if (GOOGLE_REFRESH_TOKEN && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    try {
      console.log('🔄 Odświeżam token Google...');
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: GOOGLE_REFRESH_TOKEN,
          grant_type: 'refresh_token'
        })
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        accessToken = tokenData.access_token;
        console.log('✅ Token Google odświeżony');
      } else {
        const error = await tokenResponse.json();
        console.warn('⚠️ Nie udało się odświeżyć tokenu Google:', error);
      }
    } catch (error) {
      console.warn('⚠️ Błąd odświeżania tokenu Google, używam istniejącego:', error.message);
    }
  }

  if (!accessToken) {
    throw new Error('Brak Google Access Token. Ustaw: GOOGLE_ACCESS_TOKEN lub GOOGLE_REFRESH_TOKEN + GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET');
  }

  const folderId = GOOGLE_DRIVE_FOLDER_ID || 'root';

  try {
    const folder = mode === 'full' ? 'full' : 'daily';
    
    // Funkcja pomocnicza do tworzenia folderu (jeśli nie istnieje)
    const ensureFolder = async (parentId: string, folderName: string) => {
      // Sprawdź czy folder już istnieje
      const searchResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.files && searchData.files.length > 0) {
          return searchData.files[0].id; // Folder już istnieje
        }
      }

      // Utwórz folder
      const createResponse = await fetch(
        'https://www.googleapis.com/drive/v3/files',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: parentId === 'root' ? [] : [parentId]
          })
        }
      );

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(`Failed to create folder: ${JSON.stringify(error)}`);
      }

      const folderData = await createResponse.json();
      return folderData.id;
    };

    // Upewnij się, że folder 'full' lub 'daily' istnieje
    const targetFolderId = await ensureFolder(folderId, folder);

    // Funkcja pomocnicza do uploadu pliku
    const uploadFile = async (filename: string, content: string) => {
      const metadata = {
        name: filename,
        parents: [targetFolderId]
      };

      const formData = new FormData();
      const blob = new Blob([content], { 
        type: filename.endsWith('.json') ? 'application/json' : 'text/csv' 
      });
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', blob);

      const response = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Google Drive upload failed: ${JSON.stringify(error)}`);
      }

      return await response.json();
    };

    // Upload obu plików równolegle
    const [jsonFile, csvFile] = await Promise.all([
      uploadFile(jsonFilename, jsonContent),
      uploadFile(csvFilename, csvContent)
    ]);

    return { 
      type: 'google_drive', 
      folder_id: folderId,
      subfolder: folder,
      files: [
        { id: jsonFile.id, name: jsonFilename, webViewLink: `https://drive.google.com/file/d/${jsonFile.id}/view` },
        { id: csvFile.id, name: csvFilename, webViewLink: `https://drive.google.com/file/d/${csvFile.id}/view` }
      ],
      success: true
    };
  } catch (error) {
    throw new Error(`Google Drive error: ${error.message}`);
  }
}

// Backup do Dropbox (pełna implementacja)
async function backupToDropbox(
  jsonFilename: string, 
  csvFilename: string, 
  jsonContent: string, 
  csvContent: string,
  mode: string
) {
  const DROPBOX_ACCESS_TOKEN = Deno.env.get('DROPBOX_ACCESS_TOKEN');
  const DROPBOX_BACKUP_PATH = Deno.env.get('DROPBOX_BACKUP_PATH') || '/backups';

  if (!DROPBOX_ACCESS_TOKEN) {
    throw new Error('Brak konfiguracji Dropbox. Ustaw: DROPBOX_ACCESS_TOKEN');
  }

  try {
    const folder = mode === 'full' ? 'full' : 'daily';
    
    // Funkcja pomocnicza do uploadu pliku
    const uploadFile = async (filename: string, content: string) => {
      const path = `${DROPBOX_BACKUP_PATH}/${folder}/${filename}`;
      
      // Najpierw sprawdź czy folder istnieje, jeśli nie - utwórz go
      try {
        await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DROPBOX_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path: `${DROPBOX_BACKUP_PATH}/${folder}`,
            autorename: false
          })
        });
      } catch (e) {
        // Folder już istnieje lub inny błąd - kontynuuj
        console.log('Folder check:', e.message);
      }
      
      // Upload pliku
      const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DROPBOX_ACCESS_TOKEN}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            path: path,
            mode: 'overwrite',
            autorename: false
          })
        },
        body: content
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Dropbox upload failed: ${JSON.stringify(error)}`);
      }

      return await response.json();
    };

    // Upload obu plików równolegle
    const [jsonResult, csvResult] = await Promise.all([
      uploadFile(jsonFilename, jsonContent),
      uploadFile(csvFilename, csvContent)
    ]);

    return { 
      type: 'dropbox', 
      path: DROPBOX_BACKUP_PATH,
      folder,
      files: [
        { path: jsonResult.path_lower, name: jsonFilename },
        { path: csvResult.path_lower, name: csvFilename }
      ],
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
  lines.push('ID,Data,Tabela,Rekord ID,Akcja,Użytkownik,Email,Chiropraktyk,Zmienione pola');
  (backupData.data.audit_logs || []).forEach((log: any) => {
    lines.push([
      log.id,
      log.created_at,
      log.table_name,
      log.record_id,
      log.action,
      log.user_login || '',
      log.user_email || '',
      log.chiropractor || '',
      log.changed_fields?.join(';') || ''
    ].map(c => `"${String(c).replace(/"/g, '""')}"`).join(','));
  });

  // CSV dla leads
  lines.push('\n=== LEADS ===');
  lines.push('ID,Imię,Telefon,Email,Status,Źródło,Chiropraktyk,Data utworzenia');
  (backupData.data.leads || []).forEach((lead: any) => {
    lines.push([
      lead.id,
      lead.name || '',
      lead.phone || '',
      lead.email || '',
      lead.status || '',
      lead.source || '',
      lead.chiropractor || '',
      lead.created_at || ''
    ].map(c => `"${String(c).replace(/"/g, '""')}"`).join(','));
  });

  // CSV dla bookings
  lines.push('\n=== BOOKINGS ===');
  lines.push('ID,Lead ID,Nazwa,Data,Od,Do,Status,Chiropraktyk,Utworzył,Email utworzącego,Zaktualizował,Email zaktualizował,Data utworzenia');
  (backupData.data.bookings || []).forEach((booking: any) => {
    lines.push([
      booking.id,
      booking.lead_id || '',
      booking.name || '',
      booking.date || '',
      booking.time_from || '',
      booking.time_to || '',
      booking.status || '',
      booking.chiropractor || '',
      booking.created_by_user_login || '',
      booking.created_by_user_email || '',
      booking.updated_by_user_login || '',
      booking.updated_by_user_email || '',
      booking.created_at || ''
    ].map(c => `"${String(c).replace(/"/g, '""')}"`).join(','));
  });

  return lines.join('\n');
}
