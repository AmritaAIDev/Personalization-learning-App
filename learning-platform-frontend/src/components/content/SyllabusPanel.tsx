"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api";

type TopicLevel = "SUBJECT" | "CHAPTER" | "SUB_TOPIC" | "CONCEPT";

type TopicTreeNode = {
  id: string;
  name: string;
  description: string | null;
  level: TopicLevel;
  children: TopicTreeNode[];
};

const LEVEL_ORDER: TopicLevel[] = ["SUBJECT", "CHAPTER", "SUB_TOPIC", "CONCEPT"];
const LEVEL_LABEL: Record<TopicLevel, string> = {
  SUBJECT: "Subject",
  CHAPTER: "Chapter",
  SUB_TOPIC: "Sub-topic",
  CONCEPT: "Concept",
};

function nextLevel(level: TopicLevel): TopicLevel | null {
  const index = LEVEL_ORDER.indexOf(level);
  return index < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[index + 1] : null;
}

function countDescendants(node: TopicTreeNode): number {
  return node.children.reduce(
    (sum, child) => sum + 1 + countDescendants(child),
    0,
  );
}

export default function SyllabusPanel() {
  const [tree, setTree] = useState<TopicTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [addingRoot, setAddingRoot] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    void apiFetch<TopicTreeNode[]>("/api/topics/tree", { memoryCacheTtlMs: 0 })
      .then((data) => {
        setTree(data);
        setError(null);
      })
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error
            ? reason.message
            : "The syllabus could not be loaded.",
        );
      })
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, []);

  const createTopic = async (
    payload: { name: string; description?: string; level: TopicLevel; parentId?: string },
  ) => {
    setError(null);
    setNotice(null);
    try {
      await apiFetch("/api/topics", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setNotice(`${LEVEL_LABEL[payload.level]} "${payload.name}" added.`);
      load();
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "The topic could not be created.",
      );
      throw reason;
    }
  };

  const updateTopic = async (
    id: string,
    payload: { name: string; description?: string },
  ) => {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      await apiFetch(`/api/topics/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setNotice("Topic updated.");
      load();
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "The topic could not be updated.",
      );
      throw reason;
    } finally {
      setBusyId(null);
    }
  };

  const deleteTopic = async (node: TopicTreeNode) => {
    const descendants = countDescendants(node);
    const warning =
      descendants > 0
        ? `Delete "${node.name}" and its ${descendants} nested topic${descendants === 1 ? "" : "s"}? This cannot be undone.`
        : `Delete "${node.name}"? This cannot be undone.`;
    if (!window.confirm(warning)) return;
    setBusyId(node.id);
    setError(null);
    setNotice(null);
    try {
      await apiFetch(`/api/topics/${node.id}`, { method: "DELETE" });
      setNotice(`"${node.name}" was deleted.`);
      load();
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "The topic could not be deleted.",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="mt-6 rounded-[1.75rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-tint text-primary">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-bold text-ink">Syllabus</h2>
            <p className="mt-0.5 text-sm text-ink-soft">
              Manage the subject → chapter → sub-topic → concept hierarchy.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAddingRoot((value) => !value)}
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-primary-strong"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add subject
        </button>
      </div>

      {error ? (
        <p
          className="mt-4 flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-tint px-3 py-3 text-sm font-semibold text-danger"
          role="alert"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          className="mt-4 rounded-xl border border-success/20 bg-success-tint px-3 py-3 text-sm font-semibold text-success"
          role="status"
        >
          {notice}
        </p>
      ) : null}

      {addingRoot ? (
        <div className="mt-4">
          <TopicForm
            level="SUBJECT"
            onCancel={() => setAddingRoot(false)}
            onSubmit={async (values) => {
              await createTopic({ ...values, level: "SUBJECT" });
              setAddingRoot(false);
            }}
          />
        </div>
      ) : null}

      {loading ? (
        <div className="mt-5 space-y-2" aria-label="Loading syllabus">
          <div className="h-12 rounded-xl skeleton" />
          <div className="h-12 rounded-xl skeleton" />
          <div className="h-12 rounded-xl skeleton" />
        </div>
      ) : tree.length === 0 ? (
        <p className="mt-5 rounded-xl bg-canvas px-4 py-8 text-center text-sm leading-6 text-ink-soft">
          No subjects yet. Add one to start building the syllabus.
        </p>
      ) : (
        <div className="mt-5 space-y-1.5">
          {tree.map((node) => (
            <TopicNode
              key={node.id}
              node={node}
              depth={0}
              busyId={busyId}
              onCreate={createTopic}
              onUpdate={updateTopic}
              onDelete={deleteTopic}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function TopicNode({
  node,
  depth,
  busyId,
  onCreate,
  onUpdate,
  onDelete,
}: {
  node: TopicTreeNode;
  depth: number;
  busyId: string | null;
  onCreate: (payload: {
    name: string;
    description?: string;
    level: TopicLevel;
    parentId?: string;
  }) => Promise<void>;
  onUpdate: (
    id: string,
    payload: { name: string; description?: string },
  ) => Promise<void>;
  onDelete: (node: TopicTreeNode) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const [editing, setEditing] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const childLevel = nextLevel(node.level);
  const busy = busyId === node.id;

  return (
    <div>
      <div
        className="group flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-canvas"
        style={{ marginLeft: depth * 20 }}
      >
        {node.children.length > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-ink-mute hover:bg-canvas hover:text-ink"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        ) : (
          <span className="h-6 w-6 shrink-0" />
        )}

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-mute">
              {LEVEL_LABEL[node.level]}
            </span>
            <span className="truncate text-sm font-semibold text-ink">{node.name}</span>
          </span>
          {node.description ? (
            <span className="mt-0.5 block truncate text-xs text-ink-mute">
              {node.description}
            </span>
          ) : null}
        </span>

        <span className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
          {childLevel ? (
            <button
              type="button"
              onClick={() => setAddingChild((value) => !value)}
              title={`Add ${LEVEL_LABEL[childLevel]}`}
              className="grid h-7 w-7 place-items-center rounded-lg text-ink-mute hover:bg-canvas hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            title="Edit"
            className="grid h-7 w-7 place-items-center rounded-lg text-ink-mute hover:bg-canvas hover:text-ink"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => void onDelete(node)}
            disabled={busy}
            title="Delete"
            className="grid h-7 w-7 place-items-center rounded-lg text-ink-mute hover:bg-danger-tint hover:text-danger disabled:opacity-60"
          >
            {busy ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        </span>
      </div>

      {editing ? (
        <div style={{ marginLeft: depth * 20 + 32 }} className="mb-2">
          <TopicForm
            level={node.level}
            initialName={node.name}
            initialDescription={node.description ?? ""}
            onCancel={() => setEditing(false)}
            onSubmit={async (values) => {
              await onUpdate(node.id, values);
              setEditing(false);
            }}
          />
        </div>
      ) : null}

      {addingChild && childLevel ? (
        <div style={{ marginLeft: depth * 20 + 32 }} className="mb-2">
          <TopicForm
            level={childLevel}
            onCancel={() => setAddingChild(false)}
            onSubmit={async (values) => {
              await onCreate({ ...values, level: childLevel, parentId: node.id });
              setAddingChild(false);
              setExpanded(true);
            }}
          />
        </div>
      ) : null}

      {expanded
        ? node.children.map((child) => (
            <TopicNode
              key={child.id}
              node={child}
              depth={depth + 1}
              busyId={busyId}
              onCreate={onCreate}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))
        : null}
    </div>
  );
}

function TopicForm({
  level,
  initialName = "",
  initialDescription = "",
  onSubmit,
  onCancel,
}: {
  level: TopicLevel;
  initialName?: string;
  initialDescription?: string;
  onSubmit: (values: { name: string; description?: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setFormError("A name is required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
      });
    } catch (reason) {
      setFormError(
        reason instanceof ApiError ? reason.message : "This could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="flex flex-col gap-2 rounded-xl border border-hairline bg-canvas p-3 sm:flex-row sm:items-start"
    >
      <div className="flex-1 space-y-2">
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={`${LEVEL_LABEL[level]} name`}
          className="w-full rounded-lg border border-hairline bg-surface px-3 py-1.5 text-sm outline-none focus:border-primary"
          autoFocus
        />
        <input
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description (optional)"
          className="w-full rounded-lg border border-hairline bg-surface px-3 py-1.5 text-sm outline-none focus:border-primary"
        />
        {formError ? (
          <p className="text-xs font-semibold text-danger">{formError}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-1.5">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
        >
          {saving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-8 items-center rounded-lg border border-hairline px-3 py-1.5 text-xs font-bold text-ink-soft hover:bg-canvas"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
