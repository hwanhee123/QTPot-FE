import { getDaysInMonth } from "../../utils/dateUtils";

// 뱃지 단계별 이미지 및 이름 매핑
const BADGE_CONFIG = {
  "씨앗": { img: "/badge-seed.png",   label: "씨앗",  days: 10 },
  "새싹": { img: "/badge-sprout.png", label: "새싹",  days: 20 },
  "꽃":   { img: "/badge-flower.png", label: "꽃",    days: 30 },
};

function getBadgeConfig(badgeName) {
  for (const key of Object.keys(BADGE_CONFIG)) {
    if (badgeName?.includes(key)) return BADGE_CONFIG[key];
  }
  // 이름에 키워드가 없으면 기본값
  return { img: "/pot-badge.png", label: badgeName, days: null };
}

export default function BadgeCard({ badge }) {
  const config   = getBadgeConfig(badge.badgeName);
  const [year, monthStr] = badge.month.split("-");
  const monthNum = parseInt(monthStr, 10);

  // 2월 꽃 뱃지는 해당 연도 2월의 실제 일수로 표시
  const displayDays = config.label === "꽃" && monthNum === 2
    ? getDaysInMonth(parseInt(year), 2)
    : config.days;

  return (
    <div className="badge-chip">
      <div className="badge-medal">
        <img src={config.img} alt={config.label} className="badge-medal-img" />
        <span className="badge-medal-num">{monthNum}</span>
      </div>
      <div>
        <p className="badge-name">{badge.badgeName}</p>
        <p className="badge-month">{badge.month}</p>
        {displayDays && (
          <p style={{ fontSize:10, color:"var(--accent)", marginTop:2 }}>
            {displayDays}일 달성
          </p>
        )}
      </div>
    </div>
  );
}
