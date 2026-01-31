import { useState, useRef, useEffect } from "react";

function SettingsModal({ isOpen, onClose, chiropractors, images, onUpdate }) {
  const [newChiropractorName, setNewChiropractorName] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [focusedField, setFocusedField] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const fileInputRefs = useRef({});

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 50);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddChiropractor = () => {
    if (!newChiropractorName.trim()) {
      alert("Wprowadź nazwę chiropraktyka!");
      return;
    }
    if (chiropractors.includes(newChiropractorName)) {
      alert("Chiropraktyk o tej nazwie już istnieje!");
      return;
    }
    const updated = [...chiropractors, newChiropractorName];
    localStorage.setItem("chiropractors", JSON.stringify(updated));
    setNewChiropractorName("");
    onUpdate(updated, images);
  };

  const handleDeleteChiropractor = (name) => {
    if (window.confirm(`Czy na pewno chcesz usunąć ${name}?`)) {
      const updated = chiropractors.filter(c => c !== name);
      const updatedImages = { ...images };
      delete updatedImages[name];
      localStorage.setItem("chiropractors", JSON.stringify(updated));
      localStorage.setItem("chiropractorImages", JSON.stringify(updatedImages));
      onUpdate(updated, updatedImages);
    }
  };

  const handleImageUpload = (chiropractor, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedImages = {
          ...images,
          [chiropractor]: reader.result,
        };
        localStorage.setItem("chiropractorImages", JSON.stringify(updatedImages));
        onUpdate(chiropractors, updatedImages);
      };
      reader.readAsDataURL(file);
    }
  };

  // Ikony SVG
  const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );

  const PlusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );

  const ImageIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );

  const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  );

  const UserIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: isAnimating ? "rgba(0, 0, 0, 0.85)" : "rgba(0, 0, 0, 0)",
        backdropFilter: isAnimating ? "blur(8px)" : "blur(0px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "20px",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      onClick={onClose}
    >
      {/* Animated background orbs */}
      <div style={{
        position: "absolute",
        top: "10%",
        left: "10%",
        width: "30%",
        height: "30%",
        background: "radial-gradient(circle, rgba(102, 126, 234, 0.15) 0%, transparent 70%)",
        filter: "blur(60px)",
        animation: "float1 15s ease-in-out infinite",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        bottom: "10%",
        right: "10%",
        width: "35%",
        height: "35%",
        background: "radial-gradient(circle, rgba(118, 75, 162, 0.15) 0%, transparent 70%)",
        filter: "blur(60px)",
        animation: "float2 18s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      <div
        style={{
          background: "rgba(20, 20, 25, 0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "0",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.08)",
          opacity: isAnimating ? 1 : 0,
          transform: isAnimating ? "translateY(0) scale(1)" : "translateY(30px) scale(0.95)",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "24px 32px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          position: "sticky",
          top: 0,
          background: "rgba(20, 20, 25, 0.98)",
          backdropFilter: "blur(20px)",
          zIndex: 10,
          borderRadius: "24px 24px 0 0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)",
            }}>
              <span style={{ fontSize: "20px" }}>⚙️</span>
            </div>
            <div>
              <h2 style={{
                color: "white",
                fontSize: "20px",
                fontWeight: 700,
                margin: 0,
              }}>
                Ustawienia
              </h2>
              <p style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "13px",
                margin: 0,
              }}>
                Zarządzaj chiropraktykami
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              color: "rgba(255,255,255,0.6)",
              width: "42px",
              height: "42px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "rgba(255,255,255,0.6)";
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "32px" }}>
          {/* Add new chiropractor */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "32px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "rgba(255,255,255,0.7)",
              marginBottom: "14px",
              fontSize: "14px",
              fontWeight: 500,
            }}>
              <UserIcon />
              Dodaj nowego chiropraktyka
            </label>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  type="text"
                  value={newChiropractorName}
                  onChange={(e) => setNewChiropractorName(e.target.value)}
                  onFocus={() => setFocusedField(true)}
                  onBlur={() => setFocusedField(false)}
                  placeholder="Imię chiropraktyka"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    border: `2px solid ${focusedField ? "#667eea" : "rgba(255,255,255,0.1)"}`,
                    background: "rgba(255,255,255,0.05)",
                    color: "white",
                    fontSize: "15px",
                    boxSizing: "border-box",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    outline: "none",
                    boxShadow: focusedField ? "0 0 0 4px rgba(102, 126, 234, 0.15)" : "none",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddChiropractor();
                  }}
                />
              </div>
              <button
                onClick={handleAddChiropractor}
                style={{
                  padding: "14px 24px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.3s",
                  boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 12px 32px rgba(102, 126, 234, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 8px 24px rgba(102, 126, 234, 0.3)";
                }}
              >
                <PlusIcon />
                Dodaj
              </button>
            </div>
          </div>

          {/* Chiropractors list */}
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}>
              <h3 style={{
                color: "white",
                fontSize: "16px",
                fontWeight: 600,
                margin: 0,
              }}>
                Lista chiropraktyków
              </h3>
              <span style={{
                background: "rgba(102, 126, 234, 0.2)",
                color: "#667eea",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: 600,
              }}>
                {chiropractors.length} {chiropractors.length === 1 ? "osoba" : "osób"}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {chiropractors.map((chiropractor, index) => {
                const isHovered = hoveredCard === chiropractor;
                
                return (
                  <div
                    key={chiropractor}
                    onMouseEnter={() => setHoveredCard(chiropractor)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "16px 20px",
                      background: isHovered 
                        ? "rgba(102, 126, 234, 0.08)" 
                        : "rgba(255,255,255,0.03)",
                      borderRadius: "16px",
                      border: `1px solid ${isHovered ? "rgba(102, 126, 234, 0.2)" : "rgba(255,255,255,0.06)"}`,
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      transform: isHovered ? "translateX(4px)" : "translateX(0)",
                      opacity: isAnimating ? 1 : 0,
                      transitionDelay: `${index * 0.05}s`,
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "14px",
                      overflow: "hidden",
                      border: `2px solid ${isHovered ? "#667eea" : "rgba(255,255,255,0.1)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.3s",
                      boxShadow: isHovered ? "0 8px 24px rgba(102, 126, 234, 0.2)" : "none",
                    }}>
                      {images[chiropractor] ? (
                        <img
                          src={images[chiropractor]}
                          alt={chiropractor}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "linear-gradient(135deg, #374151 0%, #1f2937 100%)",
                          fontSize: "22px",
                          fontWeight: 700,
                          color: "rgba(255,255,255,0.6)",
                        }}>
                          {chiropractor.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: "white",
                        fontSize: "16px",
                        fontWeight: 600,
                        marginBottom: "4px",
                      }}>
                        {chiropractor}
                      </div>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.4)",
                      }}>
                        <span style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#10b981",
                        }} />
                        Aktywny
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{
                      display: "flex",
                      gap: "8px",
                      opacity: isHovered ? 1 : 0.6,
                      transition: "opacity 0.3s",
                    }}>
                      <input
                        type="file"
                        accept="image/*"
                        ref={(el) => (fileInputRefs.current[chiropractor] = el)}
                        onChange={(e) => handleImageUpload(chiropractor, e)}
                        style={{ display: "none" }}
                      />
                      <button
                        onClick={() => fileInputRefs.current[chiropractor]?.click()}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "rgba(255,255,255,0.05)",
                          color: "rgba(255,255,255,0.7)",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "all 0.2s",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(102, 126, 234, 0.15)";
                          e.currentTarget.style.borderColor = "rgba(102, 126, 234, 0.3)";
                          e.currentTarget.style.color = "#667eea";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                          e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                        }}
                      >
                        <ImageIcon />
                        {images[chiropractor] ? "Zmień" : "Zdjęcie"}
                      </button>
                      <button
                        onClick={() => handleDeleteChiropractor(chiropractor)}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          background: "rgba(239, 68, 68, 0.1)",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                          e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                          e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
                        }}
                      >
                        <TrashIcon />
                        Usuń
                      </button>
                    </div>
                  </div>
                );
              })}

              {chiropractors.length === 0 && (
                <div style={{
                  textAlign: "center",
                  padding: "48px 24px",
                  color: "rgba(255,255,255,0.4)",
                }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>👨‍⚕️</div>
                  <p style={{ margin: 0, fontSize: "15px" }}>
                    Brak chiropraktyków. Dodaj pierwszego powyżej.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, 20px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, -15px); }
        }
      `}</style>
    </div>
  );
}

export default SettingsModal;
