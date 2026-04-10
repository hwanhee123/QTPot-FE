import api from "./axios";

export function changeMyPassword(currentPassword, newPassword) {
  return api.put("/api/members/me/password", { currentPassword, newPassword });
}

export function updateFcmToken(fcmToken) {
  return api.put("/api/members/me/fcm-token", { fcmToken });
}

export function clearFcmToken() {
  return api.delete("/api/members/me/fcm-token");
}

// ── 알림 설정 조회
export function getNotificationSettings() {
  return api.get("/api/members/me/notification-settings");
}

// ── 알림 설정 저장
export function updateNotificationSettings(commentNotiEnabled, qtNotiTime) {
  return api.put("/api/members/me/notification-settings", {
    commentNotiEnabled,
    qtNotiTime: qtNotiTime || null,
  });
}

export function getAdminMembers() {
  return api.get("/api/admin/members");
}

export function resetMemberPassword(memberId) {
  return api.post(`/api/admin/members/${memberId}/reset-password`);
}

export function getAdminAttendanceByDate(date) {
  return api.get("/api/admin/attendance", { params: { date } });
}
