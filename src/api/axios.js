import axios from "axios";
 
const api = axios.create({
baseURL: "/"
});
 
// 요청마다 토큰 자동 첨부 (자동로그인 여부에 따라 저장소가 다름)
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
 
// 401 응답 → 로그아웃 후 /login 이동
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
 
export default api;
