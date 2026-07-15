// 현재 연도·월 반환
export function getYearMonth(date = new Date()) {
  return {
    year:  date.getFullYear(),
    month: date.getMonth() + 1,
  };
}

// 오늘 날짜 "YYYY-MM-DD" 문자열
export function getTodayString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
 
// 한국어 월 레이블  예) "2025년 3월"
export function getMonthLabel(year, month) {
  return `${year}년 ${month}월`;
}
 
// 해당 월의 총 일수
export function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}
 
// 해당 월 1일의 요일 (0=일 ~ 6=토)
// 달력 그리드 앞 빈칸 계산에 사용
export function getFirstDayOfWeek(year, month) {
  return new Date(year, month - 1, 1).getDay();
}
