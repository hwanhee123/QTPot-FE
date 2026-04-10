import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/common/Layout";
import { getNotificationSettings, updateNotificationSettings } from "../api/memberApi";
import { requestFcmToken } from "../firebase";
import { updateFcmToken } from "../api/memberApi";

const ITEM_HEIGHT   = 48;
const VISIBLE_COUNT = 5;
const PAD           = Math.floor(VISIBLE_COUNT / 2);
const HOURS         = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES       = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

function DrumColumn({ items, defaultValue, onChange }) {
  const listRef  = useRef(null);
  const timer    = useRef(null);
  const snapping = useRef(false);

  useEffect(() => {
    const idx = items.indexOf(defaultValue);
    if (listRef.current) {
      listRef.current.scrollTop = idx * ITEM_HEIGHT;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = () => {
    if (snapping.current) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!listRef.current) return;
      const raw = listRef.current.scrollTop / ITEM_HEIGHT;
      const idx = Math.max(0, Math.min(Math.round(raw), items.length - 1));
      const targetTop = idx * ITEM_HEIGHT;
      snapping.current = true;
      listRef.current.scrollTo({ top: targetTop, behavior: "smooth" });
      onChange(items[idx]);
      setTimeout(() => { snapping.current = false; }, 400);
    }, 80);
  };

  const containerH = ITEM_HEIGHT * VISIBLE_COUNT;

  return (
    <div style={{ position: "relative", width: 72, height: containerH, overflow: "hidden" }}>
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
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: PAD * ITEM_HEIGHT,
        background: "linear-gradient(to bottom, var(--surface) 20%, transparent)",
        pointerEvents: "none", zIndex: 3,
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: PAD * ITEM_HEIGHT,
        background: "linear-gradient(to top, var(--surface) 20%, transparent)",
        pointerEvents: "none", zIndex: 3,
      }} />
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
          paddingTop: PAD * ITEM_HEIGHT,
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

export default function NotificationSettings() {
  const navigate = useNavigate();

  const [commentNoti, setCommentNoti] = useState(true);
  const [qtNotiOn,    setQtNotiOn]    = useState(false);
  const [hour,        setHour]        = useState("07");
  const [minute,      setMinute]      = useState("00");
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
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

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      // 무조건 FCM 토큰 발급/갱신 (localStorage 조건 없이)
      const token = await requestFcmToken(true);
      if (token) {
        await updateFcmToken(token);
        localStorage.setItem("notiEnabled", "true");
        localStorage.setItem("fcmToken", token);
      }
      await updateNotificationSettings(commentNoti, qtNotiOn ? `${hour}:${minute}` : null);
      // 저장 완료 후 프로필로 이동
      navigate("/profile");
    } catch {
      setError("저장에 실패했습니다. 다시 시도해주세요.");
      setSaving(false);
    }
  };

  if (loading) return <Layout><div className="loading">불러오는 중...</div></Layout>;

  return (
    <Layout>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button
          onClick={() => navigate("/profile")}
          style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--muted)", padding: "4px 8px", borderRadius: 6 }}
        >←</button>
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
      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? "저장 중..." : "저장"}
      </button>
    </Layout>
  );
}
