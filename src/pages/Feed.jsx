import { useState, useEffect, useCallback } from "react";
import Layout from "../components/common/Layout";
import FeedCard from "../components/attendance/FeedCard";
import { getFeed, updateAttendanceContent, deleteAttendance }
  from "../api/attendanceApi";
import { useAuth } from "../context/AuthContext";

export default function Feed() {
  const { user }            = useAuth();
  const now                 = new Date();
  const today               = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const [year,    setYear]  = useState(now.getFullYear());
  const [month,   setMonth] = useState(now.getMonth() + 1);
  const [date,    setDate]  = useState(today);
  const [items,   setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const firstDay = `${year}-${String(month).padStart(2,"0")}-01`;
  const lastDay  = isCurrentMonth
    ? `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`
    : `${year}-${String(month).padStart(2,"0")}-${new Date(year, month, 0).getDate()}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = date
        ? await getFeed(date)
        : await getFeed(null, year, month);
      setItems(res.data);
    } finally { setLoading(false); }
  }, [date, year, month]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => {
    setDate("");
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (isCurrentMonth) return;
    setDate("");
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제할까요?")) return;
    await deleteAttendance(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleEditContent = async (id, content) => {
    await updateAttendanceContent(id, content);
    setItems(prev => prev.map(i => i.id === id ? { ...i, content } : i));
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2 className="page-title">큐티 피드</h2>
          <p className="page-subtitle">성도님들의 말씀 묵상을 나눠요</p>
        </div>
      </div>

      {/* 필터 바 */}
      <div style={{ display:"flex", alignItems:"center", gap:8,
                    marginBottom:16, flexWrap:"wrap" }}>
        {/* 월 네비게이션 */}
        <button onClick={prevMonth}
          style={{ background:"none", border:"none", cursor:"pointer",
                   fontSize:20, color:"var(--text)", padding:"4px 6px",
                   lineHeight:1 }}>‹</button>
        <span style={{ fontSize:14, fontWeight:500, color:"var(--text)",
                       minWidth:88, textAlign:"center" }}>
          {year}년 {month}월
        </span>
        <button onClick={nextMonth}
          style={{ background:"none", border:"none",
                   cursor: isCurrentMonth ? "default" : "pointer",
                   fontSize:20,
                   color: isCurrentMonth ? "var(--muted)" : "var(--text)",
                   padding:"4px 6px", lineHeight:1 }}>›</button>

        <div style={{ width:1, height:20, background:"var(--border)",
                      margin:"0 4px", flexShrink:0 }} />

        {/* 날짜 필터 */}
        <input type="date" value={date}
          min={firstDay} max={lastDay}
          onChange={e => setDate(e.target.value)}
          style={{ padding:"7px 12px",
                   background:"var(--surface)",
                   border:"1px solid var(--border)",
                   borderRadius:8,
                   fontSize:13,
                   color:"var(--text)",
                   colorScheme:"light dark",
                   outline:"none" }} />
        <button className="btn btn-secondary btn-sm"
          onClick={() => setDate("")}
          style={{ visibility: date ? "visible" : "hidden" }}>
          {month}월 전체보기
        </button>
      </div>

      {loading ? (
        <div className="loading">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📖</div>
          <p>{date ? "해당 날짜의 인증이 없습니다." : "이번 달 인증이 없습니다."}</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {items.map(item => (
            <FeedCard
              key={item.id}
              item={item}
              isMine={item.memberEmail === user?.email}
              onDelete={handleDelete}
              onEditContent={handleEditContent}
            />
          ))}
        </div>
      )}
    </Layout>
  );
}