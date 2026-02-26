import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      try {
        const autoLogin = localStorage.getItem("autoLogin") === "true";
        const sessionAlive = sessionStorage.getItem("sessionAlive") === "true";

        // 자동 로그인 OFF + 세션 마커 없음 → 앱이 닫혔다 열린 것 → 로그아웃
        if (!autoLogin && !sessionAlive) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("autoLogin");
          setLoading(false);
          return;
        }

        const stored = localStorage.getItem("user");
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch (error) {
        console.error("스토리지 파싱 에러:", error);
        localStorage.clear();
        sessionStorage.clear();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (token, userData, rememberMe = false) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("autoLogin", rememberMe ? "true" : "false");
    // 현재 세션이 살아있음을 표시 (앱 종료 시 자동 삭제됨)
    sessionStorage.setItem("sessionAlive", "true");
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("autoLogin");
    sessionStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {/* [핵심] loading이 true일 때는 하위 컴포넌트(App, Dashboard 등)를
        아예 그리지 않고 기다립니다. 이렇게 해야 겹침 현상이 사라집니다.
      */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth는 AuthProvider 안에서만 사용 가능합니다.");
  }
  return context;
}