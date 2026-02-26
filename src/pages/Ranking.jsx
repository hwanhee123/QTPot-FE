import { useState, useEffect } from "react";
import Layout from "../components/common/Layout";
import { getRanking } from "../api/rankingApi";
import { getYearMonth, getMonthLabel } from "../utils/dateUtils";
 
const MEDALS = ["🥇", "🥈", "🥉"];
 
export default function Ranking() {
  const now = getYearMonth();
  const [year,    setYear]    = useState(now.year);
  const [month,   setMonth]   = useState(now.month);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
 
  useEffect(() => {
    setLoading(true);
    getRanking(year, month)
      .then((res) => setRanking(res.data))
      .catch(() => setRanking([]))
      .finally(() => setLoading(false));
  }, [year, month]);
 
  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2 className="page-title">월간 랭킹</h2>
          <p className="page-subtitle">{getMonthLabel(year, month)} 큐티 인증 순위</p>
        </div>
        <div className="month-selector">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
        </div>
      </div>
 
      {loading ? (
        <div className="loading">불러오는 중...</div>
      ) : ranking.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📖</div>
          <p>이번 달 인증 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="ranking-list fade-in">
          {ranking.map((r) => (
            <div
              key={r.rank}
              className={`ranking-item ${r.rank <= 3 ? `rank-${r.rank}` : ""}`}
            >
              <div className="ranking-left">
                <span className="ranking-medal">
                  {MEDALS[r.rank - 1] ?? r.rank}
                </span>
                <span className="ranking-name">{r.name}</span>
              </div>
              <span className="ranking-count">{r.count}일</span>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
