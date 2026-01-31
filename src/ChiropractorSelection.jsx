import { useState, useEffect } from "react";
import SettingsModal from "./SettingsModal.jsx";

function ChiropractorSelection({ onSelect, currentChiropractor, currentImage }) {
  const [selectedChiropractor, setSelectedChiropractor] = useState(currentChiropractor || null);
  const [chiropractors, setChiropractors] = useState(["Krzysztof", "Kamil"]);
  const [images, setImages] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const storedChiropractors = localStorage.getItem("chiropractors");
    if (storedChiropractors) {
      setChiropractors(JSON.parse(storedChiropractors));
    }
    
    const storedImages = localStorage.getItem("chiropractorImages");
    if (storedImages) {
      setImages(JSON.parse(storedImages));
    }
    
    if (currentChiropractor) {
      setSelectedChiropractor(currentChiropractor);
      if (currentImage) {
        setImages(prev => ({
          ...prev,
          [currentChiropractor]: currentImage
        }));
      }
    }
  }, [currentChiropractor, currentImage]);

  const handleSettingsUpdate = (updatedChiropractors, updatedImages) => {
    setChiropractors(updatedChiropractors);
    setImages(updatedImages);
  };

  const handleSelect = (chiropractor) => {
    setSelectedChiropractor(chiropractor);
  };

  const handleConfirm = () => {
    if (!selectedChiropractor) {
      alert("Wybierz chiropraktyka!");
      return;
    }
    onSelect(selectedChiropractor, images[selectedChiropractor]);
  };

  // Ikona ustawień
  const SettingsIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0a0a0f",
      position: "relative",
      overflow: "hidden",
      padding: "20px",
    }}>
      
      {/* Animated background */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {/* Gradient orbs */}
        <div style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: "50%",
          height: "50%",
          background: "radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "float1 15s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: "60%",
          height: "60%",
          background: "radial-gradient(circle, rgba(118, 75, 162, 0.3) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "float2 18s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "40%",
          height: "40%",
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)",
          filter: "blur(50px)",
          animation: "float3 12s ease-in-out infinite",
          transform: "translate(-50%, -50%)",
        }} />
        
        {/* Grid pattern */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }} />
      </div>

      {/* Main content */}
      <div style={{
        width: "100%",
        maxWidth: "800px",
        position: "relative",
        zIndex: 1,
      }}>
        
        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "48px 40px",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 25px 80px rgba(0,0,0,0.4)",
          opacity: isAnimating ? 1 : 0,
          transform: isAnimating ? "translateY(0) scale(1)" : "translateY(30px) scale(0.95)",
          transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
        }}>
          
          {/* Settings button */}
          <button
            onClick={() => setShowSettings(true)}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(102, 126, 234, 0.2)";
              e.currentTarget.style.borderColor = "rgba(102, 126, 234, 0.4)";
              e.currentTarget.style.color = "#667eea";
              e.currentTarget.style.transform = "rotate(45deg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "rgba(255,255,255,0.6)";
              e.currentTarget.style.transform = "rotate(0deg)";
            }}
          >
            <SettingsIcon />
          </button>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 10px 40px rgba(102, 126, 234, 0.4)",
              animation: "pulse 3s ease-in-out infinite",
            }}>
              <span style={{ fontSize: "28px" }}>👨‍⚕️</span>
            </div>
            
            <h1 style={{
              fontSize: "clamp(24px, 5vw, 32px)",
              fontWeight: 700,
              background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "12px",
            }}>
              Wybierz chiropraktyka
            </h1>
            
            <p style={{
              fontSize: "16px",
              color: "rgba(255,255,255,0.5)",
            }}>
              Kliknij na osobę, z którą chcesz pracować
            </p>
          </div>

          {/* Chiropractors grid */}
          <div style={{
            display: "flex",
            gap: "24px",
            justifyContent: "center",
            alignItems: "stretch",
            marginBottom: "40px",
            flexWrap: "wrap",
          }}>
            {chiropractors.map((chiropractor, index) => {
              const isSelected = selectedChiropractor === chiropractor;
              const isHovered = hoveredCard === chiropractor;
              
              return (
                <div
                  key={chiropractor}
                  onClick={() => handleSelect(chiropractor)}
                  onMouseEnter={() => setHoveredCard(chiropractor)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "24px",
                    borderRadius: "20px",
                    border: `2px solid ${isSelected ? "#667eea" : "rgba(255,255,255,0.08)"}`,
                    background: isSelected 
                      ? "rgba(102, 126, 234, 0.1)" 
                      : "rgba(255,255,255,0.02)",
                    cursor: "pointer",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: isHovered ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
                    boxShadow: isSelected 
                      ? "0 20px 50px rgba(102, 126, 234, 0.3)" 
                      : isHovered 
                        ? "0 15px 40px rgba(0,0,0,0.3)"
                        : "none",
                    opacity: isAnimating ? 1 : 0,
                    transitionDelay: `${index * 0.1}s`,
                    minWidth: "180px",
                    flex: "1 1 180px",
                    maxWidth: "220px",
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    position: "relative",
                    width: "120px",
                    height: "120px",
                    borderRadius: "50%",
                    marginBottom: "16px",
                    overflow: "hidden",
                    border: `3px solid ${isSelected ? "#667eea" : "rgba(255,255,255,0.1)"}`,
                    transition: "all 0.3s",
                    boxShadow: isSelected 
                      ? "0 0 30px rgba(102, 126, 234, 0.5)" 
                      : "0 10px 30px rgba(0,0,0,0.3)",
                  }}>
                    {images[chiropractor] ? (
                      <img
                        src={images[chiropractor]}
                        alt={chiropractor}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transition: "transform 0.4s",
                          transform: isHovered ? "scale(1.1)" : "scale(1)",
                        }}
                      />
                    ) : (
                      <div style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isSelected 
                          ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                          : "linear-gradient(135deg, #374151 0%, #1f2937 100%)",
                        fontSize: "42px",
                        fontWeight: 700,
                        color: "white",
                        transition: "all 0.3s",
                      }}>
                        {chiropractor.charAt(0)}
                      </div>
                    )}
                    
                    {/* Selection indicator */}
                    {isSelected && (
                      <div style={{
                        position: "absolute",
                        bottom: "4px",
                        right: "4px",
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
                        border: "2px solid #0a0a0f",
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Name */}
                  <div style={{
                    color: "white",
                    fontSize: "18px",
                    fontWeight: 600,
                    textAlign: "center",
                    marginBottom: "4px",
                  }}>
                    {chiropractor}
                  </div>
                  
                  {/* Status */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.4)",
                  }}>
                    <span style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#10b981",
                      animation: "blink 2s ease-in-out infinite",
                    }} />
                    Dostępny
                  </div>
                </div>
              );
            })}
          </div>

          {/* Confirm button */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedChiropractor}
            style={{
              width: "100%",
              padding: "18px",
              borderRadius: "14px",
              border: "none",
              background: selectedChiropractor 
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                : "rgba(255,255,255,0.1)",
              color: selectedChiropractor ? "white" : "rgba(255,255,255,0.3)",
              fontSize: "17px",
              fontWeight: 600,
              cursor: selectedChiropractor ? "pointer" : "not-allowed",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: selectedChiropractor 
                ? "0 10px 40px rgba(102, 126, 234, 0.4)"
                : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
            onMouseEnter={(e) => {
              if (!selectedChiropractor) return;
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 15px 50px rgba(102, 126, 234, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = selectedChiropractor 
                ? "0 10px 40px rgba(102, 126, 234, 0.4)"
                : "none";
            }}
          >
            {selectedChiropractor ? (
              <>
                Kontynuuj jako {selectedChiropractor}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </>
            ) : (
              "Wybierz chiropraktyka aby kontynuować"
            )}
          </button>
        </div>
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        chiropractors={chiropractors}
        images={images}
        onUpdate={handleSettingsUpdate}
      />

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
          0%, 100% { transform: translate(-50%, -50%); }
          50% { transform: translate(calc(-50% + 20px), calc(-50% - 30px)); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 10px 40px rgba(102, 126, 234, 0.4); }
          50% { box-shadow: 0 10px 60px rgba(102, 126, 234, 0.6); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default ChiropractorSelection;
