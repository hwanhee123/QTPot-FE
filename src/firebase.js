import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, deleteToken } from "firebase/messaging";

// Firebase 콘솔 > 프로젝트 설정 > 일반 > 내 앱 에서 복사
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

// Firebase 콘솔 > 프로젝트 설정 > 클라우드 메시징 > 웹 푸시 인증서(VAPID 키) 에서 복사
const VAPID_KEY = "BLmWPaQegmOFybAhSZH3tv6m5PXMKhMIPNpZkhzvljyneIN2f75KdJzjZIFP8yddM7cpJUztFfdcwo6RY-mmxAk";

// forceRefresh=true: 기존 토큰 삭제 후 재발급 (iOS APNS 구독 갱신용)
export async function requestFcmToken(forceRefresh = false) {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

  if (forceRefresh) {
    try { await deleteToken(messaging); } catch (_) { /* 토큰 없으면 무시 */ }
  }

  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  return token;
}

// 앱 시작 시 전용 토큰 갱신: pushManager 레벨에서 구독 끊어 APNS 강제 갱신
export async function refreshFcmTokenOnStart() {
  if (Notification.permission !== "granted") return null;
  try {
    const registration = await navigator.serviceWorker.ready;

    // Firebase SDK 캐시를 우회해 브라우저/OS 레벨에서 직접 구독 해제
    const existingSub = await registration.pushManager.getSubscription();
    if (existingSub) await existingSub.unsubscribe();

    // Firebase 내부 캐시도 제거
    try { await deleteToken(messaging); } catch (_) {}

    // 완전히 새 APNS 구독으로 토큰 발급
    return await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  } catch (_) {
    return null;
  }
}

// 앱이 열려있는 상태(포그라운드)에서 알림 수신
export function onForegroundMessage(callback) {
  return onMessage(messaging, callback);
}
