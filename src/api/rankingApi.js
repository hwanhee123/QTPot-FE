import api from "./axios";
 
export const getRanking = (year, month) =>
  api.get(`/api/ranking?year=${year}&month=${month}`);
