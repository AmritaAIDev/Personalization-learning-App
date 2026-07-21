'use client';

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BotMessageSquare,
  ChevronDown,
  LoaderCircle,
  SendHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { TutorMessage } from '@/lib/learning-types';
import {
  parseTutorMarkdown,
  type TutorInlineSegment,
} from '@/lib/tutor-markdown';

type ConversationPayload = {
  conversationId: string;
  messages: TutorMessage[];
};

function InlineTutorText({ segments }: { segments: TutorInlineSegment[] }) {
  return (
    <>
      {segments.map((segment, index) => {
        if (segment.type === 'strong') {
          return (
            <strong
              key={`${segment.text}-${index}`}
              className="font-bold text-[#313337]"
            >
              {segment.text}
            </strong>
          );
        }
        if (segment.type === 'code') {
          return (
            <code
              key={`${segment.text}-${index}`}
              className="rounded-md bg-[#f1ecee] px-1.5 py-0.5 text-[0.82em] font-semibold text-[#313337]"
            >
              {segment.text}
            </code>
          );
        }
        return <span key={`${segment.text}-${index}`}>{segment.text}</span>;
      })}
    </>
  );
}

function TutorText({ content }: { content: string }) {
  const blocks = useMemo(() => parseTutorMarkdown(content), [content]);

  return (
    <div className="space-y-2.5 text-sm leading-6 text-[#45474d]">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <h4
              key={`${block.text}-${index}`}
              className="font-bold text-[#313337]"
            >
              {block.text}
            </h4>
          );
        }
        if (block.type === 'unorderedList') {
          return (
            <ul key={`ul-${index}`} className="list-disc space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={`ul-${index}-${itemIndex}`}>
                  <InlineTutorText segments={item} />
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === 'orderedList') {
          return (
            <ol key={`ol-${index}`} className="list-decimal space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={`ol-${index}-${itemIndex}`}>
                  <InlineTutorText segments={item} />
                </li>
              ))}
            </ol>
          );
        }
        if (block.type === 'codeBlock') {
          return (
            <pre
              key={`code-${index}`}
              className="overflow-x-auto rounded-xl bg-[#313337] p-3 text-xs leading-5 text-white"
            >
              <code>{block.code}</code>
            </pre>
          );
        }
        return (
          <p key={`p-${index}`} className="whitespace-pre-wrap">
            <InlineTutorText segments={block.segments} />
          </p>
        );
      })}
    </div>
  );
}

type StudyAssistantProps = {
  sessionId: string;
  autoOpenMessage: TutorMessage | null;
  variant?: 'floating' | 'panel';
  title?: string;
};

