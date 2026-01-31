import { useState, useEffect } from "react";

function LoginPage({ onLogin }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    login: "",
  });
  const [loginPassword, setLoginPassword] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    setTimeout(() => setIsAnimating(true), 100);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("registeredUsers");
    if (stored) {
      setRegisteredUsers(JSON.parse(stored));
    }
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isRegistering) return;

    const existingUser = registeredUsers.find(
      (u) => u.email === formData.email || u.login === formData.login
    );
    if (existingUser) {
      alert("Użytkownik o tym emailu lub loginie już istnieje!");
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL ||
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "https://ihc-app.vercel.app"
        : window.location.origin);

    setIsRegistering(true);
    let userData;
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
        userData = {
          id: data.id,
          login: formData.login.trim(),
          email: formData.email.trim(),
          password: formData.password,
          isLoggedIn: true,
          chiropractor: null,
        };
      } else {
        if (r.status === 409) {
          alert("Użytkownik o tym loginie lub emailu już istnieje w systemie.");
          return;
        }
        console.warn("Rejestracja — błąd API:", r.status, data);
        alert(data?.error || "Serwer niedostępny. Spróbuj później.");
        return;
      }
    } catch (err) {
      console.error("Rejestracja — błąd połączenia:", err);
      alert("Błąd połączenia. Serwer może być niedostępny.");
      return;
    } finally {
      setIsRegistering(false);
    }

    const updatedUsers = [...registeredUsers, userData];
    localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers));
    setRegisteredUsers(updatedUsers);
    localStorage.setItem("user", JSON.stringify(userData));
    onLogin(userData);
    fetch(`${API_URL}/api/user-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: userData.login }),
    }).catch(() => {});
  };

  const handleQuickLogin = () => {
    if (!selectedUser) {
      alert("Wybierz użytkownika!");
      return;
    }
    if (!loginPassword) {
      alert("Wprowadź hasło!");
      return;
    }
    if (selectedUser.password !== loginPassword) {
      alert("Nieprawidłowe hasło!");
      return;
    }

    const userData = { ...selectedUser, isLoggedIn: true };
    localStorage.setItem("user", JSON.stringify(userData));
    onLogin(userData);

    const API_URL = import.meta.env.VITE_API_URL ||
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "https://ihc-app.vercel.app"
        : window.location.origin);
    fetch(`${API_URL}/api/user-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: selectedUser.login }),
    }).catch(() => {});
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    if (!confirm(`Czy na pewno chcesz usunąć użytkownika „${selectedUser.login}"?`)) return;
    const updated = registeredUsers.filter((u) => u.id !== selectedUser.id);
    localStorage.setItem("registeredUsers", JSON.stringify(updated));
    setRegisteredUsers(updated);
    setSelectedUser(null);
    setLoginPassword("");
    try {
      const cur = JSON.parse(localStorage.getItem("user") || "{}");
      if (cur && cur.id === selectedUser.id) {
        localStorage.removeItem("user");
      }
    } catch (_) {}
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
                  onClick={() => setIsRegisterMode(i === 1)}
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

          {!isRegisterMode ? (
            // Login form
            <div>
              {registeredUsers.length > 0 ? (
                <>
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{
                      display: "block",
                      color: "rgba(255,255,255,0.7)",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}>
                      Użytkownik
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <div style={{ flex: 1, position: "relative" }}>
                        <div style={iconStyle(focusedField === 'user')}>
                          <UserIcon />
                        </div>
                        <select
                          value={selectedUser?.id || ""}
                          onChange={(e) => {
                            const user = registeredUsers.find((u) => u.id === parseInt(e.target.value));
                            setSelectedUser(user);
                          }}
                          onFocus={() => setFocusedField('user')}
                          onBlur={() => setFocusedField(null)}
                          style={{
                            ...inputStyle(focusedField === 'user'),
                            appearance: "none",
                            cursor: "pointer",
                          }}
                        >
                          <option value="">Wybierz użytkownika</option>
                          {registeredUsers.map((user) => (
                            <option key={user.id} value={user.id} style={{ background: "#1a1a2e", color: "white" }}>
                              {user.login}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleDeleteUser}
                        disabled={!selectedUser}
                        style={{
                          padding: "0 16px",
                          borderRadius: "12px",
                          border: "2px solid rgba(239, 68, 68, 0.3)",
                          background: "transparent",
                          color: "#ef4444",
                          fontSize: "18px",
                          cursor: selectedUser ? "pointer" : "not-allowed",
                          opacity: selectedUser ? 1 : 0.4,
                          transition: "all 0.3s",
                        }}
                        title="Usuń użytkownika"
                      >
                        🗑️
                      </button>
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
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuickLogin()}
                        style={inputStyle(focusedField === 'password')}
                        placeholder="Wprowadź hasło"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleQuickLogin}
                    style={{
                      width: "100%",
                      padding: "16px",
                      borderRadius: "12px",
                      border: "none",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                      fontSize: "16px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.3s",
                      boxShadow: "0 8px 30px rgba(102, 126, 234, 0.4)",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow = "0 12px 40px rgba(102, 126, 234, 0.5)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "0 8px 30px rgba(102, 126, 234, 0.4)";
                    }}
                  >
                    Zaloguj się
                  </button>
                </>
              ) : (
                <div style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "rgba(255,255,255,0.5)",
                }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>👤</div>
                  <p style={{ marginBottom: "8px" }}>Brak kont użytkowników</p>
                  <p style={{ fontSize: "14px" }}>Przejdź do rejestracji aby utworzyć konto</p>
                </div>
              )}
            </div>
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
        
        select option {
          background: #1a1a2e;
          color: white;
        }
      `}</style>
    </div>
  );
}

export default LoginPage;
