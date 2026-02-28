import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup as signupApi } from "../api/authApi";
 
export default function Signup() {
  const [form,     setForm]    = useState({ name:"", email:"", password:"" });
  const [confirm,  setConfirm] = useState("");
  const [error,    setError]   = useState("");
  const [success,  setSuccess] = useState(false);
  const navigate = useNavigate();
 
  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
 
  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (form.password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    try {
      await signupApi(form);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "회원가입에 실패했습니다.");
    }
  };
 
  return (
    <div className="auth-page">
      <div className="auth-box fade-in">
 
        <div className="auth-logo">
          <h1>✝ QT Tracker</h1>
          <p>함께 말씀을 나누는 공동체</p>
        </div>
 
        {success ? (
          <div style={{ textAlign:"center", padding:"24px 0" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
            <p style={{ color:"var(--success)", fontWeight:500 }}>가입 완료!</p>
            <p style={{ fontSize:13, color:"var(--muted)", marginTop:6 }}>
              로그인 페이지로 이동합니다...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="error-msg">{error}</div>}
 
            <div className="form-group">
              <label>이름</label>
              <input type="text" name="name" required
                placeholder="홍길동"
                value={form.name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>이메일</label>
              <input type="email" name="email" required
                placeholder="your@email.com"
                value={form.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>비밀번호</label>
              <input type="password" name="password" required minLength={8}
                placeholder="8자 이상"
                value={form.password} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>비밀번호 확인</label>
              <input type="password" required
                placeholder="비밀번호를 한 번 더 입력하세요"
                value={confirm} onChange={e => setConfirm(e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary">
              가입하기
            </button>
          </form>
        )}
 
        <div className="auth-footer">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </div>
      </div>
    </div>
  );
}
