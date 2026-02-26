import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname }     = useLocation();
  const navigate         = useNavigate();

  const NAV_LINKS = [
    { to: "/feed",      label: "피드",     icon: "🏠" },
    { to: "/dashboard", label: "대시보드", icon: "📅" },
    { to: "/ranking",   label: "랭킹",     icon: "🏆" },
    { to: "/profile",   label: "내 기록",  icon: "👤" },
    ...(user?.role === "ADMIN"
      ? [{ to: "/admin", label: "관리자", icon: "⚙️" }]
      : []),
  ];

  return (
    <>
      <nav className="navbar">
        <Link to="/feed" className="navbar-brand">✝ QTPot</Link>

        {user && (
          <>
            {/* 데스크탑 전용 링크 */}
            <div className="navbar-links">
              {NAV_LINKS.map(({ to, label }) => (
                <Link key={to} to={to}
                  className={pathname === to ? "active" : ""}>
                  {label}
                </Link>
              ))}
            </div>

            <div className="navbar-right">
              <span className="navbar-user">
                {user.name}
                {(user.role === "LEADER" || user.role === "ADMIN") && (
                  <span style={{ marginLeft:8, fontSize:11,
                                 background:"var(--bg2)",
                                 border:"1px solid var(--border)",
                                 borderRadius:20, padding:"2px 8px",
                                 color:"var(--accent)" }}>
                    {user.role === "ADMIN" ? "관리자" : "리더"}
                  </span>
                )}
              </span>
              <button className="logout-btn"
                onClick={() => { logout(); navigate("/login"); }}>
                로그아웃
              </button>
            </div>
          </>
        )}
      </nav>

      {/* 모바일 하단 탭바 */}
      {user && (
        <nav className="bottom-nav">
          {NAV_LINKS.map(({ to, label, icon }) => (
            <Link key={to} to={to}
              className={`bottom-nav-item${pathname === to ? " active" : ""}`}>
              <span className="bottom-nav-icon">{icon}</span>
              <span className="bottom-nav-label">{label}</span>
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
