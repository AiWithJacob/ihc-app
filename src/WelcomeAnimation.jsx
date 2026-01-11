import { useState, useEffect } from "react";

function WelcomeAnimation({ chiropractor, onComplete }) {
  const [scale, setScale] = useState(0.3);
  const [opacity, setOpacity] = useState(0);
  const [showChiropractor, setShowChiropractor] = useState(false);

  useEffect(() => {
    // Opóźnienie przed pojawieniem się
    const timer1 = setTimeout(() => {
      setOpacity(1);
    }, 200);

    // Animacja powiększania głównego tekstu
    const timer2 = setTimeout(() => {
      setScale(1);
    }, 400);

    // Pojawienie się nazwiska chiropraktyka
    const timer3 = setTimeout(() => {
      setShowChiropractor(true);
    }, 1200);

    // Zakończenie animacji po 3 sekundach
    const timer4 = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        opacity: opacity,
        transition: "opacity 0.5s ease-in",
        overflow: "visible",
        padding: "40px",
      }}
    >
      {/* Efekt cząsteczek w tle */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
          animation: "particles 20s infinite linear",
        }}
      />

      <div
        style={{
          textAlign: "center",
          transform: `scale(${scale})`,
          transition: "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
          position: "relative",
          zIndex: 1,
          overflow: "visible",
          width: "100%",
          maxWidth: "95vw",
          padding: "0 20px",
          boxSizing: "border-box",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(28px, 7vw, 56px)",
            color: "#ffffff",
            fontWeight: 900,
            marginBottom: "30px",
            textShadow: "0 0 40px rgba(255, 255, 255, 0.5), 0 2px 10px rgba(0, 0, 0, 0.3)",
            letterSpacing: "0px",
            fontFamily: "'Segoe UI', 'Arial Black', 'Helvetica Neue', sans-serif",
            overflow: "visible",
            wordWrap: "break-word",
            lineHeight: "1.3",
            padding: "0 30px",
            margin: "0 auto",
            maxWidth: "100%",
            boxSizing: "border-box",
            whiteSpace: "normal",
            display: "block",
          }}
        >
          Witaj na stanowisku
        </h1>
        
        <div
          style={{
            opacity: showChiropractor ? 1 : 0,
            transform: showChiropractor ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.6s ease-out",
          }}
        >
          <p
            style={{
              fontSize: "32px",
              color: "rgba(255, 255, 255, 0.9)",
              marginTop: "20px",
              fontWeight: 600,
              textShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
            }}
          >
            Pracujesz z <span style={{ color: "#fff", fontWeight: 700 }}>{chiropractor}</span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes particles {
          0% { transform: translate(0, 0); }
          100% { transform: translate(30px, 30px); }
        }
      `}</style>
    </div>
  );
}

export default WelcomeAnimation;
