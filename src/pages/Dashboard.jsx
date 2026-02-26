import { useState, useCallback } from "react";
import Layout from "../components/common/Layout";
import UploadCard from "../components/attendance/UploadCard";
import AttendanceCalendar from "../components/attendance/AttendanceCalendar";
import FeedCard from "../components/attendance/FeedCard";
import { useAuth } from "../context/AuthContext";
import { getYearMonth, getMonthLabel } from "../utils/dateUtils";
import { getMyAllAttendance, deleteAttendance, updateAttendanceContent } from "../api/attendanceApi";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { year, month }   = getYearMonth();

  const [refreshKey,    setRefreshKey]    = useState(0);
  const [selectedDay,   setSelectedDay]   = useState(null);
  const [selectedPost,  setSelectedPost]  = useState(null);
  const [showAll,       setShowAll]       = useState(false);
  const [allPosts,      setAllPosts]      = useState([]);
  const [allLoading,    setAllLoading]    = useState(false);
  const [viewYear,      setViewYear]      = useState(year);
  const [viewMonth,     setViewMonth]     = useState(month);

  const handleMonthChange = useCallback((y, m) => {
    setViewYear(y);
    setViewMonth(m);
    setSelectedDay(null);
    setSelectedPost(null);
  }, []);

  const handleSuccess = useCallback(() => {
    setRefreshKey(k => k + 1);
    setSelectedDay(null);
    setSelectedPost(null);
  }, []);

  const handleSelectDay = useCallback((day, post) => {
    setSelectedDay(prev => prev === day ? null : day);
    setSelectedPost(prev => prev === null && post === null ? null : (prev?.id === post?.id && day === selectedDay ? null : post));
  }, [selectedDay]);

  const selectedDate = selectedDay
    ? `${viewYear}-${String(viewMonth).padStart(2,"0")}-${String(selectedDay).padStart(2,"0")}`
    : null;

  const handleToggleAll = async () => {
    if (!showAll && allPosts.length === 0) {
      setAllLoading(true);
      try {
        const res = await getMyAllAttendance();
        setAllPosts(res.data);
      } finally {
        setAllLoading(false);
      }
    }
    setShowAll(v => !v);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제할까요?")) return;
    await deleteAttendance(id);
    setAllPosts(prev => prev.filter(p => p.id !== id));
    if (selectedPost?.id === id) setSelectedPost(null);
    setRefreshKey(k => k + 1);
  };

  const handleEditContent = async (id, content) => {
    await updateAttendanceContent(id, content);
    setAllPosts(prev => prev.map(p => p.id === id ? { ...p, content } : p));
    if (selectedPost?.id === id) setSelectedPost(p => ({ ...p, content }));
  };

  if (loading || !user) return null;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2 className="page-title">안녕하세요, {user.name}님</h2>
          <p className="page-subtitle">{getMonthLabel(viewYear, viewMonth)} 큐티 현황</p>
        </div>
      </div>

      <div className="dashboard-grid fade-in">
        <UploadCard onSuccess={handleSuccess} selectedDate={selectedDate} />
        <AttendanceCalendar
          key={refreshKey}
          year={viewYear}
          month={viewMonth}
          selectedDay={selectedDay}
          onSelectDay={handleSelectDay}
          onMonthChange={handleMonthChange}
          maxYear={year}
          maxMonth={month}
        />
      </div>

      {/* 선택한 날짜의 게시글 */}
      {selectedDay && (
        <div style={{ marginTop: 24 }}>
          <p className="section-title">
            {selectedDate} 기록
          </p>
          {selectedPost ? (
            <FeedCard
              item={selectedPost}
              isMine={true}
              onDelete={handleDelete}
              onEditContent={handleEditContent}
            />
          ) : (
            <div className="empty-state" style={{ padding: "32px 0" }}>
              <div className="icon">📷</div>
              <p>이 날에는 아직 인증 기록이 없어요.</p>
            </div>
          )}
        </div>
      )}

      {/* 전체보기 */}
      <div style={{ marginTop: 32, textAlign: "center" }}>
        <button className="btn btn-secondary" onClick={handleToggleAll} disabled={allLoading}>
          {allLoading ? "불러오는 중..." : showAll ? "전체보기 닫기" : "전체보기"}
        </button>
      </div>

      {showAll && (
        <div style={{ marginTop: 16 }}>
          <p className="section-title">내 전체 인증 기록</p>
          {allPosts.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px 0" }}>
              <div className="icon">📷</div>
              <p>아직 인증 기록이 없어요.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
              {allPosts.map(post => (
                <FeedCard
                  key={post.id}
                  item={post}
                  isMine={true}
                  onDelete={handleDelete}
                  onEditContent={handleEditContent}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
