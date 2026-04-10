import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/common/Layout";
import { getNotificationSettings, updateNotificationSettings } from "../api/memberApi";
import { requestFcmToken } from "../firebase";
import { updateFcmToken } from "../api/memberApi";

const ITEM_HEIGHT   = 48;
const VISIBLE_COUNT = 5;
const PAD           = Math.floor(VISIBLE_COUNT / 2); // 위아래 여백 항목 수
const HOURS         = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES       = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

/* ─── 드럼롤 컬럼
 *  - CSS scroll-snap-align: center 으로 스냅
 *  - 초기값(defaultValue)으로만 스크롤 위치 세팅, 이후 스크롤은 브라우저가 처리
 *  - onChange는 스크롤 멈춘 후 현재 위치를 읽어서 한 번만 호출
 * ─── */
function DrumColumn({ items, defaultValue, onChange }) {
  const listRef  = useRef(null);
  const timer    = useRef(null);
  const snapping = useRef(false); // 프로그래매틱 스냅 중 onScroll 무시

  // 마운트 시 초기 위치만 세팅 (이후 re-render에 반응 안 함)
  useEffect(() => {
    const idx = items.indexOf(defaultValue);
    if (listRef.current) {
      // instant 스크롤: 스냅 이벤트 없이 바로 이동
      listRef.current.scrollTop = idx * ITEM_HEIGHT;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = () => {
    if (snapping.current) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!listRef.current) return;
      // 현재 스크롤 위치에서 가장 가까운 항목 계산
      const raw = listRef.current.scrollTop / ITEM_HEIGHT;
      const idx = Math.max(0, Math.min(Math.round(raw), items.length - 1));
      const targetTop = idx * ITEM_HEIGHT;

      // 정확한 위치로 스냅 (smooth)
      snapping.current = true;
      listRef.current.scrollTo({ top: targetTop, behavior: "smooth" });
      onChange(items[idx]);

      // smooth 완료 후 플래그 해제 (보통 300ms 이내)
      setTimeout(() => { snapping.current = false; }, 400);
    }, 80);
  };

  const containerH = ITEM_HEIGHT * VISIBLE_COUNT;

  return (
    <div style={{ position: "relative", width: 72, height: containerH, overflow: "hidden" }}>

      {/* 선택 영역 하이라이트 */}
      <div style={{
        position: "absolute",
        top: PAD * ITEM_HEIGHT, left: 0, right: 0,
        height: ITEM_HEIGHT,
        background: "rgba(139,111,71,0.10)",
        borderTop: "1.5px solid var(--accent)",
        borderBottom: "1.5px solid var(--accent)",
        borderRadius: 6,
        pointerEvents: "none", zIndex: 2,
      }} />

      {/* 위 페이드 */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: PAD * ITEM_HEIGHT,
        background: "linear-gradient(to bottom, var(--surface) 20%, transparent)",
        pointerEvents: "none", zIndex: 3,
      }} />
      {/* 아래 페이드 */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: PAD * ITEM_HEIGHT,
        background: "linear-gradient(to top, var(--surface) 20%, transparent)",
        pointerEvents: "none", zIndex: 3,
      }} />

      {/* 스크롤 영역 */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        style={{
          height: "100%",
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          // 위아래 padding으로 첫/마지막 항목이 가운데 오게
          paddingTop:    PAD * ITEM_HEIGHT,
          paddingBottom: PAD * ITEM_HEIGHT,
          boxSizing: "content-box",
        }}
      >
        <style>{`div::-webkit-scrollbar{display:none}`}</style>
        {items.map((item) => (
          <div
            key={item}
            style={{
              height: ITEM_HEIGHT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              color: "var(--text)",
              scrollSnapAlign: "center",
              userSelect: "none",
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 토글 스위치 ─── */
function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 48, height: 28, borderRadius: 14,
        background: value ? "var(--accent)" : "var(--border)",
        position: "relative", cursor: "pointer",
        transition: "background 0.25s", flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: 3,
        left: value ? 23 : 3,
        width: 22, height: 22, borderRadius: "50%",
        background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        transition: "left 0.25s",
      }} />
    </div>
  );
}

/* ─── 메인 페이지 ─── */
export default function NotificationSettings() {
  const navigate = useNavigate();

  const [commentNoti,  setCommentNoti]  = useState(true);
  const [qtNotiOn,     setQtNotiOn]     = useState(false);
  const [hour,         setHour]         = useState("07");
  const [minute,       setMinute]       = useState("00");
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [error,        setError]        = useState("");

  // 초기 설정 로드
  useEffect(() => {
    getNotificationSettings()
      .then((res) => {
        const { commentNotiEnabled, qtNotiTime } = res.data;
        setCommentNoti(commentNotiEnabled);
        if (qtNotiTime) {
          setQtNotiOn(true);
          const [h, m] = qtNotiTime.split(":");
          setHour(h);
          setMinute(m);
        }
      })
      .catch(() => setError("설정을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  const ensureFcmToken = async () => {
    if (localStorage.getItem("notiEnabled") === "true") return;
    try {
      const token = await requestFcmToken(true);
      if (token) {
        await updateFcmToken(token);
        localStorage.setItem("notiEnabled", "true");
        localStorage.setItem("fcmToken", token);
      }
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true); setSaved(false); setError("");
    try {
      if (commentNoti || qtNotiOn) await ensureFcmToken();
      await updateNotificationSettings(commentNoti, qtNotiOn ? `${hour}:${minute}` : null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><div className="loading">불러오는 중...</div></Layout>;

  return (
    <Layout>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button
          onClick={() => navigate("/profile")}
          style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--muted)", padding: "4px 8px", borderRadius: 6 }}
        >←</button>
        <h2 style={{ fontSize: 18, fontWeight: 500 }}>알림 설정</h2>
      </div>

      {/* 댓글 알림 */}
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 3 }}>💬 댓글 알림</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>내 게시물에 댓글이 달리면 알림을 받아요</div>
          </div>
          <Toggle value={commentNoti} onChange={setCommentNoti} />
        </div>
      </div>

      {/* 큐티 알림 */}
      <div className="card card-pad" style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: qtNotiOn ? 20 : 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 3 }}>📖 큐티 알림</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>매일 설정한 시간에 푸시 알림을 보내드려요</div>
          </div>
          <Toggle value={qtNotiOn} onChange={setQtNotiOn} />
        </div>

        {qtNotiOn && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 4, paddingTop: 12,
            borderTop: "1px solid var(--border)",
          }}>
            <DrumColumn items={HOURS}   defaultValue={hour}   onChange={setHour} />
            <span style={{ fontSize: 28, fontWeight: 300, color: "var(--accent)" }}>:</span>
            <DrumColumn items={MINUTES} defaultValue={minute} onChange={setMinute} />
          </div>
        )}
      </div>

      {error && <p style={{ fontSize: 13, color: "var(--danger)", marginBottom: 10, textAlign: "center" }}>{error}</p>}
      {saved && <p style={{ fontSize: 13, color: "var(--success)", marginBottom: 10, textAlign: "center" }}>✓ 저장되었습니다</p>}
      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? "저장 중..." : "저장"}
      </button>
    </Layout>
  );
}
