import { useState, useEffect, useRef } from "react";
import Layout from "../components/common/Layout";
import FeedCard from "../components/attendance/FeedCard";
import RetryError from "../components/common/RetryError";
import { alertUnlessSessionExpired } from "../utils/errorUtils";
import { getAdminMembers, resetMemberPassword,
         getAdminAttendanceByDate } from "../api/memberApi";

export default function Admin() {
  const [members,  setMembers]  = useState([]);
  const [date,     setDate]     = useState("");
  const [feed,     setFeed]     = useState([]);
  const [loadingM, setLoadingM] = useState(true);
  const [loadingF, setLoadingF] = useState(false);
  const [errorM,   setErrorM]   = useState(false);
  const [tab,      setTab]      = useState("members");
  const [retryTick, setRetryTick] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const reqId = ++requestIdRef.current;
    setLoadingM(true);
    setErrorM(false);
    getAdminMembers()
      .then(r => {
        if (reqId !== requestIdRef.current) return;
        setMembers(r.data);
      })
      .catch((err) => {
        if (reqId !== requestIdRef.current) return;
        if (err.response?.status !== 401) setErrorM(true);
      })
      .finally(() => {
        if (reqId === requestIdRef.current) setLoadingM(false);
      });
  }, [retryTick]);

  const handleReset = async (id, name) => {
    if (!window.confirm(`${name}님의 비밀번호를 123456789로 초기화할까요?`)) return;
    await resetMemberPassword(id);
    alert("초기화되었습니다.");
  };

  const handleFeedSearch = async () => {
    if (!date) return alert("날짜를 선택해주세요.");
    setLoadingF(true);
    try {
      const r = await getAdminAttendanceByDate(date);
      setFeed(r.data);
    } catch (err) {
      setFeed([]); // 실패한 조회의 결과로 이전 날짜의 조회 결과가 그대로 남아있지 않도록
      alertUnlessSessionExpired(err, "조회에 실패했습니다. 다시 시도해주세요.");
    } finally { setLoadingF(false); }
  };
 
  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2 className="page-title">🛡 관리자 페이지</h2>
          <p className="page-subtitle">멤버 관리 및 통계</p>
        </div>
      </div>
 
      {/* 탭 */}
      <div style={{ display:"flex", gap:0, marginBottom:24,
                    border:"1px solid var(--border)", borderRadius:10,
                    overflow:"hidden", width:"fit-content" }}>
        {[["members","멤버 관리"], ["feed","날짜별 인증"]].map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding:"9px 24px", border:"none", cursor:"pointer",
                     fontFamily:"Noto Sans KR,sans-serif", fontSize:13,
                     background: tab===key ? "var(--accent)" : "var(--surface)",
                     color: tab===key ? "#fff" : "var(--muted)" }}>
            {label}
          </button>
        ))}
      </div>
 
      {/* ── 멤버 관리 탭 ── */}
      {tab === "members" && (
        loadingM ? <div className="loading">불러오는 중...</div> : errorM ? (
          <RetryError message="멤버 목록을 불러오지 못했습니다." onRetry={() => setRetryTick(t => t + 1)} />
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse",
                            fontFamily:"Noto Sans KR,sans-serif", fontSize:13 }}>
              <thead>
                <tr style={{ background:"var(--bg2)", color:"var(--muted)", textAlign:"left" }}>
                  {["이름","이메일","역할","이번달","올해","누적","초기화"].map(h => (
                    <th key={h} style={{ padding:"10px 14px",
                                         borderBottom:"1px solid var(--border)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id} style={{ borderBottom:"1px solid var(--border)" }}>
                    <td style={{ padding:"10px 14px", color:"var(--text)", fontWeight:500 }}>
                      {m.name}
                    </td>
                    <td style={{ padding:"10px 14px", color:"var(--muted)" }}>{m.email}</td>
                    <td style={{ padding:"10px 14px" }}>
                      <span style={{ background:"var(--bg2)",
                                     border:"1px solid var(--border)",
                                     borderRadius:20, padding:"2px 8px",
                                     fontSize:11, color:"var(--accent)" }}>
                        {m.role}
                      </span>
                    </td>
                    <td style={{ padding:"10px 14px", color:"var(--accent)",
                                  fontWeight:700, fontSize:15 }}>
                      {m.thisMonthCount}일
                    </td>
                    <td style={{ padding:"10px 14px", color:"var(--accent)",
                                  fontWeight:700, fontSize:15 }}>
                      {m.yearCount}일
                    </td>
                    <td style={{ padding:"10px 14px", color:"var(--muted)" }}>
                      {m.totalCount}회
                    </td>
                    <td style={{ padding:"10px 14px" }}>
                      <button onClick={() => handleReset(m.id, m.name)}
                        style={{ padding:"5px 12px",
                                 border:"1px solid var(--danger)",
                                 background:"transparent", color:"var(--danger)",
                                 borderRadius:6, fontSize:12, cursor:"pointer" }}>
                        초기화
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
 
      {/* ── 날짜별 인증 탭 ── */}
      {tab === "feed" && (
        <div>
          <div style={{ display:"flex", gap:8, marginBottom:20, alignItems:"center" }}>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ padding:"7px 12px", background:"var(--surface)",
                       border:"1px solid var(--border)", borderRadius:8,
                       fontSize:13, color:"var(--text)", outline:"none" }} />
            <button className="btn btn-primary btn-sm" onClick={handleFeedSearch}>
              조회
            </button>
            {feed.length > 0 && (
              <span style={{
                fontWeight:700,
                fontSize:15, color:"var(--accent)", marginLeft:8
              }}>
                총 {feed.length}명 인증
              </span>
            )}
          </div>
 
          {loadingF ? (
            <div className="loading">불러오는 중...</div>
          ) : feed.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📅</div>
              <p>날짜를 선택하고 조회 버튼을 눌러주세요.</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {feed.map(item => (
                <FeedCard key={item.id} item={item}
                  isMine={false} onDelete={() => {}} onEditContent={() => {}} />
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
