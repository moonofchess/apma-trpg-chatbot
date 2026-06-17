"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { EmployeeCard } from "./components/employee-card";
import { MessageContent } from "./components/message-content";
import {
  buildIntakeMessage,
  OnboardingForm,
  type IntakeData,
} from "./components/onboarding-form";
import { SuggestedReplies } from "./components/suggested-replies";
import { extractGameState } from "@/lib/trpg/employee-profile";
import { extractLatestSuggestedReplies } from "@/lib/trpg/suggested-replies";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [intake, setIntake] = useState<IntakeData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "streaming" || status === "submitted";
  const hasSession = messages.length > 0;

  const messageParts = useMemo(
    () =>
      messages.map((m) => ({
        role: m.role,
        parts: m.parts as { type: string; state?: string; output?: unknown }[],
      })),
    [messages],
  );

  const { profile, chapter } = useMemo(
    () => extractGameState(messageParts.map((m) => m.parts)),
    [messageParts],
  );

  const suggestedReplies = useMemo(() => {
    if (isLoading) return [];
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return [];
    return extractLatestSuggestedReplies(messageParts);
  }, [messageParts, messages, isLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendUserMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendUserMessage(input);
  };

  const handleIntakeSubmit = (data: IntakeData) => {
    if (isLoading) return;
    setIntake(data);
    sendMessage({ text: buildIntakeMessage(data) });
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
          intake={intake}
        />

        <section className="work-panel">
          <header className="panel-header">
            <h1>근무일지 시스템</h1>
            <p>
              {chapter
                ? chapter.subtitle
                  ? `${chapter.title} — ${chapter.subtitle}`
                  : chapter.title
                : "2026년 · 내부망 전용"}
            </p>
          </header>

          <div className="messages">
            {messages.length === 0 ? (
              <OnboardingForm onSubmit={handleIntakeSubmit} disabled={isLoading} />
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

          {hasSession && suggestedReplies.length > 0 && (
            <SuggestedReplies
              replies={suggestedReplies}
              onSelect={sendUserMessage}
              disabled={isLoading}
            />
          )}

          <form className="chat-form" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="직접 입력… (예: 신분증을 건넨다)"
              disabled={isLoading || !hasSession}
            />
            <button type="submit" disabled={isLoading || !input.trim() || !hasSession}>
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
