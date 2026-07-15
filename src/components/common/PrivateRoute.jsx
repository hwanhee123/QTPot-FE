import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. [중요] 정보를 불러오는 중(loading)일 때는 아무것도 하지 않습니다.
  // 이 처리가 없으면 유저 정보가 오기도 전에 로그인창으로 튕겨버립니다.
  if (loading) {
    return null;
  }

  // 2. 로딩이 끝났는데 유저가 진짜 없다면 그때만 로그인 페이지로 보냅니다.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. 관리자가 초기화한 임시 비밀번호를 아직 쓰고 있다면 비밀번호를 바꾸기 전까지 프로필 페이지만 허용
  if (user.mustChangePassword && location.pathname !== "/profile") {
    return <Navigate to="/profile" replace />;
  }

  // 4. 유저가 있으면 대시보드(children)를 보여줍니다.
  return children;
}