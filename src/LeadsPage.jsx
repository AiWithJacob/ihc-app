import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext.jsx";
import { IconCalendar } from "./Icons.jsx";
import { formatDateDDMMRR } from "./utils/dateFormat.js";

const STATUSES = [
  "Nowy kontakt",
  "Umówiony",
  "Nie odebrał",
  "Zadzwoń później",
  "Sam się skontaktuje",
];

// Dostępne tagi
const AVAILABLE_TAGS = [
  { id: "VIP", label: "VIP", color: "#f59e0b", icon: "⭐" },
  { id: "Pilne", label: "Pilne", color: "#ef4444", icon: "🔥" },
  { id: "Polecenie", label: "Polecenie", color: "#22c55e", icon: "👥" },
  { id: "Ubezpieczenie", label: "Ubezpieczenie", color: "#3b82f6", icon: "🏥" },
  { id: "Powracający", label: "Powracający", color: "#8b5cf6", icon: "🔄" },
];

// Helper function for status colors
const getStatusColor = (status) => {
  switch (status) {
    case "Nowy kontakt":
      return "#3b82f6"; // Blue
    case "Umówiony":
      return "#22c55e"; // Green
    case "Nie odebrał":
      return "#ef4444"; // Red
    case "Zadzwoń później":
      return "#f59e0b"; // Orange
    case "Sam się skontaktuje":
      return "#6b7280"; // Gray
    default:
      return "#333";
  }
};

