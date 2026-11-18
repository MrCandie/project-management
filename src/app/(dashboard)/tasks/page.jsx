"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import useGet from "../../hooks/use-get";
import { usePost } from "../../hooks/use-post";
import { useProject } from "../../context/project";
import { useAuth } from "@/app/context/auth";

const STATUSES = [
  {
    value: "pending",
    label: "Pending",
    badge: "bg-amber-50 text-amber-800 ring-amber-200",
    dot: "bg-amber-500",
    drop: "border-amber-400 bg-amber-50/60",
  },
  {
    value: "ongoing",
    label: "Ongoing",
    badge: "bg-blue-50 text-blue-800 ring-blue-200",
    dot: "bg-blue-600",
    drop: "border-blue-500 bg-blue-50/60",
  },
  {
    value: "completed",
    label: "Completed",
    badge: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    dot: "bg-emerald-600",
    drop: "border-emerald-500 bg-emerald-50/60",
  },
  {
    value: "overdue",
    label: "Overdue",
    badge: "bg-red-50 text-red-800 ring-red-200",
    dot: "bg-red-600",
    drop: "border-red-500 bg-red-50/60",
  },
];

const PRIORITIES = [
  { value: "low", label: "Low", className: "bg-slate-100 text-slate-700" },
  {
    value: "medium",
    label: "Medium",
    className: "bg-amber-100 text-amber-800",
  },
  { value: "high", label: "High", className: "bg-red-100 text-red-800" },
];

const statusMeta = (value) =>
  STATUSES.find((s) => s.value === value) ?? STATUSES[0];
const priorityMeta = (value) => PRIORITIES.find((p) => p.value === value);

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : dateFormatter.format(d);
}

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : dateTimeFormatter.format(d);
}

function toInputDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function toList(data, ...keys) {
  if (Array.isArray(data)) return data;
  for (const key of ["data", ...keys]) {
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data?.[key])) return data.data[key];
  }
  return [];
}

function pickObject(data, key) {
  if (!data) return null;
  if (data[key]) return data[key];
  if (data.data?.[key]) return data.data[key];
  if (data.data && !Array.isArray(data.data)) return data.data;
  return data;
}

const idOf = (item) =>
  typeof item === "string" ? item : (item?._id ?? item?.id);
const taskName = (task) => task.name ?? task.title ?? "Untitled task";

function memberName(member) {
  if (!member || typeof member === "string") return "";
  const full = [member.firstName, member.lastName].filter(Boolean).join(" ");
  return full || member.name || member.email || "";
}

