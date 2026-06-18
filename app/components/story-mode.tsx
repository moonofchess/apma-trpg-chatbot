"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { SESSIONS, STORY_NODES } from "@/lib/story/nodes";
import type { Choice, StatKey, StoryNode } from "@/lib/story/types";
import { DEFAULT_STATS } from "@/lib/story/types";

type ChoiceState =
  | { phase: "idle" }
  | { phase: "result"; choice: Choice; nodeId: string };

type StoryModeProps = {
  onBack: () => void;
};

function StatBar({ label, value }: { label: string; value: number }) {
  if (label === "침식률") {
    const pct = Math.min(100, value);
    return (
      <div className="story-stat">
        <span className="story-stat-label">{label}</span>
        <div className="story-stress-bar">
          <div className="story-stress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="story-stat-value">{value}</span>
      </div>
    );
  }
  return (
    <div className="story-stat">
      <span className="story-stat-label">{label}</span>
      <span className="story-stat-value">{value}</span>
    </div>
  );
}

export function StoryMode({ onBack }: StoryModeProps) {
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<StatKey, number>>({ ...DEFAULT_STATS });
  const [clearedSessions, setClearedSessions] = useState<number[]>([]);
  const [choiceState, setChoiceState] = useState<ChoiceState>({ phase: "idle" });
  const [showSessionSelect, setShowSessionSelect] = useState(true);
  const [horrorActive, setHorrorActive] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const node: StoryNode | null = currentNodeId ? (STORY_NODES.get(currentNodeId) ?? null) : null;

  const applyStats = useCallback((delta: Partial<Record<StatKey, number>> | undefined) => {
    if (!delta) return;
    setStats((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(delta)) {
        next[k as StatKey] = Math.max(0, (next[k as StatKey] ?? 0) + (v ?? 0));
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!node) return;
    applyStats(node.statsOnEnter);
    if (node.horrorMode === true) setHorrorActive(true);
    if (node.horrorMode === false) setHorrorActive(false);
  }, [node?.id]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentNodeId, choiceState]);

  const goToNode = useCallback((id: string) => {
    setChoiceState({ phase: "idle" });
    setCurrentNodeId(id);
  }, []);

  const handleChoice = (choice: Choice) => {
    applyStats(choice.result.stats);
    setChoiceState({ phase: "result", choice, nodeId: currentNodeId! });
  };

  const handleContinue = () => {
    const result = choiceState.phase === "result" ? choiceState.choice.result : null;
    if (!result) return;

    if (result.nextId === "RETRY") {
      setChoiceState({ phase: "idle" });
      return;
    }
    goToNode(result.nextId);
  };

  const handleNext = () => {
    if (!node?.nextId) return;
    goToNode(node.nextId);
  };

  const handleSessionClear = (sessionNum: number) => {
    setClearedSessions((prev) =>
      prev.includes(sessionNum) ? prev : [...prev, sessionNum],
    );
    setShowSessionSelect(true);
    setCurrentNodeId(null);
    setChoiceState({ phase: "idle" });
  };

  const startSession = (sessionId: string) => {
    const session = SESSIONS.find((s) => s.id === sessionId);
    if (!session) return;
    setStats({ ...DEFAULT_STATS });
    setChoiceState({ phase: "idle" });
    setHorrorActive(false);
    setShowSessionSelect(false);
    setCurrentNodeId(session.firstNodeId);
  };


  if (showSessionSelect) {
    return (
      <div className={horrorActive ? "app-shell horror-mode" : "app-shell"}>
        <header className="top-bar">
          <div className="top-bar-left">
            <span className="org-logo">괴</span>
            <div>
              <p className="org-name">괴이현상관리국</p>
              <p className="org-sub">Anomaly Phenomenon Management Agency</p>
            </div>
          </div>
          <button type="button" className="classified-stamp story-back-btn" onClick={onBack}>
            ← 모드 선택
          </button>
        </header>

        <main className="story-session-select">
          <div className="story-act-header">
            <p className="story-act-label">📂 스토리 모드</p>
            <h2 className="story-act-title">제1막 : 일상의 붕괴</h2>
          </div>

          <div className="story-session-list">
            {SESSIONS.map((session) => {
              const isUnlocked = session.number === 1 || clearedSessions.includes(session.number - 1);
              const isCleared = clearedSessions.includes(session.number);
              return (
                <button
                  key={session.id}
                  type="button"
                  className={`story-session-btn ${isCleared ? "cleared" : ""} ${!isUnlocked ? "locked" : ""}`}
                  onClick={() => isUnlocked && startSession(session.id)}
                  disabled={!isUnlocked}
                >
                  <div className="story-session-meta">
                    <span className="story-session-num">Session {session.number}</span>
                    {isCleared && <span className="story-session-clear">CLEAR</span>}
                    {!isUnlocked && <span className="story-session-lock">🔒 잠금</span>}
                  </div>
                  <p className="story-session-title">{session.title}</p>
                  <p className="story-session-sub">{session.subtitle}</p>
                </button>
              );
            })}
          </div>
        </main>

        <footer className="site-footer">
          괴이현상관리국 내부망 · 무단 접속 시 관련 규정에 따라 조치됩니다
        </footer>
      </div>
    );
  }

  if (!node) return null;

  const resultPhase = choiceState.phase === "result" ? choiceState : null;
  const resultType = resultPhase?.choice.result.type;
  const isSessionClearNode = typeof node.sessionClear === "number";

  return (
    <div className={node.horrorMode ? "app-shell horror-mode" : "app-shell"}>
      <header className="top-bar">
        <div className="top-bar-left">
          <span className="org-logo">괴</span>
          <div>
            <p className="org-name">괴이현상관리국</p>
            <p className="org-sub">Anomaly Phenomenon Management Agency</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            type="button"
            className="panel-action-button"
            onClick={() => setShowSessionSelect(true)}
          >
            세션 목록
          </button>
          <span className="classified-stamp">대외비</span>
        </div>
      </header>

      <main className="story-main">
        {/* 왼쪽: 스탯 패널 */}
        <aside className="story-stats-panel">
          <p className="story-stats-title">현황</p>
          {(Object.keys(stats) as StatKey[]).map((key) => (
            <StatBar key={key} label={key} value={stats[key]} />
          ))}
          {node.time && (
            <div className="story-time-badge">{node.time}</div>
          )}
        </aside>

        {/* 오른쪽: 스토리 패널 */}
        <section className="story-panel">
          <div className="story-scene-header">
            {node.tag && <span className="story-scene-tag">{node.tag}</span>}
            {node.title && <h2 className="story-scene-title">{node.title}</h2>}
          </div>

          <div className="story-content" ref={contentRef}>
            {node.lines.map((line, i) => (
              <p key={i} className="story-line">
                {line}
              </p>
            ))}

            {node.systemMessages && node.systemMessages.length > 0 && (
              <div className="story-system-messages">
                {node.systemMessages.map((msg, i) => (
                  <p key={i} className="story-system-msg">{msg}</p>
                ))}
              </div>
            )}

            {/* 선택 결과 표시 */}
            {resultPhase && (
              <div className={`story-result story-result-${resultType}`}>
                <p className="story-result-badge">
                  {resultType === "correct" && "✓ 정답"}
                  {resultType === "death" && "✕ 사망"}
                  {resultType === "penalty" && "⚠ 패널티"}
                  {resultType === "neutral" && "→"}
                </p>
                {resultPhase.choice.result.lines.map((line, i) => (
                  <p key={i} className="story-line">{line}</p>
                ))}
                <button
                  type="button"
                  className={`story-continue-btn ${resultType === "death" ? "retry" : ""}`}
                  onClick={resultType === "death" ? () => setChoiceState({ phase: "idle" }) : handleContinue}
                >
                  {resultType === "death" ? "다시 시도" : "계속 →"}
                </button>
              </div>
            )}

            {/* 선택지 표시 */}
            {!resultPhase && node.choices && (
              <div className="story-choices">
                {node.choices.map((choice) => (
                  <button
                    key={choice.label}
                    type="button"
                    className="story-choice-btn"
                    onClick={() => handleChoice(choice)}
                  >
                    <span className="story-choice-label">{choice.label}</span>
                    <span className="story-choice-text">{choice.text}</span>
                    {choice.badge && (
                      <span className="story-choice-badge">{choice.badge}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* 다음/세션클리어 버튼 */}
            {!resultPhase && !node.choices && (
              isSessionClearNode ? (
                <button
                  type="button"
                  className="story-continue-btn session-clear"
                  onClick={() => handleSessionClear(node.sessionClear!)}
                >
                  세션 클리어 — 다음 세션 해금
                </button>
              ) : node.nextId ? (
                <button
                  type="button"
                  className="story-continue-btn"
                  onClick={handleNext}
                >
                  계속 →
                </button>
              ) : null
            )}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        괴이현상관리국 내부망 · 무단 접속 시 관련 규정에 따라 조치됩니다
      </footer>
    </div>
  );
}
