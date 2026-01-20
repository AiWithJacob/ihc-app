import { useMemo, useState } from "react";
import { useTheme } from "./ThemeContext.jsx";

function StatisticsPage({ leads, bookings }) {
  const { themeData } = useTheme();
  const [viewMode, setViewMode] = useState("statistics"); // "statistics" lub "monthly-report"
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
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

  // Oblicz dane dla każdego miesiąca (dla raportu miesięcznego)
  const monthlyData = useMemo(() => {
    const months = [];
    
    for (let month = 0; month < 12; month++) {
      const monthBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        return bookingDate.getMonth() === month && 
               bookingDate.getFullYear() === selectedYear;
      });

      const UM = monthBookings.length; // Wszystkie umówione wizyty
      const P = monthBookings.filter(b => b.status === 'completed').length; // Przyszli
      const ODP = UM > 0 ? ((UM - P) / UM * 100).toFixed(2) : 0; // Procent nieobecności

      months.push({
        month: month + 1,
        monthName: new Date(selectedYear, month, 1).toLocaleString('pl-PL', { month: 'long' }),
        UM,
        P,
        ODP: parseFloat(ODP)
      });
    }

    return months;
  }, [bookings, selectedYear]);

  // Oblicz maksymalne wartości dla skali wykresu
  const maxValue = useMemo(() => {
    const maxUM = Math.max(...monthlyData.map(m => m.UM), 0);
    const maxP = Math.max(...monthlyData.map(m => m.P), 0);
    return Math.max(maxUM, maxP, 100);
  }, [monthlyData]);

  const maxCount = Math.max(...Object.values(statistics), 1);

  // Kolory dla każdego statusu
  const statusColors = {
    "Nowy kontakt": "#3b82f6",
    "Umówiony": "#22c55e",
    "Nie odebrał": "#ef4444",
    "Zadzwoń później": "#f59e0b",
    "Sam się skontaktuje": "#6b7280",
  };

  // Kolory dla raportu miesięcznego
  const UMColor = "#22c55e";
  const PColor = "#3b82f6";
  const ODPColor = "#ec4899";

  // Funkcja do obliczania procentu
  const getPercentage = (count) => {
    if (additionalStats.totalLeads === 0) return 0;
    return Math.round((count / additionalStats.totalLeads) * 100);
  };

  // Oblicz wysokość słupka na wykresie
  const getBarHeight = (value) => {
    if (maxValue === 0) return 0;
    return (value / maxValue) * 200; // Maksymalna wysokość 200px
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
      {/* Nagłówek z przełącznikiem */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "clamp(12px, 2vw, 16px)",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(20px, 5vw, 28px)",
            fontWeight: 700,
            margin: 0,
            color: themeData.text,
          }}
        >
          📊 Statystyki
        </h1>

        {/* Przełącznik widoku */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            background: themeData.surface,
            padding: "4px",
            borderRadius: "8px",
            border: `2px solid ${themeData.border}`,
          }}
        >
          <button
            onClick={() => setViewMode("statistics")}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              background: viewMode === "statistics"
                ? `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`
                : "transparent",
              color: viewMode === "statistics" ? "white" : themeData.text,
              fontWeight: viewMode === "statistics" ? 700 : 500,
              cursor: "pointer",
              fontSize: "14px",
              transition: "all 0.3s ease",
            }}
          >
            Statystyki
          </button>
          <button
            onClick={() => setViewMode("monthly-report")}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              background: viewMode === "monthly-report"
                ? `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`
                : "transparent",
              color: viewMode === "monthly-report" ? "white" : themeData.text,
              fontWeight: viewMode === "monthly-report" ? 700 : 500,
              cursor: "pointer",
              fontSize: "14px",
              transition: "all 0.3s ease",
            }}
          >
            Raport miesięczny
          </button>
        </div>
      </div>

      {/* Widok statystyk */}
      {viewMode === "statistics" && (
        <>
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
        </>
      )}

      {/* Widok raportu miesięcznego */}
      {viewMode === "monthly-report" && (
        <>
          {/* Wybór roku */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              marginBottom: "20px",
              gap: "12px",
            }}
          >
            <label
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: themeData.textSecondary,
              }}
            >
              Rok:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: `2px solid ${themeData.border}`,
                background: themeData.surfaceElevated,
                color: themeData.text,
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Legenda */}
          <div
            style={{
              display: "flex",
              gap: "20px",
              marginBottom: "20px",
              padding: "12px",
              background: themeData.surface,
              borderRadius: "8px",
              border: `1px solid ${themeData.border}`,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "4px",
                  background: UMColor,
                }}
              />
              <span style={{ fontSize: "14px", fontWeight: 500 }}>
                ✅ UM - Ilość osób, które się umówiły
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "4px",
                  background: PColor,
                }}
              />
              <span style={{ fontSize: "14px", fontWeight: 500 }}>
                🪙 P - Ilość osób, które przyszły
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "4px",
                  background: ODPColor,
                }}
              />
              <span style={{ fontSize: "14px", fontWeight: 500 }}>
                ⛔ ODP % - Procent osób, które nie przyszły
              </span>
            </div>
          </div>

          {/* Tabela i wykres obok siebie */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2fr",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            {/* Tabela */}
            <div
              style={{
                background: themeData.surface,
                borderRadius: "12px",
                padding: "16px",
                border: `2px solid ${themeData.border}`,
                boxShadow: `0 4px 12px ${themeData.shadow}`,
              }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  marginBottom: "16px",
                  color: themeData.text,
                  textAlign: "center",
                }}
              >
                {selectedYear}
              </h2>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        padding: "8px",
                        textAlign: "left",
                        borderBottom: `2px solid ${themeData.border}`,
                        color: themeData.textSecondary,
                        fontWeight: 600,
                      }}
                    >
                      MSC
                    </th>
                    <th
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        borderBottom: `2px solid ${themeData.border}`,
                        color: themeData.textSecondary,
                        fontWeight: 600,
                      }}
                    >
                      ✅ UM
                    </th>
                    <th
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        borderBottom: `2px solid ${themeData.border}`,
                        color: themeData.textSecondary,
                        fontWeight: 600,
                      }}
                    >
                      🪙 P
                    </th>
                    <th
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        borderBottom: `2px solid ${themeData.border}`,
                        color: themeData.textSecondary,
                        fontWeight: 600,
                      }}
                    >
                      ⛔ ODP %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((data) => (
                    <tr
                      key={data.month}
                      style={{
                        borderBottom: `1px solid ${themeData.border}40`,
                      }}
                    >
                      <td
                        style={{
                          padding: "10px 8px",
                          fontWeight: 600,
                          color: themeData.text,
                        }}
                      >
                        {data.month}
                      </td>
                      <td
                        style={{
                          padding: "10px 8px",
                          textAlign: "center",
                          color: UMColor,
                          fontWeight: 600,
                        }}
                      >
                        {data.UM}
                      </td>
                      <td
                        style={{
                          padding: "10px 8px",
                          textAlign: "center",
                          color: PColor,
                          fontWeight: 600,
                        }}
                      >
                        {data.P}
                      </td>
                      <td
                        style={{
                          padding: "10px 8px",
                          textAlign: "center",
                          color: ODPColor,
                          fontWeight: 600,
                        }}
                      >
                        {data.ODP.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Wykres */}
            <div
              style={{
                background: themeData.surface,
                borderRadius: "12px",
                padding: "16px",
                border: `2px solid ${themeData.border}`,
                boxShadow: `0 4px 12px ${themeData.shadow}`,
              }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  marginBottom: "16px",
                  color: themeData.text,
                  textAlign: "center",
                }}
              >
                WYKRES
              </h2>

              <div
                style={{
                  position: "relative",
                  height: "280px",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-around",
                  gap: "8px",
                  padding: "0 10px",
                }}
              >
                {/* Linie pomocnicze */}
                <svg
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                  }}
                >
                  {[0, 50, 100, 150, 200].map((value) => {
                    if (maxValue < value) return null;
                    const y = 280 - (value / maxValue) * 200;
                    return (
                      <line
                        key={value}
                        x1="0"
                        y1={y}
                        x2="100%"
                        y2={y}
                        stroke={themeData.border}
                        strokeWidth="1"
                        strokeDasharray="4,4"
                        opacity={0.3}
                      />
                    );
                  })}
                </svg>

                {/* Słupki i linie */}
                {monthlyData.map((data, index) => {
                  const barWidth = "24px";
                  const spacing = "8px";

                  return (
                    <div
                      key={data.month}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "4px",
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      {/* Wartości nad słupkami */}
                      <div
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          color: themeData.text,
                          textAlign: "center",
                          marginBottom: "4px",
                        }}
                      >
                        <div style={{ color: UMColor }}>{data.UM}</div>
                        <div style={{ color: PColor }}>{data.P}</div>
                      </div>

                      {/* Słupki */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-end",
                          gap: "2px",
                          height: "200px",
                        }}
                      >
                        {/* Słupek UM */}
                        <div
                          style={{
                            width: barWidth,
                            height: `${getBarHeight(data.UM)}px`,
                            background: UMColor,
                            borderRadius: "4px 4px 0 0",
                            position: "relative",
                            boxShadow: `0 2px 8px ${UMColor}40`,
                          }}
                          title={`UM: ${data.UM}`}
                        />
                        {/* Słupek P */}
                        <div
                          style={{
                            width: barWidth,
                            height: `${getBarHeight(data.P)}px`,
                            background: PColor,
                            borderRadius: "4px 4px 0 0",
                            position: "relative",
                            boxShadow: `0 2px 8px ${PColor}40`,
                          }}
                          title={`P: ${data.P}`}
                        />
                      </div>

                      {/* Linia łącząca UM */}
                      {index < monthlyData.length - 1 && (
                        <svg
                          style={{
                            position: "absolute",
                            top: `${280 - getBarHeight(data.UM) - 200}px`,
                            left: "50%",
                            width: `${parseInt(barWidth) * 2 + parseInt(spacing)}px`,
                            height: `${Math.abs(
                              getBarHeight(monthlyData[index + 1].UM) -
                                getBarHeight(data.UM)
                            )}px`,
                            pointerEvents: "none",
                            zIndex: 0,
                          }}
                        >
                          <line
                            x1="0"
                            y1={getBarHeight(data.UM)}
                            x2="100%"
                            y2={
                              getBarHeight(monthlyData[index + 1].UM) -
                              getBarHeight(data.UM)
                            }
                            stroke={UMColor}
                            strokeWidth="2"
                            opacity={0.7}
                          />
                        </svg>
                      )}

                      {/* Linia łącząca P */}
                      {index < monthlyData.length - 1 && (
                        <svg
                          style={{
                            position: "absolute",
                            top: `${280 - getBarHeight(data.P) - 200}px`,
                            left: "50%",
                            width: `${parseInt(barWidth) * 2 + parseInt(spacing)}px`,
                            height: `${Math.abs(
                              getBarHeight(monthlyData[index + 1].P) -
                                getBarHeight(data.P)
                            )}px`,
                            pointerEvents: "none",
                            zIndex: 0,
                          }}
                        >
                          <line
                            x1="0"
                            y1={getBarHeight(data.P)}
                            x2="100%"
                            y2={
                              getBarHeight(monthlyData[index + 1].P) -
                              getBarHeight(data.P)
                            }
                            stroke={PColor}
                            strokeWidth="2"
                            opacity={0.7}
                          />
                        </svg>
                      )}

                      {/* Etykieta miesiąca */}
                      <div
                        style={{
                          fontSize: "10px",
                          fontWeight: 500,
                          color: themeData.textSecondary,
                          marginTop: "4px",
                          textAlign: "center",
                        }}
                      >
                        MSC {data.month}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Oś Y */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "10px",
                  padding: "0 10px",
                  fontSize: "10px",
                  color: themeData.textSecondary,
                }}
              >
                <span>{maxValue}</span>
                <span>{Math.round(maxValue * 0.75)}</span>
                <span>{Math.round(maxValue * 0.5)}</span>
                <span>{Math.round(maxValue * 0.25)}</span>
                <span>0</span>
              </div>

              {/* Etykiety dla linii UM i P */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "20px",
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: `1px solid ${themeData.border}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div
                    style={{
                      width: "16px",
                      height: "3px",
                      background: UMColor,
                    }}
                  />
                  <span style={{ fontSize: "12px", fontWeight: 500 }}>UM</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div
                    style={{
                      width: "16px",
                      height: "3px",
                      background: PColor,
                    }}
                  />
                  <span style={{ fontSize: "12px", fontWeight: 500 }}>P</span>
                </div>
              </div>
            </div>
          </div>

          {/* Podsumowanie roczne */}
          <div
            style={{
              background: themeData.surface,
              borderRadius: "12px",
              padding: "16px",
              border: `2px solid ${themeData.border}`,
              boxShadow: `0 4px 12px ${themeData.shadow}`,
            }}
          >
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 600,
                marginBottom: "16px",
                color: themeData.text,
              }}
            >
              📈 Podsumowanie roku {selectedYear}
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              <div
                style={{
                  padding: "16px",
                  background: themeData.surfaceElevated,
                  borderRadius: "8px",
                  border: `2px solid ${UMColor}40`,
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: themeData.textSecondary,
                    marginBottom: "6px",
                  }}
                >
                  ✅ Łącznie umówionych
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: UMColor,
                  }}
                >
                  {monthlyData.reduce((sum, m) => sum + m.UM, 0)}
                </div>
              </div>

              <div
                style={{
                  padding: "16px",
                  background: themeData.surfaceElevated,
                  borderRadius: "8px",
                  border: `2px solid ${PColor}40`,
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: themeData.textSecondary,
                    marginBottom: "6px",
                  }}
                >
                  🪙 Łącznie przyszłych
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: PColor,
                  }}
                >
                  {monthlyData.reduce((sum, m) => sum + m.P, 0)}
                </div>
              </div>

              <div
                style={{
                  padding: "16px",
                  background: themeData.surfaceElevated,
                  borderRadius: "8px",
                  border: `2px solid ${ODPColor}40`,
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: themeData.textSecondary,
                    marginBottom: "6px",
                  }}
                >
                  ⛔ Średni ODP %
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: ODPColor,
                  }}
                >
                  {monthlyData.length > 0
                    ? (
                        monthlyData.reduce((sum, m) => sum + m.ODP, 0) /
                        monthlyData.filter((m) => m.UM > 0).length
                      ).toFixed(2)
                    : 0}
                  %
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default StatisticsPage;
