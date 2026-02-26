import { useEffect, useState } from "react";
import { getMyAttendance, getMyAttendanceCount } from "../../api/attendanceApi";
import { getDaysInMonth, getFirstDayOfWeek } from "../../utils/dateUtils";

export default function AttendanceCalendar({ year, month, onSelectDay, selectedDay, onMonthChange, maxYear, maxMonth }) {
  const [postsByDay, setPostsByDay] = useState(new Map());
  const [count,      setCount]      = useState(0);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getMyAttendance(year, month),
      getMyAttendanceCount(year, month),
    ]).then(([listRes, cntRes]) => {
      setPostsByDay(new Map(
        listRes.data.map((a) => [parseInt(a.createdDate.split("-")[2], 10), a])
      ));
      setCount(cntRes.data);
    }).finally(() => setLoading(false));
  }, [year, month]);

  const attendedDays = new Set(postsByDay.keys());
  const totalDays    = getDaysInMonth(year, month);
  const startDay     = getFirstDayOfWeek(year, month);
  const progress     = Math.min((count / 20) * 100, 100);

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

  return (
    <div className="calendar-wrap">
      <div className="calendar-header">
        <span className="calendar-title">{year}년 {month}월</span>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span className={`calendar-count ${count >= 20 ? "achieved" : ""}`}>
            {count}일 인증{count >= 20 && " 🏅"}
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
          <span>20일 목표</span>
          <span>{count} / 20일</span>
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
