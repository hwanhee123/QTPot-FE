importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDaRCCI_KxX8XY6EHe3Ep9iLMI0VSIvXWo",
  authDomain: "qtpot-7786c.firebaseapp.com",
  projectId: "qtpot-7786c",
  storageBucket: "qtpot-7786c.firebasestorage.app",
  messagingSenderId: "645379437910",
  appId: "1:645379437910:web:ed076e0f08de73aadd92f7",
  measurementId: "G-KC1X1LK4BV"
});

const messaging = firebase.messaging();

// 새 서비스워커 즉시 활성화 (대기 없이 바로 교체)
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

messaging.onBackgroundMessage(async (payload) => {
  const windowClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  const isAppVisible = windowClients.some((c) => c.visibilityState === "visible");

  if (isAppVisible) {
    // 앱이 열려있는 상태 (iOS는 onMessage 대신 여기로 라우팅됨 - 1-2 fix)
    // OS 알림 표시
    self.registration.showNotification(payload.notification.title, {
      body: payload.notification.body,
      icon: "/pwa-192x192.png",
    });
    // 앱에 토스트 표시 요청
    windowClients.forEach((c) => c.postMessage({ type: "FCM_FOREGROUND", payload }));
    return;
  }

  // 앱이 닫혀있는 상태
  const ua = (self.navigator?.userAgent || "").toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  if (isIOS) return; // iOS: APNS가 이미 표시

  // Android/Chrome
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/pwa-192x192.png",
  });
});

// 알림 클릭 시 앱 열기
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow("/");
    })
  );
});