"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
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
import {
  buildFallbackSuggestedReplies,
  extractLatestSuggestedReplies,
} from "@/lib/trpg/suggested-replies";

const ACTIVE_SESSION_KEY = "apma-trpg-active-session";
const SAVE_SLOTS_KEY = "apma-trpg-save-slots";
const MAX_SAVE_SLOTS = 3;

type SavedSession = {
  id: string;
  title: string;
  updatedAt: string;
  messages: UIMessage[];
  intake: IntakeData | null;
};

function readSavedSession(key: string): SavedSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedSession;
    return Array.isArray(parsed.messages) ? parsed : null;
  } catch {
    return null;
  }
}

type SaveSlot = SavedSession | null;

function readSaveSlots(): SaveSlot[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(SAVE_SLOTS_KEY);
    if (!raw) return Array(MAX_SAVE_SLOTS).fill(null);
    const parsed = JSON.parse(raw) as SaveSlot[];
    if (!Array.isArray(parsed)) return Array(MAX_SAVE_SLOTS).fill(null);

    return Array.from({ length: MAX_SAVE_SLOTS }, (_, index) => {
      const slot = parsed[index];
      return slot && Array.isArray(slot.messages) ? slot : null;
    });
  } catch {
    return Array(MAX_SAVE_SLOTS).fill(null);
  }
}

function writeSaveSlots(slots: SaveSlot[]) {
  window.localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(slots.slice(0, MAX_SAVE_SLOTS)));
}

function formatSavedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "저장됨";

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [intake, setIntake] = useState<IntakeData | null>(null);
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>(Array(MAX_SAVE_SLOTS).fill(null));
  const [storageReady, setStorageReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, setMessages, status } = useChat({
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

  const saveTitle = useMemo(() => {
    const name = intake?.name || profile.name;
    const chapterTitle = chapter?.title || "입사 대기";
    return `${name} · ${chapterTitle}`;
  }, [chapter, intake, profile]);

  const suggestedReplies = useMemo(() => {
    if (isLoading) return [];
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return [];
    const replies = extractLatestSuggestedReplies(messageParts);
    return replies.length > 0 ? replies : buildFallbackSuggestedReplies(chapter);
  }, [chapter, messageParts, messages, isLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const activeSession = readSavedSession(ACTIVE_SESSION_KEY);
    setSaveSlots(readSaveSlots());

    if (activeSession) {
      setMessages(activeSession.messages);
      setIntake(activeSession.intake);
    }

    setStorageReady(true);
  }, [setMessages]);

  useEffect(() => {
    if (!storageReady) return;

    const hasActiveSession = messages.length > 0 || intake !== null;
    if (!hasActiveSession) {
      window.localStorage.removeItem(ACTIVE_SESSION_KEY);
      return;
    }

    const activeSession: SavedSession = {
      id: "active",
      title: saveTitle,
      updatedAt: new Date().toISOString(),
      messages,
      intake,
    };

    window.localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(activeSession));
  }, [intake, messages, saveTitle, storageReady]);

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

  const saveToSlot = (slotIndex: number) => {
    if (isLoading || messages.length === 0) return;

    const nextSlots = [...saveSlots];
    nextSlots[slotIndex] = {
      id: `slot-${slotIndex + 1}`,
      title: saveTitle,
      updatedAt: new Date().toISOString(),
      messages,
      intake,
    };

    const normalizedSlots = Array.from({ length: MAX_SAVE_SLOTS }, (_, index) => nextSlots[index] ?? null);

    setSaveSlots(normalizedSlots);
    writeSaveSlots(normalizedSlots);
  };

  const loadSlot = (slot: SavedSession) => {
    if (isLoading) return;
    setMessages(slot.messages);
    setIntake(slot.intake);
    setInput("");
  };

  const clearCurrentSession = () => {
    if (isLoading) return;
    setMessages([]);
    setIntake(null);
    setInput("");
    window.localStorage.removeItem(ACTIVE_SESSION_KEY);
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
            <div>
              <h1>근무일지 시스템</h1>
              <p>
                {chapter
                  ? chapter.subtitle
                    ? `${chapter.title} — ${chapter.subtitle}`
                    : chapter.title
                  : "2026년 · 내부망 전용"}
              </p>
            </div>
            <button
              type="button"
              className="new-session-button"
              onClick={clearCurrentSession}
              disabled={isLoading || !hasSession}
            >
              새 기록
            </button>
          </header>

          <div className="save-slots" aria-label="저장 슬롯">
            {Array.from({ length: MAX_SAVE_SLOTS }, (_, index) => {
              const slot = saveSlots[index];
              return (
                <div className="save-slot" key={index}>
                  <button
                    type="button"
                    className="save-slot-load"
                    onClick={() => slot && loadSlot(slot)}
                    disabled={isLoading || !slot}
                    title={slot ? `${slot.title} 불러오기` : "빈 슬롯"}
                  >
                    <span>슬롯 {index + 1}</span>
                    <small>{slot ? `${slot.title} · ${formatSavedAt(slot.updatedAt)}` : "비어 있음"}</small>
                  </button>
                  <button
                    type="button"
                    className="save-slot-save"
                    onClick={() => saveToSlot(index)}
                    disabled={isLoading || !hasSession}
                    title={`슬롯 ${index + 1}에 저장`}
                  >
                    저장
                  </button>
                </div>
              );
            })}
          </div>

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
                    <MessageContent parts={message.parts} role={message.role} />
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
