import { useState, useEffect } from "react";
import { getComments, addComment, deleteComment } from "../../api/attendanceApi";
import { useAuth } from "../../context/AuthContext";

export default function FeedCard({ item, onDelete, onEditContent, isMine, showOriginal = false }) {
  const { user } = useAuth();
  const [imgIdx,      setImgIdx]      = useState(0);
  const [editMode,    setEditMode]    = useState(false);
  const [editContent, setEditContent] = useState(item.content || "");
  const [saving,      setSaving]      = useState(false);

  // 댓글 상태
  const [comments,     setComments]     = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);

  const images = item.imageUrls ?? [];
  // 비공개이고 내 글이 아닌 경우 블러
  const isBlurred = item.isPrivate && !isMine && !showOriginal;

  // 댓글 토글 시 로드
  useEffect(() => {
    if (!showComments) return;
    setCommentLoading(true);
    getComments(item.id)
      .then(res => setComments(res.data))
      .catch(() => {})
      .finally(() => setCommentLoading(false));
  }, [showComments, item.id]);

  const handleSave = async () => {
    setSaving(true);
    await onEditContent(item.id, editContent);
    setEditMode(false);
    setSaving(false);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setSubmitting(true);
    try {
      const res = await addComment(item.id, commentInput.trim());
      setComments(prev => [...prev, res.data]);
      setCommentInput("");
    } catch {
      alert("댓글 등록에 실패했습니다.");
    } finally { setSubmitting(false); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("댓글을 삭제할까요?")) return;
    try {
      await deleteComment(item.id, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch {
      alert("댓글 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="card fade-in" style={{ overflow:"hidden" }}>

      {/* 사진 슬라이더 */}
      {images.length > 0 && (
        <div style={{ position:"relative", background:"#000" }}>
          <img src={images[imgIdx]} alt="큐티"
            style={{
              width:"100%", maxHeight:320, objectFit:"cover",
              opacity: images.length > 1 ? 0.95 : 1,
              filter: isBlurred ? "blur(3px)" : "none",
              transition: "filter 0.2s",
            }} />
          {/* 화살표: 사진 2장 이상일 때만 */}
          {images.length > 1 && (
            <>
              <button onClick={() => setImgIdx(i => Math.max(0, i-1))}
                style={arrowStyle("left")} disabled={imgIdx === 0}>‹</button>
              <button onClick={() => setImgIdx(i => Math.min(images.length-1, i+1))}
                style={arrowStyle("right")} disabled={imgIdx === images.length-1}>›</button>
              {/* 인디케이터 */}
              <div style={{ position:"absolute", bottom:8, left:0, right:0,
                            display:"flex", justifyContent:"center", gap:4 }}>
                {images.map((_,i) => (
                  <span key={i} onClick={() => setImgIdx(i)}
                    style={{ width:6, height:6, borderRadius:"50%",
                             background: i===imgIdx ? "#fff" : "rgba(255,255,255,0.45)",
                             cursor:"pointer" }} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* 카드 하단 */}
      <div style={{ padding:"16px 20px" }}>
        {/* 멤버 이름 + 날짜 + 비공개 뱃지 */}
        <div style={{ display:"flex", justifyContent:"space-between",
                       alignItems:"center", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontWeight:500, fontSize:14, color:"var(--text)" }}>
              {item.memberName}
            </span>
            {item.isPrivate && (
              <span style={{ fontSize:10, color:"var(--muted)",
                             background:"var(--bg2)", border:"1px solid var(--border)",
                             borderRadius:10, padding:"1px 7px" }}>비공개</span>
            )}
          </div>
          <span style={{ fontSize:12, color:"var(--muted)" }}>
            {item.createdDate}
          </span>
        </div>

        {/* 소감 */}
        {editMode ? (
          <div>
            <textarea value={editContent}
              onChange={e => setEditContent(e.target.value)}
              style={{ width:"100%", minHeight:70, padding:"8px 10px",
                       border:"1px solid var(--border)", borderRadius:8,
                       fontFamily:"Noto Sans KR, sans-serif",
                       fontSize:13, resize:"vertical", outline:"none" }} />
            <div style={{ display:"flex", gap:8, marginTop:8 }}>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                {saving ? "저장 중..." : "저장"}
              </button>
              <button className="btn btn-secondary btn-sm"
                onClick={() => { setEditMode(false); setEditContent(item.content||""); }}>
                취소
              </button>
            </div>
          </div>
        ) : (
          item.content && (
            <p style={{ fontSize:14, color:"var(--muted)", lineHeight:1.7,
                         fontStyle:"italic" }}>
              "{item.content}"
            </p>
          )
        )}

        {/* 본인 글 수정/삭제 버튼 */}
        {isMine && !editMode && (
          <div style={{ display:"flex", gap:8, marginTop:12,
                         paddingTop:12, borderTop:"1px solid var(--border)" }}>
            <button className="btn btn-secondary btn-sm"
              onClick={() => setEditMode(true)}>
              소감 수정
            </button>
            <button className="btn btn-sm"
              onClick={() => onDelete(item.id)}
              style={{ color:"var(--danger)", border:"1px solid var(--danger)",
                        background:"transparent", borderRadius:8,
                        padding:"7px 16px", fontSize:13, cursor:"pointer" }}>
              삭제
            </button>
          </div>
        )}

        {/* 댓글 토글 버튼 */}
        <button
          onClick={() => setShowComments(v => !v)}
          style={{ marginTop:12, background:"none", border:"none",
                   color:"var(--muted)", fontSize:12, cursor:"pointer",
                   display:"flex", alignItems:"center", gap:4, padding:0 }}>
          <span>💬</span>
          <span>{showComments ? "댓글 닫기" : `댓글 ${item.commentCount != null ? `(${item.commentCount})` : "보기"}`}</span>
        </button>

        {/* 댓글 영역 */}
        {showComments && (
          <div style={{ marginTop:10, borderTop:"1px solid var(--border)", paddingTop:12 }}>
            {commentLoading ? (
              <p style={{ fontSize:12, color:"var(--muted)", textAlign:"center" }}>불러오는 중...</p>
            ) : comments.length === 0 ? (
              <p style={{ fontSize:12, color:"var(--muted)", textAlign:"center", padding:"8px 0" }}>
                첫 댓글을 남겨보세요 🙏
              </p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
                {comments.map(c => (
                  <div key={c.id} className="comment-item">
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div>
                        <span style={{ fontSize:12, fontWeight:500, color:"var(--accent)" }}>
                          {c.memberName}
                        </span>
                        <span style={{ fontSize:11, color:"var(--muted)", marginLeft:6 }}>
                          {c.createdDate}
                        </span>
                      </div>
                      {c.memberEmail === user?.email && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          style={{ background:"none", border:"none",
                                   color:"var(--muted)", fontSize:11,
                                   cursor:"pointer", padding:0 }}>
                          삭제
                        </button>
                      )}
                    </div>
                    <p style={{ fontSize:13, color:"var(--text)", marginTop:3, lineHeight:1.5 }}>
                      {c.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* 댓글 입력 */}
            <form onSubmit={handleAddComment} style={{ display:"flex", gap:8 }}>
              <input
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                placeholder="댓글을 입력하세요..."
                maxLength={200}
                style={{ flex:1, padding:"8px 12px",
                         border:"1px solid var(--border)", borderRadius:8,
                         fontFamily:"Noto Sans KR, sans-serif",
                         fontSize:13, color:"var(--text)",
                         background:"var(--bg)", outline:"none" }} />
              <button type="submit" className="btn btn-primary btn-sm"
                disabled={submitting || !commentInput.trim()}
                style={{ whiteSpace:"nowrap" }}>
                {submitting ? "..." : "등록"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const arrowStyle = (side) => ({
  position:"absolute", top:"50%", transform:"translateY(-50%)",
  [side]: 8,
  background:"rgba(0,0,0,0.4)", color:"#fff",
  border:"none", borderRadius:"50%",
  width:32, height:32, fontSize:20, lineHeight:"30px",
  textAlign:"center", cursor:"pointer",
});
