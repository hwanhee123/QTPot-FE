import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/common/Layout";
import { getNotificationSettings, updateNotificationSettings } from "../api/memberApi";
import { requestFcmToken } from "../firebase";
import { updateFcmToken } from "../api/memberApi";

/* ─── 드럼롤 피커 상수 ─── */
const ITEM_HEIGHT = 44;
const VISIBLE_COUNT = 5; // 보이는 항목 수 (가운데가 선택)
const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

/* ─── 드럼롤 컬럼 컴포넌트 ─── */
function DrumColumn({ items, selected, onChange }) {
  const listRef   = useRef(null);
  const isDragging = useRef(false);
  const startY    = useRef(0);
  const startIdx  = useRef(0);

  const selectedIdx = items.indexOf(selected);

  // 선택된 항목으로 스크롤
  const scrollToIndex = useCallback((idx, smooth = true) => {
    if (!listRef.current) return;
    listRef.current.scrollTo({
      top: idx * ITEM_HEIGHT,
      behavior: smooth ? "smooth" : "instant",
    });
  }, []);

  useEffect(() => {
    scrollToIndex(selectedIdx, false);
  }, [selectedIdx, scrollToIndex]);

  // 스크롤 끝나면 가장 가까운 항목으로 스냅
  const handleScroll = useCallback(() => {
    if (!listRef.current || isDragging.current) return;
    const rawIdx = listRef.current.scrollTop / ITEM_HEIGHT;
    const snappedIdx = Math.round(rawIdx);
    const clamped = Math.max(0, Math.min(snappedIdx, items.length - 1));
    onChange(items[clamped]);
  }, [items, onChange]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    let timer;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(handleScroll, 100);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [handleScroll]);

  // 터치 드래그 지원
  const onTouchStart = (e) => {
    isDragging.current = true;
    startY.current = e.touches[0].clientY;
    startIdx.current = selectedIdx;
  };
  const onTouchMove = (e) => {
    if (!isDragging.current || !listRef.current) return;
    const dy = startY.current - e.touches[0].clientY;
    const delta = Math.round(dy / ITEM_HEIGHT);
    const newIdx = Math.max(0, Math.min(startIdx.current + delta, items.length - 1));
    listRef.current.scrollTop = newIdx * ITEM_HEIGHT;
  };
  const onTouchEnd = () => {
    isDragging.current = false;
    handleScroll();
  };

  const containerHeight = ITEM_HEIGHT * VISIBLE_COUNT;
  const padCount = Math.floor(VISIBLE_COUNT / 2);

  return (
    <div
      style={{
        position: "relative",
        width: 80,
        height: containerHeight,
        overflow: "hidden",
      }}
    >
      {/* 선택 영역 하이라이트 */}
      <div style={{
        position: "absolute",
        top: padCount * ITEM_HEIGHT,
        left: 0, right: 0,
        height: ITEM_HEIGHT,
        background: "rgba(139,111,71,0.10)",
        borderTop: "1.5px solid var(--accent)",
        borderBottom: "1.5px solid var(--accent)",
        borderRadius: 6,
        pointerEvents: "none",
        zIndex: 2,
      }} />

      {/* 위/아래 그라데이션 페이드 */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: padCount * ITEM_HEIGHT,
        background: "linear-gradient(to bottom, var(--surface) 30%, transparent)",
        pointerEvents: "none", zIndex: 3,
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: padCount * ITEM_HEIGHT,
        background: "linear-gradient(to top, var(--surface) 30%, transparent)",
        pointerEvents: "none", zIndex: 3,
      }} />

      {/* 스크롤 리스트 */}
      <div
        ref={listRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          height: "100%",
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          paddingTop: padCount * ITEM_HEIGHT,
          paddingBottom: padCount * ITEM_HEIGHT,
        }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
        {items.map((item) => (
          <div
            key={item}
            onClick={() => {
              const idx = items.indexOf(item);
              scrollToIndex(idx);
              onChange(item);
            }}
            style={{
              height: ITEM_HEIGHT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: item === selected ? 600 : 300,
              color: item === selected ? "var(--accent)" : "var(--muted)",
              scrollSnapAlign: "start",
              cursor: "pointer",
              userSelect: "none",
              transition: "color 0.15s, font-weight 0.15s",
            }}
          >
            {item}
          </div>
        ))}
      </div>
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

  // 서버에서 현재 설정 불러오기
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

  // FCM 토큰 확보 (알림 켜는 경우)
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
      // 댓글 알림 또는 큐티 알림이 켜지면 FCM 토큰 확보
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
      {/* 헤더 */}
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

      {/* 댓글 알림 섹션 */}
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 3 }}>💬 댓글 알림</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              내 게시물에 댓글이 달리면 알림을 받아요
            </div>
          </div>
          <Toggle value={commentNoti} onChange={setCommentNoti} />
        </div>
      </div>

      {/* 큐티 알림 섹션 */}
      <div className="card card-pad" style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: qtNotiOn ? 20 : 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 3 }}>📖 큐티 알림</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              매일 설정한 시간에 푸시 알림을 보내드려요
            </div>
          </div>
          <Toggle value={qtNotiOn} onChange={setQtNotiOn} />
        </div>

        {/* 드럼롤 타임피커 */}
        {qtNotiOn && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "8px 0 4px",
            borderTop: "1px solid var(--border)",
          }}>
            <DrumColumn items={HOURS}   selected={hour}   onChange={setHour} />
            <span style={{ fontSize: 28, fontWeight: 300, color: "var(--accent)", marginBottom: 2 }}>:</span>
            <DrumColumn items={MINUTES} selected={minute} onChange={setMinute} />
          </div>
        )}
      </div>

      {/* 저장 버튼 */}
      {error && (
        <p style={{ fontSize: 13, color: "var(--danger)", marginBottom: 10, textAlign: "center" }}>
          {error}
        </p>
      )}
      {saved && (
        <p style={{ fontSize: 13, color: "var(--success)", marginBottom: 10, textAlign: "center" }}>
          ✓ 저장되었습니다
        </p>
      )}
      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? "저장 중..." : "저장"}
      </button>
    </Layout>
  );
}

/* ─── 토글 스위치 ─── */
function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 48,
        height: 28,
        borderRadius: 14,
        background: value ? "var(--accent)" : "var(--border)",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.25s",
        flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute",
        top: 3,
        left: value ? 23 : 3,
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        transition: "left 0.25s",
      }} />
    </div>
  );
}
