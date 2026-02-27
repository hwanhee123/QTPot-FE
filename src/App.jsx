import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { onForegroundMessage, requestFcmToken } from "./firebase";
import { updateFcmToken, clearFcmToken } from "./api/memberApi";
import PrivateRoute   from "./components/common/PrivateRoute";
import AdminRoute     from "./components/common/AdminRoute";
import Login          from "./pages/Login";
import Signup         from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Feed           from "./pages/Feed";
import Dashboard      from "./pages/Dashboard";
import Ranking        from "./pages/Ranking";
import Profile        from "./pages/Profile";
import Admin          from "./pages/Admin";
 
export default function App() {
  const [toast, setToast] = useState(null);

  // 포그라운드 알림: Android/Chrome은 onMessage로 들어옴
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      const { title, body } = payload.notification;
      setToast({ title, body });
      setTimeout(() => setToast(null), 4000);
    });
    return unsubscribe;
  }, []);

  // iOS 포그라운드 알림: 서비스워커 postMessage 수신 (iOS는 onMessage 대신 onBackgroundMessage로 라우팅)
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handler = (event) => {
      if (event.data?.type === "FCM_FOREGROUND") {
        const { title, body } = event.data.payload.notification;
        setToast({ title, body });
        setTimeout(() => setToast(null), 4000);
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  // 앱 시작 시 알림 자동 껐다 켜기 (Profile 토글과 동일한 흐름으로 APNS 재구독)
  useEffect(() => {
    const notiEnabled = localStorage.getItem("notiEnabled") === "true";
    if (!notiEnabled) return;
    (async () => {
      try {
        await clearFcmToken();                    // 1. 서버 토큰 제거 (끄기)
        const token = await requestFcmToken(true); // 2. 새 APNS 구독 + 토큰 (켜기)
        if (!token) return;
        await updateFcmToken(token);              // 3. 서버 업데이트
        localStorage.setItem("fcmToken", token);
      } catch (err) {
        console.warn("FCM 자동 갱신 실패:", err);
      }
    })();
  }, []);

  return (
    <AuthProvider>
      {toast && (
        <div style={{
          position:"fixed", top:16, right:16, zIndex:9999,
          background:"#fff", borderRadius:10, padding:"12px 16px",
          boxShadow:"0 4px 16px rgba(0,0,0,0.15)", maxWidth:280,
          borderLeft:"4px solid #4CAF50"
        }}>
          <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>{toast.title}</div>
          <div style={{ fontSize:13, color:"#666" }}>{toast.body}</div>
        </div>
      )}
      <BrowserRouter>
        <Routes>
          {/* 공개 라우트 */}
          <Route path="/login"           element={<Login />} />
          <Route path="/signup"          element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
 
          {/* 로그인 필요 */}
          <Route path="/feed"
            element={<PrivateRoute><Feed /></PrivateRoute>} />
          <Route path="/dashboard"
            element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/ranking"
            element={<PrivateRoute><Ranking /></PrivateRoute>} />
          <Route path="/profile"
            element={<PrivateRoute><Profile /></PrivateRoute>} />
 
          {/* ADMIN 전용 */}
          <Route path="/admin"
            element={<AdminRoute><Admin /></AdminRoute>} />
 
          {/* 루트 경로: 로그인 상태면 /feed, 아니면 /login */}
          <Route path="/" element={<PrivateRoute><Navigate to="/feed" replace /></PrivateRoute>} />

          {/* 기본 리다이렉트 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
