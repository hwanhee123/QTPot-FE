import { useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import { uploadAttendance } from "../../api/attendanceApi";

const convertToJpeg = async (file) => {
  const isHeic = file.type === "image/heic" || file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif");
  if (isHeic) {
    const heic2any = (await import("heic2any")).default;
    const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 });
    return new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" });
  }
  return file;
};

const compressImage = async (file) => {
  const converted = await convertToJpeg(file);
  return imageCompression(converted, { maxSizeMB: 3, maxWidthOrHeight: 1920, useWebWorker: true });
};

export default function UploadCard({ onSuccess, selectedDate }) {
  const [images,    setImages]    = useState([]);
  const [previews,  setPreviews]  = useState([]);
  const [content,   setContent]   = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [done,      setDone]      = useState(false);
  const fileInputRef = useRef(null);

  // 파일 선택 시 (기존 목록에 추가)
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);
    try {
      const processed = await Promise.all(files.map(compressImage));
      setImages(prev   => [...prev, ...processed]);
      setPreviews(prev => [...prev, ...processed.map(f => URL.createObjectURL(f))]);
    } catch {
      setError("이미지 처리에 실패했습니다. 다른 사진을 선택해주세요.");
    } finally {
      setLoading(false);
    }
    e.target.value = "";
  };

  // 사진 클릭 시 제거
  const removeImage = (idx) => {
    setImages(prev   => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!images.length) return setError("사진을 최소 1장 선택해주세요.");
    setLoading(true); setError("");
    try {
      await uploadAttendance(images, content, selectedDate, isPrivate);
      setDone(true);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || "업로드에 실패했습니다.");
    } finally { setLoading(false); }
  };

  if (done) return (
    <div className="card card-pad fade-in" style={{ textAlign:"center", padding:"40px 20px" }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🙏</div>
      <p style={{ fontFamily:"Cormorant Garamond,serif", fontSize:22,
                  fontWeight:400, color:"var(--accent)", marginBottom:8 }}>
        오늘 큐티 인증 완료!
      </p>
      <p style={{ fontSize:14, color:"var(--muted)" }}>
        말씀과 함께한 오늘 하루도 수고했어요.
      </p>
      <button className="btn btn-secondary btn-sm" style={{ marginTop:20 }}
        onClick={() => { setDone(false); setImages([]); setPreviews([]); setContent(""); setIsPrivate(false); }}>
        추가 업로드하기
      </button>
    </div>
  );

  return (
    <div className="card card-pad">
      <p className="section-title">
        {selectedDate ? `${selectedDate} 큐티 인증` : "오늘의 큐티 인증"}
      </p>
      <form onSubmit={handleSubmit}>

        {/* 사진이 없을 때: 전체 클릭 영역 */}
        {images.length === 0 ? (
          <label className="upload-zone"
            style={{ height:200, display:"flex", flexDirection:"column",
                     alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📷</div>
            <p style={{ fontSize:14, color:"var(--muted)" }}>
              클릭하여 사진 선택 (여러 장 가능)
            </p>
            <p style={{ fontSize:11, color:"var(--muted)", opacity:0.6, marginTop:4 }}>
              JPG, PNG, HEIC 지원
            </p>
            <input ref={fileInputRef} type="file" accept="image/*" multiple
              onChange={handleImageChange} style={{ display:"none" }} />
          </label>
        ) : (
          /* 사진이 있을 때: 그리드 */
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
            {previews.map((src, i) => (
              <div key={i}
                onClick={() => removeImage(i)}
                title="클릭하면 삭제"
                style={{ position:"relative", cursor:"pointer" }}>
                <img src={src} alt={`미리보기 ${i+1}`}
                  style={{ width:"100%", height:100,
                           objectFit:"cover", borderRadius:8 }} />
                <div style={{ position:"absolute", top:4, right:4,
                              background:"rgba(0,0,0,0.55)", color:"#fff",
                              borderRadius:"50%", width:22, height:22,
                              display:"flex", alignItems:"center",
                              justifyContent:"center", fontSize:13 }}>
                  ×
                </div>
              </div>
            ))}

            {/* + 버튼 */}
            <label
              style={{ height:100, border:"1px dashed var(--border)",
                       borderRadius:8, display:"flex",
                       alignItems:"center", justifyContent:"center",
                       fontSize:28, color:"var(--muted)",
                       cursor:"pointer", background:"var(--bg)" }}>
              +
              <input type="file" accept="image/*" multiple
                onChange={handleImageChange} style={{ display:"none" }} />
            </label>
          </div>
        )}

        {/* 비공개 스위치 */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                      marginTop:16, padding:"12px 16px",
                      background:"var(--bg)", borderRadius:10,
                      border:"1px solid var(--border)" }}>
          <div>
            <p style={{ fontSize:13, color:"var(--text)", fontWeight:500 }}>비공개</p>
            <p style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>
              {isPrivate ? "피드에서 이미지가 블러 처리됩니다" : "피드에 이미지가 공개됩니다"}
            </p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={isPrivate}
              onChange={e => setIsPrivate(e.target.checked)} />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="form-group" style={{ marginTop:16 }}>
          <label>한줄 소감 (선택)</label>
          <textarea value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="오늘 받은 말씀의 은혜를 짧게 남겨보세요..."
            style={{ minHeight:80, lineHeight:1.5 }} />
        </div>

        {error && <div className="error-msg">{error}</div>}

        <button type="submit" className="btn btn-primary"
          disabled={loading || images.length === 0}>
          {loading ? "업로드 중..." : `인증샷 제출 (${images.length}장)`}
        </button>
      </form>
    </div>
  );
}
