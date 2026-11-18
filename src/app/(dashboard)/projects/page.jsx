"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import useGet from "../../hooks/use-get";
import { usePost } from "../../hooks/use-post";
import { useAuth } from "@/app/context/auth";

const NAME_MAX = 100;
const DESCRIPTION_MAX = 500;

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function formatDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : dateFormatter.format(d);
}

function toList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.projects)) return data.projects;
  if (Array.isArray(data?.data?.projects)) return data.data.projects;
  return [];
}

const idOf = (item) => item?._id ?? item?.id;

function pickObject(data, key) {
  if (!data) return null;
  if (data[key]) return data[key];
  if (data.data?.[key]) return data.data[key];
  if (data.data && !Array.isArray(data.data)) return data.data;
  return data;
}

function isOwnerOf(project, userId) {
  if (typeof project.isOwner === "boolean") return project.isOwner;
  const ownerId =
    typeof project.owner === "string" ? project.owner : idOf(project.owner);
  return !!userId && !!ownerId && ownerId === userId;
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
  "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100";

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />
  );
}

function Icon({ name, className = "h-4 w-4" }) {
  const paths = {
    plus: <path d="M12 5v14M5 12h14" strokeLinecap="round" />,
    edit: (
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" strokeLinejoin="round" />
    ),
    trash: (
      <path
        d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    close: <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />,
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

function Modal({ title, onClose, children, footer, size = "max-w-lg" }) {
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
    panelRef.current?.querySelector("input, textarea, button")?.focus();
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
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2
            id="modal-title"
            className="text-lg font-semibold tracking-tight text-slate-900"
          >
            {title}
          </h2>
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
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          {footer}
        </div>
      </div>
    </div>
  );
}

function EditProjectModal({ project, onClose }) {
  const [form, setForm] = useState({
    name: project.name ?? "",
    description: project.description ?? "",
  });
  const [errors, setErrors] = useState({});

  const handler = usePost({
    url: `/api/v1/project/${idOf(project)}`,
    method: "PATCH",
    title: "Project updated",
    onSuccess: () => onClose(),
    queryKey: "projects",
  });

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {};
    const name = form.name.trim();
    if (!name) next.name = "Enter a project name.";
    else if (name.length > NAME_MAX)
      next.name = `Keep the name under ${NAME_MAX} characters.`;
    if (form.description.trim().length > DESCRIPTION_MAX)
      next.description = `Keep the description under ${DESCRIPTION_MAX} characters.`;
    setErrors(next);
    if (Object.keys(next).length) return;
    handler.mutate({ name, description: form.description.trim() });
  };

  const descriptionLength = form.description.length;

  return (
    <Modal
      title="Edit project"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button
            type="submit"
            form="edit-project-form"
            disabled={handler.isPending}
            className={primaryButton}
          >
            {handler.isPending && <Spinner />}
            {handler.isPending ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      <form
        id="edit-project-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="edit-name"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Project name
          </label>
          <input
            id="edit-name"
            type="text"
            value={form.name}
            onChange={update("name")}
            autoComplete="off"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "edit-name-error" : undefined}
            className={inputClass(errors.name)}
          />
          {errors.name && (
            <p id="edit-name-error" className="mt-1.5 text-sm text-red-600">
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label
              htmlFor="edit-description"
              className="block text-sm font-medium text-slate-700"
            >
              Description{" "}
              <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <span
              aria-live="polite"
              className={`text-xs tabular-nums ${descriptionLength > DESCRIPTION_MAX ? "text-red-600" : "text-slate-500"}`}
            >
              {descriptionLength}/{DESCRIPTION_MAX}
            </span>
          </div>
          <textarea
            id="edit-description"
            rows={5}
            value={form.description}
            onChange={update("description")}
            placeholder="What is this project about?"
            aria-invalid={!!errors.description}
            aria-describedby={
              errors.description ? "edit-description-error" : undefined
            }
            className={`${inputClass(errors.description)} resize-y leading-relaxed`}
          />
          {errors.description && (
            <p
              id="edit-description-error"
              className="mt-1.5 text-sm text-red-600"
            >
              {errors.description}
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}

function DeleteProjectModal({ project, onClose }) {
  const handler = usePost({
    url: "/api/v1/project",
    method: "DELETE",
    title: "Project deleted",
    onSuccess: () => onClose(),
    queryKey: "projects",
  });

  return (
    <Modal
      title="Delete this project?"
      onClose={onClose}
      size="max-w-md"
      footer={
        <>
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handler.mutate({ projectId: idOf(project) })}
            disabled={handler.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {handler.isPending && <Spinner />}
            {handler.isPending ? "Deleting…" : "Delete project"}
          </button>
        </>
      }
    >
      <p className="text-[15px] leading-relaxed text-slate-700">
        “{project.name}” and its tasks will be removed for everyone. This can’t
        be undone.
      </p>
    </Modal>
  );
}

function IconButton({ label, icon, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`relative z-10 rounded-md p-2 text-slate-500 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
        danger
          ? "hover:bg-red-50 hover:text-red-600"
          : "hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <Icon name={icon} />
    </button>
  );
}

function ProjectRow({ project, isOwner, onEdit, onDelete }) {
  const id = idOf(project);
  const initial = project.name?.trim()?.[0]?.toUpperCase() || "P";
  const created = formatDate(project.createdAt);

  return (
    <li className="group relative flex items-start gap-4 px-5 py-5 transition hover:bg-blue-50/50 sm:px-6">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-base font-semibold text-blue-700">
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-semibold text-slate-900">
          <Link
            href={`/projects/${id}`}
            className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-blue-600"
          >
            {project.name}
          </Link>
        </h3>
        {project.description ? (
          <p className="mt-1 line-clamp-2 max-w-prose text-[15px] leading-relaxed text-slate-600">
            {project.description}
          </p>
        ) : (
          <p className="mt-1 text-[15px] italic text-slate-400">
            No description
          </p>
        )}
        {created && (
          <time
            dateTime={project.createdAt}
            className="mt-2 block text-sm text-slate-500"
          >
            Created {created}
          </time>
        )}
      </div>
      <div className="flex shrink-0 items-center">
        {isOwner ? (
          <>
            <IconButton
              label={`Edit ${project.name}`}
              icon="edit"
              onClick={() => onEdit(project)}
            />
            <IconButton
              label={`Delete ${project.name}`}
              icon="trash"
              danger
              onClick={() => onDelete(project)}
            />
          </>
        ) : (
          <span className="mr-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            Member
          </span>
        )}
        <span className="hidden p-2 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-700 motion-reduce:transition-none sm:block">
          <Icon name="arrow" />
        </span>
      </div>
    </li>
  );
}

function AddProjectButton() {
  return (
    <Link href="/create-project" className={primaryButton}>
      <Icon name="plus" />
      Add project
    </Link>
  );
}

function LoadingState() {
  return (
    <ul
      aria-busy="true"
      aria-label="Loading projects"
      className="divide-y divide-slate-200"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="flex gap-4 px-5 py-5 sm:px-6">
          <span className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-slate-200 motion-reduce:animate-none" />
          <div className="flex-1 space-y-2.5 pt-1">
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Page() {
  const { data, isPending, isError, refetch } = useGet(
    "/api/v1/project",
    "projects",
  );
  const { user } = useAuth();
  const userId = user._id || user?.id;

  const [editProject, setEditProject] = useState(null);
  const [deleteProject, setDeleteProject] = useState(null);

  const projects = [...toList(data)].sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime(),
  );

  let content;
  if (isPending) content = <LoadingState />;
  else if (isError)
    content = (
      <div role="alert" className="px-6 py-14 text-center">
        <h2 className="text-base font-semibold text-slate-900">
          Projects couldn’t be loaded
        </h2>
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
  else if (!projects.length)
    content = (
      <div className="px-6 py-16 text-center">
        <h2 className="text-base font-semibold text-slate-900">
          No projects yet
        </h2>
        <p className="mt-1 text-[15px] text-slate-600">
          Create your first project to get started.
        </p>
        <div className="mt-6">
          <AddProjectButton />
        </div>
      </div>
    );
  else
    content = (
      <ul className="divide-y divide-slate-200">
        {projects.map((project, i) => (
          <ProjectRow
            key={idOf(project) ?? i}
            project={project}
            isOwner={isOwnerOf(project, userId)}
            onEdit={setEditProject}
            onDelete={setDeleteProject}
          />
        ))}
      </ul>
    );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Your projects
          </h2>
          <p className="mt-1 text-[15px] text-slate-600">
            {!isPending && !isError && projects.length
              ? `${projects.length} ${projects.length === 1 ? "project" : "projects"}, newest first`
              : "All your projects in one place"}
          </p>
        </div>
        <AddProjectButton />
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {content}
      </section>

      {editProject && isOwnerOf(editProject, userId) && (
        <EditProjectModal
          project={editProject}
          onClose={() => {
            setEditProject(null);
            refetch();
          }}
        />
      )}
      {deleteProject && isOwnerOf(deleteProject, userId) && (
        <DeleteProjectModal
          project={deleteProject}
          onClose={() => {
            setDeleteProject(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
