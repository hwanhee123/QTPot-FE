// 401은 axios 인터셉터가 이미 로그인 페이지로 이동시키며 처리하므로 중복 알림 생략
export function alertUnlessSessionExpired(err, message) {
  if (err.response?.status !== 401) alert(message);
}
