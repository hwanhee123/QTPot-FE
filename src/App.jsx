import { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { onForegroundMessage, requestFcmToken } from "./firebase";
import { updateFcmToken, clearFcmToken } from "./api/memberApi";
import PrivateRoute   from "./components/common/PrivateRoute";
import AdminRoute     from "./components/common/AdminRoute";

const Login               = lazy(() => import("./pages/Login"));
const Signup              = lazy(() => import("./pages/Signup"));
const ForgotPassword      = lazy(() => import("./pages/ForgotPassword"));
const Feed                = lazy(() => import("./pages/Feed"));
const Dashboard           = lazy(() => import("./pages/Dashboard"));
const Ranking             = lazy(() => import("./pages/Ranking"));
const Profile             = lazy(() => import("./pages/Profile"));
const Admin               = lazy(() => import("./pages/Admin"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
 
export default function App() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      const { title, body } = payload.notification;
      setToast({ title, body });
      setTimeout(() => setToast(null), 4000);
    });
    return unsubscribe;
  }, []);

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

  useEffect(() => {
    const notiEnabled = localStorage.getItem("notiEnabled") === "true";
    if (!notiEnabled) return;
    (async () => {
      try {
        await clearFcmToken();
        const token = await requestFcmToken(true);
        if (!token) return;
        await updateFcmToken(token);
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
          <Route path="/notification-settings"
            element={<PrivateRoute><NotificationSettings /></PrivateRoute>} />

          {/* ADMIN 전용 */}
          <Route path="/admin"
            element={<AdminRoute><Admin /></AdminRoute>} />
 
          <Route path="/" element={<PrivateRoute><Navigate to="/feed" replace /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
