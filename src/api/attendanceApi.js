import api from "./axios";

// ── 다중 사진 업로드 (images: File[], date: "YYYY-MM-DD" | null, isPrivate: bool)
export function uploadAttendance(images, content, date, isPrivate = false) {
  const form = new FormData();
  images.forEach((img) => form.append("images", img));
  form.append("content", content ?? "");
  if (date) form.append("date", date);
  form.append("isPrivate", isPrivate ? "true" : "false");
  return api.post("/api/attendance", form);
}

// ── 소감 수정
export function updateAttendanceContent(id, content) {
  return api.patch(`/api/attendance/${id}/content`, { content });
}

// ── 삭제
export function deleteAttendance(id) {
  return api.delete(`/api/attendance/${id}`);
}

// ── 홈 피드 (date: "YYYY-MM-DD" | null, year/month: 월 전체 조회)
export function getFeed(date, year, month) {
  const params = {};
  if (date)  params.date  = date;
  if (year)  params.year  = year;
  if (month) params.month = month;
  return api.get("/api/attendance/feed", { params });
}

// ── 내 월별 목록
export function getMyAttendance(year, month) {
  return api.get("/api/attendance/my", { params: { year, month } });
}

// ── 내 월별 횟수
export function getMyAttendanceCount(year, month) {
  return api.get("/api/attendance/my/count", { params: { year, month } });
}
// 전체 누적 인증 수
export function getMyTotalCount() {
  return api.get("/api/attendance/my/total-count");
}

// 내 전체 인증 목록 (등록 순서대로)
export function getMyAllAttendance() {
  return api.get("/api/attendance/my/all");
}

// ── 댓글 조회
export function getComments(attendanceId) {
  return api.get(`/api/attendance/${attendanceId}/comments`);
}

// ── 댓글 작성
export function addComment(attendanceId, content) {
  return api.post(`/api/attendance/${attendanceId}/comments`, { content });
}

// ── 댓글 삭제
export function deleteComment(attendanceId, commentId) {
  return api.delete(`/api/attendance/${attendanceId}/comments/${commentId}`);
}
