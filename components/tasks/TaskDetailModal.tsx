"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { X, Plus, ExternalLink, MoreHorizontal, Send } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";

interface SubItem {
  id: string;
  name: string;
  completedAt: string | null;
  priority: string | null;
}

interface CustomFieldDef {
  id: string;
  name: string;
  type: string;
}

interface CustomFieldVal {
  id: string;
  fieldId: string;
  value: string;
}

interface CommentData {
  id: string;
  text: string;
  authorId: string;
  createdAt: string;
}

interface DetailItem {
  id: string;
  name: string;
  description: string | null;
  scheduledDate: string | null;
  deadline: string | null;
  completedAt: string | null;
  priority: string | null;
  category: string | null;
  groupId: string;
  group: { board: { id: string; name: string; color: string | null; icon: string | null } };
  subItems: SubItem[];
  columnValues: { columnId: string; value: string }[];
}

interface TaskDetailModalProps {
  item: DetailItem;
  onClose: () => void;
  onUpdate: (id: string, patch: Record<string, unknown>) => void;
  onDelete?: (id: string) => void;
  onAddSubTask?: (parentId: string, name: string) => void;
}

const PRIORITY_CONFIG = {
  p1: { label: "P1 – High", color: "#ef4444" },
  p2: { label: "P2 – Medium", color: "#f97316" },
  p3: { label: "P3 – Low", color: "#5b9cf6" },
  p4: { label: "No priority", color: "#6b7280" },
};

function SideLabel({ label }: { label: string }) {
  return <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--text-4)" }}>{label}</p>;
}

