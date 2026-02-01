import { useState, useEffect } from "react";

function LoginPage({ onLogin }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    login: "",
  });
  const [loginFormData, setLoginFormData] = useState({
    login: "",
    password: "",
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    setTimeout(() => setIsAnimating(true), 100);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isRegistering) return;

    const API_URL = import.meta.env.VITE_API_URL ||
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "https://ihc-app.vercel.app"
        : window.location.origin);

    setIsRegistering(true);
    setLoginError("");
    
    try {
      const r = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: formData.login.trim(),
          email: formData.email.trim(),
          password: formData.password,
        }),
      });
      const data = await r.json().catch(() => ({}));
      
      if (r.ok && data.id != null) {
        const userData = {
          id: data.id,
          login: formData.login.trim(),
          email: formData.email.trim(),
          isLoggedIn: true,
          chiropractor: null,
        };
        localStorage.setItem("user", JSON.stringify(userData));
        onLogin(userData);
      } else {
        if (r.status === 409) {
          setLoginError("Użytkownik o tym loginie lub emailu już istnieje.");
        } else {
          setLoginError(data?.error || "Serwer niedostępny. Spróbuj później.");
        }
      }
    } catch (err) {
      console.error("Rejestracja — błąd połączenia:", err);
      setLoginError("Błąd połączenia. Serwer może być niedostępny.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoggingIn) return;

    if (!loginFormData.login.trim()) {
      setLoginError("Wprowadź login!");
      return;
    }
    if (!loginFormData.password) {
      setLoginError("Wprowadź hasło!");
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL ||
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "https://ihc-app.vercel.app"
        : window.location.origin);

    setIsLoggingIn(true);
    setLoginError("");

    try {
      const r = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: loginFormData.login.trim(),
          password: loginFormData.password,
        }),
      });
      const data = await r.json().catch(() => ({}));

      if (r.ok && data.success && data.user) {
        const userData = {
          id: data.user.id,
          login: data.user.login,
          email: data.user.email,
          isLoggedIn: true,
          chiropractor: null,
        };
        localStorage.setItem("user", JSON.stringify(userData));
        onLogin(userData);
      } else {
        setLoginError(data?.error || "Nieprawidłowy login lub hasło");
      }
    } catch (err) {
      console.error("Logowanie — błąd połączenia:", err);
      setLoginError("Błąd połączenia. Serwer może być niedostępny.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Ikony SVG
  const EmailIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );

  const UserIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );

  const LockIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );

  const inputStyle = (isFocused) => ({
    width: "100%",
    padding: "14px 14px 14px 48px",
    borderRadius: "12px",
    border: `2px solid ${isFocused ? "#667eea" : "rgba(255,255,255,0.1)"}`,
    background: "rgba(255,255,255,0.05)",
    color: "white",
    fontSize: "16px",
    boxSizing: "border-box",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    outline: "none",
    boxShadow: isFocused ? "0 0 0 4px rgba(102, 126, 234, 0.15)" : "none",
  });

  const iconStyle = (isFocused) => ({
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    color: isFocused ? "#667eea" : "rgba(255,255,255,0.4)",
    transition: "color 0.3s",
    pointerEvents: "none",
  });

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      background: "#0a0a0f",
      position: "relative",
      overflow: "hidden",
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
          top: "40%",
          right: "20%",
          width: "30%",
          height: "30%",
          background: "radial-gradient(circle, rgba(240, 147, 251, 0.2) 0%, transparent 70%)",
          filter: "blur(40px)",
          animation: "float3 12s ease-in-out infinite",
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

      {/* Left side - Hero */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px",
        position: "relative",
        zIndex: 1,
      }}
      className="hide-on-mobile"
      >
        <div style={{
          opacity: isAnimating ? 1 : 0,
          transform: isAnimating ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          textAlign: "center",
          maxWidth: "500px",
        }}>
          {/* Logo */}
          <div style={{
            width: "100px",
            height: "100px",
            borderRadius: "24px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 40px",
            boxShadow: "0 20px 60px rgba(102, 126, 234, 0.4)",
            animation: "pulse 3s ease-in-out infinite",
          }}>
            <span style={{ fontSize: "48px", fontWeight: 800, color: "white" }}>SC</span>
          </div>

          <h1 style={{
            fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: 800,
            background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "20px",
            lineHeight: 1.2,
          }}>
            Super Chiro
          </h1>

          <p style={{
            fontSize: "18px",
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.6,
            marginBottom: "40px",
          }}>
            Nowoczesny system zarządzania klientami dla profesjonalistów. 
            Szybki, intuicyjny i zawsze pod ręką.
          </p>

          {/* Stats */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "40px",
          }}>
            {[
              { value: "500+", label: "Klientów" },
              { value: "99%", label: "Uptime" },
              { value: "24/7", label: "Wsparcie" },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>{stat.value}</div>
                <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{
          width: "100%",
          maxWidth: "440px",
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "48px 40px",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 25px 80px rgba(0,0,0,0.4)",
          opacity: isAnimating ? 1 : 0,
          transform: isAnimating ? "translateY(0) scale(1)" : "translateY(30px) scale(0.95)",
          transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s",
        }}>
          
          {/* Mobile logo */}
          <div className="show-on-mobile" style={{
            textAlign: "center",
            marginBottom: "32px",
          }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              boxShadow: "0 10px 40px rgba(102, 126, 234, 0.4)",
            }}>
              <span style={{ fontSize: "28px", fontWeight: 800, color: "white" }}>SC</span>
            </div>
            <h2 style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "white",
            }}>Super Chiro</h2>
          </div>

          {/* Header */}
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "white",
              marginBottom: "8px",
            }}>
              {isRegisterMode ? "Utwórz konto" : "Witaj ponownie"}
            </h2>
            <p style={{
              fontSize: "15px",
              color: "rgba(255,255,255,0.5)",
            }}>
              {isRegisterMode 
                ? "Wypełnij formularz aby się zarejestrować" 
                : "Zaloguj się do swojego konta"}
            </p>
          </div>

          {/* Toggle buttons */}
          <div style={{
            display: "flex",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "12px",
            padding: "4px",
            marginBottom: "32px",
          }}>
            {["Logowanie", "Rejestracja"].map((label, i) => {
              const isActive = i === 0 ? !isRegisterMode : isRegisterMode;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(i === 1);
                    setLoginError("");
                  }}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background: isActive 
                      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
                      : "transparent",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.3s",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Error message */}
          {loginError && (
            <div style={{
              padding: "12px 16px",
              marginBottom: "20px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "10px",
              color: "#ef4444",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {loginError}
            </div>
          )}

          {!isRegisterMode ? (
            // Login form
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "block",
                  color: "rgba(255,255,255,0.7)",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                }}>
                  Login
                </label>
                <div style={{ position: "relative" }}>
                  <div style={iconStyle(focusedField === 'loginField')}>
                    <UserIcon />
                  </div>
                  <input
                    type="text"
                    value={loginFormData.login}
                    onChange={(e) => setLoginFormData({ ...loginFormData, login: e.target.value })}
                    onFocus={() => setFocusedField('loginField')}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle(focusedField === 'loginField')}
                    placeholder="Wprowadź swój login"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div style={{ marginBottom: "28px" }}>
                <label style={{
                  display: "block",
                  color: "rgba(255,255,255,0.7)",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                }}>
                  Hasło
                </label>
                <div style={{ position: "relative" }}>
                  <div style={iconStyle(focusedField === 'password')}>
                    <LockIcon />
                  </div>
                  <input
                    type="password"
                    value={loginFormData.password}
                    onChange={(e) => setLoginFormData({ ...loginFormData, password: e.target.value })}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle(focusedField === 'password')}
                    placeholder="Wprowadź hasło"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "none",
                  background: isLoggingIn
                    ? "rgba(102, 126, 234, 0.5)"
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: isLoggingIn ? "wait" : "pointer",
                  transition: "all 0.3s",
                  boxShadow: "0 8px 30px rgba(102, 126, 234, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
                onMouseEnter={(e) => {
                  if (isLoggingIn) return;
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 12px 40px rgba(102, 126, 234, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 8px 30px rgba(102, 126, 234, 0.4)";
                }}
              >
                {isLoggingIn && (
                  <div style={{
                    width: "18px",
                    height: "18px",
                    border: "2px solid transparent",
                    borderTopColor: "white",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }} />
                )}
                {isLoggingIn ? "Logowanie..." : "Zaloguj się"}
              </button>
            </form>
          ) : (
            // Register form
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "block",
                  color: "rgba(255,255,255,0.7)",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                }}>
                  Email
                </label>
                <div style={{ position: "relative" }}>
                  <div style={iconStyle(focusedField === 'email')}>
                    <EmailIcon />
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle(focusedField === 'email')}
                    placeholder="twoj@email.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "block",
                  color: "rgba(255,255,255,0.7)",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                }}>
                  Login
                </label>
                <div style={{ position: "relative" }}>
                  <div style={iconStyle(focusedField === 'login')}>
                    <UserIcon />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.login}
                    onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                    onFocus={() => setFocusedField('login')}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle(focusedField === 'login')}
                    placeholder="Twój login"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div style={{ marginBottom: "28px" }}>
                <label style={{
                  display: "block",
                  color: "rgba(255,255,255,0.7)",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                }}>
                  Hasło
                </label>
                <div style={{ position: "relative" }}>
                  <div style={iconStyle(focusedField === 'regPassword')}>
                    <LockIcon />
                  </div>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    onFocus={() => setFocusedField('regPassword')}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle(focusedField === 'regPassword')}
                    placeholder="Minimum 6 znaków"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isRegistering}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "none",
                  background: isRegistering
                    ? "rgba(102, 126, 234, 0.5)"
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: isRegistering ? "wait" : "pointer",
                  transition: "all 0.3s",
                  boxShadow: "0 8px 30px rgba(102, 126, 234, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
                onMouseEnter={(e) => {
                  if (isRegistering) return;
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 12px 40px rgba(102, 126, 234, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 8px 30px rgba(102, 126, 234, 0.4)";
                }}
              >
                {isRegistering && (
                  <div style={{
                    width: "18px",
                    height: "18px",
                    border: "2px solid transparent",
                    borderTopColor: "white",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }} />
                )}
                {isRegistering ? "Rejestracja..." : "Utwórz konto"}
              </button>
            </form>
          )}
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
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -30px); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 20px 60px rgba(102, 126, 234, 0.4); }
          50% { box-shadow: 0 20px 80px rgba(102, 126, 234, 0.6); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .hide-on-mobile {
          display: flex;
        }
        .show-on-mobile {
          display: none;
        }
        
        @media (max-width: 900px) {
          .hide-on-mobile {
            display: none !important;
          }
          .show-on-mobile {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}

export default LoginPage;
