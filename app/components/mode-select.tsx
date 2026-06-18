"use client";

type ModeSelectProps = {
  onSelect: (mode: "story" | "chat") => void;
};

export function ModeSelect({ onSelect }: ModeSelectProps) {
  return (
    <div className="mode-select">
      <div className="mode-select-header">
        <span className="mode-select-logo">괴</span>
        <p className="mode-select-agency">특수기록물관리청</p>
        <p className="mode-select-sub">국가재난안전처 산하 · 접근 등급 A</p>
      </div>

      <div className="mode-select-title-block">
        <p className="mode-select-label">미션 유형 선택</p>
        <h1 className="mode-select-title">어떤 방식으로 출근하겠습니까?</h1>
      </div>

      <div className="mode-select-buttons">
        <button
          type="button"
          className="mode-btn mode-btn-story"
          onClick={() => onSelect("story")}
        >
          <span className="mode-btn-icon">📂</span>
          <span className="mode-btn-name">스토리 모드</span>
          <span className="mode-btn-desc">제1막 : 일상의 붕괴 — 선택지 기반 TextRPG</span>
        </button>

        <button
          type="button"
          className="mode-btn mode-btn-chat"
          disabled
        >
          <span className="mode-btn-icon">🤖</span>
          <span className="mode-btn-name">AI 챗 모드</span>
          <span className="mode-btn-desc">자유 서술 AI 응답 TRPG</span>
          <span className="mode-btn-badge">준비 중</span>
        </button>
      </div>

      <p className="mode-select-footer">
        괴이현상관리국 내부망 · 무단 접속 시 관련 규정에 따라 조치됩니다
      </p>
    </div>
  );
}