export default function StudyAssistant({
  sessionId,
  autoOpenMessage,
  variant = 'floating',
  title = 'Study assistant',
}: StudyAssistantProps) {
  const [isManuallyOpen, setIsManuallyOpen] = useState(variant === 'panel');
  const [dismissedAutoMessageId, setDismissedAutoMessageId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const loadedSessionRef = useRef<string | null>(null);
  const optimisticMessageCounterRef = useRef(0);

  const autoMessageVisible =
    autoOpenMessage !== null && autoOpenMessage.id !== dismissedAutoMessageId;
  const isOpen = variant === 'panel' ? true : isManuallyOpen || autoMessageVisible;
  const visibleMessages = useMemo(
    () =>
      autoMessageVisible && !messages.some((item) => item.id === autoOpenMessage?.id)
        ? [...messages, autoOpenMessage]
        : messages,
    [autoMessageVisible, autoOpenMessage, messages],
  );
  const quickPrompts = [
    'Give me a hint without revealing the answer.',
    'Explain this in simpler steps.',
    'Why is my selected option wrong?',
  ];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [visibleMessages, isOpen]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadedSessionRef.current = null;
      setMessages([]);
      setError(null);
      setMessage('');
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [sessionId]);

  const loadConversation = useCallback(async (force = false) => {
    if (loading) return;
    if (!force && loadedSessionRef.current === sessionId) return;
    if (!force && messages.length > 0) {
      loadedSessionRef.current = sessionId;
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch<ConversationPayload>(
        `/api/learning/sessions/${sessionId}/tutor`,
      );
      setMessages(data.messages);
      loadedSessionRef.current = sessionId;
      setError(null);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'The study assistant could not be opened.',
      );
    } finally {
      setLoading(false);
    }
  }, [loading, messages.length, sessionId]);

  useEffect(() => {
    if (!isOpen || loadedSessionRef.current === sessionId) return;
    const timeout = window.setTimeout(() => {
      void loadConversation();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [isOpen, loadConversation, sessionId]);

  const toggle = () => {
    if (variant === 'panel') return;
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
    optimisticMessageCounterRef.current += 1;
    const optimistic: TutorMessage = {
      id: `pending-${sessionId}-${optimisticMessageCounterRef.current}`,
      role: 'USER',
      messageType: 'GENERAL',
      content: trimmed,
      relatedSessionItemId: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimistic]);
    setMessage('');
    try {
      const data = await apiFetch<{ message: TutorMessage }>(
        `/api/learning/sessions/${sessionId}/tutor`,
        { method: 'POST', body: JSON.stringify({ message: trimmed }) },
      );
      setMessages((current) => [...current, data.message]);
    } catch (reason) {
      setMessages((current) =>
        current.filter((item) => item.id !== optimistic.id),
      );
      setError(
        reason instanceof Error
          ? reason.message
          : 'The assistant could not respond just now.',
      );
    } finally {
      setSending(false);
    }
  };

  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(message);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    void sendMessage(message);
  };

  const panel = isOpen ? (
    <section
      id={`study-assistant-${sessionId}`}
      role="dialog"
      aria-modal="false"
      aria-label={title}
      className={
        variant === 'panel'
          ? 'flex h-full min-h-[34rem] flex-col overflow-hidden rounded-[1.75rem] border border-[#eadde0] bg-white shadow-[0_18px_45px_rgba(49,51,55,0.08)]'
          : 'mb-3 flex h-[min(39rem,calc(100vh-9rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.75rem] border border-[#eadde0] bg-white shadow-[0_24px_70px_rgba(49,51,55,0.24)]'
      }
    >
      <header className="flex items-center justify-between gap-3 border-b border-[#eee8e9] bg-[#313337] px-4 py-3 text-white">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e31540]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-heading text-base font-bold">{title}</h3>
            <p className="text-[11px] font-semibold text-[#f7b9c8]">
              Connected to this question
            </p>
          </div>
        </div>
        {variant === 'floating' ? (
          <button
            type="button"
            onClick={() => {
              setIsManuallyOpen(false);
              if (autoOpenMessage) setDismissedAutoMessageId(autoOpenMessage.id);
            }}
            className="grid h-9 w-9 place-items-center rounded-xl text-[#d6d7da] transition hover:bg-white/10 hover:text-white"
            aria-label="Close study assistant"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#fcfbfb] p-4">
        {loading && (
          <p className="flex items-center gap-2 text-sm font-semibold text-[#6b6e75]">
            <LoaderCircle
              className="h-4 w-4 animate-spin text-[#e31540]"
              aria-hidden="true"
            />
            Loading your study thread...
          </p>
        )}
        {!loading && visibleMessages.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#e4dcde] bg-white p-4 text-sm leading-6 text-[#6b6e75]">
            Ask for a hint, a simpler explanation, or why an option fails. The
            assistant stays tied to your current question flow.
            {variant === 'panel' ? (
              <button
                type="button"
                onClick={() => void loadConversation(true)}
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl border border-[#d9dadd] px-3 py-2 text-xs font-bold text-[#55585f] transition hover:bg-[#f7f4f5]"
              >
                Reload tutor thread
              </button>
            ) : null}
          </div>
        )}
        <div className="space-y-3">
          {visibleMessages.map((item) => (
            <article
              key={item.id}
              className={
                item.role === 'USER'
                  ? 'ml-8 rounded-2xl rounded-br-md bg-[#e31540] px-3.5 py-3 text-sm leading-6 text-white'
                  : 'mr-3 rounded-2xl rounded-bl-md border border-[#e9e1e3] bg-white px-3.5 py-3 shadow-[0_6px_16px_rgba(49,51,55,0.04)]'
              }
            >
              {item.role === 'USER' ? (
                <p className="whitespace-pre-wrap">{item.content}</p>
              ) : (
                <TutorText content={item.content} />
              )}
            </article>
          ))}
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

      <form onSubmit={send} className="border-t border-[#eee8e9] bg-white p-3">
        <div className="mb-2 flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={sending}
              onClick={() => void sendMessage(prompt)}
              className="rounded-full border border-[#e7dde0] bg-[#fbfafb] px-3 py-1.5 text-[11px] font-bold text-[#5d6067] transition hover:border-[#e31540]/40 hover:bg-[#fff3f6] hover:text-[#e31540] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {prompt.replace(/\.$/, '')}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor={`tutor-message-${sessionId}`}>
          Ask the study assistant
        </label>
        <div className="flex items-end gap-2 rounded-2xl border border-[#e5dfe1] bg-[#fbfafb] p-2 focus-within:border-[#e31540] focus-within:ring-4 focus-within:ring-[#e31540]/10">
          <textarea
            id={`tutor-message-${sessionId}`}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleInputKeyDown}
            rows={2}
            maxLength={1200}
            placeholder="Ask for a hint or explain the idea..."
            className="max-h-24 min-h-10 flex-1 resize-none bg-transparent px-2 py-1 text-sm text-[#313337] outline-none placeholder:text-[#a1a5ab]"
          />
          <button
            type="submit"
            disabled={!message.trim() || sending}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e31540] text-white shadow-[0_8px_18px_rgba(227,21,64,0.22)] transition hover:bg-[#c61137] disabled:cursor-not-allowed disabled:opacity-55"
            aria-label="Send message"
          >
            {sending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <SendHorizontal className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </form>
    </section>
  ) : null;

  if (variant === 'panel') return panel;

  return (
    <div className="fixed bottom-[88px] right-4 z-50 sm:bottom-6 sm:right-6">
      {panel}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={`study-assistant-${sessionId}`}
        className="group inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#313337] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(49,51,55,0.24)] transition hover:-translate-y-px hover:bg-[#45474d]"
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#e31540]">
          <BotMessageSquare className="h-4 w-4" aria-hidden="true" />
        </span>
        <span>{isOpen ? 'Hide helper' : 'Ask helper'}</span>
        <ChevronDown
          className={`h-4 w-4 transition ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