function initials(member) {
  const name = memberName(member);
  if (!name) return "?";
  const parts = name.split(/[\s@]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

const inputClass = (error) =>
  `block w-full rounded-lg border bg-white px-3.5 py-2.5 text-[15px] text-slate-900 placeholder-slate-400 outline-none transition focus:ring-4 ${
    error
      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
      : "border-slate-300 focus:border-blue-600 focus:ring-blue-100"
  }`;

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70";

const dangerButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200 disabled:cursor-not-allowed disabled:opacity-70";

function Spinner({ light = true }) {
  return (
    <span
      className={`h-4 w-4 animate-spin rounded-full border-2 motion-reduce:animate-none ${
        light
          ? "border-white/40 border-t-white"
          : "border-slate-300 border-t-blue-700"
      }`}
    />
  );
}

function Icon({ name, className = "h-4 w-4" }) {
  const paths = {
    plus: <path d="M12 5v14M5 12h14" strokeLinecap="round" />,
    edit: (
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" strokeLinejoin="round" />
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path
          d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.2A6.5 6.5 0 0 1 21.5 20"
          strokeLinecap="round"
        />
      </>
    ),
    trash: (
      <path
        d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    close: <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />,
    calendar: (
      <>
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path d="M3.5 10h17M8 3v4M16 3v4" strokeLinecap="round" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" strokeLinecap="round" />
      </>
    ),
    eye: (
      <>
        <path
          d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    grip: (
      <>
        <circle cx="9" cy="6" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="15" cy="6" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="9" cy="18" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="15" cy="18" r="1.2" fill="currentColor" stroke="none" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}

function Modal({
  title,
  description,
  onClose,
  children,
  footer,
  size = "max-w-lg",
}) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement;
    const onKey = (e) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector("input, select, textarea, button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative flex max-h-[92vh] w-full ${size} flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="modal-title"
              className="text-lg font-semibold tracking-tight text-slate-900"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 truncate text-sm text-slate-600">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-red-600">
      {children}
    </p>
  );
}

function StatusBadge({ status }) {
  const meta = statusMeta(status);
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium ring-1 ring-inset ${meta.badge}`}
    >
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function IconButton({ label, icon, onClick, danger, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-md p-1.5 text-slate-500 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
        danger
          ? "hover:bg-red-50 hover:text-red-600"
          : "hover:bg-slate-100 hover:text-slate-900"
      } ${className}`}
    >
      <Icon name={icon} />
    </button>
  );
}

function MemberStack({ members }) {
  const list = members ?? [];
  if (!list.length) return null;
  const populated = list.filter((m) => typeof m === "object" && m);
  if (!populated.length)
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-600">
        <Icon name="users" className="h-3.5 w-3.5" />
        {list.length}
      </span>
    );
  const shown = populated.slice(0, 3);
  const extra = list.length - shown.length;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-1.5">
        {shown.map((m) => (
          <span
            key={idOf(m)}
            title={memberName(m)}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-blue-700 ring-2 ring-white"
          >
            {initials(m)}
          </span>
        ))}
      </div>
      {extra > 0 && (
        <span className="ml-1.5 text-xs text-slate-600">+{extra}</span>
      )}
    </div>
  );
}

function TaskFormModal({ task, defaultStatus, projectId, onClose }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task ? taskName(task) : "",
    description: task?.description ?? "",
    startDate: toInputDate(task?.startDate),
    endDate: toInputDate(task?.endDate),
    priority: task?.priority ?? "medium",
    status: task?.status ?? defaultStatus ?? "pending",
  });
  const [errors, setErrors] = useState({});

  const handler = usePost({
    url: isEdit ? `/api/v1/task/${idOf(task)}` : "/api/v1/task",
    method: isEdit ? "PATCH" : "POST",
    title: isEdit ? "Task updated" : "Task created",
    onSuccess: () => onClose(),
    queryKey: "tasks",
  });

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.title.trim()) next.title = "Enter a task title.";
    if (!form.description.trim()) next.description = "Enter a description.";
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      next.endDate = "End date can’t be before the start date.";
    setErrors(next);
    if (Object.keys(next).length) return;

    handler.mutate({
      title: form.title.trim(),
      description: form.description.trim(),
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      priority: form.priority,
      status: form.status,
      projectId,
    });
  };

  return (
    <Modal
      title={isEdit ? "Edit task" : "New task"}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button
            type="submit"
            form="task-form"
            disabled={handler.isPending}
            className={primaryButton}
          >
            {handler.isPending && <Spinner />}
            {isEdit
              ? handler.isPending
                ? "Saving…"
                : "Save changes"
              : handler.isPending
                ? "Creating task…"
                : "Create task"}
          </button>
        </>
      }
    >
      <form
        id="task-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="title"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={update("title")}
            placeholder="e.g. Draft homepage copy"
            autoComplete="off"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? "title-error" : undefined}
            className={inputClass(errors.title)}
          />
          <FieldError id="title-error">{errors.title}</FieldError>
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={update("description")}
            placeholder="What needs to be done?"
            aria-invalid={!!errors.description}
            aria-describedby={
              errors.description ? "description-error" : undefined
            }
            className={`${inputClass(errors.description)} resize-y leading-relaxed`}
          />
          <FieldError id="description-error">{errors.description}</FieldError>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="startDate"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Start date
            </label>
            <input
              id="startDate"
              type="date"
              value={form.startDate}
              onChange={update("startDate")}
              className={inputClass()}
            />
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              End date
            </label>
            <input
              id="endDate"
              type="date"
              value={form.endDate}
              min={form.startDate || undefined}
              onChange={update("endDate")}
              aria-invalid={!!errors.endDate}
              aria-describedby={errors.endDate ? "endDate-error" : undefined}
              className={inputClass(errors.endDate)}
            />
            <FieldError id="endDate-error">{errors.endDate}</FieldError>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="priority"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Priority
            </label>
            <select
              id="priority"
              value={form.priority}
              onChange={update("priority")}
              className={inputClass()}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="status"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Status
            </label>
            <select
              id="status"
              value={form.status}
              onChange={update("status")}
              className={inputClass()}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function TaskMembersModal({ task, projectId, onClose }) {
  const { data, isPending, isError, refetch } = useGet(
    `/api/v1/project/${projectId}/members`,
    "task-members" + projectId,
  );
  const people = toList(data, "members", "users");
  const [selected, setSelected] = useState(() =>
    (task.members ?? []).map(idOf).filter(Boolean),
  );
  const [query, setQuery] = useState("");

  const handler = usePost({
    url: `/api/v1/task/${idOf(task)}`,
    method: "POST",
    title: "Members updated",
    onSuccess: () => onClose(),
    queryKey: "tasks",
  });

  const q = query.trim().toLowerCase();
  const filtered = q
    ? people.filter((p) =>
        `${memberName(p)} ${p.email ?? ""}`.toLowerCase().includes(q),
      )
    : people;
  const toggle = (id) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  let body;
  if (isPending) {
    body = (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-600">
        <Spinner light={false} />
        Loading people…
      </div>
    );
  } else if (isError) {
    body = (
      <div role="alert" className="py-8 text-center">
        <p className="text-[15px] text-slate-700">People couldn’t be loaded.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className={`${secondaryButton} mt-4`}
        >
          Try again
        </button>
      </div>
    );
  } else if (!people.length) {
    body = (
      <p className="py-8 text-center text-[15px] text-slate-600">
        There’s no one to add yet. Invite members to the project first.
      </p>
    );
  } else {
    body = (
      <>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Icon name="search" />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            aria-label="Search people"
            className={`${inputClass()} pl-9`}
          />
        </div>
        <ul className="mt-3 divide-y divide-slate-100">
          {filtered.map((person) => {
            const id = idOf(person);
            return (
              <li key={id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={selected.includes(id)}
                    onChange={() => toggle(id)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                  />
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                    {initials(person)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-medium text-slate-900">
                      {memberName(person) || "Unnamed user"}
                    </span>
                    {person.email && (
                      <span className="block truncate text-sm text-slate-500">
                        {person.email}
                      </span>
                    )}
                  </span>
                </label>
              </li>
            );
          })}
          {!filtered.length && (
            <li className="py-6 text-center text-sm text-slate-500">
              No one matches “{query}”.
            </li>
          )}
        </ul>
      </>
    );
  }

  return (
    <Modal
      title="Task members"
      description={taskName(task)}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handler.mutate({ projectId, members: selected })}
            disabled={handler.isPending || isPending || isError}
            className={primaryButton}
          >
            {handler.isPending && <Spinner />}
            {handler.isPending
              ? "Saving…"
              : `Save members${selected.length ? ` (${selected.length})` : ""}`}
          </button>
        </>
      }
    >
      {body}
    </Modal>
  );
}

function DeleteTaskModal({ task, onClose, projectId }) {
  const handler = usePost({
    url: `/api/v1/task/${idOf(task)}/delete?projectId=${projectId}`,
    method: "DELETE",
    title: "Task deleted",
    onSuccess: () => onClose(),
    queryKey: "tasks",
  });

  return (
    <Modal
      title="Delete this task?"
      onClose={onClose}
      size="max-w-md"
      footer={
        <>
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handler.mutate({})}
            disabled={handler.isPending}
            className={dangerButton}
          >
            {handler.isPending && <Spinner />}
            {handler.isPending ? "Deleting…" : "Delete task"}
          </button>
        </>
      }
    >
      <p className="text-[15px] leading-relaxed text-slate-700">
        “{taskName(task)}” will be removed for everyone on this project. This
        can’t be undone.
      </p>
    </Modal>
  );
}

