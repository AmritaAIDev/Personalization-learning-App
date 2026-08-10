"use client";

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BotMessageSquare,
  BookOpen,
  ChevronDown,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  LoaderCircle,
  SendHorizontal,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { TutorMessage } from "@/lib/learning-types";
import { nextTutorPollDelay } from "@/lib/tutor-polling";
import StudyMarkdown from "./StudyMarkdown";

type ConversationPayload = {
  conversationId: string;
  messages: TutorMessage[];
  pending?: boolean;
};

type StudyAssistantProps = {
  sessionId: string;
  autoOpenMessage: TutorMessage | null;
  /** True while the backend is writing a hint or explanation for this session. */
  refreshWhen?: boolean;
  variant?: "floating" | "panel";
  title?: string;
  /** Fires a quick prompt into the tutor when the nonce changes (keyboard shortcuts). */
  externalPrompt?: { prompt: string; nonce: number } | null;
};

const QUICK_PROMPTS = [
  {
    label: "Hint",
    prompt: "Give me a hint without revealing the answer.",
    Icon: Lightbulb,
  },
  {
    label: "Explain",
    prompt: "Explain this in simpler steps.",
    Icon: BookOpen,
  },
  {
    label: "Why wrong?",
    prompt: "Why is my selected option wrong?",
    Icon: HelpCircle,
  },
];

