import { useState, useEffect, useCallback } from "react";
import UploadCard from "../attendance/UploadCard";
import { getMyAttendance } from "../../api/attendanceApi";
import { getYearMonth, getTodayString } from "../../utils/dateUtils";

export default function QtFab() {
  const [doneToday, setDoneToday] = useState(false);
  const [open,       setOpen]     = useState(false);

  const checkToday = useCallback(async () => {
    const { year, month } = getYearMonth();
    const today = getTodayString();
    try {
      const res = await getMyAttendance(year, month);
      setDoneToday(res.data.some(a => a.createdDate === today));
    } catch {
      // 조회 실패는 무시 (FAB은 그냥 + 상태로 둠)
    }
  }, []);

  useEffect(() => { checkToday(); }, [checkToday]);

  const handleSuccess = () => {
    setDoneToday(true);
  };

  return (
    <>
      <button
        className={`qt-fab${doneToday ? " done" : ""}`}
        onClick={() => setOpen(true)}
        aria-label={doneToday ? "오늘 큐티 인증 완료" : "오늘 큐티 인증하기"}
        title={doneToday ? "오늘 큐티 인증 완료" : "오늘 큐티 인증하기"}
      >
        {doneToday ? "✓" : "+"}
      </button>

      {open && (
        <div className="qt-fab-overlay" onClick={() => setOpen(false)}>
          <div className="qt-fab-modal" onClick={e => e.stopPropagation()}>
            <div className="qt-fab-modal-header">
              <p className="section-title" style={{ marginBottom:0 }}>오늘 큐티 인증</p>
              <button className="qt-fab-modal-close" onClick={() => setOpen(false)} aria-label="닫기">✕</button>
            </div>
            <UploadCard onSuccess={handleSuccess} selectedDate={null} />
          </div>
        </div>
      )}
    </>
  );
}