function LeadsPage({ leads, setLeads, bookings, onOpenAddLeadModal, onAddLead, onUpdateLead, onDeleteLead }) {
  const { themeData, theme } = useTheme();
  const [newLead, setNewLead] = useState({
    name: "",
    phone: "",
    description: "",
  });

  const [selectedLead, setSelectedLead] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showFullNoteModal, setShowFullNoteModal] = useState(false);
  const [showFullDescriptionModal, setShowFullDescriptionModal] = useState(false);
  const [draggedLead, setDraggedLead] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef(null);
  const scrollRefs = useRef({});

  // Filtrowanie leadów na podstawie wyszukiwania
  const filterLeads = (leadsToFilter) => {
    if (!searchQuery.trim()) return leadsToFilter;
    const query = searchQuery.toLowerCase().trim();
    return leadsToFilter.filter(lead => 
      (lead.name && lead.name.toLowerCase().includes(query)) ||
      (lead.phone && lead.phone.toLowerCase().includes(query)) ||
      (lead.email && lead.email.toLowerCase().includes(query)) ||
      (lead.notes && lead.notes.toLowerCase().includes(query)) ||
      (lead.description && lead.description.toLowerCase().includes(query)) ||
      (lead.tags && lead.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  };

  // Skróty klawiszowe
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K lub Cmd+K - otwórz wyszukiwarkę
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      // Ctrl+N lub Cmd+N - nowy lead
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setShowAddLeadModal(true);
      }
      // Escape - zamknij wyszukiwarkę
      if (e.key === 'Escape') {
        setShowSearch(false);
        setSearchQuery("");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dashboard "Dziś" - obliczenia
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const todayBookings = bookings.filter(b => b.date === today);
  const newLeadsLast24h = leads.filter(l => l.createdAt && l.createdAt > yesterday);
  const leadsToCallback = leads.filter(l => 
    l.status === "Zadzwoń później" || l.status === "Nie odebrał"
  );
  const urgentLeads = leads.filter(l => l.tags?.includes("Pilne"));
  const vipLeads = leads.filter(l => l.tags?.includes("VIP"));

  const navigate = useNavigate();

  // Register the modal opening function with App.jsx
  useEffect(() => {
    if (onOpenAddLeadModal) {
      onOpenAddLeadModal(() => setShowAddLeadModal(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once


  const addLead = () => {
    if (!newLead.name || !newLead.phone) {
      alert('Wypełnij imię i nazwisko oraz telefon.');
      return;
    }
    const payload = {
      name: newLead.name,
      phone: newLead.phone,
      description: newLead.description || "",
      notes: "",
      status: "Nowy kontakt",
      createdAt: new Date().toISOString(),
    };
    onAddLead?.(payload);
    setNewLead({ name: "", phone: "", description: "" });
    setShowAddLeadModal(false);
  };

  const deleteLead = (id) => {
    if (!window.confirm("Na pewno usunąć tego leada?")) return;
    setLeads((prev) => prev.filter((l) => l.id !== id));
    closeModal();
  };

  const changeStatus = (id, newStatus) => {
    onUpdateLead?.(id, { status: newStatus });
    if (selectedLead && selectedLead.id === id) {
      setSelectedLead((prev) => ({ ...prev, status: newStatus }));
      if (newStatus === "Nie odebrał" || newStatus === "Sam się skontaktuje" || newStatus === "Zadzwoń później") {
        closeModal();
      }
    }
  };

  const saveNotes = () => {
    if (!selectedLead) return;
    onUpdateLead?.(selectedLead.id, { notes: noteDraft });
    setSelectedLead((prev) => ({ ...prev, notes: noteDraft }));
  };

  const closeModal = () => {
    if (selectedLead && noteDraft !== undefined) {
      onUpdateLead?.(selectedLead.id, { notes: noteDraft });
    }
    setSelectedLead(null);
    setShowFullNoteModal(false);
    setShowFullDescriptionModal(false);
  };

  const openLead = (lead) => {
    setSelectedLead(lead);
    setNoteDraft(lead.notes || "");
  };

  const goToCalendarWithLead = () => {
    if (!selectedLead) return;
    const booking = getLeadBooking(selectedLead.id);
    if (booking) {
      // Jeśli lead ma booking, przejdź do kalendarza i podświetl wydarzenie
      navigate("/calendar", { state: { highlightBookingId: booking.id } });
    } else {
      // Jeśli nie ma booking, otwórz modal dodawania
      navigate("/calendar", { state: { lead: selectedLead } });
    }
  };

  const getLeadBooking = (leadId) => {
    return bookings.find((b) => b.leadId === leadId);
  };

  const handleDragStart = (e, lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", lead.id.toString());
  };

  const handleDragEnd = () => {
    setDraggedLead(null);
    setDragOverStatus(null);
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
    setDragOverStatus(status);
  };

  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    if (draggedLead) {
      changeStatus(draggedLead.id, targetStatus);
      setDraggedLead(null);
      setDragOverStatus(null);
    }
  };

  const leadBooking = selectedLead ? getLeadBooking(selectedLead.id) : null;

  return (
    <div style={{ 
      padding: "0", 
      height: "100vh",
      maxHeight: "100vh",
      display: "flex", 
      flexDirection: "column", 
      overflow: "hidden",
      background: "transparent",
      position: "relative",
      width: "100%",
      boxSizing: "border-box",
      marginTop: "0px",
      marginBottom: "0px",
    }}>
      
      <div
        style={{
          marginBottom: "clamp(12px, 2vw, 16px)",
          padding: "clamp(12px, 2vw, 16px) clamp(12px, 2vw, 16px) 0 clamp(12px, 2vw, 16px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
          zIndex: 1,
          flexShrink: 0,
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(20px, 5vw, 32px)",
              fontWeight: 800,
              letterSpacing: "-1px",
              color: themeData.text,
              textShadow: `0 0 30px ${themeData.glow}`,
              position: "relative",
            }}
          >
            Kontakty
            <div style={{
              position: "absolute",
              bottom: "-6px",
              left: 0,
              width: "clamp(40px, 10vw, 50px)",
              height: "3px",
              background: `linear-gradient(90deg, ${themeData.accent} 0%, transparent 100%)`,
              borderRadius: "2px",
              boxShadow: `0 0 10px ${themeData.glow}`,
            }} />
          </h1>
        </div>
        <button
          onClick={() => navigate("/calendar")}
          style={{
            padding: "clamp(8px, 2vw, 10px) clamp(12px, 3vw, 20px)",
            borderRadius: 8,
            border: `2px solid ${themeData.accent}`,
            background: `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`,
            color: "white",
            cursor: "pointer",
            fontSize: "clamp(12px, 3vw, 14px)",
            fontWeight: 600,
            transition: "all 0.3s ease",
            boxShadow: `0 4px 16px ${themeData.glow}`,
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: "8px",
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
          <IconCalendar w={16} h={16} color="white" />
          <span className="mobile-hidden">Kalendarz</span>
        </button>
      </div>

      {/* Wyszukiwarka */}
      <div style={{
        display: "flex",
        gap: "8px",
        padding: "0 clamp(8px, 2vw, 16px)",
        marginBottom: "10px",
        alignItems: "center",
      }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "350px" }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Szukaj po imieniu, telefonie, notatce... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearch(true)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              borderRadius: "8px",
              border: `1px solid ${searchQuery ? themeData.accent : themeData.border}`,
              background: themeData.surfaceElevated,
              color: themeData.text,
              fontSize: "13px",
              outline: "none",
              transition: "all 0.2s",
            }}
          />
          <svg 
            style={{ 
              position: "absolute", 
              left: "12px", 
              top: "50%", 
              transform: "translateY(-50%)",
              color: themeData.textSecondary,
            }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: themeData.textSecondary,
                cursor: "pointer",
                padding: "2px",
                fontSize: "14px",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Status columns - fill entire page */}
      <div style={{ 
        display: "flex", 
        gap: "clamp(8px, 1.5vw, 12px)", 
        flex: 1,
        overflow: "hidden",
        minHeight: 0,
        height: "calc(100vh - 130px)",
        maxHeight: "calc(100vh - 130px)",
        alignItems: "stretch",
        position: "relative",
        zIndex: 1,
        width: "100%",
        padding: "0 clamp(8px, 2vw, 16px) clamp(8px, 2vw, 16px) clamp(8px, 2vw, 16px)",
        boxSizing: "border-box",
      }}>
        {STATUSES.map((status) => {
          const statusColor = getStatusColor(status);
          const statusLeads = filterLeads(leads).filter(l => l.status === status);
          return (
          <div
            key={status}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
            style={{
              border: `2px solid`,
              borderColor: dragOverStatus === status 
                ? statusColor 
                : themeData.border,
              borderRadius: 16,
              padding: "clamp(8px, 2vw, 12px)",
              flex: "1 1 0",
              minWidth: 0,
              width: "calc((100% - 4 * clamp(8px, 1.5vw, 12px)) / 5)",
              maxWidth: "calc((100% - 4 * clamp(8px, 1.5vw, 12px)) / 5)",
              height: "100%",
              maxHeight: "100%",
              background: dragOverStatus === status 
                ? themeData.cardBackgroundHover
                : themeData.cardBackground,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              position: "relative",
              boxShadow: dragOverStatus === status 
                ? `0 8px 32px ${themeData.shadow}, 0 0 20px ${statusColor}30`
                : `0 4px 20px ${themeData.shadow}`,
              boxSizing: "border-box",
            }}
            onMouseEnter={(e) => {
              if (dragOverStatus !== status) {
                e.currentTarget.style.borderColor = `${statusColor}60`;
                e.currentTarget.style.boxShadow = `0 6px 24px ${themeData.shadow}, 0 0 0 1px ${statusColor}30`;
              }
            }}
            onMouseLeave={(e) => {
              if (dragOverStatus !== status) {
                e.currentTarget.style.borderColor = themeData.border;
                e.currentTarget.style.boxShadow = `0 4px 16px ${themeData.shadow}`;
              }
            }}
          >
            {/* Nagłówek kolumny z licznikiem */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 0,
              paddingBottom: 16,
              paddingTop: 2,
              borderBottom: `2px solid ${themeData.border}`,
              flexShrink: 0,
              minHeight: "48px",
              height: "48px",
              boxSizing: "border-box",
            }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: "clamp(12px, 3vw, 16px)", 
                fontWeight: 700,
                color: themeData.text,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}>
                <div style={{
                  width: "6px",
                  height: "6px",
                  minWidth: "6px",
                  minHeight: "6px",
                  borderRadius: "50%",
                  background: statusColor,
                  boxShadow: `0 0 8px ${statusColor}80`,
                  animation: "pulse 2s ease-in-out infinite",
                  flexShrink: 0,
                }} />
                {status}
              </h3>
              <div style={{
                padding: "3px 8px",
                borderRadius: 8,
                background: themeData.surfaceElevated,
                border: `1px solid ${themeData.border}`,
                fontSize: "12px",
                fontWeight: 600,
                color: statusColor,
                minWidth: "28px",
                textAlign: "center",
              }}>
                {statusLeads.length}
              </div>
            </div>

            <div
              ref={(el) => (scrollRefs.current[status] = el)}
              className="hide-scrollbar"
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                marginTop: 12,
                paddingTop: 8,
                minHeight: 0,
                maxHeight: "100%",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {statusLeads
                .sort((a, b) => {
                  const dateA = a.createdAt ? new Date(a.createdAt) : new Date(a.id);
                  const dateB = b.createdAt ? new Date(b.createdAt) : new Date(b.id);
                  return dateB - dateA;
                })
                .map((l) => (
                  <div
                    key={l.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, l)}
                    onDragEnd={handleDragEnd}
                    onClick={() => openLead(l)}
                    style={{
                      cursor: "grab",
                      border: `2px solid ${themeData.border}`,
                      borderRadius: 12,
                      padding: "14px 16px",
                      marginBottom: 10,
                      height: "auto",
                      minHeight: "90px",
                      maxHeight: "none",
                      background: draggedLead?.id === l.id 
                        ? themeData.surfaceHover 
                        : themeData.surfaceElevated,
                      fontSize: "14px",
                      lineHeight: "1.4",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      opacity: draggedLead?.id === l.id ? 0.5 : 1,
                      position: "relative",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      boxShadow: `0 4px 16px ${themeData.shadow}`,
                      overflow: "hidden",
                      boxSizing: "border-box",
                    }}
                    onMouseEnter={(e) => {
                      if (draggedLead?.id !== l.id) {
                        e.currentTarget.style.background = themeData.surfaceElevated;
                        e.currentTarget.style.borderColor = `${getStatusColor(l.status)}60`;
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = `0 6px 16px ${themeData.shadow}, 0 0 0 1px ${getStatusColor(l.status)}30`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (draggedLead?.id !== l.id) {
                        e.currentTarget.style.background = themeData.cardBackground;
                        e.currentTarget.style.borderColor = themeData.border;
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = `0 2px 8px ${themeData.shadow}`;
                      }
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.cursor = "grabbing";
                      e.currentTarget.style.transform = "scale(0.98)";
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.cursor = "grab";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {/* Efekt świetlny po lewej */}
                    <div style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: "2px",
                      background: `linear-gradient(180deg, ${getStatusColor(l.status)} 0%, transparent 100%)`,
                      opacity: 0.6,
                    }} />
                    
                    <div style={{ flex: 1, marginLeft: 8, display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
                      <b style={{ 
                        fontSize: "14px", 
                        fontWeight: 700, 
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: 2, 
                        color: themeData.text,
                        lineHeight: "1.3",
                      }}>
                        {status === "Umówiony" && getLeadBooking(l.id)?.status === 'completed' && (
                          <span style={{ 
                            color: "#22c55e",
                            fontSize: "16px",
                            display: "inline-flex",
                            alignItems: "center",
                            fontWeight: 700,
                          }}>
                            ✓
                          </span>
                        )}
                        {l.name}
                      </b>
                      {l.email ? (
                        <div style={{ 
                          fontSize: "11px", 
                          color: themeData.textSecondary, 
                          marginBottom: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          lineHeight: "1.3",
                        }}>
                          ✉️ {l.email}
                        </div>
                      ) : null}
                      <a 
                        href={`tel:${l.phone?.replace(/\s/g, '')}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                          fontSize: "11px", 
                          color: themeData.accent, 
                          marginBottom: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          lineHeight: "1.3",
                          textDecoration: "none",
                          transition: "opacity 0.2s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = "0.7"}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                        title="Kliknij aby zadzwonić"
                      >
                        📞 {l.phone}
                      </a>
                      {l.description ? (
                        <div style={{ 
                          fontSize: "10px", 
                          color: themeData.textSecondary, 
                          lineHeight: "1.3",
                          opacity: 0.8,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                        }}>
                          {l.description}
                        </div>
                      ) : null}
                      {/* Tagi */}
                      {l.tags && l.tags.length > 0 && (
                        <div style={{ 
                          display: "flex", 
                          flexWrap: "wrap", 
                          gap: "3px", 
                          marginTop: "4px" 
                        }}>
                          {l.tags.slice(0, 3).map(tagId => {
                            const tag = AVAILABLE_TAGS.find(t => t.id === tagId);
                            if (!tag) return null;
                            return (
                              <span
                                key={tagId}
                                style={{
                                  fontSize: "9px",
                                  padding: "1px 5px",
                                  borderRadius: "4px",
                                  background: `${tag.color}20`,
                                  color: tag.color,
                                  fontWeight: 600,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "2px",
                                }}
                              >
                                {tag.icon} {tag.label}
                              </span>
                            );
                          })}
                          {l.tags.length > 3 && (
                            <span style={{ fontSize: "9px", color: themeData.textSecondary }}>
                              +{l.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        minWidth: "8px",
                        minHeight: "8px",
                        borderRadius: "50%",
                        background: getStatusColor(l.status),
                        flexShrink: 0,
                        marginLeft: 8,
                        boxShadow: `0 0 6px ${getStatusColor(l.status)}40`,
                      }}
                    />
                  </div>
                ))}
            </div>
            
            {/* Zakończenie lejka */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginTop: 8,
              paddingTop: 12,
              paddingBottom: 8,
              borderTop: `2px solid ${themeData.border}`,
              flexShrink: 0,
              minHeight: "40px",
              height: "40px",
              boxSizing: "border-box",
              position: "relative",
            }}>
              {/* Gradient efekt na dole lejka */}
              <div style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: "60%",
                height: "2px",
                background: `linear-gradient(90deg, transparent 0%, ${statusColor}40 50%, transparent 100%)`,
                borderRadius: "2px",
              }} />
              {/* Punkt zakończenia */}
              <div style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: statusColor,
                boxShadow: `0 0 8px ${statusColor}60`,
                opacity: 0.6,
              }} />
            </div>
          </div>
          );
        })}
      </div>

      {/* Modal dodawania leada */}
      {showAddLeadModal && (
        <div
          onClick={() => {
            setShowAddLeadModal(false);
            setNewLead({ name: "", phone: "", description: "" });
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: `rgba(0,0,0,${theme === 'night' ? '0.95' : '0.85'})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="hide-scrollbar"
            style={{
              padding: "32px",
              background: themeData.surfaceSolid || themeData.surface,
              borderRadius: 20,
              width: "90%",
              maxWidth: 520,
              maxHeight: "85vh",
              boxShadow: `0 25px 80px ${themeData.shadow}`,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              border: `2px solid ${themeData.border}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Efekt świetlny na górze modala */}
            <div style={{
              position: "absolute",
              top: "-2px",
              left: "-2px",
              right: "-2px",
              height: "4px",
              background: `linear-gradient(90deg, ${themeData.accent} 0%, transparent 100%)`,
              borderRadius: "24px 24px 0 0",
            }} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <h2
                style={{ 
                  margin: 0, 
                  fontSize: "28px", 
                  fontWeight: 700,
                  color: themeData.text,
                }}
              >
                Dodaj nowy lead
              </h2>
              <button
                onClick={() => {
                  setShowAddLeadModal(false);
                  setNewLead({ name: "", phone: "", description: "" });
                }}
                style={{
                  background: themeData.surfaceElevated,
                  border: `1px solid ${themeData.border}`,
                  color: themeData.text,
                  fontSize: "24px",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: 8,
                  transition: "all 0.3s ease",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = themeData.surface;
                  e.currentTarget.style.transform = "rotate(90deg) scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = themeData.surfaceElevated;
                  e.currentTarget.style.transform = "rotate(0deg) scale(1)";
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: 18 }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontSize: "15px",
                    fontWeight: 600,
                    color: themeData.textSecondary,
                  }}
                >
                  Imię i nazwisko *
                </label>
                <input
                  placeholder="Wprowadź imię i nazwisko"
                  value={newLead.name}
                  onChange={(e) =>
                    setNewLead((n) => ({ ...n, name: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: themeData.surfaceElevated,
                    color: themeData.text,
                    border: `2px solid ${themeData.border}`,
                    borderRadius: 8,
                    fontSize: "15px",
                    boxSizing: "border-box",
                    transition: "all 0.3s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = themeData.accent;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${themeData.glow}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = themeData.border;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontSize: "15px",
                    fontWeight: 600,
                    color: themeData.textSecondary,
                  }}
                >
                  Telefon *
                </label>
                <input
                  placeholder="Wprowadź numer telefonu"
                  value={newLead.phone}
                  onChange={(e) =>
                    setNewLead((n) => ({ ...n, phone: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: themeData.surfaceElevated,
                    color: themeData.text,
                    border: `2px solid ${themeData.border}`,
                    borderRadius: 8,
                    fontSize: "15px",
                    boxSizing: "border-box",
                    transition: "all 0.3s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = themeData.accent;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${themeData.glow}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = themeData.border;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontSize: "15px",
                    fontWeight: 600,
                    color: themeData.textSecondary,
                  }}
                >
                  Opis
                </label>
                <textarea
                  placeholder="Wprowadź opis (opcjonalnie)"
                  value={newLead.description}
                  onChange={(e) =>
                    setNewLead((n) => ({ ...n, description: e.target.value }))
                  }
                  className="hide-scrollbar"
                  style={{
                    width: "100%",
                    minHeight: 100,
                    padding: "12px 16px",
                    background: themeData.surfaceElevated,
                    color: themeData.text,
                    border: `2px solid ${themeData.border}`,
                    borderRadius: 8,
                    fontSize: "15px",
                    resize: "vertical",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    transition: "all 0.3s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = themeData.accent;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${themeData.glow}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = themeData.border;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "flex-end",
                  marginTop: 6,
                }}
              >
                <button
                  onClick={() => {
                    setShowAddLeadModal(false);
                    setNewLead({ name: "", phone: "", description: "" });
                  }}
                  style={{
                    padding: "12px 24px",
                    fontSize: "15px",
                    fontWeight: 600,
                    background: themeData.surfaceElevated,
                    color: themeData.text,
                    border: `2px solid ${themeData.border}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = themeData.surface;
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = themeData.surfaceElevated;
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  Anuluj
                </button>
                <button
                  onClick={addLead}
                  style={{
                    padding: "12px 24px",
                    fontSize: "15px",
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`,
                    color: "white",
                    border: `2px solid ${themeData.accent}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: `0 4px 16px ${themeData.glow}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                    e.currentTarget.style.boxShadow = `0 6px 24px ${themeData.glow}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = `0 4px 16px ${themeData.glow}`;
                  }}
                >
                  ➕ Dodaj leada
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal szczegółów leada */}
      {selectedLead && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            draggable={false}
            onDragStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrag={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDragEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            style={{
              paddingTop: "21px",
              paddingBottom: "21px",
              paddingLeft: "clamp(16px, 3vw, 24px)",
              paddingRight: "clamp(16px, 3vw, 24px)",
              background: themeData.surface,
              borderRadius: 12,
              width: "clamp(90vw, 95vw, 1000px)",
              maxWidth: "1000px",
              height: "clamp(70vh, 80vh, 600px)",
              maxHeight: "90vh",
              display: "flex",
              flexWrap: "wrap",
              gap: "clamp(12px, 2vw, 20px)",
              border: `2px solid ${themeData.border}`,
              boxShadow: `0 12px 48px ${themeData.shadow}`,
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              overflow: "hidden",
              boxSizing: "border-box",
              userSelect: "text",
              WebkitUserSelect: "text",
              touchAction: "pan-y",
              pointerEvents: "auto",
            }}
          >
            {/* Efekt świetlny na górze modala */}
            <div style={{
              position: "absolute",
              top: "-2px",
              left: "-2px",
              right: "-2px",
              height: "3px",
              background: `linear-gradient(90deg, ${themeData.accent} 0%, transparent 100%)`,
              borderRadius: "12px 12px 0 0",
            }} />
            
            <div
              style={{
                width: "clamp(250px, 30vw, 300px)",
                minWidth: "clamp(250px, 30vw, 300px)",
                maxWidth: "100%",
                borderTop: "none",
                borderBottom: "none",
                borderLeft: "none",
                borderRight: `2px solid ${themeData.border}`,
                paddingRight: "clamp(12px, 2vw, 16px)",
                display: "flex",
                flexDirection: "column",
                overflowY: "hidden",
                maxHeight: "100%",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <h2
                  style={{
                    marginTop: 0,
                    fontSize: "20px",
                    fontWeight: 700,
                    margin: 0,
                    color: themeData.text,
                  }}
                >
                  {selectedLead.name}
                </h2>
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    minWidth: "12px",
                    minHeight: "12px",
                    borderRadius: "50%",
                    background: getStatusColor(selectedLead.status),
                    flexShrink: 0,
                  }}
                  title={selectedLead.status}
                />
              </div>
              <a 
                href={`tel:${selectedLead.phone?.replace(/\s/g, '')}`}
                style={{ 
                  fontSize: "16px", 
                  marginBottom: 12,
                  color: themeData.accent,
                  textDecoration: "none",
                  display: "block",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.7"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                title="Kliknij aby zadzwonić"
              >
                📞 {selectedLead.phone}
              </a>
              {selectedLead.email ? (
                <div style={{ 
                  fontSize: "16px", 
                  marginBottom: 12,
                  color: themeData.textSecondary,
                }}>
                  ✉️ {selectedLead.email}
                </div>
              ) : null}
              
              {/* Przycisk do pokazania opisu */}
              {selectedLead.description && selectedLead.description.length > 0 && (
                <button
                  onClick={() => setShowFullDescriptionModal(true)}
                  style={{
                    padding: "8px 12px",
                    marginBottom: 10,
                    width: "100%",
                    background: `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`,
                    color: "white",
                    border: `1px solid ${themeData.accent}`,
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    transition: "all 0.3s ease",
                    boxShadow: `0 4px 12px ${themeData.glow}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = `0 6px 16px ${themeData.glow}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = `0 4px 12px ${themeData.glow}`;
                  }}
                >
                  📋 Pokaż opis
                </button>
              )}

              {leadBooking && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: "2px 12px",
                    background: `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`,
                    borderRadius: 8,
                    fontSize: "14px",
                    lineHeight: "1.5",
                    color: "white",
                    boxShadow: `0 4px 12px ${themeData.glow}`,
                  }}
                >
                  <strong>Umówiony:</strong> {formatDateDDMMRR(leadBooking.date)} {leadBooking.time}
                </div>
              )}

              {/* Tagi */}
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  marginBottom: 8,
                  marginTop: 0,
                  color: themeData.text,
                }}
              >
                Tagi
              </h4>
              <div style={{ 
                display: "flex", 
                flexWrap: "wrap", 
                gap: "6px", 
                marginBottom: 12,
              }}>
                {AVAILABLE_TAGS.map(tag => {
                  const isActive = selectedLead.tags?.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => {
                        const currentTags = selectedLead.tags || [];
                        const newTags = isActive 
                          ? currentTags.filter(t => t !== tag.id)
                          : [...currentTags, tag.id];
                        onUpdateLead?.(selectedLead.id, { tags: newTags });
                        setSelectedLead(prev => ({ ...prev, tags: newTags }));
                      }}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        border: `2px solid ${isActive ? tag.color : themeData.border}`,
                        background: isActive ? `${tag.color}20` : "transparent",
                        color: isActive ? tag.color : themeData.textSecondary,
                        cursor: "pointer",
                        fontSize: "11px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.borderColor = tag.color;
                          e.currentTarget.style.color = tag.color;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.borderColor = themeData.border;
                          e.currentTarget.style.color = themeData.textSecondary;
                        }
                      }}
                    >
                      {tag.icon} {tag.label}
                    </button>
                  );
                })}
              </div>

              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  marginBottom: 6,
                  marginTop: 0,
                  color: themeData.text,
                }}
              >
                Status
              </h4>
              {STATUSES.filter((s) => s !== selectedLead.status).map((s) => (
                <button
                  key={s}
                  onClick={(e) => {
                    e.stopPropagation();
                    changeStatus(selectedLead.id, s);
                  }}
                  style={{
                    display: "block",
                    marginBottom: 3,
                    fontSize: "12px",
                    width: "100%",
                    padding: "8px 12px",
                    background: getStatusColor(s),
                    color: "white",
                    border: "1px solid transparent",
                    borderRadius: 5,
                    cursor: "pointer",
                    fontWeight: 500,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  {s}
                </button>
              ))}

              <hr style={{ 
                margin: "6px 0", 
                borderColor: themeData.border,
                borderWidth: "1px",
              }} />

              <button
                onClick={closeModal}
                style={{
                  width: "100%",
                  marginTop: 2,
                  padding: "8px 12px",
                  background: themeData.surfaceElevated,
                  color: themeData.text,
                  border: `1px solid ${themeData.border}`,
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = themeData.surface;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = themeData.surfaceElevated;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Zamknij
              </button>

              <button
                onClick={() => deleteLead(selectedLead.id)}
                style={{
                  background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                  color: "white",
                  border: "1px solid #991b1b",
                  padding: "8px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  marginTop: 6,
                  display: "block",
                  width: "100%",
                  fontSize: "12px",
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(220, 38, 38, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(220, 38, 38, 0.3)";
                }}
              >
                Usuń leada
              </button>

              <button
                onClick={goToCalendarWithLead}
                style={{
                  marginTop: 8,
                  background: `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`,
                  color: "white",
                  border: `1px solid ${themeData.accent}`,
                  padding: "8px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  display: "block",
                  width: "100%",
                  transition: "all 0.3s ease",
                  boxShadow: `0 4px 12px ${themeData.glow}`,
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                {leadBooking ? "Pokaż w kalendarzu" : "Umów w kalendarzu"}
              </button>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: "clamp(300px, 50vw, 600px)", minWidth: "clamp(250px, 30vw, 300px)", overflowY: "auto", overflowX: "hidden", maxHeight: "100%", justifyContent: "space-between" }}>
              <div>
                <h3
                  style={{
                    marginTop: 0,
                    fontSize: "18px",
                    fontWeight: 600,
                    marginBottom: 12,
                    color: themeData.text,
                  }}
                >
                  Notatki / opis pacjenta
                </h3>

              {/* Szablony notatek */}
              <div style={{ 
                display: "flex", 
                flexWrap: "wrap", 
                gap: "6px", 
                marginBottom: 12,
              }}>
                <span style={{ 
                  fontSize: "11px", 
                  color: themeData.textSecondary, 
                  alignSelf: "center",
                  marginRight: "4px",
                }}>
                  Szablony:
                </span>
                {[
                  { label: "Pierwsza wizyta", text: "PIERWSZA WIZYTA\n\nDolegliwości: \nOd kiedy: \nPrzyczyna: \n\nZalecenia: \n" },
                  { label: "Kontrola", text: "WIZYTA KONTROLNA\n\nPostępy: \nSamopoczucie: \n\nZalecenia: \n" },
                  { label: "Ból pleców", text: "BÓL PLECÓW\n\nLokalizacja: \nNasilenie (1-10): \nOd kiedy: \nCzynniki nasilające: \n\nBadanie: \nZalecenia: \n" },
                  { label: "Ból szyi", text: "BÓL SZYI\n\nLokalizacja: \nPromieniowanie: \nNasilenie (1-10): \n\nBadanie: \nZalecenia: \n" },
                ].map((template) => (
                  <button
                    key={template.label}
                    onClick={() => {
                      const newNote = noteDraft 
                        ? noteDraft + "\n\n" + template.text 
                        : template.text;
                      setNoteDraft(newNote);
                    }}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: `1px solid ${themeData.border}`,
                      background: themeData.surfaceElevated,
                      color: themeData.textSecondary,
                      cursor: "pointer",
                      fontSize: "10px",
                      fontWeight: 500,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = themeData.accent;
                      e.currentTarget.style.color = themeData.accent;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = themeData.border;
                      e.currentTarget.style.color = themeData.textSecondary;
                    }}
                    title={`Wstaw szablon: ${template.label}`}
                  >
                    + {template.label}
                  </button>
                ))}
              </div>

              {/* Podgląd notatki jeśli jest długa */}
              {noteDraft.length > 300 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{
                    padding: "12px",
                    background: themeData.surfaceElevated,
                    border: `1px solid ${themeData.border}`,
                    borderRadius: 8,
                    maxHeight: "100px",
                    overflow: "hidden",
                    position: "relative",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    color: themeData.textSecondary,
                  }}>
                    {noteDraft.substring(0, 300)}...
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "50px",
                        background:
                          `linear-gradient(to top, ${themeData.surfaceElevated}, transparent)`,
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                </div>
              )}

              {noteDraft.length > 300 && (
                <button
                  onClick={() => setShowFullNoteModal(true)}
                  style={{
                    padding: "6px 10px",
                    marginBottom: 10,
                    width: "100%",
                    background: `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`,
                    color: "white",
                    border: `1px solid ${themeData.accent}`,
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    transition: "all 0.3s ease",
                    boxShadow: `0 4px 12px ${themeData.glow}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = `0 6px 16px ${themeData.glow}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = `0 4px 12px ${themeData.glow}`;
                  }}
                >
                  📄 Pokaż pełną notatkę
                </button>
              )}

              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                style={{
                  width: "100%",
                  flex: 1,
                  minHeight: 400,
                  maxHeight: "calc(90vh - 350px)",
                  background: themeData.surfaceElevated,
                  color: themeData.text,
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${themeData.border}`,
                  resize: "none",
                  fontSize: "17px",
                  fontFamily: "inherit",
                  lineHeight: "1.7",
                  transition: "all 0.3s ease",
                  overflowY: "auto",
                  overflowX: "hidden",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = themeData.accent;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${themeData.glow}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = themeData.border;
                  e.currentTarget.style.boxShadow = "none";
                }}
              />

              </div>
              <div style={{ marginTop: "auto", paddingTop: 12 }}>
                <button
                  onClick={saveNotes}
                  style={{
                    padding: "8px 12px",
                    width: "100%",
                    background: `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`,
                    color: "white",
                    border: `1px solid ${themeData.accent}`,
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 500,
                    transition: "all 0.3s ease",
                    boxShadow: `0 4px 12px ${themeData.glow}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = `0 6px 16px ${themeData.glow}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = `0 4px 12px ${themeData.glow}`;
                  }}
                >
                  💾 Zapisz notatki
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal z pełną notatką */}
      {showFullNoteModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFullNoteModal(false);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: `rgba(0,0,0,${theme === 'night' ? '0.95' : '0.85'})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: "40px",
              background: themeData.surface,
              borderRadius: 24,
              width: "90%",
              maxWidth: 1000,
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: `0 12px 48px ${themeData.shadow}`,
              border: `2px solid ${themeData.border}`,
              position: "relative",
            }}
          >
            {/* Efekt świetlny na górze modala */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: `linear-gradient(90deg, ${themeData.accent} 0%, transparent 100%)`,
              borderRadius: "24px 24px 0 0",
            }} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <h2
                style={{ 
                  margin: 0, 
                  fontSize: "36px", 
                  fontWeight: 700,
                  color: themeData.text,
                }}
              >
                Pełna notatka
              </h2>
              <button
                onClick={() => setShowFullNoteModal(false)}
                style={{
                  background: themeData.surfaceElevated,
                  border: `1px solid ${themeData.border}`,
                  color: themeData.text,
                  fontSize: "32px",
                  cursor: "pointer",
                  padding: "8px 16px",
                  borderRadius: 12,
                  transition: "all 0.3s ease",
                  width: "48px",
                  height: "48px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = themeData.surface;
                  e.currentTarget.style.transform = "rotate(90deg) scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = themeData.surfaceElevated;
                  e.currentTarget.style.transform = "rotate(0deg) scale(1)";
                }}
              >
                ×
              </button>
            </div>
            <div
              className="hide-scrollbar"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px",
                background: themeData.surfaceElevated,
                borderRadius: 12,
                border: `2px solid ${themeData.border}`,
                fontSize: "20px",
                color: themeData.text,
                lineHeight: "1.8",
                whiteSpace: "pre-wrap",
              }}
            >
              {selectedLead?.notes}
            </div>
            <div style={{ marginTop: 24, textAlign: "right" }}>
              <button
                onClick={() => setShowFullNoteModal(false)}
                style={{
                  padding: "14px 28px",
                  background: themeData.surfaceElevated,
                  color: themeData.text,
                  border: `2px solid ${themeData.border}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  fontSize: "18px",
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = themeData.surface;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = themeData.surfaceElevated;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal z pełnym opisem pacjenta */}
      {showFullDescriptionModal && selectedLead && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFullDescriptionModal(false);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: `rgba(0,0,0,${theme === 'night' ? '0.95' : '0.85'})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: "24px",
              background: themeData.surface,
              borderRadius: 16,
              width: "90%",
              maxWidth: 480,
              maxHeight: "70vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: `0 12px 48px ${themeData.shadow}`,
              border: `2px solid ${themeData.border}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Efekt świetlny na górze modala */}
            <div style={{
              position: "absolute",
              top: "-2px",
              left: "-2px",
              right: "-2px",
              height: "3px",
              background: `linear-gradient(90deg, ${themeData.accent} 0%, transparent 100%)`,
              borderRadius: "16px 16px 0 0",
            }} />
            
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h2
                style={{ 
                  margin: 0, 
                  fontSize: "20px", 
                  fontWeight: 700,
                  color: themeData.text,
                }}
              >
                Pełny opis
              </h2>
              <button
                onClick={() => setShowFullDescriptionModal(false)}
                style={{
                  background: themeData.surfaceElevated,
                  border: `1px solid ${themeData.border}`,
                  color: themeData.text,
                  fontSize: "20px",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: 8,
                  transition: "all 0.3s ease",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = themeData.surface;
                  e.currentTarget.style.transform = "rotate(90deg) scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = themeData.surfaceElevated;
                  e.currentTarget.style.transform = "rotate(0deg) scale(1)";
                }}
              >
                ×
              </button>
            </div>
            <div
              className="hide-scrollbar"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "12px",
                background: themeData.surfaceElevated,
                borderRadius: 8,
                border: `1px solid ${themeData.border}`,
                fontSize: "14px",
                color: themeData.text,
                lineHeight: "1.5",
                whiteSpace: "pre-wrap",
              }}
            >
              {selectedLead?.description}
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                    if (selectedLead && selectedLead.description) {
                    const currentNotes = selectedLead.notes || "";
                    const newNotes = currentNotes 
                      ? `${selectedLead.description}\n\n${currentNotes}`
                      : selectedLead.description;
                    onUpdateLead?.(selectedLead.id, { notes: newNotes });
                    setSelectedLead((prev) => ({ ...prev, notes: newNotes }));
                    setNoteDraft(newNotes);
                    setShowFullDescriptionModal(false);
                  }
                }}
                style={{
                  padding: "8px 16px",
                  background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                  color: "white",
                  border: "2px solid #22c55e",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(34, 197, 94, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(34, 197, 94, 0.3)";
                }}
              >
                📋 Skopiuj do notatek
              </button>
              <button
                onClick={() => setShowFullDescriptionModal(false)}
                style={{
                  padding: "8px 16px",
                  background: themeData.surfaceElevated,
                  color: themeData.text,
                  border: `2px solid ${themeData.border}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = themeData.surface;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = themeData.surfaceElevated;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeadsPage;