function TaskHistory({ history, isPending, isError, onRetry }) {
  if (isPending) {
    return (
      <ol
        aria-busy="true"
        aria-label="Loading history"
        className="space-y-5 pl-6"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-6 top-1 h-[15px] w-[15px] animate-pulse rounded-full bg-slate-200 motion-reduce:animate-none" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
            <div className="mt-2 h-3.5 w-1/3 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
          </li>
        ))}
      </ol>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="rounded-lg bg-slate-50 px-4 py-6 text-center"
      >
        <p className="text-sm text-slate-700">History couldn’t be loaded.</p>
        <button
          type="button"
          onClick={() => onRetry()}
          className={`${secondaryButton} mt-3`}
        >
          Try again
        </button>
      </div>
    );
  }

  const entries = [...(history ?? [])]
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));

  if (!entries.length) {
    return (
      <div className="rounded-lg bg-slate-50 px-4 py-6 text-center">
        <p className="text-sm font-medium text-slate-700">No activity yet</p>
        <p className="mt-0.5 text-sm text-slate-500">
          Changes to this task will show up here.
        </p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-5 pl-6 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-slate-200">
      {entries.map((entry, i) => (
        <li key={idOf(entry) ?? `${entry.createdAt}-${i}`} className="relative">
          <span
            className={`absolute -left-6 top-1 h-[15px] w-[15px] rounded-full border-2 border-white ring-1 ${
              i === 0
                ? "bg-blue-700 ring-blue-700"
                : "bg-slate-300 ring-slate-300"
            }`}
          />
          <p className="text-[15px] leading-snug text-slate-900">
            {entry.action || "Updated"}
          </p>
          <time
            dateTime={entry.createdAt}
            className="mt-0.5 block text-sm text-slate-500"
          >
            {formatDateTime(entry.createdAt)}
          </time>
        </li>
      ))}
    </ol>
  );
}

