export default function RetryError({ message, onRetry }) {
  return (
    <div className="empty-state">
      <div className="icon">⚠️</div>
      <p>{message}</p>
      <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={onRetry}>
        다시 시도
      </button>
    </div>
  );
}