export default function StudyAssistant({
  sessionId,
  autoOpenMessage,
  refreshWhen = false,
  variant = "floating",
  title = "Study assistant",
  externalPrompt = null,
}: StudyAssistantProps) {
  const [isManuallyOpen, setIsManuallyOpen] = useState(variant === "panel");
  const [dismissedAutoMessageId, setDismissedAutoMessageId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [pendingReply, setPendingReply] = useState(refreshWhen);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const loadedSessionRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);
  const stickToBottomRef = useRef(true);

  const autoMessageVisible =
    autoOpenMessage !== null && autoOpenMessage.id !== dismissedAutoMessageId;
  const isOpen =
    variant === "panel" ? true : isManuallyOpen || autoMessageVisible;

  const visibleMessages = useMemo(
    () =>
      autoMessageVisible &&
      !messages.some((item) => item.id === autoOpenMessage?.id)
        ? [...messages, autoOpenMessage]
        : messages,
    [autoMessageVisible, autoOpenMessage, messages],
  );

  const loadConversation = useCallback(async () => {
    // A single-flight guard, not an early return on `loading`: the old version
    // silently dropped polls while a slow read was in progress.
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    if (loadedSessionRef.current !== sessionId) setLoading(true);
    try {
      const data = await apiFetch<ConversationPayload>(
        `/api/learning/sessions/${sessionId}/tutor`,
      );
      setMessages(data.messages);
      setPendingReply(Boolean(data.pending));
      loadedSessionRef.current = sessionId;
      setError(null);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The study assistant could not be opened.",
      );
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!isOpen || loadedSessionRef.current === sessionId) return;
    void loadConversation();
  }, [isOpen, loadConversation, sessionId]);

  // A hint is being written server-side; mirror it locally so the board shows a
  // live "writing" bubble immediately, before the first poll returns. Following
  // a prop is done while rendering rather than in an effect, which would cost
  // an extra render on every answer.
  const [trackedRefreshSignal, setTrackedRefreshSignal] = useState(refreshWhen);
  if (trackedRefreshSignal !== refreshWhen) {
    setTrackedRefreshSignal(refreshWhen);
    if (refreshWhen) setPendingReply(true);
  }

  /**
   * Backs off while waiting for a background tutor reply: quick first checks so
   * a fast hint lands immediately, then slower ones so a slow model does not
   * turn into a request storm.
   */
  useEffect(() => {
    if (!pendingReply) return;
    let attempt = 0;
    let timer: number | undefined;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      attempt += 1;
      void loadConversation().finally(() => {
        if (cancelled) return;
        const delay = nextTutorPollDelay(attempt);
        if (delay === null) {
          setPendingReply(false);
          return;
        }
        timer = window.setTimeout(tick, delay);
      });
    };

    timer = window.setTimeout(tick, nextTutorPollDelay(0) ?? 600);
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [loadConversation, pendingReply]);

  // Follow new messages only when the learner is already reading the newest
  // ones, so scrolling back through an explanation is never yanked away.
  useEffect(() => {
    if (!stickToBottomRef.current) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [visibleMessages, pendingReply, draftMessage, isOpen]);

  const onScroll = () => {
    const node = scrollRef.current;
    if (!node) return;
    stickToBottomRef.current =
      node.scrollHeight - node.scrollTop - node.clientHeight < 80;
  };

  const toggle = () => {
    if (variant === "panel") return;
    if (isOpen) {
      setIsManuallyOpen(false);
      if (autoOpenMessage) setDismissedAutoMessageId(autoOpenMessage.id);
      return;
    }
    setIsManuallyOpen(true);
    void loadConversation();
  };

  const sendMessage = async (rawMessage: string) => {
    const trimmed = rawMessage.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);
    setMessage("");
    // Echo the question straight away: the learner should never wonder whether
    // their message was registered while the model is thinking.
    setDraftMessage(trimmed);
    stickToBottomRef.current = true;
    try {
      await apiFetch<{ message: TutorMessage }>(
        `/api/learning/sessions/${sessionId}/tutor`,
        { method: "POST", body: JSON.stringify({ message: trimmed }) },
      );
      await loadConversation();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The assistant could not respond just now.",
      );
      setMessage(trimmed);
    } finally {
      setDraftMessage(null);
      setSending(false);
    }
  };

  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(message);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    void sendMessage(message);
  };

  // Keyboard-driven quick prompts (H/E from the practice board) are pushed in
  // through externalPrompt; each new nonce fires the prompt once.
  const lastPromptNonceRef = useRef(0);
  useEffect(() => {
    if (
      !externalPrompt ||
      externalPrompt.nonce === lastPromptNonceRef.current
    ) {
      return;
    }
    lastPromptNonceRef.current = externalPrompt.nonce;
    void sendMessage(externalPrompt.prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPrompt]);
  const showWritingBubble = pendingReply || sending;

  const panel = isOpen ? (
    <section
      id={`study-assistant-${sessionId}`}
      role="dialog"
      aria-modal="false"
      aria-label={title}
      className={
        variant === "panel"
          ? "flex h-full max-h-[70dvh] min-h-0 flex-col overflow-hidden rounded-[1.5rem] border border-hairline bg-white shadow-[0_16px_40px_rgba(20,20,30,0.06)] xl:max-h-none"
          : "mb-3 flex h-[min(39rem,calc(100vh-9rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.75rem] border border-hairline bg-white shadow-[0_24px_70px_rgba(20,20,30,0.24)]"
      }
    >
      <header
        className={`flex items-center justify-between gap-3 border-b border-hairline px-4 py-3 ${
          variant === "panel" ? "bg-primary-tint text-ink" : "bg-ink text-white"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-white shadow-[0_8px_18px_rgba(20,20,30,0.18)]">
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-heading text-base font-bold">
              {title}
            </h3>
            <p
              className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                variant === "panel" ? "text-primary-strong" : "text-[#a8c4b6]"
              }`}
              aria-live="polite"
            >
              {showWritingBubble ? (
                <>
                  <span className="tutor-dot" aria-hidden="true" />
                  Writing your guidance
                </>
              ) : (
                "Connected to this question"
              )}
            </p>
          </div>
        </div>
        {variant === "floating" ? (
          <button
            type="button"
            onClick={() => {
              setIsManuallyOpen(false);
              if (autoOpenMessage)
                setDismissedAutoMessageId(autoOpenMessage.id);
            }}
            className="grid h-9 w-9 place-items-center rounded-xl text-[#e5e5ea] transition hover:bg-white/10 hover:text-white"
            aria-label="Close study assistant"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}
      </header>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[linear-gradient(180deg,#fff,#fcfbfb)] p-3 custom-scrollbar"
      >
        {loading && visibleMessages.length === 0 ? (
          <div
            className="flex items-center gap-2 rounded-2xl border border-hairline bg-white px-4 py-3 text-sm text-ink-mute"
            aria-label="Loading your study thread"
          >
            <span className="tutor-dot" aria-hidden="true" />
            <span className="tutor-dot tutor-dot--2" aria-hidden="true" />
            <span className="tutor-dot tutor-dot--3" aria-hidden="true" />
            <span className="ml-1 font-semibold">Thinking…</span>
          </div>
        ) : null}

        {!loading && visibleMessages.length === 0 && !showWritingBubble ? (
          <div className="flex min-h-[13rem] flex-col items-center justify-center px-4 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-tint text-primary">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm font-bold text-ink">AI Tutor</p>
            <p className="mt-1 max-w-[16rem] text-xs leading-5 text-ink-mute">
              Need a hint or an explanation? Ask me anything about this
              question.
            </p>
          </div>
        ) : null}

        <div className="space-y-3">
          {visibleMessages.map((item) => (
            <article
              key={item.id}
              className={
                item.role === "USER"
                  ? "ml-8 rounded-2xl rounded-br-md bg-primary px-3 py-2.5 text-[12.5px] leading-5 text-white"
                  : "mr-3 rounded-2xl rounded-bl-md border border-hairline bg-white px-3 py-2.5 shadow-[0_6px_16px_rgba(20,20,30,0.04)]"
              }
            >
              {item.role === "USER" ? (
                <p className="whitespace-pre-wrap">{item.content}</p>
              ) : (
                <>
                  {item.messageType !== "GENERAL" ? (
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                      {item.messageType === "SOCRATIC_HINT"
                        ? "Hint"
                        : "Full explanation"}
                    </p>
                  ) : null}
                  <StudyMarkdown className="text-[12.5px] leading-5 text-ink-soft">
                    {item.content}
                  </StudyMarkdown>
                </>
              )}
            </article>
          ))}

          {draftMessage ? (
            <article className="ml-8 rounded-2xl rounded-br-md bg-primary/85 px-3 py-2.5 text-[12.5px] leading-5 text-white">
              <p className="whitespace-pre-wrap">{draftMessage}</p>
            </article>
          ) : null}

          {showWritingBubble ? (
            <article
              className="mr-3 flex items-center gap-2 rounded-2xl rounded-bl-md border border-hairline bg-white px-3.5 py-3.5"
              aria-label="The tutor is writing"
            >
              <span className="tutor-dot" aria-hidden="true" />
              <span className="tutor-dot tutor-dot--2" aria-hidden="true" />
              <span className="tutor-dot tutor-dot--3" aria-hidden="true" />
            </article>
          ) : null}
        </div>

        {error && (
          <p
            className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
            role="alert"
          >
            {error}
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="border-t border-hairline bg-white p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map(({ label, prompt, Icon }) => (
            <button
              key={label}
              type="button"
              disabled={sending}
              onClick={() => void sendMessage(prompt)}
              className="inline-flex items-center gap-1 rounded-full border border-hairline bg-canvas px-2.5 py-1 text-[11px] font-bold text-ink-soft transition hover:border-primary/40 hover:bg-primary-tint hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon className="h-3 w-3" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor={`tutor-message-${sessionId}`}>
          Ask the study assistant
        </label>
        <div className="flex items-end gap-2 rounded-2xl border border-hairline bg-canvas p-2 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
          <textarea
            id={`tutor-message-${sessionId}`}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleInputKeyDown}
            rows={2}
            maxLength={1200}
            placeholder="Ask for a hint or explain the idea..."
            className="max-h-20 min-h-9 flex-1 resize-none bg-transparent px-2 py-1 text-[13px] text-ink outline-none placeholder:text-ink-mute"
          />
          <button
            type="submit"
            disabled={!message.trim() || sending}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-white shadow-[0_8px_18px_rgba(20,20,30,0.22)] transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-55"
            aria-label="Send message"
          >
            {sending ? (
              <LoaderCircle
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <SendHorizontal className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </form>
    </section>
  ) : null;

  if (variant === "panel") return panel;

  return (
    <div className="fixed bottom-[88px] right-4 z-50 sm:bottom-6 sm:right-6">
      {panel}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={`study-assistant-${sessionId}`}
        className="group inline-flex min-h-12 items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(20,20,30,0.24)] transition hover:-translate-y-px hover:bg-ink/90"
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary">
          <BotMessageSquare className="h-4 w-4" aria-hidden="true" />
        </span>
        <span>{isOpen ? "Hide helper" : "Ask helper"}</span>
        <ChevronDown
          className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
