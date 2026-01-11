import { useState, useRef } from "react";

function SettingsModal({ isOpen, onClose, chiropractors, images, onUpdate }) {
  const [newChiropractorName, setNewChiropractorName] = useState("");
  const fileInputRefs = useRef({});

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

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#1a1a1a",
          borderRadius: "20px",
          padding: "40px",
          width: "90%",
          maxWidth: "600px",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
          }}
        >
          <h2
            style={{
              color: "white",
              fontSize: "28px",
              fontWeight: 700,
              margin: 0,
            }}
          >
            Ustawienia chiropraktyków
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "white",
              fontSize: "32px",
              cursor: "pointer",
              padding: "0",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Dodaj nowego chiropraktyka */}
        <div style={{ marginBottom: "30px" }}>
          <label
            style={{
              display: "block",
              color: "#ccc",
              marginBottom: "10px",
              fontSize: "16px",
            }}
          >
            Dodaj nowego chiropraktyka
          </label>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              value={newChiropractorName}
              onChange={(e) => setNewChiropractorName(e.target.value)}
              placeholder="Nazwa chiropraktyka"
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #444",
                background: "#222",
                color: "white",
                fontSize: "16px",
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddChiropractor();
                }
              }}
            />
            <button
              onClick={handleAddChiropractor}
              style={{
                padding: "12px 24px",
                borderRadius: "8px",
                border: "none",
                background: "#2563eb",
                color: "white",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Dodaj
            </button>
          </div>
        </div>

        {/* Lista chiropraktyków */}
        <div>
          <h3
            style={{
              color: "white",
              fontSize: "20px",
              marginBottom: "20px",
            }}
          >
            Chiropraktycy ({chiropractors.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {chiropractors.map((chiropractor) => (
              <div
                key={chiropractor}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  padding: "20px",
                  background: "#222",
                  borderRadius: "12px",
                }}
              >
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "2px solid #444",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#333",
                    flexShrink: 0,
                  }}
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
                    <span style={{ color: "#888", fontSize: "14px" }}>
                      {chiropractor.charAt(0)}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      color: "white",
                      fontSize: "18px",
                      fontWeight: 600,
                      marginBottom: "8px",
                    }}
                  >
                    {chiropractor}
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
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
                        padding: "8px 16px",
                        borderRadius: "6px",
                        border: "1px solid #444",
                        background: "#333",
                        color: "white",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      {images[chiropractor] ? "Zmień zdjęcie" : "Dodaj zdjęcie"}
                    </button>
                    <button
                      onClick={() => handleDeleteChiropractor(chiropractor)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "6px",
                        border: "1px solid #dc2626",
                        background: "#dc2626",
                        color: "white",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      Usuń
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
