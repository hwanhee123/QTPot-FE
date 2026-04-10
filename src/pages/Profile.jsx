import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/common/Layout";
import BadgeCard from "../components/badge/BadgeCard";
import FeedCard from "../components/attendance/FeedCard";
import { getMyBadges } from "../api/badgeApi";
import { getMyAttendanceCount, getMyAttendance,
         deleteAttendance, updateAttendanceContent,
         getMyTotalCount } from "../api/attendanceApi";
import { changeMyPassword } from "../api/memberApi";
import { useAuth } from "../context/AuthContext";
import { getYearMonth, getMonthLabel, getDaysInMonth } from "../utils/dateUtils";
 
export default function Profile() {
  const { user }        = useAuth();
  const { year, month } = getYearMonth();
  const navigate        = useNavigate();
 
  const [badges,     setBadges]     = useState([]);
  const [count,      setCount]      = useState(0);
  const [yearCount,  setYearCount]  = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [myPosts,    setMyPosts]    = useState([]);
  const [loading,    setLoading]    = useState(true);
 
  const [pwForm,    setPwForm]    = useState({ currentPassword:"", newPassword:"", confirm:"" });
  const [pwError,   setPwError]   = useState("");
  const [pwOk,      setPwOk]      = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
 
  useEffect(() => {
    Promise.all([
      getMyBadges(),
      getMyAttendanceCount(year, month),
      getMyAttendance(year, month),
      getMyTotalCount(),
      getMyAttendanceCount(year, 0),
    ]).then(([b, c, posts, total, yearC]) => {
      setBadges(b.data);
      setCount(c.data);
      setMyPosts(posts.data);
      setTotalCount(total.data);
      setYearCount(yearC.data);
    }).finally(() => setLoading(false));
  }, []);
 
  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제할까요?")) return;
    await deleteAttendance(id);
    setMyPosts(prev => prev.filter(p => p.id !== id));
    setCount(c => c - 1);
  };
 
  const handleEditContent = async (id, content) => {
    await updateAttendanceContent(id, content);
    setMyPosts(prev => prev.map(p => p.id===id ? {...p, content} : p));
  };
 
  const handlePwChange = async (e) => {
    e.preventDefault();
    setPwError(""); setPwOk(false);
    if (pwForm.newPassword !== pwForm.confirm)
      return setPwError("비밀번호가 일치하지 않습니다.");
    if (pwForm.newPassword.length < 8)
      return setPwError("비밀번호는 8자 이상이어야 합니다.");
    setPwLoading(true);
    try {
      await changeMyPassword(pwForm.currentPassword, pwForm.newPassword);
      setPwOk(true);
      setPwForm({ currentPassword:"", newPassword:"", confirm:"" });
    } catch (err) {
      setPwError(err.response?.data?.message || "변경에 실패했습니다.");
    } finally { setPwLoading(false); }
  };
 
  if (loading) return <Layout><div className="loading">불러오는 중...</div></Layout>;
 
  return (
    <Layout>
      {/* 배너 */}
      <div className="profile-banner fade-in">
        <p style={{ fontSize:12, opacity:0.6, marginBottom:6, letterSpacing:"0.08em" }}>
          MY PROFILE
        </p>
        <h2>{user?.name}</h2>
        <p>
          {user?.role === "LEADER" ? "👑 리더"
            : user?.role === "ADMIN" ? "🛡 관리자"
            : "✝ 일반 회원"}
        </p>
      </div>
 
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)",
                    gap:16, marginBottom:32 }}>
 
        {(() => {
          const flowerGoal = month === 2 ? getDaysInMonth(year, month) : 30;
          return (
            <div className="stat-card">
              <div className="stat-label">{getMonthLabel(year, month)}</div>
              <div className="stat-number">{count}</div>
              <div className="stat-label">일 인증</div>
              {count >= flowerGoal && <span className="stat-badge">🌸 꽃 달성!</span>}
              {count >= 20 && count < flowerGoal && <span className="stat-badge">🌱 새싹 달성!</span>}
              {count >= 10 && count < 20 && <span className="stat-badge">🌰 씨앗 달성!</span>}
            </div>
          );
        })()}
 
        <div className="stat-card">
          <div className="stat-label">누적 뱃지</div>
          <div className="stat-number">{badges.length}</div>
          <div className="stat-label">개</div>
        </div>
 
        <div className="stat-card">
          <div className="stat-label">{year}년 누적</div>
          <div className="stat-number">{yearCount}</div>
          <div className="stat-label">일 인증</div>
        </div>
 
        <div className="stat-card">
          <div className="stat-label">총 누적</div>
          <div className="stat-number">{totalCount}</div>
          <div className="stat-label">일 인증</div>
        </div>
      </div>
 
      <p className="section-title">획득한 뱃지</p>
      {badges.length === 0 ? (
        <div className="empty-state" style={{ padding:"32px 0" }}>
          <div className="icon">🏅</div>
          <p>아직 획득한 뱃지가 없어요.</p>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
                      gap:10, marginBottom:40 }}>
          {badges.map(b => <BadgeCard key={b.id} badge={b} />)}
        </div>
      )}
 
      {/* 알림 설정 — 클릭하면 설정 페이지로 이동 */}
      <p className="section-title">알림 설정</p>
      <div
        className="card card-pad"
        onClick={() => navigate("/notification-settings")}
        style={{
          maxWidth: 440,
          marginBottom: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--bg2)"}
        onMouseLeave={e => e.currentTarget.style.background = ""}
      >
        <span style={{ fontSize:14 }}>🔔 알림 설정하기</span>
        <span style={{ color:"var(--muted)", fontSize:18 }}>›</span>
      </div>

      <p className="section-title">비밀번호 변경</p>
      <div className="card card-pad" style={{ maxWidth:440 }}>
        <form onSubmit={handlePwChange}>
          {pwError && <div className="error-msg">{pwError}</div>}
          {pwOk && (
            <div style={{ background:"rgba(39,174,96,0.08)",
                          border:"1px solid rgba(39,174,96,0.3)",
                          borderRadius:6, padding:"10px 12px",
                          fontSize:13, color:"var(--success)", marginBottom:16 }}>
              비밀번호가 변경되었습니다.
            </div>
          )}
          <div className="form-group">
            <label>현재 비밀번호</label>
            <input type="password" placeholder="현재 비밀번호 입력"
              value={pwForm.currentPassword}
              onChange={e => setPwForm(p => ({...p, currentPassword:e.target.value}))} />
          </div>
          <div className="form-group">
            <label>새 비밀번호</label>
            <input type="password" placeholder="8자 이상"
              value={pwForm.newPassword}
              onChange={e => setPwForm(p => ({...p, newPassword:e.target.value}))} />
          </div>
          <div className="form-group">
            <label>비밀번호 확인</label>
            <input type="password" placeholder="동일하게 입력"
              value={pwForm.confirm}
              onChange={e => setPwForm(p => ({...p, confirm:e.target.value}))} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={pwLoading}>
            {pwLoading ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
