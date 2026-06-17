"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { FormEvent, useState } from "react";

import { MessageContent } from "./components/message-content";

const START_MESSAGE =
  "입사 첫날입니다. 괴이현상관리국 말단 직원으로서 TRPG를 시작해 주세요. 캐릭터 생성부터 부탁합니다.";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "streaming" || status === "submitted";
  const hasSession = messages.length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    sendMessage({ text });
    setInput("");
  };

  const handleStart = () => {
    if (isLoading) return;
    sendMessage({ text: START_MESSAGE });
  };

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-bar-left">
          <span className="org-logo">괴</span>
          <div>
            <p className="org-name">괴이현상관리국</p>
            <p className="org-sub">Anomaly Phenomenon Management Agency</p>
          </div>
        </div>
        <span className="classified-stamp">대외비</span>
      </header>

      <main className="chat-container">
        <aside className="employee-card">
          <div className="card-photo">👤</div>
          <div className="card-info">
            <p className="card-label">사원증</p>
            <p className="card-name">{hasSession ? "배정 대기 중" : "입사 예정"}</p>
            <dl className="card-details">
              <div>
                <dt>부서</dt>
                <dd>{hasSession ? "—" : "미배정"}</dd>
              </div>
              <div>
                <dt>직급</dt>
                <dd>{hasSession ? "—" : "말단"}</dd>
              </div>
              <div>
                <dt>사번</dt>
                <dd>{hasSession ? "—" : "APMA-2026-___"}</dd>
              </div>
            </dl>
          </div>
        </aside>

        <section className="work-panel">
          <header className="panel-header">
            <h1>근무일지 시스템</h1>
            <p>2026년 · 내부망 전용 · 기록은 영구 보존됩니다</p>
          </header>

          <div className="messages">
            {messages.length === 0 ? (
              <div className="empty-state">
                <p className="empty-badge">입사 D-Day</p>
                <p className="empty-title">괴이현상관리국, 첫 출근</p>
                <p>
                  겉보기엔 평범한 공공기관 사무실입니다. 하지만 복사기 옆
                  게시판에는 「유클리드급 격리 프로토콜 개정」이 붙어 있고,
                  점심 메뉴 고민 대신 야근 조 배정표가 올라옵니다.
                </p>
                <p className="empty-hint">
                  당신은 말단 직원. 보고서, 현장 출동, 상사 눈치가 일상입니다.
                </p>
                <button
                  type="button"
                  className="start-button"
                  onClick={handleStart}
                  disabled={isLoading}
                >
                  출근하기
                </button>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.role === "user" ? "user" : "assistant"}`}
                >
                  <span className="message-label">
                    {message.role === "user" ? "업무 기록" : "근무일지"}
                  </span>
                  <MessageContent parts={message.parts} />
                </div>
              ))
            )}
          </div>

          {isLoading && (
            <p className="status">기록 중… (결재 대기)</p>
          )}

          <form className="chat-form" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="행동 입력… (예: 김 과장에게 보고서 제출을 미룬다)"
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()}>
              기록
            </button>
          </form>
        </section>
      </main>

      <footer className="site-footer">
        괴이현상관리국 내부망 · 무단 접속 시 관련 규정에 따라 조치됩니다
      </footer>
    </div>
  );
}
