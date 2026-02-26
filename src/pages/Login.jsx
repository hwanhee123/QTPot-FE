import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as loginApi } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    try {
      const { data } = await loginApi(form);
      login(data.token, { name: data.name, role: data.role, email: data.email }, rememberMe);
      navigate(data.role === "ADMIN" ? "/admin" : "/feed");
    } catch (err) {
      setError(err.response?.data?.message || "로그인에 실패했습니다.");
    }
  };
  return (
    <div className="auth-page">
      <div className="auth-box fade-in">
        <div className="auth-logo">
          <h1>✝ QTPot</h1>
          <p>매일의 말씀을 기록해요</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-msg">{error}</div>}
          <div className="form-group">
            <label>이메일</label>
            <input type="email" name="email" required
              placeholder="your@email.com"
              value={form.email} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>비밀번호</label>
            <input type="password" name="password" required
              placeholder="••••••••"
              value={form.password} onChange={handleChange} />
          </div>
          <label style={{ display:"flex", alignItems:"center", gap:8,
                          fontSize:13, color:"var(--text-secondary)", marginBottom:12 }}>
            <input type="checkbox" checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)} />
            자동 로그인
          </label>
          <button type="submit" className="btn btn-primary">로그인</button>
        </form>
        <div className="auth-footer">
          <Link to="/forgot-password"
            style={{ display: "block", marginBottom: 8 }}>
            비밀번호를 잊으셨나요?
          </Link>
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </div>
      </div>
    </div>
  );
}
