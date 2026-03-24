"use client";

import { useState, useEffect, useRef } from "react";
import { format, formatDistanceToNow, parseISO, isPast } from "date-fns";
import { X, Trash2, ExternalLink, MoreHorizontal, Check } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { DatePicker } from "@/components/ui/DatePicker";

// ── Priority constants ──────────────────────────────────────────────────────
const PRIORITY_COLORS = {
  p1: {
    border: "#ef4444",
    bg: "rgba(239,68,68,0.2)",
    text: "#ef4444",
    badge_bg: "rgba(239,68,68,0.12)",
    badge_border: "rgba(239,68,68,0.25)",
  },
  p2: {
    border: "#f97316",
    bg: "rgba(249,115,22,0.15)",
    text: "#f97316",
    badge_bg: "rgba(249,115,22,0.1)",
    badge_border: "rgba(249,115,22,0.25)",
  },
  p3: {
    border: "#5b9cf6",
    bg: "rgba(91,156,246,0.15)",
    text: "#5b9cf6",
    badge_bg: "rgba(91,156,246,0.1)",
    badge_border: "rgba(91,156,246,0.25)",
  },
  p4: {
    border: "var(--border-strong)",
    bg: "transparent",
    text: "var(--text-3)",
    badge_bg: "var(--bg-active)",
    badge_border: "var(--border)",
  },
};

const PRIORITY_LABELS: Record<string, string> = {
  p1: "P1 — High",
  p2: "P2 — Medium",
  p3: "P3 — Low",
  p4: "P4 — None",
};

// ── Types ───────────────────────────────────────────────────────────────────
interface SubItem {
  id: string;
  name: string;
  completedAt: string | null;
  priority: string | null;
}

interface CustomField {
  id: string;
  name: string;
  type: string; // "text" | "url" | "number" | "checkbox"
}

interface CustomFieldValue {
  id: string;
  fieldId: string;
  value: string; // JSON string
}

interface CommentData {
  id: string;
  text: string;
  authorId: string;
  createdAt: string;
  author?: { name?: string | null };
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
  createdAt?: string;
  updatedAt?: string;
  group: {
    name?: string;
    board: { id: string; name: string; color: string | null; icon: string | null };
  };
  subItems: SubItem[];
  columnValues: { columnId: string; value: string }[];
}

interface TaskDetailPanelProps {
  item: DetailItem;
  customFields?: CustomField[];
  customFieldValues?: CustomFieldValue[];
  onClose: () => void;
  onUpdate: (id: string, patch: Record<string, unknown>) => void;
  onDelete?: (id: string) => void;
  onAddSubTask?: (parentId: string, name: string) => void;
  onAddCustomField?: (boardId: string, name: string, type: string) => void;
  onUpdateCustomFieldValue?: (itemId: string, fieldId: string, value: unknown) => void;
}

