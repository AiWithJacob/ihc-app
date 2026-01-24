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

  // Animacja pojawienia się przy załadowaniu
  useEffect(() => {
    setTimeout(() => {
      setIsAnimating(true);
    }, 0);
  }, []);

  // Załaduj zarejestrowanych użytkowników
  useEffect(() => {
    const stored = localStorage.getItem("registeredUsers");
    if (stored) {
      setTimeout(() => {
        setRegisteredUsers(JSON.parse(stored));
      }, 0);
    }
  }, []);

  const handleRegister = (e) => {
    e.preventDefault();
    
    // Sprawdź czy użytkownik już istnieje
    const existingUser = registeredUsers.find(
      (u) => u.email === formData.email || u.login === formData.login
    );
    if (existingUser) {
      alert("Użytkownik o tym emailu lub loginie już istnieje!");
      return;
    }

    // Zapisanie danych użytkownika (bez chiropraktyka)
    const userData = {
      ...formData,
      id: Date.now(),
      isLoggedIn: true,
      chiropractor: null, // Będzie wybrany później
    };

    // Zapisz do listy zarejestrowanych użytkowników
    const updatedUsers = [...registeredUsers, userData];
    localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers));
    setRegisteredUsers(updatedUsers);
    
    // Zapisanie aktualnego użytkownika
    localStorage.setItem("user", JSON.stringify(userData));
    
    // Przejście do wyboru chiropraktyka
    onLogin(userData);
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

    // Przywróć pełne dane użytkownika
    const userData = {
      ...selectedUser,
      isLoggedIn: true,
    };
    localStorage.setItem("user", JSON.stringify(userData));
    onLogin(userData);
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
        position: "relative",
        overflow: "visible",
        overflowX: "hidden",
        overflowY: "auto",
      }}
    >
      {/* Efekt tła */}
      <div
        style={{
          position: "absolute",
          top: "-50%",
          left: "-50%",
          width: "200%",
          height: "200%",
          background: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
          animation: "float 20s infinite linear",
        }}
      />
      
      <div
        style={{
          background: "#1a1a1a",
          borderRadius: "20px",
          padding: "60px clamp(20px, 5vw, 50px)",
          width: "100%",
          maxWidth: "650px",
          minWidth: "280px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          position: "relative",
          zIndex: 1,
          opacity: isAnimating ? 1 : 0,
          borderTop: "3px solid rgba(102, 126, 234, 0.8)",
          transform: isAnimating ? "translateY(0) scale(1)" : "translateY(30px) scale(0.95)",
          transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
          overflow: "visible",
          boxSizing: "border-box",
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
        }}
      >
        {/* Nagłówek "Witaj w Super Chiro" */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "40px",
            overflow: "visible",
            padding: "0 20px",
            boxSizing: "border-box",
            marginLeft: "-10px",
            marginRight: "-10px",
            width: "calc(100% + 20px)",
          }}
        >
        <h1
          style={{
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontSize: "clamp(24px, 5.5vw, 48px)",
              fontWeight: 900,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              margin: 0,
              letterSpacing: "0px",
              padding: "0 15px",
              textShadow: "0 0 30px rgba(102, 126, 234, 0.3)",
              animation: "glow 2s ease-in-out infinite alternate",
              overflow: "visible",
              wordWrap: "break-word",
              lineHeight: "1.3",
              whiteSpace: "normal",
              display: "block",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            Witaj w Super Chiro
          </h1>
          <div
            style={{
              width: "100px",
              height: "4px",
              background: "linear-gradient(90deg, transparent, #667eea, transparent)",
              margin: "15px auto 0",
              borderRadius: "2px",
            }}
          />
        </div>

        {/* Przełącznik trybu */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "30px",
            background: "#222",
            padding: "4px",
            borderRadius: "8px",
          }}
        >
          <button
            type="button"
            onClick={() => setIsRegisterMode(false)}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "6px",
              border: "none",
              background: !isRegisterMode ? "#2563eb" : "transparent",
              color: "white",
              cursor: "pointer",
              fontSize: "20px",
              fontWeight: 600,
              transition: "all 0.3s",
            }}
          >
            Zaloguj się
          </button>
          <button
            type="button"
            onClick={() => setIsRegisterMode(true)}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "6px",
              border: "none",
              background: isRegisterMode ? "#2563eb" : "transparent",
              color: "white",
              cursor: "pointer",
              fontSize: "20px",
              fontWeight: 600,
              transition: "all 0.3s",
            }}
          >
            Rejestracja
          </button>
        </div>

        {!isRegisterMode ? (
          /* Tryb szybkiego logowania */
          <div>
            {registeredUsers.length > 0 ? (
              <>
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#ccc",
                      marginBottom: "8px",
                      fontSize: "18px",
                      fontWeight: 500,
                    }}
                  >
                    Wybierz użytkownika
                  </label>
                  <select
                    value={selectedUser?.id || ""}
                    onChange={(e) => {
                      const user = registeredUsers.find((u) => u.id === parseInt(e.target.value));
                      setSelectedUser(user);
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #444",
                      background: "#222",
                      color: "white",
                      fontSize: "16px",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="">-- Wybierz użytkownika --</option>
                    {registeredUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.login} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: "30px" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#ccc",
                      marginBottom: "8px",
                      fontSize: "18px",
                      fontWeight: 500,
                    }}
                  >
                    Hasło
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #444",
                      background: "#222",
                      color: "white",
                      fontSize: "16px",
                      boxSizing: "border-box",
                      transition: "all 0.3s",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#667eea";
                      e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#444";
                      e.target.style.boxShadow = "none";
                    }}
                    placeholder="Wprowadź hasło"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleQuickLogin}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "none",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    fontSize: "20px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.3s",
                    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.6)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
                  }}
                >
                  Zaloguj się
                </button>
              </>
            ) : (
              <div style={{ textAlign: "center", color: "#888", padding: "20px" }}>
                <p>Brak zarejestrowanych użytkowników.</p>
                <p>Przejdź do rejestracji, aby utworzyć konto.</p>
              </div>
            )}
          </div>
        ) : (
          /* Tryb rejestracji */
          <form onSubmit={handleRegister}>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                color: "#ccc",
                marginBottom: "8px",
                fontSize: "18px",
                fontWeight: 500,
              }}
            >
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #444",
                background: "#222",
                color: "white",
                fontSize: "16px",
                boxSizing: "border-box",
                transition: "all 0.3s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#444";
                e.target.style.boxShadow = "none";
              }}
              placeholder="twoj@email.com"
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                color: "#ccc",
                marginBottom: "8px",
                fontSize: "18px",
                fontWeight: 500,
              }}
            >
              Login
            </label>
            <input
              type="text"
              required
              value={formData.login}
              onChange={(e) =>
                setFormData({ ...formData, login: e.target.value })
              }
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #444",
                background: "#222",
                color: "white",
                fontSize: "16px",
                boxSizing: "border-box",
                transition: "all 0.3s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#444";
                e.target.style.boxShadow = "none";
              }}
              placeholder="Twój login"
            />
          </div>

          <div style={{ marginBottom: "30px" }}>
            <label
              style={{
                display: "block",
                color: "#ccc",
                marginBottom: "8px",
                fontSize: "18px",
                fontWeight: 500,
              }}
            >
              Hasło
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #444",
                background: "#222",
                color: "white",
                fontSize: "16px",
                boxSizing: "border-box",
                transition: "all 0.3s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#444";
                e.target.style.boxShadow = "none";
              }}
              placeholder="Twoje hasło"
            />
          </div>

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                fontSize: "20px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s",
                boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.6)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
              }}
            >
              Zarejestruj się
            </button>
          </form>
        )}
      </div>

      <style>{`
        @keyframes float {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        @keyframes glow {
          0% { filter: drop-shadow(0 0 5px rgba(102, 126, 234, 0.5)); }
          100% { filter: drop-shadow(0 0 20px rgba(102, 126, 234, 0.8)); }
        }
      `}</style>
    </div>
  );
}

export default LoginPage;
