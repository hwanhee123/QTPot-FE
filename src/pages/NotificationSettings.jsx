import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/common/Layout";
import { getNotificationSettings, updateNotificationSettings } from "../api/memberApi";
import { requestFcmToken } from "../firebase";
import { updateFcmToken } from "../api/memberApi";

const ITEM_HEIGHT  = 44;
const VISIBLE_COUNT = 5;
const PAD_COUNT    = Math.floor(VISIBLE_COUNT / 2); // 2
const HOURS        = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES      = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

/* ─── 드럼롤 컬럼 ─── */
function DrumColumn({ items, selected, onChange }) {
  const listRef    = useRef(null);
  const snapTimer  = useRef(null);
  const isSnapping = useRef(false);

  const selectedIdx = items.indexOf(selected);

  // idx → scrollTop 계산 (상단 스페이서 높이 포함)
  const idxToScrollTop = (idx) => PAD_COUNT * ITEM_HEIGHT + idx * ITEM_HEIGHT;

  // 스크롤 위치 → 가장 가까운 항목 인덱스
  const scrollTopToIdx = (scrollTop) => {
    const raw = (scrollTop - PAD_COUNT * ITEM_HEIGHT) / ITEM_HEIGHT;
    return Math.max(0, Math.min(Math.round(raw), items.length - 1));
  };

  const scrollToIdx = useCallback((idx, smooth = true) => {
    if (!listRef.current) return;
    listRef.current.scrollTo({
      top: idxToScrollTop(idx),
      behavior: smooth ? "smooth" : "instant",
    });
  }, []);

  // 초기 위치 세팅
  useEffect(() => {
    scrollToIdx(selectedIdx, false);
  }, [selectedIdx, scrollToIdx]);

  // 스크롤 멈추면 가장 가까운 항목으로 스냅
  const handleScroll = useCallback(() => {
    if (isSnapping.current) return;
    clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(() => {
      if (!listRef.current) return;
      const idx = scrollTopToIdx(listRef.current.scrollTop);
      isSnapping.current = true;
      scrollToIdx(idx);
      onChange(items[idx]);
      setTimeout(() => { isSnapping.current = false; }, 300);
    }, 80);
  }, [items, onChange, scrollToIdx]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const containerHeight = ITEM_HEIGHT * VISIBLE_COUNT;

  return (
    <div style={{ position: "relative", width: 80, height: containerHeight, overflow: "hidden" }}>
      {/* 선택 영역 하이라이트 */}
      <div style={{
        position: "absolute",
        top: PAD_COUNT * ITEM_HEIGHT,
        left: 0, right: 0,
        height: ITEM_HEIGHT,
        background: "rgba(139,111,71,0.10)",
        borderTop: "1.5px solid var(--accent)",
        borderBottom: "1.5px solid var(--accent)",
        borderRadius: 6,
        pointerEvents: "none",
        zIndex: 2,
      }} />

      {/* 위 페이드 */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: PAD_COUNT * ITEM_HEIGHT,
        background: "linear-gradient(to bottom, var(--surface) 30%, transparent)",
        pointerEvents: "none", zIndex: 3,
      }} />
      {/* 아래 페이드 */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: PAD_COUNT * ITEM_HEIGHT,
        background: "linear-gradient(to top, var(--surface) 30%, transparent)",
        pointerEvents: "none", zIndex: 3,
      }} />

      {/* 스크롤 목록 */}
      <div
        ref={listRef}
        style={{
          height: "100%",
          overflowY: "scroll",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`div::-webkit-scrollbar{display:none}`}</style>

        {/* 상단 스페이서 — 0번 항목이 가운데로 오게 */}
        <div style={{ height: PAD_COUNT * ITEM_HEIGHT }} />

        {items.map((item) => {
          const isSelected = item === selected;
          return (
            <div
              key={item}
              onClick={() => {
                const idx = items.indexOf(item);
                scrollToIdx(idx);
                onChange(item);
              }}
              style={{
                height: ITEM_HEIGHT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                fontWeight: isSelected ? 600 : 300,
                color: isSelected ? "var(--accent)" : "var(--muted)",
                cursor: "pointer",
                userSelect: "none",
                transition: "color 0.15s, font-weight 0.15s",
              }}
            >
              {item}
            </div>
          );
        })}

        {/* 하단 스페이서 — 마지막 항목이 가운데로 오게 */}
        <div style={{ height: PAD_COUNT * ITEM_HEIGHT }} />
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
        position: "absolute",
        top: 3,
        left: value ? 23 : 3,
        width: 22, height: 22,
        borderRadius: "50%",
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

  const [commentNoti, setCommentNoti] = useState(true);
  const [qtNotiOn,    setQtNotiOn]    = useState(false);
  const [hour,        setHour]        = useState("07");
  const [minute,      setMinute]      = useState("00");
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState("");

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
    const enabled = localStorage.getItem("notiEnabled") === "true";
    if (enabled) return;
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
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      if (commentNoti || qtNotiOn) await ensureFcmToken();
      const timeValue = qtNotiOn ? `${hour}:${minute}` : null;
      await updateNotificationSettings(commentNoti, timeValue);
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
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button
          onClick={() => navigate("/profile")}
          style={{
            background: "none", border: "none",
            fontSize: 20, cursor: "pointer", color: "var(--muted)",
            padding: "4px 8px", borderRadius: 6,
          }}
        >
          ←
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 500 }}>알림 설정</h2>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 3 }}>💬 댓글 알림</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>내 게시물에 댓글이 달리면 알림을 받아요</div>
          </div>
          <Toggle value={commentNoti} onChange={setCommentNoti} />
        </div>
      </div>

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
            gap: 8, padding: "8px 0 4px",
            borderTop: "1px solid var(--border)",
          }}>
            <DrumColumn items={HOURS}   selected={hour}   onChange={setHour} />
            <span style={{ fontSize: 28, fontWeight: 300, color: "var(--accent)", marginBottom: 2 }}>:</span>
            <DrumColumn items={MINUTES} selected={minute} onChange={setMinute} />
          </div>
        )}
      </div>

      {error && (
        <p style={{ fontSize: 13, color: "var(--danger)", marginBottom: 10, textAlign: "center" }}>{error}</p>
      )}
      {saved && (
        <p style={{ fontSize: 13, color: "var(--success)", marginBottom: 10, textAlign: "center" }}>✓ 저장되었습니다</p>
      )}
      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? "저장 중..." : "저장"}
      </button>
    </Layout>
  );
}
