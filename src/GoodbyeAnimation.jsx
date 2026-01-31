import { useState, useEffect } from "react";

function GoodbyeAnimation({ onComplete }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase(1), 100);
    const timer2 = setTimeout(() => setPhase(2), 500);
    const timer3 = setTimeout(() => setPhase(3), 900);
    const timer4 = setTimeout(() => onComplete(), 1600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "#0a0a0f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000,
      overflow: "hidden",
    }}>
      
      {/* Animated background */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {/* Gradient orbs - warmer goodbye colors */}
        <div style={{
          position: "absolute",
          top: "-30%",
          right: "-20%",
          width: "70%",
          height: "70%",
          background: "radial-gradient(circle, rgba(251, 146, 60, 0.3) 0%, transparent 70%)",
          filter: "blur(80px)",
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "scale(1)" : "scale(0.5)",
          transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1)",
          animation: phase >= 1 ? "float1 15s ease-in-out infinite" : "none",
        }} />
        <div style={{
          position: "absolute",
          bottom: "-30%",
          left: "-20%",
          width: "80%",
          height: "80%",
          background: "radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)",
          filter: "blur(80px)",
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "scale(1)" : "scale(0.5)",
          transition: "all 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.2s",
          animation: phase >= 1 ? "float2 18s ease-in-out infinite" : "none",
        }} />
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "40%",
          height: "40%",
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%)",
          filter: "blur(60px)",
          opacity: phase >= 2 ? 1 : 0,
          transform: "translate(-50%, -50%)",
          transition: "opacity 0.8s ease-out",
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
          opacity: phase >= 1 ? 1 : 0,
          transition: "opacity 1s ease-out",
        }} />
      </div>

      {/* Content */}
      <div style={{
        textAlign: "center",
        position: "relative",
        zIndex: 1,
        padding: "40px",
      }}>
        
        {/* Icon */}
        <div style={{
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #f97316 0%, #ec4899 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 40px",
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "translateY(0) scale(1)" : "translateY(30px) scale(0.5)",
          transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: "0 20px 60px rgba(249, 115, 22, 0.4)",
        }}>
          <span style={{ fontSize: "48px" }}>👋</span>
        </div>

        {/* Main text */}
        <h1 style={{
          fontSize: "clamp(32px, 8vw, 64px)",
          fontWeight: 800,
          background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "16px",
          lineHeight: 1.2,
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
        }}>
          Dziękuję za pracę
        </h1>
        
        {/* Subtitle */}
        <p style={{
          fontSize: "clamp(20px, 5vw, 32px)",
          fontWeight: 600,
          background: "linear-gradient(135deg, #f97316 0%, #ec4899 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          margin: 0,
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        }}>
          Do zobaczenia!
        </p>

        {/* Animated wave */}
        <div style={{
          marginTop: "48px",
          opacity: phase >= 3 ? 1 : 0,
          transition: "opacity 0.5s ease-out",
        }}>
          <div style={{
            display: "inline-block",
            animation: "wave 1s ease-in-out infinite",
            fontSize: "40px",
          }}>
            ✨
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-30px, 30px) rotate(-5deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(40px, -20px) rotate(5deg); }
        }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-15deg) scale(1.1); }
          75% { transform: rotate(15deg) scale(1.1); }
        }
      `}</style>
    </div>
  );
}

export default GoodbyeAnimation;
