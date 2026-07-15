import api from "./axios";
 
export function login(data)  { return api.post("/api/auth/login",  data); }
export function signup(data) { return api.post("/api/auth/signup", data); }
export function logout()     { return api.post("/api/auth/logout"); }
