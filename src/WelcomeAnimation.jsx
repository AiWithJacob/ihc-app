import { useState, useEffect } from "react";

function WelcomeAnimation({ chiropractor, onComplete }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase(1), 100);
    const timer2 = setTimeout(() => setPhase(2), 500);
    const timer3 = setTimeout(() => setPhase(3), 900);
    const timer4 = setTimeout(() => onComplete(), 1800);

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
        {/* Gradient orbs */}
        <div style={{
          position: "absolute",
          top: "-30%",
          left: "-20%",
          width: "70%",
          height: "70%",
          background: "radial-gradient(circle, rgba(102, 126, 234, 0.4) 0%, transparent 70%)",
          filter: "blur(80px)",
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "scale(1)" : "scale(0.5)",
          transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1)",
          animation: phase >= 1 ? "float1 15s ease-in-out infinite" : "none",
        }} />
        <div style={{
          position: "absolute",
          bottom: "-30%",
          right: "-20%",
          width: "80%",
          height: "80%",
          background: "radial-gradient(circle, rgba(118, 75, 162, 0.4) 0%, transparent 70%)",
          filter: "blur(80px)",
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "scale(1)" : "scale(0.5)",
          transition: "all 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.2s",
          animation: phase >= 1 ? "float2 18s ease-in-out infinite" : "none",
        }} />
        <div style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          width: "50%",
          height: "50%",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)",
          filter: "blur(60px)",
          opacity: phase >= 2 ? 1 : 0,
          transform: "translate(-50%, -50%)",
          transition: "opacity 0.8s ease-out",
          animation: phase >= 2 ? "pulse 3s ease-in-out infinite" : "none",
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
        
        {/* Logo */}
        <div style={{
          width: "100px",
          height: "100px",
          borderRadius: "28px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 40px",
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "translateY(0) scale(1)" : "translateY(30px) scale(0.5)",
          transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: "0 20px 60px rgba(102, 126, 234, 0.5)",
        }}>
          <span style={{ fontSize: "48px", fontWeight: 800, color: "white" }}>SC</span>
        </div>

        {/* Main text */}
        <h1 style={{
          fontSize: "clamp(32px, 8vw, 64px)",
          fontWeight: 800,
          background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "20px",
          lineHeight: 1.2,
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
        }}>
          Witaj na stanowisku
        </h1>
        
        {/* Chiropractor name */}
        <div style={{
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        }}>
          <p style={{
            fontSize: "clamp(18px, 4vw, 28px)",
            color: "rgba(255, 255, 255, 0.6)",
            margin: 0,
            fontWeight: 500,
          }}>
            Pracujesz z
          </p>
          <p style={{
            fontSize: "clamp(24px, 5vw, 40px)",
            fontWeight: 700,
            marginTop: "8px",
            background: "linear-gradient(135deg, #667eea 0%, #a78bfa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            {chiropractor}
          </p>
        </div>

        {/* Loading dots */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          marginTop: "48px",
          opacity: phase >= 3 ? 1 : 0,
          transition: "opacity 0.5s ease-out",
        }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                animation: "bounce 1.4s ease-in-out infinite",
                animationDelay: `${i * 0.16}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(30px, 30px) rotate(5deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-40px, -20px) rotate(-5deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.1); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}

export default WelcomeAnimation;
