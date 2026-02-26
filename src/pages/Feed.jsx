import { useState, useEffect, useCallback } from "react";
import Layout from "../components/common/Layout";
import FeedCard from "../components/attendance/FeedCard";
import { getFeed, updateAttendanceContent, deleteAttendance }
  from "../api/attendanceApi";
import { useAuth } from "../context/AuthContext";
 
export default function Feed() {
  const { user }            = useAuth();
  const [items,   setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date,    setDate]  = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  });
 
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFeed(date || null);
      setItems(res.data);
    } finally { setLoading(false); }
  }, [date]);
 
  useEffect(() => { load(); }, [load]);
 
  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제할까요?")) return;
    await deleteAttendance(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };
 
  const handleEditContent = async (id, content) => {
    await updateAttendanceContent(id, content);
    setItems(prev => prev.map(i => i.id===id ? {...i, content} : i));
  };
 
  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2 className="page-title">큐티 피드</h2>
          <p className="page-subtitle">성도님들의 말씀 묵상을 나눠요</p>
        </div>
        {/* 날짜 필터 */}
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          <span style={{ fontSize:11, color:"var(--muted)",
                         letterSpacing:"0.08em", textTransform:"uppercase" }}>
            날짜 선택
          </span>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <input type="date" value={date}
              onChange={e => setDate(e.target.value)}
              style={{ padding:"7px 12px",
                       background:"var(--surface)",
                       border:"1px solid var(--border)",
                       borderRadius:8,
                       fontFamily:"Noto Sans KR, sans-serif",
                       fontSize:13, color:"var(--text)", outline:"none" }} />
            {date && (
              <button className="btn btn-secondary btn-sm"
                onClick={() => setDate("")}>전체보기</button>
            )}
          </div>
        </div>
      </div>
 
      {loading ? (
        <div className="loading">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📖</div>
          <p>{date ? "해당 날짜의 인증이 없습니다." : "아직 인증 기록이 없습니다."}</p>
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
