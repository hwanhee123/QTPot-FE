import api from "./axios";

// ── 마이페이지 비밀번호 변경 (로그인 필요)
export function changeMyPassword(currentPassword, newPassword) {
  return api.put("/api/members/me/password", { currentPassword, newPassword });
}

// ── FCM 토큰 저장
export function updateFcmToken(fcmToken) {
  return api.put("/api/members/me/fcm-token", { fcmToken });
}

// ── FCM 토큰 삭제 (알림 끄기)
export function clearFcmToken() {
  return api.delete("/api/members/me/fcm-token");
}
 
// ── 관리자: 전체 멤버 목록
export function getAdminMembers() {
  return api.get("/api/admin/members");
}
 
// ── 관리자: 비밀번호 초기화
export function resetMemberPassword(memberId) {
  return api.post(`/api/admin/members/${memberId}/reset-password`);
}
 
// ── 관리자: 날짜별 인증 명단
export function getAdminAttendanceByDate(date) {
  return api.get("/api/admin/attendance", { params: { date } });
}
