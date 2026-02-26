import api from "./axios";
 
export const getMyBadges = () =>
  api.get("/api/badges");
