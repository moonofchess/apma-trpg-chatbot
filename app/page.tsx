"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { EmployeeCard } from "./components/employee-card";
import { MessageContent } from "./components/message-content";
import { extractGameState } from "@/lib/trpg/employee-profile";

const START_MESSAGE =
  "입사 첫날. 사건으로 시작해 주세요. 제1화부터 진행합니다.";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "streaming" || status === "submitted";
  const hasSession = messages.length > 0;

  const { profile, chapter } = useMemo(
    () =>
      extractGameState(
        messages.map((m) => m.parts as { type: string; state?: string; output?: unknown }[]),
      ),
    [messages],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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
        <EmployeeCard
          profile={profile}
          chapter={chapter}
          hasSession={hasSession}
        />

        <section className="work-panel">
          <header className="panel-header">
            <h1>근무일지 시스템</h1>
            <p>
              {chapter
                ? `제${chapter.chapter}화 · ${chapter.title}`
                : "2026년 · 내부망 전용"}
            </p>
          </header>

          <div className="messages">
            {messages.length === 0 ? (
              <div className="empty-state">
                <p className="empty-badge">입사 D-Day</p>
                <p className="empty-title">전자결재 알림이 울린다</p>
                <p>
                  온보딩 안내 메일 제목에 「유클리드」가 박혀 있다.
                  복도 끝 프린터가 돌아가는 소리. 아직 이름표도 없다.
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
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${message.role === "user" ? "user" : "assistant"}`}
                  >
                    <span className="message-label">
                      {message.role === "user" ? "업무 기록" : "근무일지"}
                    </span>
                    <MessageContent parts={message.parts} />
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
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
