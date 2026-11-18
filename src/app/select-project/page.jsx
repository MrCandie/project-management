"use client";

import Link from "next/link";
import useGet from "../hooks/use-get";
import { useProject } from "../context/project";
import { useRouter } from "next/navigation";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className="h-4 w-4"
    >
      <path d="M10 4a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4H5a1 1 0 1 1 0-2h4V5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function AddProjectButton() {
  return (
    <Link
      href="/create-project"
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
    >
      <PlusIcon />
      Add project
    </Link>
  );
}

function ProjectRow({ project }) {
  const { updateProject } = useProject();
  const router = useRouter();
  const initial = project.name?.trim()?.[0]?.toUpperCase() || "P";
  return (
    <li
      onClick={() => {
        updateProject(project);
        router.push("/dashboard");
      }}
      className="group cursor-pointer flex gap-4 px-5 py-5 transition hover:bg-blue-50/50 sm:px-6"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-base font-semibold text-blue-700">
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <h2 className="truncate text-base font-semibold text-slate-900">
            {project.name}
          </h2>
          <time
            dateTime={project.createdAt}
            className="shrink-0 text-sm text-slate-500"
          >
            Created {formatDate(project.createdAt)}
          </time>
        </div>
        {project.description ? (
          <p className="mt-1 line-clamp-2 max-w-prose text-[15px] leading-relaxed text-slate-600">
            {project.description}
          </p>
        ) : (
          <p className="mt-1 text-[15px] italic text-slate-400">
            No description
          </p>
        )}
      </div>
    </li>
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

function ErrorState({ onRetry }) {
  return (
    <div role="alert" className="px-6 py-14 text-center">
      <h2 className="text-base font-semibold text-slate-900">
        Projects couldn’t be loaded
      </h2>
      <p className="mt-1 text-[15px] text-slate-600">
        Check your connection, then try again.
      </p>
      <button
        type="button"
        onClick={() => onRetry()}
        className="mt-5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
      >
        Try again
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-16 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
        <PlusIcon />
      </span>
      <h2 className="mt-4 text-base font-semibold text-slate-900">
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
}

export default function Page() {
  const { data, isPending, isError, refetch } = useGet(
    "/api/v1/project",
    "projects",
  );

  const projects = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.projects)
        ? data.projects
        : [];

  const sorted = [...projects].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  let content;
  if (isPending) content = <LoadingState />;
  else if (isError) content = <ErrorState onRetry={refetch} />;
  else if (!sorted.length) content = <EmptyState />;
  else
    content = (
      <ul className="divide-y divide-slate-200">
        {sorted.map((project, i) => (
          <ProjectRow key={project.id ?? project._id ?? i} project={project} />
        ))}
      </ul>
    );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Projects
            </h1>
            <p className="mt-1.5 text-[15px] text-slate-600">
              {!isPending && !isError && sorted.length
                ? `${sorted.length} ${sorted.length === 1 ? "project" : "projects"}, newest first`
                : "All your projects in one place"}
            </p>
          </div>
          <AddProjectButton />
        </header>

        <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {content}
        </section>
      </div>
    </main>
  );
}