const FIELD_TYPE_OPTIONS = [
  { type: "text",     label: "Text field", icon: "T" },
  { type: "url",      label: "URL / Link",  icon: "🔗" },
  { type: "number",   label: "Number",      icon: "#" },
  { type: "checkbox", label: "Checkbox",    icon: "☑" },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatRelative(dateStr: string) {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

function priorityColors(p: string | null) {
  return PRIORITY_COLORS[(p ?? "p4") as keyof typeof PRIORITY_COLORS] ?? PRIORITY_COLORS.p4;
}

// ── PropRow ──────────────────────────────────────────────────────────────────
function PropRow({
  label,
  value,
  placeholder,
  onClick,
  children,
}: {
  label: string;
  value?: string | null;
  placeholder?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.08em] mb-1.5" style={{ color: "var(--text-4)" }}>
        {label}
      </p>
      <button
        className="flex items-center gap-1.5 text-[11px] w-full text-left px-1.5 py-1 rounded-md -mx-1.5 transition-colors"
        style={{ color: value ? "var(--text-2)" : "var(--text-4)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        onClick={onClick}
      >
        {children ?? (value || placeholder)}
      </button>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function TaskDetailPanel({
  item,
  customFields = [],
  customFieldValues = [],
  onClose,
  onUpdate,
  onDelete,
  onAddSubTask,
  onAddCustomField,
  onUpdateCustomFieldValue,
}: TaskDetailPanelProps) {
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [subtaskName, setSubtaskName] = useState("");
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [internalFields, setInternalFields] = useState<CustomField[]>([]);
  const [internalValues, setInternalValues] = useState<CustomFieldValue[]>([]);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLDivElement>(null);

  const boardId = item.group.board.id;

  // Escape to close
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Sync name/desc when item changes
  useEffect(() => {
    if (nameRef.current && nameRef.current.textContent !== item.name) {
      nameRef.current.textContent = item.name;
    }
    if (descRef.current) {
      const d = item.description ?? "";
      if (descRef.current.textContent !== d) descRef.current.textContent = d;
    }
  }, [item.id]);

  // Load comments + custom field values
  useEffect(() => {
    fetch(`/api/items/${item.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.comments)) setComments(data.comments);
        if (Array.isArray(data.customValues)) setInternalValues(data.customValues);
      })
      .catch(() => {});
    // Load custom fields for this board
    fetch(`/api/custom-fields?boardId=${boardId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setInternalFields(data); })
      .catch(() => {});
  }, [item.id, boardId]);

  function saveName(text: string | null) {
    const n = text?.trim() ?? "";
    if (n && n !== item.name) onUpdate(item.id, { name: n });
  }

  function saveDescription(text: string | null) {
    const d = text?.trim() || null;
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
    const allVals = internalValues.length > 0 ? internalValues : customFieldValues;
    const cv = allVals.find((v) => v.fieldId === fieldId);
    if (!cv) return null;
    try { return JSON.parse(cv.value); } catch { return cv.value; }
  }

  const activeFields = internalFields.length > 0 ? internalFields : customFields;

  async function addCustomField(name: string, type: string) {
    const res = await fetch("/api/custom-fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boardId, name, type }),
    });
    if (res.ok) {
      const newField = await res.json();
      setInternalFields((prev) => [...prev, newField]);
    }
    onAddCustomField?.(boardId, name, type);
  }

  async function updateCustomFieldValue(fieldId: string, value: unknown) {
    const res = await fetch("/api/custom-field-values", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, fieldId, value }),
    });
    if (res.ok) {
      const updated = await res.json();
      setInternalValues((prev) => {
        const idx = prev.findIndex((v) => v.fieldId === fieldId);
        if (idx >= 0) return prev.map((v, i) => i === idx ? updated : v);
        return [...prev, updated];
      });
    }
    onUpdateCustomFieldValue?.(item.id, fieldId, value);
  }

  const pc = priorityColors(item.priority);
  const deadlineDate = item.deadline ? parseISO(item.deadline) : null;
  const deadlineOverdue = deadlineDate && !item.completedAt && isPast(deadlineDate);
  const doneSubtasks = item.subItems.filter((s) => s.completedAt).length;
  const totalSubtasks = item.subItems.length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <div
        className="fixed z-50 flex flex-col overflow-hidden"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(90vw, 780px)",
          maxHeight: "85vh",
          background: "var(--bg-card)",
          border: "1px solid var(--border-strong)",
          borderRadius: 16,
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-sidebar)" }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] cursor-pointer transition-colors"
          style={{ background: "var(--bg-active)", color: "var(--text-3)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; }}
        >
          <div
            className="w-2 h-2 rounded-sm flex-shrink-0"
            style={{ background: item.group.board.color ?? "#5b9cf6" }}
          />
          {item.group.board.name}
        </div>
        {item.group.name && (
          <>
            <span className="text-xs" style={{ color: "var(--text-4)" }}>/</span>
            <span className="text-[11px]" style={{ color: "var(--text-4)" }}>{item.group.name}</span>
          </>
        )}

        {/* Right: actions */}
        <div className="ml-auto flex items-center gap-1">
          <button
            className="w-7 h-7 rounded-md flex items-center justify-center text-xs transition-colors"
          style={{ border: "1px solid var(--border)", background: "transparent", color: "var(--text-3)" }}
            onClick={onClose}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* ── BODY ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* LEFT ─────────────────────────────────────────────────────────── */}
        <div className="flex-1 p-5 flex flex-col gap-5 overflow-y-auto min-w-0">
          {/* Section 1 — Task name + description */}
          <div className="flex items-start gap-3">
            {/* Priority circle */}
            <Popover.Root open={priorityOpen} onOpenChange={setPriorityOpen}>
              <Popover.Trigger asChild>
                <button
                  className="w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 hover:scale-110 transition-transform"
                  style={{ borderColor: pc.border, background: pc.bg }}
                />
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  className="rounded-xl shadow-2xl p-1.5 z-50 min-w-[160px]"
          style={{ background: "var(--bg-popover)", border: "1px solid var(--border-strong)" }}
                  sideOffset={6}
                >
                  {Object.entries(PRIORITY_LABELS).map(([key, label]) => {
                    const col = PRIORITY_COLORS[key as keyof typeof PRIORITY_COLORS];
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          onUpdate(item.id, { priority: key === "p4" ? null : key });
                          setPriorityOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors text-left"
                        style={{ color: "var(--text-2)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: col.text }}
                        />
                        <span className="text-sm">{label}</span>
                        {(item.priority ?? "p4") === key && (
                          <span className="ml-auto text-xs" style={{ color: "var(--chart-primary)" }}>✓</span>
                        )}
                      </button>
                    );
                  })}
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            <div className="flex-1 min-w-0">
              {/* Editable task name */}
              <div
                ref={nameRef}
                contentEditable
                suppressContentEditableWarning
                className="text-[17px] font-medium leading-snug outline-none cursor-text"
              style={{ color: "var(--text-1)" }}
                onBlur={(e) => saveName(e.currentTarget.textContent)}
              >
                {item.name}
              </div>
              {/* Editable description */}
              <div
                ref={descRef}
                contentEditable
                suppressContentEditableWarning
                className="mt-2 text-[12px] leading-relaxed outline-none cursor-text"
              style={{ color: "var(--text-3)" }}
                onBlur={(e) => saveDescription(e.currentTarget.textContent)}
              >
                {item.description ?? ""}
              </div>
            </div>
          </div>

          {/* Section 2 — Subtasks */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-4)" }}>
                Subtasks
              </span>
              {totalSubtasks > 0 && (
                <span className="text-[9px]" style={{ color: "var(--text-4)" }}>
                  {doneSubtasks}/{totalSubtasks}
                </span>
              )}
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>

            {item.subItems.map((sub) => (
              <div key={sub.id} className="flex items-center gap-2 py-1.5 group cursor-pointer">
                <button
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center transition-colors"
                  style={
                    sub.completedAt
                      ? { background: "#3B6D11", borderColor: "#3B6D11", border: "1px solid #3B6D11" }
                      : { border: "1px solid var(--border-strong)" }
                  }
                  onClick={() =>
                    onUpdate(sub.id, {
                      completedAt: sub.completedAt ? null : new Date().toISOString(),
                    })
                  }
                >
                  {sub.completedAt && <Check size={8} className="text-white" />}
                </button>
                <span
                  className="text-[12px] flex-1"
                  style={{ color: "var(--text-2)", textDecoration: sub.completedAt ? "line-through" : "none", opacity: sub.completedAt ? 0.5 : 1 }}
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
                className="w-full text-[12px] rounded-lg px-3 py-1.5 outline-none mt-1"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-1)" }}
              />
            ) : (
              <button
                className="flex items-center gap-1.5 text-[11px] mt-1 py-1 transition-colors"
              style={{ color: "var(--text-4)" }}
                onClick={() => setAddingSubtask(true)}
              >
                <span className="text-base leading-none">+</span> Add subtask
              </button>
            )}
          </div>

          {/* Section 3 — Comments */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-4)" }}>
                Comments
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>

            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-2.5 mb-3">
                <div
                  className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-semibold text-white"
                  style={{ background: "var(--chart-primary)" }}
                >
                  {comment.author?.name?.[0] ?? "U"}
                </div>
                <div className="flex-1 rounded-xl px-3 py-2" style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium" style={{ color: "var(--text-2)" }}>
                      {comment.author?.name ?? "User"}
                    </span>
                    <span className="text-[9px]" style={{ color: "var(--text-4)" }}>
                      {formatRelative(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-2)" }}>{comment.text}</p>
                </div>
              </div>
            ))}

            <div className="flex gap-2.5 items-start">
              <div
                className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-[9px] font-semibold text-white"
                style={{ background: "var(--chart-primary)" }}
              >
                U
              </div>
              <textarea
                ref={commentRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={2}
                placeholder="Write a comment… (Enter to send)"
                className="flex-1 rounded-xl px-3 py-2 text-[11px] resize-none outline-none transition-colors font-sans"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitComment();
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT ─────────────────────────────────────────────────────────── */}
        <div className="w-[196px] shrink-0 p-4 overflow-y-auto" style={{ background: "var(--bg-sidebar)", borderLeft: "1px solid var(--border)" }}>
          {/* Priority */}
          <PropRow label="Priority" onClick={() => setPriorityOpen(true)}>
            {item.priority && item.priority !== "p4" ? (
              <span
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border"
                style={{
                  background: pc.badge_bg,
                  color: pc.text,
                  borderColor: pc.badge_border,
                }}
              >
                🚩 {PRIORITY_LABELS[item.priority]}
              </span>
            ) : (
              <span style={{ color: "var(--text-4)" }}>No priority</span>
            )}
          </PropRow>

          <div className="h-px my-1" style={{ background: "var(--border)" }} />

          {/* Scheduled date */}
          <div className="mb-4">
            <p className="text-[9px] font-semibold uppercase tracking-[0.08em] mb-1.5" style={{ color: "var(--text-4)" }}>
              Date
            </p>
            <DatePicker
              value={item.scheduledDate}
              onChange={(iso) => onUpdate(item.id, { scheduledDate: iso })}
              placeholder="Set date"
              compact
            />
          </div>

          <div className="h-px my-1" style={{ background: "var(--border)" }} />

          {/* Deadline */}
          <div className="mb-4">
            <p className="text-[9px] font-semibold uppercase tracking-[0.08em] mb-1.5" style={{ color: "var(--text-4)" }}>
              Deadline
            </p>
            <div className="flex items-center gap-1.5">
              <DatePicker
                value={item.deadline}
                onChange={(iso) => onUpdate(item.id, { deadline: iso })}
                placeholder="Set deadline"
                compact
              />
              {deadlineOverdue && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                  overdue
                </span>
              )}
            </div>
          </div>

          <div className="h-px my-1" style={{ background: "var(--border)" }} />

          {/* Category */}
          <CategoryPropRow
            value={item.category}
            onChange={(c) => onUpdate(item.id, { category: c })}
          />

          {/* Custom fields */}
          {activeFields.length > 0 && (
            <>
              <div className="h-px my-1" style={{ background: "var(--border)" }} />
              {activeFields.map((field) => {
                const val = getCustomValue(field.id);
                return (
                  <div key={field.id} className="mb-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.08em] mb-1.5" style={{ color: "var(--text-4)" }}>
                      {field.name}
                    </p>
                    <CustomFieldEditor
                      field={field}
                      value={val}
                      onChange={(v) => updateCustomFieldValue(field.id, v)}
                    />
                  </div>
                );
              })}
            </>
          )}

          {/* Add custom field */}
          <>
            <div className="h-px my-1" style={{ background: "var(--border)" }} />
            {showAddField ? (
              <div className="space-y-2 mt-2">
                <input
                  autoFocus
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="Field name"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setShowAddField(false);
                      setNewFieldName("");
                    }
                  }}
                  className="w-full text-[11px] rounded-lg px-2 py-1.5 outline-none"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                />
                <div className="grid grid-cols-2 gap-1">
                  {FIELD_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.type}
                      onClick={() => {
                        if (newFieldName.trim()) {
                          addCustomField(newFieldName.trim(), opt.type);
                          setNewFieldName("");
                          setShowAddField(false);
                        }
                      }}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] transition-colors"
                      style={{ color: "var(--text-3)", border: "1px solid var(--border)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; }}
                    >
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => { setShowAddField(false); setNewFieldName(""); }}
                  className="text-[10px] transition-colors"
                  style={{ color: "var(--text-4)" }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddField(true)}
                className="flex items-center gap-1.5 text-[11px] mt-2 transition-colors"
                style={{ color: "var(--chart-primary)", opacity: 0.7 }}
              >
                <span className="text-base leading-none">+</span> Add field
              </button>
            )}
          </>

          {/* Timestamps */}
          <div className="h-px my-3" style={{ background: "var(--border)" }} />
          <div className="space-y-1">
            {item.createdAt && (
              <p className="text-[9px]" style={{ color: "var(--text-4)" }}>
                Created {format(parseISO(item.createdAt), "MMM d, yyyy")}
              </p>
            )}
            {item.updatedAt && (
              <p className="text-[9px]" style={{ color: "var(--text-4)" }}>
                Updated {formatRelative(item.updatedAt)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 flex items-center text-[10px] shrink-0" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-sidebar)", color: "var(--text-4)" }}>
        {item.createdAt && (
          <span>Created {format(parseISO(item.createdAt), "MMM d, yyyy")}</span>
        )}
        {onDelete && (
          <button
            className="ml-auto flex items-center gap-1.5 text-[10px] text-red-400/50 hover:text-red-400 transition-colors"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 size={11} /> Delete step
          </button>
        )}
      </div>
    </div>
    </>
  );
}

