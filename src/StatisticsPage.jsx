import { useMemo } from "react";
import { useTheme } from "./ThemeContext.jsx";

function StatisticsPage({ leads, bookings }) {
  const { themeData } = useTheme();
  
  // Oblicz statystyki
  const statistics = useMemo(() => {
    const stats = {
      "Nowy kontakt": 0,
      "Umówiony": 0,
      "Nie odebrał": 0,
      "Zadzwoń później": 0,
      "Sam się skontaktuje": 0,
    };

    leads.forEach((lead) => {
      if (stats[lead.status] !== undefined) {
        stats[lead.status]++;
      }
    });

    return stats;
  }, [leads]);

  // Dodatkowe statystyki
  const additionalStats = useMemo(() => {
    const totalLeads = leads.length;
    const totalBookings = bookings.length;
    const activeLeads = statistics["Nowy kontakt"] + statistics["Umówiony"];
    const conversionRate = totalLeads > 0 ? Math.round((statistics["Umówiony"] / totalLeads) * 100) : 0;
    const responseRate = totalLeads > 0 ? Math.round(((totalLeads - statistics["Nie odebrał"]) / totalLeads) * 100) : 0;
    
    // Statystyki dla rezerwacji
    const today = new Date();
    const thisWeekBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      weekStart.setHours(0, 0, 0, 0);
      return bookingDate >= weekStart;
    }).length;

    const thisMonthBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate.getMonth() === today.getMonth() && bookingDate.getFullYear() === today.getFullYear();
    }).length;

    return {
      totalLeads,
      totalBookings,
      activeLeads,
      conversionRate,
      responseRate,
      thisWeekBookings,
      thisMonthBookings,
      avgBookingsPerWeek: thisWeekBookings > 0 ? thisWeekBookings : 0,
    };
  }, [leads, bookings, statistics]);

  const maxCount = Math.max(...Object.values(statistics), 1);

  // Kolory dla każdego statusu
  const statusColors = {
    "Nowy kontakt": "#3b82f6",
    "Umówiony": "#22c55e",
    "Nie odebrał": "#ef4444",
    "Zadzwoń później": "#f59e0b",
    "Sam się skontaktuje": "#6b7280",
  };

  // Funkcja do obliczania procentu
  const getPercentage = (count) => {
    if (additionalStats.totalLeads === 0) return 0;
    return Math.round((count / additionalStats.totalLeads) * 100);
  };

  return (
    <div
        style={{
          padding: "clamp(12px, 2vw, 16px)",
          background: themeData.background,
          minHeight: "100%",
          color: themeData.text,
          overflowY: "auto",
          maxHeight: "calc(100vh - 120px)",
        }}
    >
      <h1
        style={{
          fontSize: "clamp(20px, 5vw, 28px)",
          fontWeight: 700,
          marginBottom: "clamp(12px, 2vw, 16px)",
          color: themeData.text,
        }}
      >
        📊 Statystyki
      </h1>

      {/* Główne metryki - mniejsze karty w dwóch rzędach */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(clamp(120px, 15vw, 140px), 1fr))",
          gap: "clamp(8px, 2vw, 12px)",
          marginBottom: "clamp(12px, 2vw, 16px)",
        }}
      >
        {/* Wszystkie kontakty */}
        <div
          style={{
            background: `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`,
            padding: "16px",
            borderRadius: "12px",
            boxShadow: `0 4px 12px ${themeData.glow}`,
          }}
        >
          <div style={{ fontSize: "11px", opacity: 0.9, marginBottom: "6px", color: "white", fontWeight: 500 }}>
            Wszystkie kontakty
          </div>
          <div style={{ fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 700, color: "white" }}>{additionalStats.totalLeads}</div>
        </div>

        {/* Umówione wizyty */}
        <div
          style={{
            background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
            padding: "16px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
          }}
        >
          <div style={{ fontSize: "11px", opacity: 0.9, marginBottom: "6px", color: "white", fontWeight: 500 }}>
            Umówione wizyty
          </div>
          <div style={{ fontSize: "32px", fontWeight: 700, color: "white" }}>{additionalStats.totalBookings}</div>
        </div>

        {/* Aktywne kontakty */}
        <div
          style={{
            background: `linear-gradient(135deg, ${statusColors["Nowy kontakt"]} 0%, ${themeData.accentHover} 100%)`,
            padding: "16px",
            borderRadius: "12px",
            boxShadow: `0 4px 12px ${themeData.glow}`,
          }}
        >
          <div style={{ fontSize: "11px", opacity: 0.9, marginBottom: "6px", color: "white", fontWeight: 500 }}>
            Aktywne kontakty
          </div>
          <div style={{ fontSize: "32px", fontWeight: 700, color: "white" }}>{additionalStats.activeLeads}</div>
        </div>

        {/* Wskaźnik konwersji */}
        <div
          style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
            padding: "16px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
          }}
        >
          <div style={{ fontSize: "11px", opacity: 0.9, marginBottom: "6px", color: "white", fontWeight: 500 }}>
            Konwersja
          </div>
          <div style={{ fontSize: "32px", fontWeight: 700, color: "white" }}>{additionalStats.conversionRate}%</div>
        </div>

        {/* Wskaźnik odpowiedzi */}
        <div
          style={{
            background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
            padding: "16px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(6, 182, 212, 0.3)",
          }}
        >
          <div style={{ fontSize: "11px", opacity: 0.9, marginBottom: "6px", color: "white", fontWeight: 500 }}>
            Wskaźnik odpowiedzi
          </div>
          <div style={{ fontSize: "32px", fontWeight: 700, color: "white" }}>{additionalStats.responseRate}%</div>
        </div>

        {/* Wizyty w tym tygodniu */}
        <div
          style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            padding: "16px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
          }}
        >
          <div style={{ fontSize: "11px", opacity: 0.9, marginBottom: "6px", color: "white", fontWeight: 500 }}>
            Wizyty (tydzień)
          </div>
          <div style={{ fontSize: "32px", fontWeight: 700, color: "white" }}>{additionalStats.thisWeekBookings}</div>
        </div>

        {/* Wizyty w tym miesiącu */}
        <div
          style={{
            background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
            padding: "16px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(236, 72, 153, 0.3)",
          }}
        >
          <div style={{ fontSize: "11px", opacity: 0.9, marginBottom: "6px", color: "white", fontWeight: 500 }}>
            Wizyty (miesiąc)
          </div>
          <div style={{ fontSize: "32px", fontWeight: 700, color: "white" }}>{additionalStats.thisMonthBookings}</div>
        </div>
      </div>

      {/* Dodatkowe statystyki - przesunięte wyżej */}
      <div
        style={{
          background: themeData.surface,
          borderRadius: "12px",
          padding: "12px",
          border: `2px solid ${themeData.border}`,
          boxShadow: `0 4px 12px ${themeData.shadow}`,
          marginBottom: "16px",
        }}
      >
        <h2
          style={{
            fontSize: "16px",
            fontWeight: 600,
            marginBottom: "12px",
            color: themeData.text,
          }}
        >
          📊 Analiza wydajności
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "10px",
          }}
        >
          {/* Skuteczność kontaktów */}
          <div
            style={{
              background: themeData.surfaceElevated,
              padding: "10px",
              borderRadius: "8px",
              border: `1.5px solid ${themeData.accent}40`,
            }}
          >
            <div style={{ fontSize: "10px", color: themeData.textSecondary, marginBottom: "4px", fontWeight: 500 }}>
              Skuteczność kontaktów
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: themeData.accent }}>
              {additionalStats.conversionRate}%
            </div>
            <div style={{ fontSize: "9px", color: themeData.textSecondary, marginTop: "4px" }}>
              {statistics["Umówiony"]} z {additionalStats.totalLeads}
            </div>
          </div>

          {/* Aktywność tygodniowa */}
          <div
            style={{
              background: themeData.surfaceElevated,
              padding: "10px",
              borderRadius: "8px",
              border: `1.5px solid #f59e0b40`,
            }}
          >
            <div style={{ fontSize: "10px", color: themeData.textSecondary, marginBottom: "4px", fontWeight: 500 }}>
              Aktywność tygodniowa
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#f59e0b" }}>
              {additionalStats.thisWeekBookings}
            </div>
            <div style={{ fontSize: "9px", color: themeData.textSecondary, marginTop: "4px" }}>
              Wizyty w tym tygodniu
            </div>
          </div>

          {/* Aktywność miesięczna */}
          <div
            style={{
              background: themeData.surfaceElevated,
              padding: "10px",
              borderRadius: "8px",
              border: `1.5px solid #ec489940`,
            }}
          >
            <div style={{ fontSize: "10px", color: themeData.textSecondary, marginBottom: "4px", fontWeight: 500 }}>
              Aktywność miesięczna
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#ec4899" }}>
              {additionalStats.thisMonthBookings}
            </div>
            <div style={{ fontSize: "9px", color: themeData.textSecondary, marginTop: "4px" }}>
              Wizyty w tym miesiącu
            </div>
          </div>

          {/* Wskaźnik odpowiedzi */}
          <div
            style={{
              background: themeData.surfaceElevated,
              padding: "10px",
              borderRadius: "8px",
              border: `1.5px solid #06b6d440`,
            }}
          >
            <div style={{ fontSize: "10px", color: themeData.textSecondary, marginBottom: "4px", fontWeight: 500 }}>
              Wskaźnik odpowiedzi
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#06b6d4" }}>
              {additionalStats.responseRate}%
            </div>
            <div style={{ fontSize: "9px", color: themeData.textSecondary, marginTop: "4px" }}>
              Kontakty z odpowiedzią
            </div>
          </div>
        </div>
      </div>

      {/* Layout z dwoma kolumnami - Rozkład statusów i Szczegóły obok siebie */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "clamp(8px, 2vw, 12px)",
          marginBottom: "clamp(12px, 2vw, 16px)",
        }}
      >
        {/* Wykresy słupkowe dla każdego statusu - lewa kolumna */}
        <div
          style={{
            background: themeData.surface,
            borderRadius: "12px",
            padding: "12px",
            border: `2px solid ${themeData.border}`,
            boxShadow: `0 4px 12px ${themeData.shadow}`,
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 600,
              marginBottom: "12px",
              color: themeData.text,
            }}
          >
            📈 Rozkład statusów
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {Object.entries(statistics).map(([status, count]) => (
              <div key={status}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "6px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: statusColors[status],
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: "12px", fontWeight: 500, color: themeData.text }}>
                      {status}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: themeData.text }}>
                      {count}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: themeData.textSecondary,
                        minWidth: "35px",
                        textAlign: "right",
                      }}
                    >
                      {getPercentage(count)}%
                    </span>
                  </div>
                </div>
                {/* Pasek postępu */}
                <div
                  style={{
                    width: "100%",
                    height: "6px",
                    background: themeData.surfaceElevated,
                    borderRadius: "3px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${(count / maxCount) * 100}%`,
                      height: "100%",
                      background: `linear-gradient(90deg, ${statusColors[status]} 0%, ${statusColors[status]}dd 100%)`,
                      borderRadius: "4px",
                      transition: "width 0.5s ease",
                      boxShadow: `0 0 8px ${statusColors[status]}40`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Szczegółowa tabela - prawa kolumna */}
        <div
          style={{
            background: themeData.surface,
            borderRadius: "12px",
            padding: "12px",
            border: `2px solid ${themeData.border}`,
            boxShadow: `0 4px 12px ${themeData.shadow}`,
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 600,
              marginBottom: "12px",
              color: themeData.text,
            }}
          >
            📋 Szczegóły
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "8px",
            }}
          >
            {Object.entries(statistics).map(([status, count]) => (
              <div
                key={status}
                style={{
                  background: themeData.surfaceElevated,
                  padding: "10px",
                  borderRadius: "8px",
                  border: `1.5px solid ${statusColors[status]}40`,
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    color: themeData.textSecondary,
                    marginBottom: "5px",
                    fontWeight: 500,
                  }}
                >
                  {status}
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: statusColors[status],
                    marginBottom: "3px",
                  }}
                >
                  {count}
                </div>
                <div style={{ fontSize: "10px", color: themeData.textSecondary }}>
                  {getPercentage(count)}% wszystkich
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatisticsPage;
