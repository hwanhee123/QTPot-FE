import { useEffect, useState } from "react";
import { getMyAttendance, getMyAttendanceCount } from "../../api/attendanceApi";
import { getDaysInMonth, getFirstDayOfWeek } from "../../utils/dateUtils";

export default function AttendanceCalendar({ year, month, onSelectDay, selectedDay, onMonthChange, maxYear, maxMonth }) {
  const [postsByDay, setPostsByDay] = useState(new Map());
  const [count,      setCount]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(false);
  const [retryTick,  setRetryTick]  = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      getMyAttendance(year, month),
      getMyAttendanceCount(year, month),
    ]).then(([listRes, cntRes]) => {
      setPostsByDay(new Map(
        listRes.data.map((a) => [parseInt(a.createdDate.split("-")[2], 10), a])
      ));
      setCount(cntRes.data);
    }).catch((err) => {
      if (err.response?.status !== 401) setError(true);
    }).finally(() => setLoading(false));
  }, [year, month, retryTick]);

  const attendedDays = new Set(postsByDay.keys());
  const totalDays    = getDaysInMonth(year, month);
  const startDay     = getFirstDayOfWeek(year, month);
  const goal         = month === 2 ? totalDays : 30;
  const progress     = Math.min((count / goal) * 100, 100);

  const isMaxMonth = maxYear && maxMonth
    ? (year > maxYear || (year === maxYear && month >= maxMonth))
    : false;

  const handlePrev = () => {
    if (month === 1) onMonthChange?.(year - 1, 12);
    else             onMonthChange?.(year, month - 1);
  };

  const handleNext = () => {
    if (isMaxMonth) return;
    if (month === 12) onMonthChange?.(year + 1, 1);
    else              onMonthChange?.(year, month + 1);
  };

  const handleDayClick = (day) => {
    onSelectDay?.(day, postsByDay.get(day) ?? null);
  };

  if (loading) return <div className="loading">불러오는 중...</div>;

  if (error) return (
    <div className="empty-state">
      <div className="icon">⚠️</div>
      <p>달력을 불러오지 못했습니다.</p>
      <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }}
        onClick={() => setRetryTick(t => t + 1)}>
        다시 시도
      </button>
    </div>
  );

  return (
    <div className="calendar-wrap">
      <div className="calendar-header">
        <span className="calendar-title">{year}년 {month}월</span>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span className={`calendar-count ${count >= goal ? "achieved" : ""}`}>
            {count}일 인증{count >= goal && " 🏅"}
          </span>
          <button onClick={handlePrev}
            style={navBtnStyle}>‹</button>
          <button onClick={handleNext} disabled={isMaxMonth}
            style={{ ...navBtnStyle, opacity: isMaxMonth ? 0.3 : 1 }}>›</button>
        </div>
      </div>

      <div className="calendar-days">
        {["일","월","화","수","목","금","토"].map((d) => (
          <div key={d} className="calendar-day-label">{d}</div>
        ))}

        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`e-${i}`} />
        ))}

        {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
          <div
            key={day}
            onClick={() => handleDayClick(day)}
            className={`calendar-day ${attendedDays.has(day) ? "attended" : ""}`}
            style={{
              cursor: "pointer",
              outline: selectedDay === day ? "2px solid var(--accent)" : "none",
              borderRadius: 6,
            }}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="progress-wrap">
        <div className="progress-label">
          <span>{goal}일 목표</span>
          <span>{count} / {goal}일</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

const navBtnStyle = {
  background: "none",
  border: "1px solid var(--border)",
  borderRadius: 6,
  width: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 16,
  color: "var(--muted)",
  cursor: "pointer",
  lineHeight: 1,
};
