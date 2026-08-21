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

  if (forceRefresh) {
    try { await deleteToken(messaging); } catch (_) {}
  }

  try {
    // serviceWorkerRegistration을 직접 넘기지 않으면 Firebase SDK가
    // firebase-messaging-sw.js를 자체 전용 스코프('/firebase-cloud-messaging-push-scope')에
    // 등록/재사용한다. vite-plugin-pwa의 sw.js는 스코프 '/'를 쓰므로 서로 겹치지 않아
    // 두 서비스워커가 공존하고, 앱을 껐다 켜도 push 구독이 끊기지 않는다.
    // (이전에는 두 SW가 같은 스코프 '/'를 두고 서로의 등록을 갈아치워서, 재실행 후엔
    //  push 핸들러가 없는 sw.js가 그 자리를 차지해 알림이 소리 없이 사라졌었음)
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return token || null;
  } catch (_) {
    return null;
  }
}

export function onForegroundMessage(callback) {
  return onMessage(messaging, callback);
}