export function TaskDetailModal({
  item,
  onClose,
  onUpdate,
  onDelete,
  onAddSubTask,
}: TaskDetailModalProps) {
  const [description, setDescription] = useState(item.description ?? "");
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [subtaskName, setSubtaskName] = useState("");
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>([]);
  const [customValues, setCustomValues] = useState<CustomFieldVal[]>([]);

  useEffect(() => {
    setDescription(item.description ?? "");
  }, [item.id, item.description]);

  // Load full item details (comments, custom fields)
  useEffect(() => {
    fetch(`/api/items/${item.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.comments)) setComments(data.comments);
        if (Array.isArray(data.customValues)) setCustomValues(data.customValues);
      })
      .catch(() => {});

    // Load custom fields for this board
    const boardId = item.group?.board?.id;
    if (boardId) {
      fetch(`/api/custom-fields?boardId=${boardId}`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setCustomFields(data); })
        .catch(() => {});
    }
  }, [item.id, item.group?.board?.id]);

  function saveDescription() {
    const d = description.trim() || null;
    if (d !== (item.description ?? null)) onUpdate(item.id, { description: d });
  }

  function submitSubtask() {
    const n = subtaskName.trim();
    if (n && onAddSubTask) onAddSubTask(item.id, n);
    setSubtaskName("");
    setAddingSubtask(false);
  }

  async function submitComment() {
    const text = commentText.trim();
    if (!text || submittingComment) return;
    setSubmittingComment(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, text }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setCommentText("");
      }
    } finally {
      setSubmittingComment(false);
    }
  }

  function getCustomValue(fieldId: string): unknown {
    const cv = customValues.find((v) => v.fieldId === fieldId);
    if (!cv) return null;
    try { return JSON.parse(cv.value); } catch { return cv.value; }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 backdrop-blur-sm"
        style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="rounded-2xl shadow-2xl w-full max-w-[680px] max-h-[85vh] flex flex-col overflow-hidden"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-5 py-3.5 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
            <span className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-3)" }}>
              <span>{item.group.board.icon ?? "📋"}</span>
              <span>{item.group.board.name}</span>
            </span>
            <div className="flex-1" />
            {onDelete && (
              <button
                onClick={() => { onDelete(item.id); onClose(); }}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "var(--text-4)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--sys-red)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-4)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <MoreHorizontal size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-4)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-4)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Left */}
            <div className="flex-1 px-5 py-5 overflow-y-auto min-w-0" style={{ borderRight: "1px solid var(--border)" }}>
              {/* Name + completion */}
              <div className="flex items-start gap-3 mb-4">
                <button
                  onClick={() =>
                    onUpdate(item.id, {
                      completedAt: item.completedAt ? null : new Date().toISOString(),
                    })
                  }
                  className={`mt-1 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                    item.completedAt
                      ? "bg-[#22c55e] border-[#22c55e]"
                      : "hover:border-[#22c55e]"
                  }`}
                  style={!item.completedAt ? { borderColor: "var(--border-strong)" } : undefined}
                >
                  {item.completedAt && (
                    <span className="text-white text-[9px] font-bold">✓</span>
                  )}
                </button>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const n = e.currentTarget.textContent?.trim() ?? "";
                    if (n && n !== item.name) onUpdate(item.id, { name: n });
                  }}
                  className="flex-1 text-lg font-medium outline-none leading-snug cursor-text rounded px-1 -mx-1 transition-colors"
                  style={{
                    color: item.completedAt ? "var(--text-4)" : "var(--text-1)",
                    textDecoration: item.completedAt ? "line-through" : "none",
                  }}
                >
                  {item.name}
                </div>
              </div>

              {/* Description */}
              <div className="mb-5">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={saveDescription}
                  placeholder="Add a description…"
                  rows={3}
                  className="w-full text-sm bg-transparent resize-none outline-none leading-relaxed pointer-events-auto"
                  style={{ color: "var(--text-3)", }}
                />
              </div>

              {/* Subtasks */}
              <div className="mb-5">
                <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--text-4)" }}>Subtasks</p>
                {item.subItems.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-2.5 py-1.5"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <button
                      onClick={() =>
                        onUpdate(sub.id, {
                          completedAt: sub.completedAt ? null : new Date().toISOString(),
                        })
                      }
                      className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        sub.completedAt ? "bg-[#22c55e] border-[#22c55e]" : ""
                      }`}
                      style={!sub.completedAt ? { borderColor: "var(--border-strong)" } : undefined}
                    >
                      {sub.completedAt && (
                        <span className="text-white text-[8px] font-bold">✓</span>
                      )}
                    </button>
                    <span
                      className="text-sm flex-1"
                      style={{
                        color: sub.completedAt ? "var(--text-4)" : "var(--text-2)",
                        textDecoration: sub.completedAt ? "line-through" : "none",
                      }}
                    >
                      {sub.name}
                    </span>
                  </div>
                ))}
                {addingSubtask ? (
                  <input
                    autoFocus
                    value={subtaskName}
                    onChange={(e) => setSubtaskName(e.target.value)}
                    onBlur={submitSubtask}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitSubtask();
                      if (e.key === "Escape") {
                        setAddingSubtask(false);
                        setSubtaskName("");
                      }
                    }}
                    placeholder="Subtask name…"
                    className="w-full text-sm rounded-lg px-3 py-1.5 outline-none mt-1"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--accent)", color: "var(--text-1)" }}
                  />
                ) : (
                  <button
                    onClick={() => setAddingSubtask(true)}
                    className="flex items-center gap-1.5 text-xs transition-colors mt-1"
                    style={{ color: "var(--text-4)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-2)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-4)"; }}
                  >
                    <Plus size={11} />
                    Add subtask
                  </button>
                )}
              </div>

              {/* Comments */}
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--text-4)" }}>Comments</p>
                {comments.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {comments.map((c) => (
                      <div key={c.id} className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-full shrink-0 mt-0.5" style={{ background: "rgba(91,156,246,0.4)" }} />
                        <div className="flex-1 rounded-lg px-3 py-2" style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
                          <p className="text-sm" style={{ color: "var(--text-2)" }}>{c.text}</p>
                          <p className="text-[10px] mt-1" style={{ color: "var(--text-4)" }}>
                            {format(parseISO(c.createdAt), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2.5">
                  <div className="w-6 h-6 rounded-full shrink-0 mb-0.5" style={{ background: "rgba(91,156,246,0.4)" }} />
                  <div className="flex-1 relative">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          submitComment();
                        }
                      }}
                      placeholder="Write a comment… (Enter to send)"
                      rows={2}
                      className="w-full text-sm rounded-lg px-3 py-1.5 pr-9 outline-none transition-colors resize-none pointer-events-auto"
                      style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-2)" }}
                    />
                    {commentText.trim() && (
                      <button
                        onClick={submitComment}
                        disabled={submittingComment}
                        className="absolute right-2 bottom-2 p-1 rounded transition-colors disabled:opacity-40"
                        style={{ color: "var(--chart-primary)" }}
                      >
                        <Send size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="w-52 shrink-0 px-4 py-5 space-y-5 overflow-y-auto">
              {/* Project */}
              <div>
                <SideLabel label="Project" />
                <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-2)" }}>
                  <span>{item.group.board.icon ?? "📋"}</span>
                  <span>{item.group.board.name}</span>
                </span>
              </div>

              {/* Scheduled date */}
              <div>
                <SideLabel label="Date" />
                {item.scheduledDate ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "var(--text-2)" }}>
                      {format(parseISO(item.scheduledDate), "MMM d")}
                    </span>
                    <button
                      onClick={() => onUpdate(item.id, { scheduledDate: null })}
                      className="transition-colors"
                      style={{ color: "var(--text-4)" }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onUpdate(item.id, { scheduledDate: new Date().toISOString() })}
                    className="text-sm transition-colors"
                    style={{ color: "var(--text-4)" }}
                  >
                    Set date
                  </button>
                )}
              </div>

              {/* Deadline */}
              <div>
                <SideLabel label="Deadline" />
                {item.deadline ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "var(--text-2)" }}>
                      {format(parseISO(item.deadline), "MMM d")}
                    </span>
                    <button
                      onClick={() => onUpdate(item.id, { deadline: null })}
                      className="transition-colors"
                      style={{ color: "var(--text-4)" }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 7);
                      onUpdate(item.id, { deadline: d.toISOString() });
                    }}
                    className="text-sm transition-colors"
                    style={{ color: "var(--text-4)" }}
                  >
                    Set deadline
                  </button>
                )}
              </div>

              {/* Priority */}
              <div>
                <SideLabel label="Priority" />
                <Popover.Root>
                  <Popover.Trigger asChild>
                    <button className="flex items-center gap-1.5 text-sm transition-colors" style={{ color: "var(--text-2)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-2)"; }}>
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            PRIORITY_CONFIG[item.priority as keyof typeof PRIORITY_CONFIG]
                              ?.color ?? "#6b7280",
                        }}
                      />
                      {PRIORITY_CONFIG[item.priority as keyof typeof PRIORITY_CONFIG]?.label ??
                        "No priority"}
                    </button>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content
                      className="rounded-xl shadow-2xl z-[60] p-1.5 w-44"
                      style={{ background: "var(--bg-popover)", border: "1px solid var(--border-strong)" }}
                      sideOffset={6}
                    >
                      {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                        <button
                          key={key}
                          onClick={() =>
                            onUpdate(item.id, { priority: key === "p4" ? null : key })
                          }
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors"
                          style={{ color: "var(--text-2)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: cfg.color }}
                          />
                          <span className="text-sm">{cfg.label}</span>
                          {(item.priority ?? "p4") === key && (
                            <span className="ml-auto text-xs" style={{ color: "var(--chart-primary)" }}>✓</span>
                          )}
                        </button>
                      ))}
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              </div>

              {/* Custom fields */}
              {customFields.length > 0 && (
                <div className="space-y-3">
                  {customFields.map((field) => {
                    const val = getCustomValue(field.id);
                    return (
                      <div key={field.id}>
                        <SideLabel label={field.name} />
                        {field.type === "checkbox" ? (
                          <input
                            type="checkbox"
                            checked={Boolean(val)}
                            readOnly
                            className="w-4 h-4 rounded accent-[#5b9cf6]"
                          />
                        ) : field.type === "url" && val ? (
                          <a
                            href={String(val)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm flex items-center gap-1"
                            style={{ color: "var(--chart-primary)" }}
                          >
                            <ExternalLink size={11} />
                            {String(val).replace(/^https?:\/\//, "").slice(0, 20)}…
                          </a>
                        ) : (
                          <span className="text-sm" style={{ color: "var(--text-2)" }}>
                            {val != null ? String(val) : (
                              <span style={{ color: "var(--text-4)" }}>—</span>
                            )}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
