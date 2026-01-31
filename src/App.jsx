import { useState, useEffect, useRef, useCallback } from "react";
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext.jsx";
import LeadsPage from "./LeadsPage.jsx";
import CalendarPage from "./CalendarPage.jsx";
import StatisticsPage from "./StatisticsPage.jsx";
import LoginPage from "./LoginPage.jsx";
import ChiropractorSelection from "./ChiropractorSelection.jsx";
import WelcomeAnimation from "./WelcomeAnimation.jsx";
import GoodbyeAnimation from "./GoodbyeAnimation.jsx";
import { IconContacts, IconCalendar, IconStats, IconAdd, IconLogout, IconSwap, IconMoon, IconSun, IconNight } from "./Icons.jsx";

const APP_UI_VERSION = "ui2-clean";

export default function App() {
  const { themeData, toggleTheme, theme } = useTheme();
  const navigate = useNavigate();

  // Jednorazowe czyszczenie leadów i rezerwacji przy pierwszym uruchomieniu po aktualizacji
  useEffect(() => {
    if (localStorage.getItem("appUiVersion") !== APP_UI_VERSION) {
      localStorage.removeItem("leadsByChiropractor");
      localStorage.removeItem("bookingsByChiropractor");
      localStorage.setItem("appUiVersion", APP_UI_VERSION);
    }
  }, []);
  
  // Stan użytkownika
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  
  const [showWelcome, setShowWelcome] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [showChiropractorSelection, setShowChiropractorSelection] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showGoodbye, setShowGoodbye] = useState(false);
  const [isChiropractorSelectionClosing, setIsChiropractorSelectionClosing] = useState(false);

  // Stan globalny - leads i bookings przypisane do chiropraktyków
  const [leadsByChiropractor, setLeadsByChiropractor] = useState(() => {
    const stored = localStorage.getItem("leadsByChiropractor");
    return stored ? JSON.parse(stored) : {};
  });

  const [bookingsByChiropractor, setBookingsByChiropractor] = useState(() => {
    const stored = localStorage.getItem("bookingsByChiropractor");
    return stored ? JSON.parse(stored) : {};
  });

  // Pobierz leads i bookings dla aktualnego chiropraktyka
  const currentLeads = user?.chiropractor ? (leadsByChiropractor[user.chiropractor] || []) : [];
  const currentBookings = user?.chiropractor ? (bookingsByChiropractor[user.chiropractor] || []) : [];

  // Funkcje do aktualizacji leads i bookings – useCallback, żeby nie wywoływać effectów w pętli
  const setLeads = useCallback((newLeadsOrFunction) => {
    if (!user?.chiropractor) return;
    setLeadsByChiropractor(prev => {
      const currentLeads = prev[user.chiropractor] || [];
      const newLeads = typeof newLeadsOrFunction === 'function'
        ? newLeadsOrFunction(currentLeads)
        : newLeadsOrFunction;
      const updated = { ...prev, [user.chiropractor]: newLeads };
      localStorage.setItem("leadsByChiropractor", JSON.stringify(updated));
      return updated;
    });
  }, [user?.chiropractor]);

  const setBookings = useCallback((newBookingsOrFunction) => {
    if (!user?.chiropractor) return;
    setBookingsByChiropractor(prev => {
      const currentBookings = prev[user.chiropractor] || [];
      const newBookings = typeof newBookingsOrFunction === 'function'
        ? newBookingsOrFunction(currentBookings)
        : newBookingsOrFunction;
      const updated = { ...prev, [user.chiropractor]: newBookings };
      localStorage.setItem("bookingsByChiropractor", JSON.stringify(updated));
      return updated;
    });
  }, [user?.chiropractor]);

  // Zapis do localStorage przy zmianie chiropraktyka
  useEffect(() => {
    if (user?.chiropractor) {
      // Inicjalizuj puste listy dla nowego chiropraktyka, jeśli nie istnieją
      setTimeout(() => {
        setLeadsByChiropractor(prev => {
          if (!prev[user.chiropractor]) {
            const updated = {
              ...prev,
              [user.chiropractor]: [],
            };
            localStorage.setItem("leadsByChiropractor", JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
      
        setBookingsByChiropractor(prev => {
          if (!prev[user.chiropractor]) {
            const updated = {
              ...prev,
              [user.chiropractor]: [],
            };
            localStorage.setItem("bookingsByChiropractor", JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
      }, 0);
    }
  }, [user?.chiropractor]);

  // Heartbeat: last_seen_at (co 2 min) – do panelu „Kto pracuje”
  useEffect(() => {
    if (!user?.login) return;
    const API_URL = import.meta.env.VITE_API_URL ||
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "https://ihc-app.vercel.app"
        : window.location.origin);
    const tick = () => {
      fetch(`${API_URL}/api/user-heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: user.login, chiropractor: user.chiropractor || null }),
      }).catch(() => {});
    };
    tick();
    const id = setInterval(tick, 2 * 60 * 1000);
    return () => clearInterval(id);
  }, [user?.login, user?.chiropractor]);

  // Synchronizacja leadów z Supabase
  // Pobiera leady z bazy danych i synchronizuje z localStorage
  useEffect(() => {
    if (!user?.chiropractor) return;

    // Użyj URL Vercel w produkcji lub localhost w dev
    const API_URL = import.meta.env.VITE_API_URL || 
                    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                      ? 'https://ihc-app.vercel.app'  // W dev mode używaj Vercel API
                      : window.location.origin);

    // Pełne pobranie leadów z Supabase (bez since) – żeby widać leady dodane ręcznie przez innych i w panelu
    const syncLeadsFromSupabase = async () => {
      try {
        const apiUrl = `${API_URL}/api/leads?chiropractor=${encodeURIComponent(user.chiropractor)}`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
          console.log('⚠️ API nie jest dostępne (może być w trybie dev):', response.status, response.statusText);
          return;
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.leads)) {
          const list = data.leads.map(l => ({ ...l, chiropractor: l.chiropractor || user.chiropractor }));
          setLeads(prev => {
            const localOnly = prev.filter(p => !list.some(l => l.id === p.id));
            return [...localOnly, ...list];
          });
          if (list.length > 0) console.log('📥 Zsynchronizowano leady z Supabase:', list.length);
        }
      } catch (error) {
        console.error('❌ Błąd synchronizacji leadów z Supabase:', error.message);
      }
    };

    const saveLeadToSupabase = async (lead) => {
      try {
        const url = `${API_URL}/api/leads?chiropractor=${encodeURIComponent(user.chiropractor)}`;
        const body = { ...lead, chiropractor: lead.chiropractor || user.chiropractor, user_id: user.id, user_login: user.login, user_email: user.email, source: 'ui' };
        console.log('📤 POST /api/leads:', lead.name, '→', url);
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (res.ok) {
          const d = await res.json();
          return { ok: true, lead: d.lead || null };
        }
        const txt = await res.text();
        let msg = txt;
        try { const j = JSON.parse(txt); msg = j.message || j.error || txt; } catch (_) {}
        console.error('❌ saveLeadToSupabase:', res.status, msg);
        return { ok: false, error: msg };
      } catch (e) {
        console.error('❌ saveLeadToSupabase:', e);
        return { ok: false, error: e.message || 'Błąd sieci' };
      }
    };

    const updateLeadInSupabase = async (leadId, patch) => {
      try {
        const res = await fetch(`${API_URL}/api/leads?id=${encodeURIComponent(leadId)}&chiropractor=${encodeURIComponent(user.chiropractor)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...patch,
            chiropractor: user.chiropractor,
            user_id: user.id,
            user_login: user.login,
            user_email: user.email,
            source: 'ui'
          })
        });
        return res.ok;
      } catch (e) { console.error('❌ updateLeadInSupabase:', e); return false; }
    };

    const deleteLeadInSupabase = async (leadId) => {
      try {
        const res = await fetch(`${API_URL}/api/leads?id=${encodeURIComponent(leadId)}&chiropractor=${encodeURIComponent(user.chiropractor)}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chiropractor: user.chiropractor,
            user_id: user.id,
            user_login: user.login,
            user_email: user.email,
            source: 'ui'
          })
        });
        return res.ok;
      } catch (e) { console.error('❌ deleteLeadInSupabase:', e); return false; }
    };

    // Co 30 s; pierwszy sync po 5 s (spójność z rezerwacjami)
    const interval = setInterval(syncLeadsFromSupabase, 30000);
    const timeout = setTimeout(syncLeadsFromSupabase, 5000);
    
    // Przypisz do ref – onAddLead / onUpdateLead / onDeleteLead wywołują leadApiRef.current.save/update/delete
    leadApiRef.current = {
      save: saveLeadToSupabase,
      update: updateLeadInSupabase,
      delete: deleteLeadInSupabase,
    };

    window.syncLeadsFromSupabase = syncLeadsFromSupabase;
    window.saveLeadToSupabase = saveLeadToSupabase;

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [user?.chiropractor, setLeads]);

  // Synchronizacja rezerwacji z Supabase
  useEffect(() => {
    if (!user?.chiropractor) return;

    const API_URL = import.meta.env.VITE_API_URL || 
                    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                      ? 'https://ihc-app.vercel.app'
                      : window.location.origin);

    const syncBookingsFromSupabase = async () => {
      try {
        if (typeof window !== 'undefined' && window.skipBookingsSyncUntil != null && Date.now() < window.skipBookingsSyncUntil) return;
        const apiUrl = `${API_URL}/api/bookings?chiropractor=${encodeURIComponent(user.chiropractor)}`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
          console.log('⚠️ API nie jest dostępne (może być w trybie dev):', response.status, response.statusText);
          return;
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.bookings)) {
          const list = data.bookings.map(b => ({
            ...b,
            chiropractor: b.chiropractor || user.chiropractor,
            date: String(b.date || '').slice(0, 10),
          }));
          setBookings(prev => {
            const localOnly = prev.filter(p => !list.some(l => String(l.id) === String(p.id)));
            return [...localOnly, ...list];
          });
          if (list.length > 0) console.log('📥 Zsynchronizowano rezerwacje z Supabase:', list.length);
        }
      } catch (error) {
        console.error('❌ Błąd synchronizacji rezerwacji z Supabase:', error.message);
      }
    };

    window.syncBookingsFromSupabase = syncBookingsFromSupabase;

    // Co 30 s; pierwszy sync po 5 s (bufor po dodaniu wizyty – unikamy nadpisania przed zapisem w DB)
    const interval = setInterval(syncBookingsFromSupabase, 30000);
    const timeout = setTimeout(syncBookingsFromSupabase, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [user?.chiropractor, setBookings]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      
      // Synchronizuj dane użytkownika w liście zarejestrowanych użytkowników
      const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
      const userIndex = registeredUsers.findIndex((u) => u.id === user.id);
      
      if (userIndex !== -1) {
        // Aktualizuj istniejącego użytkownika
        const updatedUsers = [...registeredUsers];
        updatedUsers[userIndex] = user;
        localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers));
      } else if (user.id) {
        // Jeśli użytkownik nie istnieje w liście, ale ma ID, dodaj go
        const updatedUsers = [...registeredUsers, user];
        localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers));
      }
    }
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData);
    // Zawsze pokazuj ekran wyboru chiropraktyka po zalogowaniu
    setShowChiropractorSelection(true);
    setJustLoggedIn(false);
    setShowWelcome(false);
  };

  const handleChiropractorSelect = (chiropractor, image) => {
    const updatedUser = {
      ...user,
      chiropractor: chiropractor,
      chiropractorImage: image,
    };
    
    // Sprawdź czy to pierwszy wybór czy zmiana chiropraktyka
    const isChangingChiropractor = user?.chiropractor !== null && user?.chiropractor !== chiropractor;
    
    setUser(updatedUser);
    // useEffect automatycznie zsynchronizuje dane z localStorage (registeredUsers)
    
    // Animacja zamykania panelu wyboru
    setIsChiropractorSelectionClosing(true);
    
    setTimeout(() => {
      setShowChiropractorSelection(false);
      setIsChiropractorSelectionClosing(false);
      
      if (isChangingChiropractor) {
        // Jeśli zmieniamy chiropraktyka, pominąć welcome animation i płynnie wrócić
        setIsTransitioning(false);
        setShowWelcome(false);
        setJustLoggedIn(false);
      } else {
        // Jeśli to pierwszy wybór, pokaż welcome animation
        setIsTransitioning(false);
        setShowWelcome(true);
        setJustLoggedIn(true);
      }
      
      // Automatyczne przekierowanie na stronę kontakty
      navigate("/");
    }, 400);
  };

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
    setIsTransitioning(true);
    // Płynne przejście do aplikacji
    setTimeout(() => {
      setIsTransitioning(false);
      setJustLoggedIn(false);
      // Automatyczne przekierowanie na stronę kontakty
      navigate("/");
    }, 500);
  };

  const openAddLeadModalRef = useRef(null);
  const leadApiRef = useRef({});

  const handleLogout = () => {
    if (window.confirm("Czy na pewno chcesz się wylogować?")) {
      setShowGoodbye(true);
    }
  };

  const handleGoodbyeComplete = () => {
    localStorage.removeItem("user");
    setUser(null);
    setShowChiropractorSelection(false);
    setShowWelcome(false);
    setJustLoggedIn(false);
    setIsTransitioning(false);
    setShowGoodbye(false);
  };

  // Aktywna ścieżka dla podświetlenia linku
  const location = useLocation();
  const isLeadsActive = location.pathname === "/";
  const isCalendarActive = location.pathname === "/calendar";
  const isStatisticsActive = location.pathname === "/statistics";

  // Jeśli użytkownik nie jest zalogowany, pokaż stronę logowania
  if (!user || !user.isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Jeśli użytkownik jest zalogowany, zawsze pokaż ekran wyboru chiropraktyka
  if (showChiropractorSelection) {
    return (
      <div
        key="chiropractor-selection"
        style={{
          opacity: isChiropractorSelectionClosing ? 0 : 1,
          transform: isChiropractorSelectionClosing ? "scale(0.95) translateY(20px)" : "scale(1) translateY(0)",
          transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <ChiropractorSelection
          key={`chiropractor-${showChiropractorSelection}`}
          onSelect={handleChiropractorSelect}
          currentChiropractor={user?.chiropractor}
          currentImage={user?.chiropractorImage}
        />
      </div>
    );
  }

  return (
    <>
      {showGoodbye && (
        <GoodbyeAnimation
          onComplete={handleGoodbyeComplete}
        />
      )}
      {showWelcome && justLoggedIn && !showGoodbye && user?.chiropractor && (
        <WelcomeAnimation
          chiropractor={user.chiropractor}
          onComplete={handleWelcomeComplete}
        />
      )}
      {!showGoodbye && !showWelcome && user?.chiropractor && (
      <div
        style={{
          background: themeData.background,
          minHeight: "100vh",
          color: themeData.text,
          display: "flex",
          flexDirection: "column",
          width: "100%",
          margin: 0,
          padding: 0,
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? "translateY(20px)" : "translateY(0)",
          transition: "all 0.5s ease-out",
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Animated background orbs */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
          <div style={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "40%",
            height: "40%",
            background: `radial-gradient(circle, ${themeData.glow} 0%, transparent 70%)`,
            filter: "blur(80px)",
            animation: "float1 20s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute",
            bottom: "-20%",
            right: "-10%",
            width: "50%",
            height: "50%",
            background: `radial-gradient(circle, ${theme === 'night' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(118, 75, 162, 0.2)'} 0%, transparent 70%)`,
            filter: "blur(80px)",
            animation: "float2 25s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute",
            top: "40%",
            right: "30%",
            width: "30%",
            height: "30%",
            background: `radial-gradient(circle, ${themeData.glow} 0%, transparent 70%)`,
            filter: "blur(60px)",
            opacity: 0.3,
            animation: "float3 15s ease-in-out infinite",
          }} />
          {/* Grid pattern */}
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(${themeData.border} 1px, transparent 1px),
              linear-gradient(90deg, ${themeData.border} 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            opacity: 0.3,
          }} />
        </div>
        {/* Górny pasek nawigacji */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "clamp(4px, 1vw, 6px) clamp(12px, 3vw, 20px)",
            borderBottom: `2px solid ${themeData.border}`,
            background: themeData.navBackground,
            flexShrink: 0,
            boxShadow: `0 4px 20px ${themeData.shadow}`,
            position: "relative",
            overflow: "hidden",
            flexWrap: "wrap",
            gap: "8px",
            minHeight: "56px",
            height: "56px",
            maxHeight: "56px",
            boxSizing: "border-box",
            zIndex: 10,
          }}
        >
          {/* Efekt świetlny na górze */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: `linear-gradient(90deg, transparent 0%, ${themeData.accent} 50%, transparent 100%)`,
            opacity: 0.7,
            filter: `blur(2px) drop-shadow(0 0 8px ${themeData.accent})`,
            pointerEvents: "none",
            zIndex: 0,
          }} />
          
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px",
            position: "relative",
            zIndex: 1,
            flex: "1 1 0",
            minWidth: 0,
          }}>
            <div
              className="desktop-only"
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: themeData.textSecondary,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                padding: "2px 8px",
                borderRight: `1px solid ${themeData.border}`,
                marginRight: "4px",
              }}
            >
              Super Chiro
            </div>
            <div style={{ 
              fontSize: "clamp(12px, 3vw, 18px)", 
              fontWeight: 700, 
              letterSpacing: "-0.5px",
              color: themeData.text,
              textShadow: theme === 'light' ? 'none' : `0 0 20px ${themeData.glow}`,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}>
              <span className="desktop-only">Pracujesz dla</span>
              <span>{user.chiropractor}</span>
            </div>
            {user.chiropractorImage && (
              <div style={{
                position: "relative",
                padding: "2px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`,
                boxShadow: `0 4px 16px ${themeData.glow}`,
              }}>
                <img
                  src={user.chiropractorImage}
                  alt={user.chiropractor}
                  style={{
                    width: "clamp(28px, 6vw, 32px)",
                    height: "clamp(28px, 6vw, 32px)",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: `2px solid ${themeData.surface}`,
                    display: "block",
                  }}
                />
              </div>
            )}
            <button
              onClick={() => {
                setIsTransitioning(true);
                setTimeout(() => {
                  setIsTransitioning(false);
                  setIsChiropractorSelectionClosing(false);
                  setShowChiropractorSelection(true);
                }, 300);
              }}
              style={{
                padding: "clamp(3px, 1vw, 4px) clamp(8px, 2vw, 10px)",
                borderRadius: "6px",
                border: `2px solid ${themeData.accent}`,
                background: "transparent",
                color: themeData.text,
                cursor: "pointer",
                fontSize: "clamp(11px, 2.5vw, 13px)",
                fontWeight: 600,
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                opacity: 0.8,
                flexShrink: 0,
                height: "32px",
                lineHeight: "1",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = themeData.accent;
                e.currentTarget.style.color = "white";
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 4px 16px ${themeData.glow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = themeData.text;
                e.currentTarget.style.opacity = "0.8";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
              title="Zmień chiropraktyka"
            >
              <IconSwap w={14} h={14} />
              <span className="mobile-hidden">Zmień</span>
            </button>
          </div>

          <div style={{ 
            display: "flex", 
            gap: "clamp(4px, 1vw, 6px)", 
            alignItems: "center",
            position: "relative",
            zIndex: 1,
            flexWrap: "nowrap",
            justifyContent: "flex-end",
          }}>
            {isLeadsActive && (
              <button
                onClick={() => {
                  if (openAddLeadModalRef.current) {
                    openAddLeadModalRef.current();
                  }
                }}
                style={{
                  padding: "clamp(4px, 1vw, 6px) clamp(8px, 1.5vw, 12px)",
                  borderRadius: 6,
                  border: `2px solid ${themeData.accent}`,
                  background: `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`,
                  color: "white",
                  cursor: "pointer",
                  fontSize: "clamp(11px, 2.5vw, 13px)",
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                  boxShadow: `0 4px 16px ${themeData.glow}`,
                  whiteSpace: "nowrap",
                  height: "32px",
                  maxHeight: "32px",
                  minHeight: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  lineHeight: "1",
                  boxSizing: "border-box",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
                  e.currentTarget.style.boxShadow = `0 6px 20px ${themeData.glow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = `0 4px 16px ${themeData.glow}`;
                }}
              >
                <IconAdd w={14} h={14} color="white" />
                <span className="mobile-hidden">Dodaj nowy lead</span>
              </button>
            )}
            
            <button
              onClick={() => navigate("/")}
              style={{
                padding: "clamp(4px, 1vw, 6px) clamp(8px, 1.5vw, 12px)",
                borderRadius: 6,
                border: isLeadsActive ? `2px solid ${themeData.accent}` : `2px solid ${themeData.border}`,
                background: isLeadsActive 
                  ? `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`
                  : themeData.surfaceElevated,
                color: isLeadsActive ? "white" : themeData.text,
                fontWeight: isLeadsActive ? 700 : 500,
                transition: "all 0.3s ease",
                boxShadow: isLeadsActive ? `0 4px 16px ${themeData.glow}` : "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "clamp(11px, 2.5vw, 13px)",
                whiteSpace: "nowrap",
                height: "32px",
                maxHeight: "32px",
                minHeight: "32px",
                lineHeight: "1",
                textDecoration: "none",
                boxSizing: "border-box",
                gap: "6px",
              }}
              onMouseEnter={(e) => {
                if (!isLeadsActive) {
                  e.currentTarget.style.background = themeData.surfaceHover;
                  e.currentTarget.style.color = themeData.text;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLeadsActive) {
                  e.currentTarget.style.background = themeData.surfaceElevated;
                  e.currentTarget.style.color = themeData.text;
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <IconContacts w={14} h={14} color={isLeadsActive ? "white" : themeData.text} />
              <span className="mobile-hidden">Kontakty</span>
            </button>

            <Link
              to="/calendar"
              style={{
                padding: "clamp(4px, 1vw, 6px) clamp(8px, 1.5vw, 12px)",
                borderRadius: 6,
                textDecoration: "none",
                gap: "6px",
                background: isCalendarActive 
                  ? `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`
                  : themeData.surfaceElevated,
                color: isCalendarActive ? "white" : themeData.text,
                fontWeight: isCalendarActive ? 700 : 500,
                transition: "all 0.3s ease",
                fontSize: "clamp(11px, 2.5vw, 13px)",
                border: isCalendarActive ? `2px solid ${themeData.accent}` : `2px solid ${themeData.border}`,
                boxShadow: isCalendarActive ? `0 4px 16px ${themeData.glow}` : "none",
                whiteSpace: "nowrap",
                height: "32px",
                maxHeight: "32px",
                minHeight: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: "1",
                boxSizing: "border-box",
              }}
              onMouseEnter={(e) => {
                if (!isCalendarActive) {
                  e.currentTarget.style.background = themeData.surfaceHover;
                  e.currentTarget.style.color = themeData.text;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isCalendarActive) {
                  e.currentTarget.style.background = themeData.surfaceElevated;
                  e.currentTarget.style.color = themeData.text;
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <IconCalendar w={14} h={14} color={isCalendarActive ? "white" : themeData.text} />
              <span className="mobile-hidden">Kalendarz</span>
            </Link>

            <Link
              to="/statistics"
              style={{
                padding: "clamp(4px, 1vw, 6px) clamp(8px, 1.5vw, 12px)",
                borderRadius: 6,
                textDecoration: "none",
                gap: "6px",
                background: isStatisticsActive 
                  ? `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`
                  : themeData.surfaceElevated,
                color: isStatisticsActive ? "white" : themeData.text,
                fontWeight: isStatisticsActive ? 700 : 500,
                transition: "all 0.3s ease",
                border: isStatisticsActive ? `2px solid ${themeData.accent}` : `2px solid ${themeData.border}`,
                boxShadow: isStatisticsActive ? `0 4px 16px ${themeData.glow}` : "none",
                fontSize: "clamp(11px, 2.5vw, 13px)",
                whiteSpace: "nowrap",
                height: "32px",
                maxHeight: "32px",
                minHeight: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: "1",
                boxSizing: "border-box",
              }}
              onMouseEnter={(e) => {
                if (!isStatisticsActive) {
                  e.currentTarget.style.background = themeData.surfaceHover;
                  e.currentTarget.style.color = themeData.text;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isStatisticsActive) {
                  e.currentTarget.style.background = themeData.surfaceElevated;
                  e.currentTarget.style.color = themeData.text;
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <IconStats w={14} h={14} color={isStatisticsActive ? "white" : themeData.text} />
              <span className="mobile-hidden">Statystyki</span>
            </Link>

            {/* Przycisk zmiany motywu */}
            <button
              onClick={toggleTheme}
              style={{
                padding: "0",
                borderRadius: 6,
                border: `2px solid ${themeData.border}`,
                background: themeData.surfaceElevated,
                color: themeData.text,
                cursor: "pointer",
                fontSize: "clamp(14px, 3vw, 16px)",
                fontWeight: 500,
                transition: "all 0.3s ease",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                boxShadow: `0 2px 8px ${themeData.shadow}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = themeData.surface;
                e.currentTarget.style.borderColor = themeData.accent;
                e.currentTarget.style.transform = "scale(1.1) rotate(15deg)";
                e.currentTarget.style.boxShadow = `0 4px 16px ${themeData.glow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = themeData.surfaceElevated;
                e.currentTarget.style.borderColor = themeData.border;
                e.currentTarget.style.transform = "scale(1) rotate(0deg)";
                e.currentTarget.style.boxShadow = `0 2px 8px ${themeData.shadow}`;
              }}
              title={`Tryb: ${themeData.name} (Kliknij aby zmienić)`}
            >
              {theme === "dark" && <IconMoon w={16} h={16} />}
              {theme === "light" && <IconSun w={16} h={16} />}
              {theme === "night" && <IconNight w={16} h={16} />}
            </button>

            <button
              onClick={handleLogout}
              style={{
                padding: "clamp(4px, 1vw, 6px) clamp(10px, 2vw, 14px)",
                borderRadius: 6,
                border: "2px solid #991b1b",
                background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                color: "white",
                cursor: "pointer",
                fontSize: "clamp(11px, 2.5vw, 13px)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)",
                whiteSpace: "nowrap",
                height: "32px",
                lineHeight: "1",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(220, 38, 38, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(220, 38, 38, 0.3)";
              }}
            >
              <IconLogout w={14} h={14} color="white" />
              <span className="mobile-hidden">Wyloguj</span>
            </button>
          </div>
        </div>

        {/* Widoki stron */}
        <div style={{ flex: 1, overflow: "auto", overflowY: "auto", display: "flex", flexDirection: "column", width: "100%", minHeight: 0, height: "100%", position: "relative", zIndex: 1 }}>
          <Routes>
            <Route
              path="/"
              element={
                <LeadsPage
                  leads={currentLeads}
                  setLeads={setLeads}
                  bookings={currentBookings}
                  setBookings={setBookings}
                  onOpenAddLeadModal={(fn) => (openAddLeadModalRef.current = fn)}
                  onAddLead={async (lead) => {
                    const fn = leadApiRef.current?.save;
                    if (!fn) {
                      console.error('❌ leadApiRef.save nie jest ustawione – odśwież stronę (F5)');
                      alert('Nie udało się dodać leada. Odśwież stronę (F5) i spróbuj ponownie.');
                      return;
                    }
                    const s = await fn(lead);
                    if (s?.ok && s?.lead) {
                      setLeads(prev => [s.lead, ...prev]);
                      setTimeout(() => { window.syncLeadsFromSupabase?.(); }, 1500);
                    } else if (s?.error) {
                      alert('Nie udało się zapisać leada: ' + s.error);
                    } else {
                      alert('Nie udało się zapisać leada. Sprawdź konsolę (F12).');
                    }
                  }}
                  onUpdateLead={async (id, patch) => {
                    const fn = leadApiRef.current.update;
                    if (fn) { await fn(id, patch); setLeads(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l)); }
                  }}
                  onDeleteLead={async (id) => {
                    const fn = leadApiRef.current.delete;
                    if (fn) { await fn(id); setLeads(prev => prev.filter(l => l.id !== id)); }
                  }}
                />
              }
            />
            <Route
              path="/calendar"
              element={
                <CalendarPage
                  user={user}
                  bookings={currentBookings}
                  setBookings={setBookings}
                  leads={currentLeads}
                  setLeads={setLeads}
                />
              }
            />
            <Route
              path="/statistics"
              element={
                <StatisticsPage
                  leads={currentLeads}
                  bookings={currentBookings}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Animacje CSS */}
        <style>{`
          @keyframes float1 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(30px, 30px) rotate(5deg); }
          }
          @keyframes float2 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(-40px, -20px) rotate(-5deg); }
          }
          @keyframes float3 {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(20px, -30px); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
      )}
    </>
  );
}