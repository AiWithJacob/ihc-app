import { useState, useEffect, useRef } from "react";
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext.jsx";
import LeadsPage from "./LeadsPage.jsx";
import CalendarPage from "./CalendarPage.jsx";
import StatisticsPage from "./StatisticsPage.jsx";
import AuditLogPage from "./AuditLogPage.jsx";
import LoginPage from "./LoginPage.jsx";
import ChiropractorSelection from "./ChiropractorSelection.jsx";
import WelcomeAnimation from "./WelcomeAnimation.jsx";
import GoodbyeAnimation from "./GoodbyeAnimation.jsx";

const INITIAL_LEADS = [
  {
    id: 1,
    name: "Jan Testowy",
    phone: "123456789",
    description: "Ból pleców",
    notes: "",
    status: "Nowy kontakt",
  },
  {
    id: 2,
    name: "Anna Nowak",
    phone: "987654321",
    description: "Ból szyi",
    notes: "",
    status: "Sam się skontaktuje",
  },
];

export default function App() {
  console.log("✅ App component rendering...");
  const { themeData, toggleTheme, theme } = useTheme();
  const navigate = useNavigate();
  
  // Stan użytkownika
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    const parsed = stored ? JSON.parse(stored) : null;
    console.log("User from localStorage:", parsed);
    return parsed;
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

  // Funkcje do aktualizacji leads i bookings dla aktualnego chiropraktyka
  // Obsługują zarówno bezpośrednią wartość, jak i funkcję (jak setState)
  const setLeads = (newLeadsOrFunction) => {
    if (!user?.chiropractor) return;
    
    setLeadsByChiropractor(prev => {
      const currentLeads = prev[user.chiropractor] || [];
      const newLeads = typeof newLeadsOrFunction === 'function' 
        ? newLeadsOrFunction(currentLeads)
        : newLeadsOrFunction;
      
      const updated = {
        ...prev,
        [user.chiropractor]: newLeads,
      };
      localStorage.setItem("leadsByChiropractor", JSON.stringify(updated));
      return updated;
    });
  };

  const setBookings = (newBookingsOrFunction) => {
    if (!user?.chiropractor) return;
    
    setBookingsByChiropractor(prev => {
      const currentBookings = prev[user.chiropractor] || [];
      const newBookings = typeof newBookingsOrFunction === 'function'
        ? newBookingsOrFunction(currentBookings)
        : newBookingsOrFunction;
      
      const updated = {
        ...prev,
        [user.chiropractor]: newBookings,
      };
      localStorage.setItem("bookingsByChiropractor", JSON.stringify(updated));
      return updated;
    });
  };

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

  // Synchronizacja leadów z Supabase
  // Pobiera leady z bazy danych i synchronizuje z localStorage
  useEffect(() => {
    if (!user?.chiropractor) return;

    // Użyj URL Vercel w produkcji lub localhost w dev
    const API_URL = import.meta.env.VITE_API_URL || 
                    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                      ? 'https://ihc-app.vercel.app'  // W dev mode używaj Vercel API
                      : window.location.origin);

    // Funkcja do pobierania leadów z Supabase
    const syncLeadsFromSupabase = async () => {
      try {
        // Pobierz czas ostatniego sprawdzenia
        const lastCheckTime = localStorage.getItem('lastLeadsCheck') || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Ostatnie 24h
        
        // Pobierz leady z Supabase przez API
        const apiUrl = `${API_URL}/api/leads?chiropractor=${encodeURIComponent(user.chiropractor)}&since=${encodeURIComponent(lastCheckTime)}`;
        console.log('🔍 Synchronizuję leady z Supabase:', {
          url: apiUrl,
          chiropractor: user.chiropractor,
          since: lastCheckTime
        });
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          // API może nie być dostępne w dev mode - to OK
          console.log('⚠️ API nie jest dostępne (może być w trybie dev):', response.status, response.statusText);
          return;
        }

        const data = await response.json();
        console.log('📥 Otrzymano dane z Supabase:', {
          success: data.success,
          count: data.count,
          leads: data.leads?.length || 0,
          chiropractor: user.chiropractor,
          source: data.source
        });
        
        if (data.success && data.leads && data.leads.length > 0) {
          // Dodaj nowe leady do aplikacji
          setLeads(prev => {
            const existingIds = prev.map(l => l.id);
            const newLeads = data.leads
              .filter(l => !existingIds.includes(l.id))
              .map(lead => ({
                ...lead,
                // Upewnij się, że lead ma przypisanego chiropraktyka
                chiropractor: lead.chiropractor || user.chiropractor
              }));
            
            if (newLeads.length > 0) {
              console.log(`✅ Dodano ${newLeads.length} nowych leadów z Supabase:`, newLeads.map(l => l.name));
              // Zaktualizuj czas ostatniego sprawdzenia
              const newCheckTime = new Date().toISOString();
              localStorage.setItem('lastLeadsCheck', newCheckTime);
              return [...newLeads, ...prev];
            } else {
              console.log('ℹ️ Brak nowych leadów (wszystkie już istnieją)');
            }
            return prev;
          });
        } else {
          console.log('ℹ️ Brak nowych leadów w Supabase dla chiropraktyka:', user.chiropractor);
        }
      } catch (error) {
        // Loguj błędy dla debugowania
        console.error('❌ Błąd synchronizacji leadów z Supabase:', error.message);
      }
    };

    // Funkcja do zapisywania leada w Supabase
    const saveLeadToSupabase = async (lead) => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 
                        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                          ? 'https://ihc-app.vercel.app'
                          : window.location.origin);
        
        // Dodaj kontekst użytkownika dla audit log
        const response = await fetch(`${API_URL}/api/leads?chiropractor=${encodeURIComponent(user.chiropractor)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...lead,
            chiropractor: lead.chiropractor || user.chiropractor,
            // Kontekst użytkownika dla audit log
            user_id: user.id,
            user_login: user.login,
            user_email: user.email,
            source: 'ui'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Lead zapisany w Supabase:', data.lead?.name);
          return data.lead;
        } else {
          console.error('❌ Błąd zapisywania leada w Supabase:', response.statusText);
        }
      } catch (error) {
        console.error('❌ Błąd zapisywania leada w Supabase:', error.message);
      }
      return null;
    };

    // Sprawdzaj co 30 sekund nowe leady z Supabase
    const interval = setInterval(syncLeadsFromSupabase, 30000);
    
    // Sprawdź od razu przy załadowaniu (z małym opóźnieniem)
    const timeout = setTimeout(syncLeadsFromSupabase, 2000);
    
    // Dodaj funkcje do ręcznego użycia (dla debugowania)
    window.syncLeadsFromSupabase = syncLeadsFromSupabase;
    window.saveLeadToSupabase = saveLeadToSupabase;
    console.log('💡 Możesz ręcznie synchronizować leady wpisując w konsoli: syncLeadsFromSupabase()');
    
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

    // Funkcja do pobierania rezerwacji z Supabase
    const syncBookingsFromSupabase = async () => {
      try {
        const lastCheckTime = localStorage.getItem('lastBookingsCheck') || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const apiUrl = `${API_URL}/api/bookings?chiropractor=${encodeURIComponent(user.chiropractor)}&since=${encodeURIComponent(lastCheckTime)}`;
        console.log('🔍 Synchronizuję rezerwacje z Supabase:', {
          url: apiUrl,
          chiropractor: user.chiropractor,
          since: lastCheckTime
        });
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          console.log('⚠️ API nie jest dostępne (może być w trybie dev):', response.status, response.statusText);
          return;
        }

        const data = await response.json();
        console.log('📥 Otrzymano rezerwacje z Supabase:', {
          success: data.success,
          count: data.count,
          bookings: data.bookings?.length || 0,
          chiropractor: user.chiropractor,
          source: data.source
        });
        
        if (data.success && data.bookings && data.bookings.length > 0) {
          setBookings(prev => {
            const existingIds = prev.map(b => b.id);
            const newBookings = data.bookings
              .filter(b => !existingIds.includes(b.id))
              .map(booking => ({
                ...booking,
                chiropractor: booking.chiropractor || user.chiropractor
              }));
            
            if (newBookings.length > 0) {
              console.log(`✅ Dodano ${newBookings.length} nowych rezerwacji z Supabase`);
              const newCheckTime = new Date().toISOString();
              localStorage.setItem('lastBookingsCheck', newCheckTime);
              return [...newBookings, ...prev];
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('❌ Błąd synchronizacji rezerwacji z Supabase:', error.message);
      }
    };

    // Sprawdzaj co 30 sekund nowe rezerwacje z Supabase
    const interval = setInterval(syncBookingsFromSupabase, 30000);
    const timeout = setTimeout(syncBookingsFromSupabase, 2000);
    
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
    console.log("handleLogin called with:", userData);
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
  const isAuditLogActive = location.pathname === "/audit-log";

  // Debug logi
  console.log("App render state:", {
    hasUser: !!user,
    isLoggedIn: user?.isLoggedIn,
    chiropractor: user?.chiropractor,
    showGoodbye,
    showWelcome,
    justLoggedIn,
    showChiropractorSelection,
    isTransitioning
  });

  // Jeśli użytkownik nie jest zalogowany, pokaż stronę logowania
  if (!user || !user.isLoggedIn) {
    console.log("Rendering LoginPage");
    return <LoginPage onLogin={handleLogin} />;
  }

  // Jeśli użytkownik jest zalogowany, zawsze pokaż ekran wyboru chiropraktyka
  if (showChiropractorSelection) {
    console.log("Rendering ChiropractorSelection");
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

  console.log("Rendering main app");
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
        }}
      >
        {/* Górny pasek nawigacji */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "clamp(8px, 2vw, 12px) clamp(12px, 3vw, 20px)",
            borderBottom: `2px solid ${themeData.border}`,
            background: themeData.gradient,
            flexShrink: 0,
            boxShadow: `0 4px 16px ${themeData.shadow}`,
            position: "relative",
            overflow: "hidden",
            flexWrap: "wrap",
            gap: "8px",
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
            <div style={{ 
              fontSize: "clamp(14px, 4vw, 24px)", 
              fontWeight: 800, 
              letterSpacing: "-1px",
              color: themeData.text,
              textShadow: theme === 'light' ? 'none' : `0 0 20px ${themeData.glow}`,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              <span className="desktop-only">Pracujesz dla </span>{user.chiropractor}
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
                    width: "clamp(32px, 8vw, 40px)",
                    height: "clamp(32px, 8vw, 40px)",
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
                padding: "clamp(4px, 1.5vw, 6px) clamp(8px, 2.5vw, 12px)",
                borderRadius: "8px",
                border: `2px solid ${themeData.accent}`,
                background: "transparent",
                color: themeData.text,
                cursor: "pointer",
                fontSize: "clamp(12px, 3vw, 14px)",
                fontWeight: 600,
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                opacity: 0.8,
                flexShrink: 0,
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
              <span>🔄</span>
              <span className="mobile-hidden">Zmień</span>
            </button>
          </div>

          <div style={{ 
            display: "flex", 
            gap: "clamp(4px, 1vw, 8px)", 
            alignItems: "center",
            position: "relative",
            zIndex: 1,
            flexWrap: "wrap",
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
                  padding: "clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 16px)",
                  borderRadius: 8,
                  border: `2px solid ${themeData.accent}`,
                  background: `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`,
                  color: "white",
                  cursor: "pointer",
                  fontSize: "clamp(11px, 2.5vw, 14px)",
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                  boxShadow: `0 4px 16px ${themeData.glow}`,
                  whiteSpace: "nowrap",
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
                ➕ <span className="mobile-hidden">Dodaj nowy lead</span>
              </button>
            )}
            
            <button
              onClick={() => navigate("/")}
              style={{
                padding: "clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 14px)",
                borderRadius: 8,
                border: isLeadsActive ? `2px solid ${themeData.accent}` : `2px solid ${themeData.border}`,
                background: isLeadsActive 
                  ? `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`
                  : themeData.surfaceElevated,
                color: isLeadsActive ? "white" : themeData.text,
                fontWeight: isLeadsActive ? 700 : 500,
                transition: "all 0.3s ease",
                boxShadow: isLeadsActive ? `0 4px 16px ${themeData.glow}` : "none",
                cursor: "pointer",
                position: "relative",
                zIndex: 10,
                display: "inline-block",
                fontFamily: "inherit",
                fontSize: "clamp(11px, 2.5vw, 14px)",
                whiteSpace: "nowrap",
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
              Kontakty
            </button>

            <Link
              to="/calendar"
              style={{
                padding: "clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 14px)",
                borderRadius: 8,
                textDecoration: "none",
                background: isCalendarActive 
                  ? `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`
                  : themeData.surfaceElevated,
                color: isCalendarActive ? "white" : themeData.text,
                fontWeight: isCalendarActive ? 700 : 500,
                transition: "all 0.3s ease",
                fontSize: "clamp(11px, 2.5vw, 14px)",
                border: isCalendarActive ? `2px solid ${themeData.accent}` : `2px solid ${themeData.border}`,
                boxShadow: isCalendarActive ? `0 4px 16px ${themeData.glow}` : "none",
                whiteSpace: "nowrap",
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
              Kalendarz
            </Link>

            <Link
              to="/statistics"
              style={{
                padding: "clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 14px)",
                borderRadius: 8,
                textDecoration: "none",
                background: isStatisticsActive 
                  ? `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`
                  : themeData.surfaceElevated,
                color: isStatisticsActive ? "white" : themeData.text,
                fontWeight: isStatisticsActive ? 700 : 500,
                transition: "all 0.3s ease",
                border: isStatisticsActive ? `2px solid ${themeData.accent}` : `2px solid ${themeData.border}`,
                boxShadow: isStatisticsActive ? `0 4px 16px ${themeData.glow}` : "none",
                fontSize: "clamp(11px, 2.5vw, 14px)",
                whiteSpace: "nowrap",
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
              📊 Statystyki
            </Link>

            <Link
              to="/audit-log"
              style={{
                padding: "clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 14px)",
                borderRadius: 8,
                textDecoration: "none",
                background: isAuditLogActive 
                  ? `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`
                  : themeData.surfaceElevated,
                color: isAuditLogActive ? "white" : themeData.text,
                fontWeight: isAuditLogActive ? 700 : 500,
                transition: "all 0.3s ease",
                border: isAuditLogActive ? `2px solid ${themeData.accent}` : `2px solid ${themeData.border}`,
                boxShadow: isAuditLogActive ? `0 4px 16px ${themeData.glow}` : "none",
                fontSize: "clamp(11px, 2.5vw, 14px)",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!isAuditLogActive) {
                  e.currentTarget.style.background = themeData.surfaceHover;
                  e.currentTarget.style.color = themeData.text;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isAuditLogActive) {
                  e.currentTarget.style.background = themeData.surfaceElevated;
                  e.currentTarget.style.color = themeData.text;
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              📋 Historia
            </Link>

            {/* Przycisk zmiany motywu */}
            <button
              onClick={toggleTheme}
              style={{
                padding: "clamp(6px, 1.5vw, 8px) clamp(8px, 2.5vw, 12px)",
                borderRadius: 8,
                border: `2px solid ${themeData.border}`,
                background: themeData.surfaceElevated,
                color: themeData.text,
                cursor: "pointer",
                fontSize: "clamp(16px, 4vw, 18px)",
                fontWeight: 500,
                transition: "all 0.3s ease",
                minWidth: "clamp(32px, 8vw, 40px)",
                height: "clamp(32px, 8vw, 40px)",
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
              {themeData.icon}
            </button>

            <button
              onClick={handleLogout}
              style={{
                padding: "clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 14px)",
                borderRadius: 8,
                border: "2px solid #991b1b",
                background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                color: "white",
                cursor: "pointer",
                fontSize: "clamp(11px, 2.5vw, 14px)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)",
                whiteSpace: "nowrap",
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
              <span>🚪</span>
              <span className="mobile-hidden">Wyloguj</span>
            </button>
          </div>
        </div>

        {/* Widoki stron */}
        <div style={{ flex: 1, overflow: "auto", overflowY: "auto", display: "flex", flexDirection: "column", width: "100%", minHeight: 0, height: "100%" }}>
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
                />
              }
            />
            <Route
              path="/calendar"
              element={
                <CalendarPage
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
            <Route
              path="/audit-log"
              element={<AuditLogPage />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
      )}
    </>
  );
}