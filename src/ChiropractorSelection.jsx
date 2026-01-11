import { useState, useEffect } from "react";
import SettingsModal from "./SettingsModal.jsx";

function ChiropractorSelection({ onSelect, currentChiropractor, currentImage }) {
  const [selectedChiropractor, setSelectedChiropractor] = useState(currentChiropractor || null);
  const [chiropractors, setChiropractors] = useState(["Krzysztof", "Kamil"]);
  const [images, setImages] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animacja pojawienia się przy załadowaniu
  useEffect(() => {
    // Krótkie opóźnienie, aby animacja działała po renderowaniu
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []); // Tylko przy montowaniu komponentu

  // Załaduj listę chiropraktyków i zdjęcia
  useEffect(() => {
    const storedChiropractors = localStorage.getItem("chiropractors");
    if (storedChiropractors) {
      setTimeout(() => {
        setChiropractors(JSON.parse(storedChiropractors));
      }, 0);
    }
    
    const storedImages = localStorage.getItem("chiropractorImages");
    if (storedImages) {
      const savedImages = JSON.parse(storedImages);
      setTimeout(() => {
        setImages(savedImages);
      }, 0);
    }
    
    // Jeśli użytkownik ma już wybranego chiropraktyka, ustaw go jako wybranego
    if (currentChiropractor) {
      setTimeout(() => {
        setSelectedChiropractor(currentChiropractor);
        // Jeśli jest zdjęcie w profilu użytkownika, użyj go
        if (currentImage) {
          setImages(prev => ({
            ...prev,
            [currentChiropractor]: currentImage
          }));
        }
      }, 0);
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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#1a1a1a",
          borderRadius: "20px",
          padding: "40px",
          width: "100%",
          maxWidth: "700px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          position: "relative",
          opacity: isAnimating ? 1 : 0,
          transform: isAnimating ? "translateY(0) scale(1)" : "translateY(30px) scale(0.95)",
          transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Przycisk ustawień w prawym górnym rogu */}
        <button
          onClick={() => setShowSettings(true)}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "1px solid #444",
            background: "#333",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            transition: "all 0.3s",
          }}
          onMouseOver={(e) => {
            e.target.style.background = "#444";
            e.target.style.transform = "rotate(90deg)";
          }}
          onMouseOut={(e) => {
            e.target.style.background = "#333";
            e.target.style.transform = "rotate(0deg)";
          }}
        >
          ⚙️
        </button>

        <h1
          style={{
            color: "white",
            textAlign: "center",
            marginBottom: "40px",
            fontSize: "32px",
            fontWeight: 700,
          }}
        >
          Wybierz chiropraktyka
        </h1>

        <div
          style={{
            display: "flex",
            gap: "40px",
            justifyContent: "center",
            alignItems: "flex-start",
            marginBottom: "40px",
            flexWrap: "wrap",
          }}
        >
          {chiropractors.map((chiropractor) => (
            <div
              key={chiropractor}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "15px",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "200px",
                  height: "200px",
                  borderRadius: "50%",
                  border: selectedChiropractor === chiropractor ? "4px solid #2563eb" : "2px solid #444",
                  background: selectedChiropractor === chiropractor ? "#2563eb" : "#222",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  overflow: "hidden",
                  boxShadow: selectedChiropractor === chiropractor ? "0 0 30px rgba(37, 99, 235, 0.6)" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={() => handleSelect(chiropractor)}
              >
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
                  <span
                    style={{
                      color: "white",
                      fontSize: "24px",
                      fontWeight: 600,
                    }}
                  >
                    {chiropractor.charAt(0)}
                  </span>
                )}
              </div>
              {/* Nazwa chiropraktyka pod zdjęciem */}
              <div
                style={{
                  color: "white",
                  fontSize: "20px",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                {chiropractor}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "8px",
            border: "none",
            background: "#2563eb",
            color: "white",
            fontSize: "18px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.3s",
          }}
          onMouseOver={(e) => (e.target.style.background = "#1d4ed8")}
          onMouseOut={(e) => (e.target.style.background = "#2563eb")}
        >
          Kontynuuj
        </button>
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        chiropractors={chiropractors}
        images={images}
        onUpdate={handleSettingsUpdate}
      />
    </div>
  );
}

export default ChiropractorSelection;
