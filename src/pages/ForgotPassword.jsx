import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { resetPassword } from "../api/authApi";
 
export default function ForgotPassword() {
  const [form,  setForm]  = useState({ email:"", name:"", newPassword:"" });
  const [error, setError] = useState("");
  const [done,  setDone]  = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
 
  const handleChange = e =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
 
  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (form.newPassword.length < 8)
      return setError("비밀번호는 8자 이상이어야 합니다.");
    setLoading(true);
    try {
      await resetPassword(form);
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "일치하는 계정을 찾을 수 없습니다.");
    } finally { setLoading(false); }
  };
 
  return (
    <div className="auth-page">
      <div className="auth-box fade-in">
        <div className="auth-logo">
          <h1>✝ QT Tracker</h1>
          <p>비밀번호 찾기</p>
        </div>
 
        {done ? (
          <div style={{ textAlign:"center", padding:"24px 0" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
            <p style={{ color:"var(--success)", fontWeight:500 }}>비밀번호가 변경되었습니다!</p>
            <p style={{ fontSize:13, color:"var(--muted)", marginTop:6 }}>
              로그인 페이지로 이동합니다...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="error-msg">{error}</div>}
            <div className="form-group">
              <label>이메일</label>
              <input type="email" name="email" required
                placeholder="가입할 때 사용한 이메일"
                value={form.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>이름</label>
              <input type="text" name="name" required
                placeholder="가입할 때 입력한 이름"
                value={form.name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>새 비밀번호</label>
              <input type="password" name="newPassword" required
                placeholder="8자 이상"
                value={form.newPassword} onChange={handleChange} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "확인 중..." : "비밀번호 변경"}
            </button>
          </form>
        )}
 
        <div className="auth-footer">
          <Link to="/login">← 로그인으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}
