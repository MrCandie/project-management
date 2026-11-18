"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useGet from "@/app/hooks/use-get";
import { usePost } from "@/app/hooks/use-post";
import { useAuth } from "@/app/context/auth";
import { usePatch } from "@/app/hooks/use-patch";

const STATUSES = [
  {
    value: "pending",
    label: "Pending",
    badge: "bg-amber-50 text-amber-800 ring-amber-200",
    dot: "bg-amber-500",
  },
  {
    value: "ongoing",
    label: "Ongoing",
    badge: "bg-blue-50 text-blue-800 ring-blue-200",
    dot: "bg-blue-600",
  },
  {
    value: "completed",
    label: "Completed",
    badge: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    dot: "bg-emerald-600",
  },
  {
    value: "overdue",
    label: "Overdue",
    badge: "bg-red-50 text-red-800 ring-red-200",
    dot: "bg-red-600",
  },
];

const PRIORITIES = [
  { value: "low", label: "Low", className: "text-slate-600" },
  { value: "medium", label: "Medium", className: "text-amber-700" },
  { value: "high", label: "High", className: "text-red-700" },
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
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3.5 6.5 8.5 6.5 8.5-6.5" strokeLinejoin="round" />
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
    back: (
      <path d="m15 5-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    ),
    arrow: (
      <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
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
      className={`rounded-md p-2 text-slate-500 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
        danger
          ? "hover:bg-red-50 hover:text-red-600"
          : "hover:bg-slate-100 hover:text-slate-900"
      } ${className}`}
    >
      <Icon name={icon} />
    </button>
  );
}

function TaskFormModal({ task, projectId, onClose }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task ? taskName(task) : "",
    description: task?.description ?? "",
    startDate: toInputDate(task?.startDate),
    endDate: toInputDate(task?.endDate),
    priority: task?.priority ?? "medium",
    status: task?.status ?? "pending",
  });
  const [errors, setErrors] = useState({});

  const handler = usePost({
    url: isEdit ? `/api/v1/task/${idOf(task)}` : "/api/v1/task",
    method: isEdit ? "PATCH" : "POST",
    title: isEdit ? "Task updated" : "Task created",
    onSuccess: () => onClose(),
    queryKey: "tasks",
  });

  const editHandler = usePatch({
    url: `/api/v1/task/${idOf(task)}`,
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

    if (isEdit) {
      editHandler.mutate({
        title: form.title.trim(),
        description: form.description.trim(),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        priority: form.priority,
        status: form.status,
        projectId,
      });
    } else {
      handler.mutate({
        title: form.title.trim(),
        description: form.description.trim(),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        priority: form.priority,
        status: form.status,
        projectId,
      });
    }
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
            disabled={handler.isPending || editHandler.isPending}
            className={primaryButton}
          >
            {(handler.isPending || editHandler.isPending) && <Spinner />}
            {isEdit
              ? handler.isPending || editHandler.isPending
                ? "Saving…"
                : "Save changes"
              : handler.isPending || editHandler.isPending
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

function TaskHistory({ history }) {
  const entries = [...(history ?? [])]
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));

  if (!entries.length) {
    return (
      <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
        No activity recorded yet.
      </p>
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

function ViewTaskModal({ task, isOwner, onClose, onEdit, projectId }) {
  const priority = priorityMeta(task.priority);
  const members = (task.members ?? []).filter(
    (m) => m && typeof m === "object",
  );
  const start = formatDate(task.startDate);
  const end = formatDate(task.endDate);

  const { data } = useGet(
    `/api/v1/task/${task._id}/history?projectId=${projectId}`,
    "task_history" + task._id,
  );

  const history = data?.data || [];

  const details = [
    { label: "Start date", value: start || "Not set" },
    { label: "End date", value: end || "Not set" },
    {
      label: "Priority",
      value: priority ? priority.label : "Not set",
      className: priority?.className,
    },
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
          <StatusBadge status={task.status} />
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
              <dd
                className={`mt-0.5 text-[15px] font-medium ${d.className ?? "text-slate-900"}`}
              >
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
          </h3>
          <TaskHistory history={history} />
        </section>
      </div>
    </Modal>
  );
}

function StatusSelect({ task, projectId }) {
  const [optimistic, setOptimistic] = useState(null);
  const handler = usePost({
    url: `/api/v1/task/${idOf(task)}/status`,
    method: "POST",
    title: "Status updated",
    onSuccess: () => setOptimistic(null),
    queryKey: "tasks",
  });

  useEffect(() => {
    if (handler.isError) setOptimistic(null);
  }, [handler.isError]);

  const value = optimistic ?? task.status ?? "pending";
  const meta = statusMeta(value);

  const onChange = (e) => {
    const next = e.target.value;
    if (next === value) return;
    setOptimistic(next);
    handler.mutate({ status: next, projectId });
  };

  return (
    <div
      className={`relative inline-flex items-center rounded-full ring-1 ring-inset ${meta.badge}`}
    >
      <span
        className={`pointer-events-none absolute left-2.5 h-2 w-2 rounded-full ${meta.dot}`}
      />
      <select
        value={value}
        onChange={onChange}
        disabled={handler.isPending}
        aria-label={`Status for ${taskName(task)}`}
        className="cursor-pointer appearance-none rounded-full bg-transparent py-1 pl-6 pr-7 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-wait"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
        className="pointer-events-none absolute right-2 h-3.5 w-3.5 opacity-70"
      >
        <path d="M5.2 7.7a.75.75 0 0 1 1.06.02L10 11.6l3.74-3.88a.75.75 0 1 1 1.08 1.04l-4.28 4.44a.75.75 0 0 1-1.08 0L5.18 8.76a.75.75 0 0 1 .02-1.06Z" />
      </svg>
    </div>
  );
}

function MemberStack({ members }) {
  const list = members ?? [];
  if (!list.length)
    return <span className="text-sm text-slate-500">No members</span>;
  const populated = list.filter((m) => typeof m === "object" && m);
  if (!populated.length)
    return (
      <span className="text-sm text-slate-600">
        {list.length} {list.length === 1 ? "member" : "members"}
      </span>
    );
  const shown = populated.slice(0, 4);
  const extra = list.length - shown.length;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((m) => (
          <span
            key={idOf(m)}
            title={memberName(m)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[11px] font-semibold text-blue-700 ring-2 ring-white"
          >
            {initials(m)}
          </span>
        ))}
      </div>
      {extra > 0 && (
        <span className="ml-2 text-sm text-slate-600">+{extra}</span>
      )}
    </div>
  );
}

function TaskDates({ task }) {
  const start = formatDate(task.startDate);
  const end = formatDate(task.endDate);
  if (!start && !end) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon name="calendar" className="h-4 w-4 text-slate-400" />
      {start && end
        ? `${start} – ${end}`
        : start
          ? `Starts ${start}`
          : `Due ${end}`}
    </span>
  );
}

function TaskRow({
  task,
  isOwner,
  onView,
  onEdit,
  onMembers,
  onDelete,
  projectId,
}) {
  const priority = priorityMeta(task.priority);

  return (
    <li className="px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-900">
            <button
              type="button"
              onClick={() => onView(task)}
              className="text-left hover:text-blue-700 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {taskName(task)}
            </button>
          </h3>
          {task.description && (
            <p className="mt-1 line-clamp-2 max-w-prose text-[15px] leading-relaxed text-slate-600">
              {task.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
            <TaskDates task={task} />
            {priority && (
              <span className={`font-medium ${priority.className}`}>
                {priority.label} priority
              </span>
            )}
            <MemberStack members={task.members} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end sm:gap-3">
          <StatusSelect projectId={projectId} task={task} />
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
    </li>
  );
}

function ListSkeleton({ label, rows = 4 }) {
  return (
    <ul
      aria-busy="true"
      aria-label={label}
      className="divide-y divide-slate-200"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="space-y-3 px-5 py-5 sm:px-6">
          <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
          <div className="h-3.5 w-2/3 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
        </li>
      ))}
    </ul>
  );
}

function ProjectTasks({ projectId, projectName, isOwner }) {
  const { data, isPending, isError, refetch } = useGet(
    `/api/v1/task?projectId=${projectId}`,
    "tasks" + projectId,
  );

  const [filter, setFilter] = useState("all");
  const [viewTaskId, setViewTaskId] = useState(null);
  const [formTask, setFormTask] = useState(undefined);
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

  const viewTask = viewTaskId
    ? tasks.find((t) => idOf(t) === viewTaskId)
    : null;

  const counts = useMemo(() => {
    const c = { all: tasks.length };
    for (const s of STATUSES)
      c[s.value] = tasks.filter(
        (t) => (t.status ?? "pending") === s.value,
      ).length;
    return c;
  }, [tasks]);

  const visible =
    filter === "all"
      ? tasks
      : tasks.filter((t) => (t.status ?? "pending") === filter);

  const closeAndRefresh = (setter, value) => () => {
    setter(value);
    refetch();
  };

  const newTaskButton = isOwner ? (
    <button
      type="button"
      onClick={() => setFormTask(null)}
      className={primaryButton}
    >
      <Icon name="plus" />
      New task
    </button>
  ) : null;

  let content;
  if (isPending) content = <ListSkeleton label="Loading tasks" />;
  else if (isError)
    content = (
      <div role="alert" className="px-6 py-14 text-center">
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
    content = (
      <div className="px-6 py-16 text-center">
        <h3 className="text-base font-semibold text-slate-900">No tasks yet</h3>
        <p className="mt-1 text-[15px] text-slate-600">
          {isOwner
            ? `Add the first task for ${projectName ?? "this project"}.`
            : "The project owner hasn’t added any tasks yet."}
        </p>
        {newTaskButton && <div className="mt-6">{newTaskButton}</div>}
      </div>
    );
  else if (!visible.length)
    content = (
      <p className="px-6 py-14 text-center text-[15px] text-slate-600">
        No {statusMeta(filter).label.toLowerCase()} tasks.
      </p>
    );
  else
    content = (
      <ul className="divide-y divide-slate-200">
        {visible.map((task) => (
          <TaskRow
            key={idOf(task)}
            task={task}
            isOwner={isOwner}
            onView={(t) => setViewTaskId(idOf(t))}
            onEdit={setFormTask}
            onMembers={setMembersTask}
            onDelete={setDeleteTask}
            projectId={projectId}
          />
        ))}
      </ul>
    );

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[15px] text-slate-600">
          {counts.all
            ? `${counts.all} ${counts.all === 1 ? "task" : "tasks"}`
            : "Plan and track the work for this project"}
        </p>
        {newTaskButton}
      </div>

      {tasks.length > 0 && (
        <div
          role="tablist"
          aria-label="Filter by status"
          className="mt-5 flex gap-1 overflow-x-auto"
        >
          {[{ value: "all", label: "All" }, ...STATUSES].map((s) => {
            const active = filter === s.value;
            return (
              <button
                key={s.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(s.value)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  active
                    ? "bg-blue-700 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {s.label}
                <span
                  className={`text-xs tabular-nums ${active ? "text-blue-100" : "text-slate-500"}`}
                >
                  {counts[s.value]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {content}
      </section>

      {viewTask && (
        <ViewTaskModal
          task={viewTask}
          projectId={projectId}
          isOwner={isOwner}
          onClose={() => setViewTaskId(null)}
          onEdit={(t) => {
            setViewTaskId(null);
            setFormTask(t);
          }}
        />
      )}
      {isOwner && formTask !== undefined && (
        <TaskFormModal
          task={formTask}
          projectId={projectId}
          onClose={closeAndRefresh(setFormTask, undefined)}
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_INVITES = 10;

let rowCounter = 0;
const newRow = () => ({ key: `row-${++rowCounter}`, email: "", error: "" });

function InviteModal({ projectId, existingEmails, onClose }) {
  const [rows, setRows] = useState(() => [newRow()]);
  const listRef = useRef(null);

  const handler = usePost({
    url: `/api/v1/project/${projectId}/invite`,
    method: "POST",
    title: "Invites sent",
    onSuccess: () => onClose(),
    queryKey: "project",
  });

  const setEmail = (key, email) =>
    setRows((rs) =>
      rs.map((r) => (r.key === key ? { ...r, email, error: "" } : r)),
    );

  const addRow = () => {
    if (rows.length >= MAX_INVITES) return;
    setRows((rs) => [...rs, newRow()]);
    requestAnimationFrame(() => {
      const inputs = listRef.current?.querySelectorAll("input");
      inputs?.[inputs.length - 1]?.focus();
    });
  };

  const removeRow = (key) =>
    setRows((rs) =>
      rs.length === 1 ? [newRow()] : rs.filter((r) => r.key !== key),
    );

  const handleSubmit = (e) => {
    e.preventDefault();
    const seen = new Set();
    const filled = rows.filter((r) => r.email.trim() || rows.length === 1);
    const checked = filled.map((r) => {
      const email = r.email.trim().toLowerCase();
      let error = "";
      if (!email) error = "Enter an email address.";
      else if (!EMAIL_PATTERN.test(email))
        error = "Enter a valid email address, like name@company.com.";
      else if (existingEmails.has(email))
        error = "This person is already a member.";
      else if (seen.has(email)) error = "This email is already in the list.";
      seen.add(email);
      return { ...r, email: r.email.trim(), error };
    });
    setRows(checked.length ? checked : [newRow()]);
    if (!checked.length || checked.some((r) => r.error)) return;
    handler.mutate({ members: checked.map((r) => r.email.toLowerCase()) });
  };

  const validCount = rows.filter((r) =>
    EMAIL_PATTERN.test(r.email.trim()),
  ).length;

  return (
    <Modal
      title="Invite members"
      description="They’ll get an email invite to join this project."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button
            type="submit"
            form="invite-form"
            disabled={handler.isPending}
            className={primaryButton}
          >
            {handler.isPending && <Spinner />}
            {handler.isPending
              ? "Sending…"
              : validCount > 1
                ? `Send ${validCount} invites`
                : "Send invite"}
          </button>
        </>
      }
    >
      <form id="invite-form" onSubmit={handleSubmit} noValidate>
        <ul ref={listRef} className="space-y-3">
          {rows.map((row, i) => (
            <li key={row.key}>
              <label htmlFor={row.key} className="sr-only">
                Email {i + 1}
              </label>
              <div className="flex items-start gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-3 text-slate-400">
                    <Icon name="mail" />
                  </span>
                  <input
                    id={row.key}
                    type="email"
                    inputMode="email"
                    autoComplete="off"
                    value={row.email}
                    onChange={(e) => setEmail(row.key, e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        i === rows.length - 1 &&
                        row.email.trim() &&
                        rows.length < MAX_INVITES
                      ) {
                        e.preventDefault();
                        addRow();
                      }
                    }}
                    placeholder="name@company.com"
                    aria-invalid={!!row.error}
                    aria-describedby={
                      row.error ? `${row.key}-error` : undefined
                    }
                    className={`${inputClass(row.error)} pl-9`}
                  />
                </div>
                <IconButton
                  label={`Remove email ${i + 1}`}
                  icon="close"
                  onClick={() => removeRow(row.key)}
                  className="mt-1"
                />
              </div>
              {row.error && (
                <p
                  id={`${row.key}-error`}
                  className="mt-1.5 text-sm text-red-600"
                >
                  {row.error}
                </p>
              )}
            </li>
          ))}
        </ul>
        {rows.length < MAX_INVITES ? (
          <button
            type="button"
            onClick={addRow}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Icon name="plus" />
            Add another email
          </button>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            You can invite up to {MAX_INVITES} people at a time.
          </p>
        )}
      </form>
    </Modal>
  );
}

function MemberTasksModal({ member, projectId, onClose }) {
  const userId = idOf(member);
  const { data, isPending, isError, refetch } = useGet(
    `/api/v1/task/user/${userId}?projectId=${projectId}`,
    `user-tasks-${userId}-${projectId}`,
  );

  const tasks = useMemo(() => {
    const list = toList(data, "tasks");
    return list.filter((t) => !t.project || idOf(t.project) === projectId);
  }, [data, projectId]);

  let body;
  if (isPending) body = <ListSkeleton label="Loading tasks" rows={3} />;
  else if (isError)
    body = (
      <div role="alert" className="py-8 text-center">
        <p className="text-[15px] text-slate-700">Tasks couldn’t be loaded.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className={`${secondaryButton} mt-4`}
        >
          Try again
        </button>
      </div>
    );
  else if (!tasks.length)
    body = (
      <p className="py-8 text-center text-[15px] text-slate-600">
        {memberName(member) || "This member"} isn’t assigned to any tasks in
        this project.
      </p>
    );
  else
    body = (
      <ul className="-mx-5 divide-y divide-slate-100 sm:-mx-6">
        {tasks.map((task) => (
          <li key={idOf(task)} className="px-5 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-slate-900">
                  {taskName(task)}
                </p>
                {task.description && (
                  <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">
                    {task.description}
                  </p>
                )}
                <div className="mt-2 text-sm text-slate-600">
                  <TaskDates task={task} />
                </div>
              </div>
              <StatusBadge status={task.status} />
            </div>
          </li>
        ))}
      </ul>
    );

  return (
    <Modal
      title={memberName(member) || "Member"}
      description={member.email}
      onClose={onClose}
      size="max-w-xl"
    >
      <h3 className="mb-3 text-sm font-medium text-slate-700">
        Assigned tasks
        {!isPending && !isError && tasks.length ? ` (${tasks.length})` : ""}
      </h3>
      {body}
    </Modal>
  );
}

function RemoveMemberModal({ member, projectId, projectName, onClose }) {
  const handler = usePost({
    url: `/api/v1/project/${projectId}/remove-user`,
    method: "POST",
    title: "Member removed",
    onSuccess: () => onClose(),
    queryKey: "project",
  });

  return (
    <Modal
      title="Remove this member?"
      onClose={onClose}
      size="max-w-md"
      footer={
        <>
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handler.mutate({ userId: idOf(member) })}
            disabled={handler.isPending}
            className={dangerButton}
          >
            {handler.isPending && <Spinner />}
            {handler.isPending ? "Removing…" : "Remove member"}
          </button>
        </>
      }
    >
      <p className="text-[15px] leading-relaxed text-slate-700">
        {memberName(member) || "This person"} will lose access to{" "}
        {projectName ?? "this project"} and its tasks. You can invite them again
        later.
      </p>
    </Modal>
  );
}

function MembersTab({ project, projectId, isOwner }) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [viewMember, setViewMember] = useState(null);
  const [removeMember, setRemoveMember] = useState(null);

  const { data, isPending, isError, refetch } = useGet(
    `/api/v1/project/${projectId}/members`,
    "members" + projectId,
  );

  const ownerId = idOf(project.owner);
  const members = useMemo(
    () =>
      toList(data, "members", "users").filter(
        (m) => m && typeof m === "object",
      ),
    [data],
  );

  const existingEmails = useMemo(
    () => new Set(members.map((m) => m.email?.toLowerCase()).filter(Boolean)),
    [members],
  );

  const sorted = [...members].sort((a, b) => {
    if (idOf(a) === ownerId) return -1;
    if (idOf(b) === ownerId) return 1;
    return memberName(a).localeCompare(memberName(b));
  });

  let content;
  if (isPending) content = <ListSkeleton label="Loading members" rows={3} />;
  else if (isError)
    content = (
      <div role="alert" className="px-6 py-14 text-center">
        <h3 className="text-base font-semibold text-slate-900">
          Members couldn’t be loaded
        </h3>
        <button
          type="button"
          onClick={() => refetch()}
          className={`${secondaryButton} mt-5`}
        >
          Try again
        </button>
      </div>
    );
  else if (!sorted.length)
    content = (
      <div className="px-6 py-16 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
          <Icon name="users" className="h-6 w-6" />
        </span>
        <h3 className="mt-4 text-base font-semibold text-slate-900">
          No members yet
        </h3>
        <p className="mt-1 text-[15px] text-slate-600">
          {isOwner
            ? "Invite teammates by email to start sharing tasks."
            : "The project owner hasn’t invited anyone yet."}
        </p>
      </div>
    );
  else
    content = (
      <ul className="divide-y divide-slate-200">
        {sorted.map((member) => {
          const id = idOf(member);
          const memberIsOwner = id === ownerId;
          const name = memberName(member) || "Unnamed user";
          return (
            <li
              key={id}
              className="group relative flex items-center gap-4 px-5 py-4 transition hover:bg-blue-50/50 sm:px-6"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {initials(member)}
              </span>
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setViewMember(member)}
                  className="block max-w-full truncate text-left text-[15px] font-semibold text-slate-900 after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-blue-600"
                >
                  {name}
                </button>
                {member.email && (
                  <p className="truncate text-sm text-slate-500">
                    {member.email}
                  </p>
                )}
              </div>
              {memberIsOwner && (
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  Owner
                </span>
              )}
              {isOwner && !memberIsOwner && (
                <IconButton
                  label={`Remove ${name}`}
                  icon="trash"
                  danger
                  onClick={() => setRemoveMember(member)}
                  className="relative z-10"
                />
              )}
              <span className="hidden text-slate-400 transition group-hover:text-blue-700 sm:block">
                <Icon name="arrow" />
              </span>
            </li>
          );
        })}
      </ul>
    );

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[15px] text-slate-600">
          {members.length
            ? `${members.length} ${members.length === 1 ? "member" : "members"}. Select someone to see their tasks.`
            : isOwner
              ? "Invite people to work on this project with you."
              : "People working on this project."}
        </p>
        {isOwner && (
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className={primaryButton}
          >
            <Icon name="plus" />
            Invite members
          </button>
        )}
      </div>

      <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {content}
      </section>

      {isOwner && inviteOpen && (
        <InviteModal
          projectId={projectId}
          existingEmails={existingEmails}
          onClose={() => {
            setInviteOpen(false);
            refetch();
          }}
        />
      )}
      {viewMember && (
        <MemberTasksModal
          member={viewMember}
          projectId={projectId}
          onClose={() => setViewMember(null)}
        />
      )}
      {isOwner && removeMember && (
        <RemoveMemberModal
          member={removeMember}
          projectId={projectId}
          projectName={project.name}
          onClose={() => {
            setRemoveMember(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

export default function ProjectPage() {
  const { id: projectId } = useParams();
  const { data, isPending, isError, refetch } = useGet(
    `/api/v1/project/${projectId}`,
    "project" + projectId,
  );
  const { user } = useAuth();
  const [tab, setTab] = useState("members");

  const project = pickObject(data, "project");
  const me = user;
  const isOwner =
    typeof project?.isOwner === "boolean"
      ? project.isOwner
      : !!idOf(me) && !!project && idOf(me) === idOf(project.owner);

  const backLink = (
    <Link
      href="/projects"
      className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-slate-600 transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      <Icon name="back" />
      All projects
    </Link>
  );

  if (isPending) {
    return (
      <div className="mx-auto max-w-5xl" aria-busy="true">
        {backLink}
        <div className="mt-6 h-8 w-1/3 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
        <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
        <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="mx-auto max-w-5xl">
        {backLink}
        <div role="alert" className="mt-10 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            This project couldn’t be loaded
          </h2>
          <p className="mt-1 text-[15px] text-slate-600">
            It may have been deleted, or your connection dropped.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className={`${secondaryButton} mt-5`}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const memberCount = (project.members ?? []).length;
  const created = formatDate(project.createdAt);
  const tabs = [
    { key: "members", label: "Members", count: memberCount },
    { key: "tasks", label: "Tasks" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      {backLink}

      <header className="mt-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
            {project.name}
          </h2>
          {!isOwner && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              Member
            </span>
          )}
        </div>
        {project.description ? (
          <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-slate-600">
            {project.description}
          </p>
        ) : (
          <p className="mt-2 text-[15px] italic text-slate-400">
            No description
          </p>
        )}
        {created && (
          <p className="mt-3 text-sm text-slate-500">Created {created}</p>
        )}
      </header>

      <div
        role="tablist"
        aria-label="Project sections"
        className="mt-8 flex gap-1 border-b border-slate-200"
      >
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              id={`tab-${t.key}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${t.key}`}
              onClick={() => setTab(t.key)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-[15px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 ${
                active
                  ? "border-blue-700 text-blue-700"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs tabular-nums ${
                    active
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        id={`panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="mt-6"
      >
        {tab === "members" ? (
          <MembersTab
            project={project}
            projectId={projectId}
            isOwner={isOwner}
          />
        ) : (
          <ProjectTasks
            projectId={projectId}
            projectName={project.name}
            isOwner={isOwner}
          />
        )}
      </div>
    </div>
  );
}