// ── CategoryPropRow ──────────────────────────────────────────────────────────
function CategoryPropRow({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (c: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  function submit() {
    setEditing(false);
    const c = draft.trim() || null;
    if (c !== value) onChange(c);
  }

  return (
    <div className="mb-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.08em] mb-1.5" style={{ color: "var(--text-4)" }}>
        Category
      </p>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={submit}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-full text-[11px] rounded-lg px-2 py-1 outline-none"
        style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-1)" }}
        />
      ) : value ? (
        <button
          onClick={() => { setDraft(value); setEditing(true); }}
          className="flex items-center gap-1.5 text-[11px] w-full text-left px-1.5 py-1 rounded-md -mx-1.5 transition-colors"
          style={{ color: "var(--text-3)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-medium border"
            style={{
              background: "rgba(91,156,246,0.1)",
              color: "var(--chart-primary)",
              borderColor: "rgba(91,156,246,0.25)",
            }}
          >
            {value}
          </span>
        </button>
      ) : (
        <button
          onClick={() => { setDraft(""); setEditing(true); }}
          className="flex items-center gap-1.5 text-[11px] w-full text-left px-1.5 py-1 rounded-md -mx-1.5 transition-colors"
          style={{ color: "var(--text-4)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          Add category
        </button>
      )}
    </div>
  );
}

// ── CustomFieldEditor ────────────────────────────────────────────────────────
function CustomFieldEditor({
  field,
  value,
  onChange,
}: {
  field: CustomField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const [draft, setDraft] = useState(value != null ? String(value) : "");
  const [editing, setEditing] = useState(false);

  function submit() {
    setEditing(false);
    if (field.type === "number") onChange(draft === "" ? null : Number(draft));
    else onChange(draft || null);
  }

  if (field.type === "checkbox") {
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded cursor-pointer" style={{ accentColor: "var(--chart-primary)" }}
      />
    );
  }

  if (field.type === "url" && value && !editing) {
    return (
      <div className="flex items-center gap-1.5">
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] hover:underline truncate flex items-center gap-1"
          style={{ color: "var(--chart-primary)" }}
        >
          <ExternalLink size={10} />
          {String(value).replace(/^https?:\/\//, "").slice(0, 20)}…
        </a>
        <button
          onClick={() => { setDraft(String(value)); setEditing(true); }}
          className="transition-colors"
          style={{ color: "var(--text-4)" }}
        >
          <MoreHorizontal size={10} />
        </button>
      </div>
    );
  }

  if (editing || !value) {
    return (
      <input
        autoFocus={editing}
        type={field.type === "number" ? "number" : "text"}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={submit}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setEditing(false);
        }}
        placeholder={field.type === "url" ? "https://…" : "—"}
        className="w-full text-[11px] rounded-lg px-2 py-1 outline-none"
      style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-1)" }}
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(String(value)); setEditing(true); }}
      className="text-[11px] transition-colors text-left"
      style={{ color: "var(--text-2)" }}
    >
      {String(value)}
    </button>
  );
}