function ViewTaskModal({ task, status, isOwner, projectId, onClose, onEdit }) {
  const priority = priorityMeta(task.priority);
  const members = (task.members ?? []).filter(
    (m) => m && typeof m === "object",
  );

  const {
    data,
    isPending: historyPending,
    isError: historyError,
    refetch: refetchHistory,
  } = useGet(
    `/api/v1/task/${idOf(task)}/history?projectId=${projectId}`,
    "task_history" + idOf(task),
  );

  const history = toList(data, "history");

  const details = [
    { label: "Start date", value: formatDate(task.startDate) || "Not set" },
    { label: "End date", value: formatDate(task.endDate) || "Not set" },
    { label: "Priority", value: priority ? priority.label : "Not set" },
    { label: "Created", value: formatDate(task.createdAt) || "—" },
  ];

  return (
    <Modal
      title={taskName(task)}
      onClose={onClose}
      size="max-w-2xl"
      footer={
        <>
          <button type="button" onClick={onClose} className={secondaryButton}>
            Close
          </button>
          {isOwner && (
            <button
              type="button"
              onClick={() => onEdit(task)}
              className={primaryButton}
            >
              <Icon name="edit" />
              Edit task
            </button>
          )}
        </>
      }
    >
      <div className="space-y-7">
        <div>
          <StatusBadge status={status} />
          {task.description ? (
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-slate-700">
              {task.description}
            </p>
          ) : (
            <p className="mt-3 text-[15px] italic text-slate-400">
              No description
            </p>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          {details.map((d) => (
            <div key={d.label}>
              <dt className="text-sm text-slate-500">{d.label}</dt>
              <dd className="mt-0.5 text-[15px] font-medium text-slate-900">
                {d.value}
              </dd>
            </div>
          ))}
        </dl>

        <section>
          <h3 className="text-sm font-semibold text-slate-900">Members</h3>
          {members.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {members.map((m) => (
                <li
                  key={idOf(m)}
                  className="flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-1 pr-3"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[11px] font-semibold text-blue-700">
                    {initials(m)}
                  </span>
                  <span className="text-sm text-slate-800">
                    {memberName(m)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-600">
              {(task.members ?? []).length
                ? `${task.members.length} assigned`
                : "No one assigned yet."}
            </p>
          )}
        </section>

        <section>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Icon name="clock" className="h-4 w-4 text-slate-500" />
            History
            {!historyPending && !historyError && history.length > 0 && (
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-medium tabular-nums text-slate-600">
                {history.length}
              </span>
            )}
          </h3>
          <TaskHistory
            history={history}
            isPending={historyPending}
            isError={historyError}
            onRetry={refetchHistory}
          />
        </section>
      </div>
    </Modal>
  );
}

function StatusMutation({ taskId, status, onDone, projectId }) {
  const started = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const handler = usePost({
    url: `/api/v1/task/${taskId}/status`,
    method: "POST",
    title: "Status updated",
    onSuccess: () => onDoneRef.current(taskId, true),
    queryKey: "tasks",
  });

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    handler.mutate({ status, projectId });
  }, []);

  useEffect(() => {
    if (handler.isError) onDoneRef.current(taskId, false);
  }, [handler.isError, taskId]);

  return null;
}

function TaskCard({
  task,
  status,
  isOwner,
  saving,
  isDragging,
  onDragStart,
  onDragEnd,
  onMove,
  onView,
  onEdit,
  onMembers,
  onDelete,
}) {
  const priority = priorityMeta(task.priority);
  const end = formatDate(task.endDate);
  const isLate =
    task.endDate &&
    status !== "completed" &&
    new Date(task.endDate) < new Date(new Date().toDateString());

  return (
    <li
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      className={`group cursor-grab rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm transition active:cursor-grabbing ${
        isDragging ? "opacity-40" : "hover:border-slate-300 hover:shadow"
      } ${saving ? "ring-2 ring-blue-200" : ""}`}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 hidden shrink-0 text-slate-300 transition group-hover:text-slate-400 sm:block">
          <Icon name="grip" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => onView(task)}
              className="text-left text-[15px] font-semibold leading-snug text-slate-900 hover:text-blue-700 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {taskName(task)}
            </button>
            {saving && <Spinner light={false} />}
          </div>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">
              {task.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {priority && (
              <span
                className={`rounded px-1.5 py-0.5 text-xs font-medium ${priority.className}`}
              >
                {priority.label}
              </span>
            )}
            {end && (
              <span
                className={`inline-flex items-center gap-1 text-xs ${isLate ? "font-medium text-red-700" : "text-slate-600"}`}
              >
                <Icon name="calendar" className="h-3.5 w-3.5" />
                {end}
              </span>
            )}
            <span className="ml-auto">
              <MemberStack members={task.members} />
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
            <label className="sr-only" htmlFor={`move-${idOf(task)}`}>
              Move {taskName(task)}
            </label>
            <select
              id={`move-${idOf(task)}`}
              value={status}
              disabled={saving}
              onChange={(e) => onMove(task, e.target.value)}
              className="min-w-0 cursor-pointer rounded-md border border-slate-200 bg-white py-1 pl-2 pr-7 text-xs font-medium text-slate-700 outline-none transition hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-wait"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <div className="flex items-center">
              <IconButton
                label="View task"
                icon="eye"
                onClick={() => onView(task)}
              />
              {isOwner && (
                <>
                  <IconButton
                    label="Edit task"
                    icon="edit"
                    onClick={() => onEdit(task)}
                  />
                  <IconButton
                    label="Assign members"
                    icon="users"
                    onClick={() => onMembers(task)}
                  />
                  <IconButton
                    label="Delete task"
                    icon="trash"
                    danger
                    onClick={() => onDelete(task)}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

function BoardColumn({
  status,
  tasks,
  isOver,
  draggingId,
  children,
  onAdd,
  isOwner,
  onDragOver,
  onDragLeave,
  onDrop,
}) {
  const meta = statusMeta(status);
  return (
    <section
      aria-label={`${meta.label} tasks`}
      onDragOver={(e) => onDragOver(e, status)}
      onDragLeave={(e) => onDragLeave(e, status)}
      onDrop={(e) => onDrop(e, status)}
      className={`flex w-[85vw] max-w-[320px] shrink-0 snap-start flex-col rounded-xl border-2 transition sm:w-[300px] lg:w-auto lg:max-w-none lg:flex-1 ${
        isOver ? meta.drop : "border-transparent bg-slate-100/70"
      }`}
    >
      <header className="flex items-center justify-between gap-2 px-3 pb-2 pt-3">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
          <h3 className="text-sm font-semibold text-slate-900">{meta.label}</h3>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium tabular-nums text-slate-600">
            {tasks.length}
          </span>
        </div>
        {isOwner && (
          <IconButton
            label={`Add task to ${meta.label}`}
            icon="plus"
            onClick={() => onAdd(status)}
          />
        )}
      </header>
      <ul className="flex min-h-[120px] flex-1 flex-col gap-2.5 px-2.5 pb-3">
        {children}
        {!tasks.length && (
          <li
            className={`flex flex-1 items-center justify-center rounded-lg border-2 border-dashed px-3 py-8 text-center text-sm ${
              isOver
                ? "border-transparent text-slate-700"
                : "border-slate-200 text-slate-500"
            }`}
          >
            {draggingId ? "Drop here" : "No tasks"}
          </li>
        )}
      </ul>
    </section>
  );
}

function BoardSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading tasks"
      className="flex gap-4 overflow-hidden"
    >
      {STATUSES.map((s) => (
        <div
          key={s.value}
          className="w-[85vw] max-w-[320px] shrink-0 rounded-xl bg-slate-100/70 p-3 sm:w-[300px] lg:w-auto lg:max-w-none lg:flex-1"
        >
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
          <div className="mt-4 space-y-2.5">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2 rounded-lg bg-white p-3.5">
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
                <div className="h-3 w-full animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TasksPage() {
  const { activeProject } = useProject();
  const projectId = activeProject?._id;

  const { data, isPending, isError, refetch } = useGet(
    `/api/v1/task?projectId=${projectId}`,
    "tasks" + projectId,
  );

  const { user: me } = useAuth();

  const isOwner =
    typeof activeProject?.isOwner === "boolean"
      ? activeProject.isOwner
      : !!idOf(me) && !!activeProject && idOf(me) === idOf(activeProject.owner);

  const [query, setQuery] = useState("");
  const [overrides, setOverrides] = useState({});
  const [pendingMoves, setPendingMoves] = useState([]);
  const [draggingId, setDraggingId] = useState(null);
  const [overColumn, setOverColumn] = useState(null);
  const [announcement, setAnnouncement] = useState("");

  const [viewTaskId, setViewTaskId] = useState(null);
  const [formState, setFormState] = useState(null);
  const [membersTask, setMembersTask] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);

  const tasks = useMemo(() => {
    const list = toList(data, "tasks");
    const forProject = projectId
      ? list.filter((t) => !t.project || idOf(t.project) === projectId)
      : list;
    return [...forProject].sort(
      (a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0),
    );
  }, [data, projectId]);

  const statusOf = (task) => overrides[idOf(task)] ?? task.status ?? "pending";

  const q = query.trim().toLowerCase();
  const filtered = q
    ? tasks.filter((t) =>
        `${taskName(t)} ${t.description ?? ""}`.toLowerCase().includes(q),
      )
    : tasks;

  const columns = useMemo(() => {
    const map = Object.fromEntries(STATUSES.map((s) => [s.value, []]));
    for (const t of filtered) {
      const s = overrides[idOf(t)] ?? t.status ?? "pending";
      (map[s] ?? map.pending).push(t);
    }
    return map;
  }, [filtered, overrides]);

  const viewTask = viewTaskId
    ? tasks.find((t) => idOf(t) === viewTaskId)
    : null;
  const savingIds = new Set(pendingMoves.map((m) => m.taskId));

  const moveTask = (task, nextStatus) => {
    const id = idOf(task);
    if (!id || statusOf(task) === nextStatus || savingIds.has(id)) return;
    setOverrides((o) => ({ ...o, [id]: nextStatus }));
    setPendingMoves((m) => [
      ...m,
      { taskId: id, status: nextStatus, key: `${id}-${Date.now()}` },
    ]);
    setAnnouncement(
      `Moved ${taskName(task)} to ${statusMeta(nextStatus).label}.`,
    );
  };

  const finishMove = async (taskId, ok) => {
    setPendingMoves((m) => m.filter((x) => x.taskId !== taskId));
    if (!ok) {
      setOverrides((o) => {
        const next = { ...o };
        delete next[taskId];
        return next;
      });
      setAnnouncement(
        "The status couldn’t be updated. The task was moved back.",
      );
      return;
    }
    try {
      await refetch();
    } finally {
      setOverrides((o) => {
        const next = { ...o };
        delete next[taskId];
        return next;
      });
    }
  };

  const handleDragStart = (e, task) => {
    const id = idOf(task);
    if (savingIds.has(id)) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    setDraggingId(id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setOverColumn(null);
  };

  const handleDragOver = (e, status) => {
    if (!draggingId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overColumn !== status) setOverColumn(status);
  };

  const handleDragLeave = (e, status) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (overColumn === status) setOverColumn(null);
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    const task = tasks.find((t) => idOf(t) === id);
    if (task) moveTask(task, status);
    setDraggingId(null);
    setOverColumn(null);
  };

  const closeAndRefresh = (setter, value) => () => {
    setter(value);
    refetch();
  };

  if (!activeProject) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          Choose a project first
        </h2>
        <p className="mt-1 text-[15px] text-slate-600">
          Tasks belong to a project. Pick one to see and add its tasks.
        </p>
        <Link href="/projects" className={`${primaryButton} mt-6`}>
          Go to projects
        </Link>
      </div>
    );
  }

  let board;
  if (isPending) board = <BoardSkeleton />;
  else if (isError)
    board = (
      <div
        role="alert"
        className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center"
      >
        <h3 className="text-base font-semibold text-slate-900">
          Tasks couldn’t be loaded
        </h3>
        <p className="mt-1 text-[15px] text-slate-600">
          Check your connection, then try again.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className={`${secondaryButton} mt-5`}
        >
          Try again
        </button>
      </div>
    );
  else if (!tasks.length)
    board = (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
        <h3 className="text-base font-semibold text-slate-900">No tasks yet</h3>
        <p className="mt-1 text-[15px] text-slate-600">
          {isOwner
            ? `Add the first task for ${activeProject.name ?? "this project"}.`
            : "The project owner hasn’t added any tasks yet."}
        </p>
        {isOwner && (
          <button
            type="button"
            onClick={() => setFormState({ task: null, status: "pending" })}
            className={`${primaryButton} mt-6`}
          >
            <Icon name="plus" />
            New task
          </button>
        )}
      </div>
    );
  else
    board = (
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:snap-none lg:px-0">
        {STATUSES.map((s) => (
          <BoardColumn
            key={s.value}
            status={s.value}
            tasks={columns[s.value]}
            isOver={overColumn === s.value}
            draggingId={draggingId}
            isOwner={isOwner}
            onAdd={(status) => setFormState({ task: null, status })}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {columns[s.value].map((task) => (
              <TaskCard
                key={idOf(task)}
                task={task}
                status={statusOf(task)}
                isOwner={isOwner}
                saving={savingIds.has(idOf(task))}
                isDragging={draggingId === idOf(task)}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onMove={moveTask}
                onView={(t) => setViewTaskId(idOf(t))}
                onEdit={(t) => setFormState({ task: t })}
                onMembers={setMembersTask}
                onDelete={setDeleteTask}
              />
            ))}
          </BoardColumn>
        ))}
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            {activeProject.name ?? "Tasks"}
          </h2>
          <p className="mt-1 text-[15px] text-slate-600">
            {tasks.length
              ? `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}. Drag a card to change its status.`
              : "Plan and track the work for this project"}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {tasks.length > 0 && (
            <div className="relative sm:w-64">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Icon name="search" />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks"
                aria-label="Search tasks"
                className={`${inputClass()} py-2 pl-9`}
              />
            </div>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={() => setFormState({ task: null, status: "pending" })}
              className={primaryButton}
            >
              <Icon name="plus" />
              New task
            </button>
          )}
        </div>
      </div>

      {q && tasks.length > 0 && !filtered.length && (
        <p className="mt-4 text-sm text-slate-600">No tasks match “{query}”.</p>
      )}

      <div className="mt-6">{board}</div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {pendingMoves.map((m) => (
        <StatusMutation
          key={m.key}
          taskId={m.taskId}
          status={m.status}
          onDone={finishMove}
          projectId={projectId}
        />
      ))}

      {viewTask && (
        <ViewTaskModal
          task={viewTask}
          status={statusOf(viewTask)}
          isOwner={isOwner}
          projectId={projectId}
          onClose={() => setViewTaskId(null)}
          onEdit={(t) => {
            setViewTaskId(null);
            setFormState({ task: t });
          }}
        />
      )}
      {isOwner && formState && (
        <TaskFormModal
          task={formState.task}
          defaultStatus={formState.status}
          projectId={projectId}
          onClose={closeAndRefresh(setFormState, null)}
        />
      )}
      {isOwner && membersTask && (
        <TaskMembersModal
          task={membersTask}
          projectId={projectId}
          onClose={closeAndRefresh(setMembersTask, null)}
        />
      )}
      {isOwner && deleteTask && (
        <DeleteTaskModal
          task={deleteTask}
          projectId={projectId}
          onClose={closeAndRefresh(setDeleteTask, null)}
        />
      )}
    </div>
  );
}
