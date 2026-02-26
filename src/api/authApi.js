import api from "./axios";
 
export function login(data)  { return api.post("/api/auth/login",  data); }
export function signup(data) { return api.post("/api/auth/signup", data); }
 
// ── 비밀번호 찾기 (비로그인 상태)
// data: { email, name, newPassword }
export function resetPassword(data) {
  return api.post("/api/auth/reset-password", data);
}
