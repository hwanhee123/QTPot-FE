import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, deleteToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDaRCCI_KxX8XY6EHe3Ep9iLMI0VSIvXWo",
  authDomain: "qtpot-7786c.firebaseapp.com",
  projectId: "qtpot-7786c",
  storageBucket: "qtpot-7786c.firebasestorage.app",
  messagingSenderId: "645379437910",
  appId: "1:645379437910:web:ed076e0f08de73aadd92f7",
  measurementId: "G-KC1X1LK4BV"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

const VAPID_KEY = "BLmWPaQegmOFybAhSZH3tv6m5PXMKhMIPNpZkhzvljyneIN2f75KdJzjZIFP8yddM7cpJUztFfdcwo6RY-mmxAk";

export async function requestFcmToken(forceRefresh = false) {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  let registration;

  if (forceRefresh) {
    // 알림설정 저장 시: 새 서비스워커 등록 + 기존 토큰 삭제 후 재발급
    registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    try { await deleteToken(messaging); } catch (_) {}
  } else {
    // 앱 재실행 시: 기존 서비스워커 유지 (새로 등록하지 않음)
    // 새로 등록하면 iOS에서 push 구독이 끊길 수 있음
    try {
      registration = await navigator.serviceWorker.ready;
    } catch (_) {
      registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    }
  }

  try {
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch (_) {
    return null;
  }
}

export function onForegroundMessage(callback) {
  return onMessage(messaging, callback);
}
