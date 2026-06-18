"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";
import { useEffect, useMemo, useRef, useState } from "react";

import { ModeSelect } from "./components/mode-select";
import { StoryMode } from "./components/story-mode";

import { EmployeeCard } from "./components/employee-card";
import { MessageContent, type DiceRollInput } from "./components/message-content";
import {
  buildIntakeMessage,
  getIntakeFullName,
  OnboardingForm,
  type IntakeData,
} from "./components/onboarding-form";
import { SuggestedReplies } from "./components/suggested-replies";
import { extractGameState } from "@/lib/trpg/employee-profile";
import {
  buildFallbackSuggestedReplies,
  extractLatestSuggestedReplies,
} from "@/lib/trpg/suggested-replies";
import { rollDice } from "@/lib/trpg/dice";

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

type ToolMessagePart = {
  type: string;
  state?: string;
  output?: unknown;
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

function sameReplies(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((reply, index) => reply.trim() === b[index].trim());
}

function getPreviousAssistantReplies(
  messages: { role: string; parts: ToolMessagePart[] }[],
) {
  const assistantMessages = messages.filter((message) => message.role === "assistant");
  if (assistantMessages.length < 2) return [];

  return extractLatestSuggestedReplies(assistantMessages.slice(0, -1));
}

export default function ChatPage() {
  const [appMode, setAppMode] = useState<"select" | "story" | "chat">("select");

  if (appMode === "select") {
    return <ModeSelect onSelect={setAppMode} />;
  }

  if (appMode === "story") {
    return <StoryMode onBack={() => setAppMode("select")} />;
  }

  return <ChatPageInner />;
}

function ChatPageInner() {
  const [input, setInput] = useState("");
  const [intake, setIntake] = useState<IntakeData | null>(null);
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>(Array(MAX_SAVE_SLOTS).fill(null));
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const latestAssistantRef = useRef<HTMLDivElement>(null);
  const lastFocusedAssistantIdRef = useRef<string | null>(null);
  const { messages, sendMessage, setMessages, status, addToolOutput } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  const isLoading = status === "streaming" || status === "submitted";
  const hasSession = messages.length > 0;

  const messageParts = useMemo(
    () =>
      messages.map((m) => ({
        role: m.role,
        parts: m.parts as ToolMessagePart[],
      })),
    [messages],
  );

  const hasPendingDiceRoll = useMemo(
    () =>
      messageParts.some((message) =>
        message.parts.some(
          (part) => part.type === "tool-rollDice" && part.state === "input-available",
        ),
      ),
    [messageParts],
  );

  const { profile, chapter, horrorMode, gameDate } = useMemo(
    () => extractGameState(messageParts.map((m) => m.parts)),
    [messageParts],
  );

  const latestAssistantId = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant")?.id ?? null,
    [messages],
  );

  const saveTitle = useMemo(() => {
    const name = intake ? getIntakeFullName(intake) : profile.name;
    const chapterTitle = chapter?.title || "입사 대기";
    return `${name} · ${chapterTitle}`;
  }, [chapter, intake, profile]);

  const suggestedReplies = useMemo(() => {
    if (isLoading || hasPendingDiceRoll) return [];
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return [];
    const replies = extractLatestSuggestedReplies(messageParts);
    const previousReplies = getPreviousAssistantReplies(messageParts);

    if (replies.length > 0 && !sameReplies(replies, previousReplies)) {
      return replies;
    }

    let seed = messages.length;
    let fallback = buildFallbackSuggestedReplies(chapter, seed);

    while (sameReplies(fallback, previousReplies) && seed < messages.length + 4) {
      seed += 1;
      fallback = buildFallbackSuggestedReplies(chapter, seed);
    }

    return fallback;
  }, [chapter, messageParts, messages, isLoading, hasPendingDiceRoll]);

  useEffect(() => {
    if (!latestAssistantId || latestAssistantId === lastFocusedAssistantIdRef.current) return;

    lastFocusedAssistantIdRef.current = latestAssistantId;
    latestAssistantRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [latestAssistantId]);

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
    if (!trimmed || isLoading || hasPendingDiceRoll) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  const handleSubmit = (event: { preventDefault(): void }) => {
    event.preventDefault();
    sendUserMessage(input);
  };

  const handleIntakeSubmit = (data: IntakeData) => {
    if (isLoading) return;
    setIntake(data);
    sendMessage({ text: buildIntakeMessage(data) });
  };

  const handleRollDice = (toolCallId: string, diceInput: DiceRollInput) => {
    if (isLoading) return;

    addToolOutput({
      tool: "rollDice",
      toolCallId,
      output: rollDice(
        diceInput.count,
        diceInput.sides,
        diceInput.modifier ?? 0,
        diceInput.reason,
      ),
    });
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
    setIsSaveDialogOpen(false);
  };

  const clearCurrentSession = () => {
    if (isLoading) return;
    setMessages([]);
    setIntake(null);
    setInput("");
    window.localStorage.removeItem(ACTIVE_SESSION_KEY);
  };

  return (
    <div className={horrorMode ? "app-shell horror-mode" : "app-shell"}>
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
                {gameDate}
                {chapter
                  ? ` · ${chapter.subtitle ? `${chapter.title} — ${chapter.subtitle}` : chapter.title}`
                  : " · 내부망 전용"}
              </p>
            </div>
            <div className="panel-actions">
              <button
                type="button"
                className="panel-action-button"
                onClick={() => setIsSaveDialogOpen(true)}
              >
                저장/불러오기
              </button>
              <button
                type="button"
                className="panel-action-button"
                onClick={clearCurrentSession}
                disabled={isLoading || !hasSession}
              >
                새 기록
              </button>
            </div>
          </header>

          {isSaveDialogOpen && (
            <div className="save-dialog-backdrop" role="presentation">
              <section className="save-dialog" role="dialog" aria-modal="true" aria-labelledby="save-dialog-title">
                <header className="save-dialog-header">
                  <div>
                    <h2 id="save-dialog-title">저장 및 불러오기</h2>
                    <p>이 브라우저에 최대 3개의 근무일지를 저장합니다.</p>
                  </div>
                  <button
                    type="button"
                    className="save-dialog-close"
                    onClick={() => setIsSaveDialogOpen(false)}
                    aria-label="닫기"
                  >
                    닫기
                  </button>
                </header>

                <div className="save-dialog-list" aria-label="저장 목록">
                  {Array.from({ length: MAX_SAVE_SLOTS }, (_, index) => {
                    const slot = saveSlots[index];
                    return (
                      <div className="save-dialog-slot" key={index}>
                        <div className="save-dialog-slot-info">
                          <strong>슬롯 {index + 1}</strong>
                          <span>{slot ? slot.title : "비어 있음"}</span>
                          <small>{slot ? formatSavedAt(slot.updatedAt) : "저장된 근무일지가 없습니다"}</small>
                        </div>
                        <div className="save-dialog-slot-actions">
                          <button
                            type="button"
                            onClick={() => slot && loadSlot(slot)}
                            disabled={isLoading || !slot}
                          >
                            불러오기
                          </button>
                          <button
                            type="button"
                            onClick={() => saveToSlot(index)}
                            disabled={isLoading || !hasSession}
                          >
                            저장
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          <div className="messages">
            {messages.length === 0 ? (
              <OnboardingForm onSubmit={handleIntakeSubmit} disabled={isLoading} />
            ) : (
              <>
                {messages.map((message) => {
                  const isLatestAssistant =
                    message.role === "assistant" && message.id === latestAssistantId;

                  return (
                    <div
                      key={message.id}
                      ref={isLatestAssistant ? latestAssistantRef : undefined}
                      className={`message ${message.role === "user" ? "user" : "assistant"}`}
                    >
                      <span className="message-label">
                        {message.role === "user" ? "업무 기록" : "근무일지"}
                      </span>
                      <MessageContent
                        parts={message.parts}
                        role={message.role}
                        onRollDice={handleRollDice}
                        diceDisabled={isLoading}
                      />
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {isLoading && (
            <p className="status" aria-live="polite">
              <span className="loading-spinner" aria-hidden="true" />
              기록 중… (결재 대기)
            </p>
          )}

          {!isLoading && hasPendingDiceRoll && (
            <p className="status" aria-live="polite">
              판정 대기 중… 주사위를 던지면 근무일지가 이어집니다.
            </p>
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
              placeholder={
                hasPendingDiceRoll
                  ? "주사위를 먼저 던져 주세요"
                  : "직접 입력… (예: 신분증을 건넨다)"
              }
              disabled={isLoading || !hasSession || hasPendingDiceRoll}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || !hasSession || hasPendingDiceRoll}
            >
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
