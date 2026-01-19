import { useState, useEffect } from "react";
import { useTheme } from "./ThemeContext.jsx";
import { createClient } from '@supabase/supabase-js';

// Inicjalizacja Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('⚠️ Brak zmiennych środowiskowych Supabase. Audit log może nie działać.');
}

export default function AuditLogPage() {
  const { themeData } = useTheme();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    table_name: "",
    action: "",
    user_login: "",
    source: "",
    date_from: "",
    date_to: "",
    limit: 100
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (supabase) {
      loadAuditLogs();
    } else {
      setError("Supabase client nie jest zainicjalizowany. Sprawdź zmienne środowiskowe.");
      setLoading(false);
    }
  }, [filters]);

  const loadAuditLogs = async () => {
    if (!supabase) return;

    setLoading(true);
    setError(null);

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      if (!user.chiropractor) {
        setError("Brak wybranego chiropraktyka. Zaloguj się ponownie.");
        setLoading(false);
        return;
      }

      // Buduj zapytanie
      let query = supabase
        .from("audit_logs")
        .select("*")
        .eq("chiropractor", user.chiropractor)
        .order("created_at", { ascending: false })
        .limit(filters.limit);

      // Filtry
      if (filters.table_name) {
        query = query.eq("table_name", filters.table_name);
      }
      if (filters.action) {
        query = query.eq("action", filters.action);
      }
      if (filters.user_login) {
        query = query.ilike("user_login", `%${filters.user_login}%`);
      }
      if (filters.date_from) {
        query = query.gte("created_at", filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte("created_at", filters.date_to + "T23:59:59");
      }

      const { data, error: queryError } = await query;
      
      // Filtrowanie po źródle po stronie klienta (metadata.source jest JSONB)
      let filteredData = data || [];
      if (filters.source) {
        filteredData = filteredData.filter(log => {
          const logSource = log.metadata?.source || 'database';
          return logSource === filters.source;
        });
      }

      if (queryError) throw queryError;

      setAuditLogs(filteredData);
    } catch (err) {
      console.error("Błąd ładowania historii:", err);
      setError(`Błąd: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatAction = (action) => {
    const config = {
      INSERT: { label: "Utworzenie", color: "#22c55e", icon: "➕" },
      UPDATE: { label: "Modyfikacja", color: "#3b82f6", icon: "✏️" },
      DELETE: { label: "Usunięcie", color: "#ef4444", icon: "🗑️" }
    };
    return config[action] || { label: action, color: "#666", icon: "📝" };
  };

  const formatTableName = (tableName) => {
    const names = {
      leads: "Leady",
      bookings: "Rezerwacje",
      users: "Użytkownicy"
    };
    return names[tableName] || tableName;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("pl-PL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const getChangedFields = (log) => {
    if (log.action !== "UPDATE" || !log.changed_fields || log.changed_fields.length === 0) {
      return null;
    }
    return log.changed_fields;
  };

  const openDetails = (log) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  const renderJsonDiff = (oldData, newData) => {
    if (!oldData && !newData) return null;

    return (
      <div style={{ marginTop: "10px" }}>
        {oldData && (
          <div style={{ marginBottom: "10px" }}>
            <div style={{ fontWeight: 600, marginBottom: "5px", color: "#ef4444" }}>
              Przed zmianą:
            </div>
            <pre
              style={{
                background: themeData.surface,
                padding: "10px",
                borderRadius: "6px",
                fontSize: "12px",
                overflow: "auto",
                maxHeight: "200px"
              }}
            >
              {JSON.stringify(oldData, null, 2)}
            </pre>
          </div>
        )}
        {newData && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: "5px", color: "#22c55e" }}>
              Po zmianie:
            </div>
            <pre
              style={{
                background: themeData.surface,
                padding: "10px",
                borderRadius: "6px",
                fontSize: "12px",
                overflow: "auto",
                maxHeight: "200px"
              }}
            >
              {JSON.stringify(newData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
        style={{
          padding: "clamp(12px, 2vw, 20px)",
          background: themeData.background,
          minHeight: "100vh",
          color: themeData.text,
          overflowY: "auto"
        }}
    >
      <h1 style={{ marginBottom: "clamp(12px, 2vw, 20px)", fontSize: "clamp(20px, 5vw, 28px)", fontWeight: 700 }}>
        📋 Historia zmian
      </h1>

      {/* Filtry */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(clamp(150px, 20vw, 200px), 1fr))",
          gap: "clamp(8px, 1.5vw, 10px)",
          marginBottom: "clamp(12px, 2vw, 20px)",
          padding: "clamp(12px, 2vw, 15px)",
          background: themeData.surface,
          borderRadius: "8px",
          border: `1px solid ${themeData.border}`
        }}
      >
        <select
          value={filters.table_name}
          onChange={(e) => setFilters({ ...filters, table_name: e.target.value })}
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: `1px solid ${themeData.border}`,
            background: themeData.surfaceElevated,
            color: themeData.text,
            fontSize: "14px"
          }}
        >
          <option value="">Wszystkie tabele</option>
          <option value="leads">Leady</option>
          <option value="bookings">Rezerwacje</option>
          <option value="users">Użytkownicy</option>
        </select>

        <select
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: `1px solid ${themeData.border}`,
            background: themeData.surfaceElevated,
            color: themeData.text,
            fontSize: "14px"
          }}
        >
          <option value="">Wszystkie akcje</option>
          <option value="INSERT">Utworzenie</option>
          <option value="UPDATE">Modyfikacja</option>
          <option value="DELETE">Usunięcie</option>
        </select>

        <input
          type="text"
          placeholder="Filtruj po użytkowniku..."
          value={filters.user_login}
          onChange={(e) => setFilters({ ...filters, user_login: e.target.value })}
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: `1px solid ${themeData.border}`,
            background: themeData.surfaceElevated,
            color: themeData.text,
            fontSize: "14px"
          }}
        />

        <select
          value={filters.source}
          onChange={(e) => setFilters({ ...filters, source: e.target.value })}
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: `1px solid ${themeData.border}`,
            background: themeData.surfaceElevated,
            color: themeData.text,
            fontSize: "14px"
          }}
        >
          <option value="">Wszystkie źródła</option>
          <option value="ui">🖥️ UI</option>
          <option value="api">🔌 API</option>
          <option value="webhook">🔗 Webhook</option>
          <option value="database">📊 Baza danych</option>
        </select>

        <input
          type="date"
          placeholder="Od daty"
          value={filters.date_from}
          onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: `1px solid ${themeData.border}`,
            background: themeData.surfaceElevated,
            color: themeData.text,
            fontSize: "14px"
          }}
        />

        <input
          type="date"
          placeholder="Do daty"
          value={filters.date_to}
          onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: `1px solid ${themeData.border}`,
            background: themeData.surfaceElevated,
            color: themeData.text,
            fontSize: "14px"
          }}
        />

        <button
          onClick={loadAuditLogs}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: `2px solid ${themeData.accent}`,
            background: `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`,
            color: "white",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = `0 4px 16px ${themeData.glow}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          🔄 Odśwież
        </button>
      </div>

      {/* Błąd */}
      {error && (
        <div
          style={{
            padding: "15px",
            background: "#ef4444",
            color: "white",
            borderRadius: "8px",
            marginBottom: "20px"
          }}
        >
          {error}
        </div>
      )}

      {/* Lista zmian */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: themeData.textSecondary
          }}
        >
          Ładowanie historii...
        </div>
      ) : auditLogs.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: themeData.textSecondary
          }}
        >
          Brak zmian do wyświetlenia
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {auditLogs.map((log) => {
            const actionConfig = formatAction(log.action);
            const changedFields = getChangedFields(log);

            return (
              <div
                key={log.id}
                style={{
                  padding: "15px",
                  background: themeData.surface,
                  borderRadius: "8px",
                  border: `2px solid ${actionConfig.color}`,
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = themeData.surfaceElevated;
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = `0 4px 16px ${themeData.shadow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = themeData.surface;
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                onClick={() => openDetails(log)}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "clamp(10px, 2vw, 15px)",
                    alignItems: "center"
                  }}
                >
                  {/* Akcja */}
                  <div
                    style={{
                      padding: "8px 12px",
                      background: actionConfig.color,
                      color: "white",
                      borderRadius: "6px",
                      fontWeight: 600,
                      fontSize: "12px",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {actionConfig.icon} {actionConfig.label}
                  </div>

                  {/* Szczegóły */}
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: "5px", fontSize: "16px" }}>
                      {formatTableName(log.table_name)} #{log.record_id}
                    </div>
                    {changedFields && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: themeData.textSecondary,
                          marginBottom: "5px"
                        }}
                      >
                        Zmienione pola: <strong>{changedFields.join(", ")}</strong>
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: "12px",
                        color: themeData.textSecondary,
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                        alignItems: "center"
                      }}
                    >
                      {log.user_login ? (
                        <span>
                          👤 <strong>Kto zmienił: {log.user_login}</strong>
                          {log.user_email && ` (${log.user_email})`}
                        </span>
                      ) : (
                        <span style={{ color: themeData.textSecondary }}>
                          👤 <strong>Kto zmienił:</strong> System
                        </span>
                      )}
                      {log.metadata?.source && (
                        <span>
                          {log.metadata.source === 'ui' ? '🖥️' : log.metadata.source === 'api' ? '🔌' : log.metadata.source === 'webhook' ? '🔗' : '📊'} 
                          <strong> Źródło: </strong>
                          {log.metadata.source === 'ui' ? 'UI' : log.metadata.source === 'api' ? 'API' : log.metadata.source === 'webhook' ? 'Webhook' : 'Baza danych'}
                        </span>
                      )}
                      {log.session_id && (
                        <span style={{ fontSize: "10px", opacity: 0.7 }}>
                          🔑 {log.session_id.substring(0, 8)}...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Data */}
                  <div
                    style={{
                      fontSize: "12px",
                      color: themeData.textSecondary,
                      textAlign: "right"
                    }}
                  >
                    {formatDate(log.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal ze szczegółami */}
      {showDetailsModal && selectedLog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
          }}
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            style={{
              background: themeData.surface,
              borderRadius: "12px",
              padding: "clamp(16px, 3vw, 25px)",
              maxWidth: "clamp(90vw, 95vw, 800px)",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              border: `2px solid ${themeData.border}`,
              boxShadow: `0 8px 32px ${themeData.shadow}`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px"
              }}
            >
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>
                Szczegóły zmiany
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: `2px solid ${themeData.border}`,
                  background: themeData.surfaceElevated,
                  color: themeData.text,
                  cursor: "pointer",
                  fontSize: "18px"
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <strong>Tabela:</strong> {formatTableName(selectedLog.table_name)}
              </div>
              <div>
                <strong>ID rekordu:</strong> {selectedLog.record_id}
              </div>
              <div>
                <strong>Akcja:</strong>{" "}
                <span style={{ color: formatAction(selectedLog.action).color }}>
                  {formatAction(selectedLog.action).label}
                </span>
              </div>
              <div>
                <strong>Data:</strong> {formatDate(selectedLog.created_at)}
              </div>
              {selectedLog.user_login ? (
                <div>
                  <strong>Kto zmienił:</strong> <strong>{selectedLog.user_login}</strong>
                  {selectedLog.user_email && ` (${selectedLog.user_email})`}
                </div>
              ) : (
                <div>
                  <strong>Kto zmienił:</strong> <span style={{ color: themeData.textSecondary }}>System</span>
                </div>
              )}
              {selectedLog.metadata?.source && (
                <div>
                  <strong>Źródło:</strong>{" "}
                  {selectedLog.metadata.source === 'ui' ? '🖥️ UI' : 
                   selectedLog.metadata.source === 'api' ? '🔌 API' : 
                   selectedLog.metadata.source === 'webhook' ? '🔗 Webhook' : 
                   '📊 Baza danych'}
                </div>
              )}
              {selectedLog.changed_fields && selectedLog.changed_fields.length > 0 && (
                <div>
                  <strong>Zmienione pola:</strong> {selectedLog.changed_fields.join(", ")}
                </div>
              )}

              {/* JSON Diff */}
              {renderJsonDiff(selectedLog.old_data, selectedLog.new_data)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
