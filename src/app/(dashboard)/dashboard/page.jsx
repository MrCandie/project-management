"use client";

import { useMemo } from "react";
import Link from "next/link";
import useGet from "../../hooks/use-get";
import { useProject } from "../../context/project";
import { useAuth } from "@/app/context/auth";

const STATUSES = [
  {
    value: "pending",
    label: "Pending",
    dot: "bg-amber-500",
    bar: "bg-amber-400",
  },
  {
    value: "ongoing",
    label: "Ongoing",
    dot: "bg-blue-600",
    bar: "bg-blue-600",
  },
  {
    value: "completed",
    label: "Completed",
    dot: "bg-emerald-600",
    bar: "bg-emerald-500",
  },
  { value: "overdue", label: "Overdue", dot: "bg-red-600", bar: "bg-red-500" },
];

const statusMeta = (value) =>
  STATUSES.find((s) => s.value === value) ?? STATUSES[0];

const shortDate = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});
const longDate = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const DAY = 24 * 60 * 60 * 1000;

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

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function dueLabel(value) {
  const today = startOfToday();
  const due = new Date(value);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / DAY);
  if (diff < 0) return { text: `${Math.abs(diff)}d late`, late: true };
  if (diff === 0) return { text: "Due today", late: false };
  if (diff === 1) return { text: "Due tomorrow", late: false };
  return { text: `Due ${shortDate.format(due)}`, late: false };
}

function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    folder: (
      <path
        d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7.5Z"
        strokeLinejoin="round"
      />
    ),
    tasks: (
      <>
        <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
        <path
          d="m8 12.5 2.5 2.5L16 9.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path
          d="m8.5 12.5 2.5 2.5 4.5-5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
    alert: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 8v4.5M12 16h.01" strokeLinecap="round" />
      </>
    ),
    arrow: (
      <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    ),
    plus: <path d="M12 5v14M5 12h14" strokeLinecap="round" />,
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

function Panel({ title, action, children, className = "" }) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}
    >
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function PanelLink({ href, children }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded text-sm font-medium text-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      {children}
      <Icon name="arrow" className="h-4 w-4" />
    </Link>
  );
}

function StatCard({ label, value, hint, icon, tone, loading }) {
  const tones = {
    blue: "bg-blue-100 text-blue-700",
    emerald: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}
        >
          <Icon name={icon} />
        </span>
      </div>
      {loading ? (
        <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
      ) : (
        <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-slate-900">
          {value}
        </p>
      )}
      {hint && (
        <p className="mt-1 text-sm text-slate-500">
          {loading ? "\u00a0" : hint}
        </p>
      )}
    </div>
  );
}

function RowsSkeleton({ rows = 4 }) {
  return (
    <ul aria-busy="true" className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="space-y-2 px-5 py-4">
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
          <div className="h-3.5 w-1/4 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
        </li>
      ))}
    </ul>
  );
}

function ErrorRow({ what, onRetry }) {
  return (
    <div role="alert" className="px-5 py-10 text-center">
      <p className="text-[15px] text-slate-700">{what} couldn’t be loaded.</p>
      <button
        type="button"
        onClick={() => onRetry()}
        className="mt-3 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
      >
        Try again
      </button>
    </div>
  );
}

function EmptyRow({ title, body, children }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-[15px] font-medium text-slate-900">{title}</p>
      {body && <p className="mt-1 text-sm text-slate-600">{body}</p>}
      {children}
    </div>
  );
}

function StatusBreakdown({ counts, total }) {
  return (
    <div className="px-5 py-5">
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100"
        role="img"
        aria-label={STATUSES.map((s) => `${s.label}: ${counts[s.value]}`).join(
          ", ",
        )}
      >
        {total > 0 &&
          STATUSES.map((s) =>
            counts[s.value] ? (
              <span
                key={s.value}
                className={`${s.bar} h-full`}
                style={{ width: `${(counts[s.value] / total) * 100}%` }}
              />
            ) : null,
          )}
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-4">
        {STATUSES.map((s) => {
          const pct = total ? Math.round((counts[s.value] / total) * 100) : 0;
          return (
            <div key={s.value} className="flex items-start gap-2.5">
              <span
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`}
              />
              <div>
                <dt className="text-sm text-slate-600">{s.label}</dt>
                <dd className="text-lg font-semibold tabular-nums text-slate-900">
                  {counts[s.value]}
                  <span className="ml-1.5 text-sm font-normal text-slate-500">
                    {pct}%
                  </span>
                </dd>
              </div>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

export default function Page() {
  const { activeProject } = useProject();
  const projectId = activeProject?._id;

  const projectsQuery = useGet("/api/v1/project", "projects");
  const tasksQuery = useGet(
    `/api/v1/task?projectId=${projectId}`,
    "tasks" + projectId,
  );
  const { user: me } = useAuth();
  const firstName = me?.firstName;

  const projects = useMemo(
    () =>
      [...toList(projectsQuery.data, "projects")].sort(
        (a, b) =>
          new Date(b.updatedAt ?? b.createdAt ?? 0) -
          new Date(a.updatedAt ?? a.createdAt ?? 0),
      ),
    [projectsQuery.data],
  );

  const tasks = useMemo(() => {
    if (!projectId) return [];
    return toList(tasksQuery.data, "tasks").filter(
      (t) => !t.project || idOf(t.project) === projectId,
    );
  }, [tasksQuery.data, projectId]);

  const stats = useMemo(() => {
    const today = startOfToday();
    const weekAhead = new Date(today.getTime() + 7 * DAY);
    const counts = Object.fromEntries(STATUSES.map((s) => [s.value, 0]));
    const late = [];
    const upcoming = [];

    for (const t of tasks) {
      const status = t.status ?? "pending";
      counts[status] = (counts[status] ?? 0) + 1;
      if (status === "completed") continue;
      const due = t.endDate ? new Date(t.endDate) : null;
      if (status === "overdue" || (due && due < today)) late.push(t);
      else if (due && due <= weekAhead) upcoming.push(t);
    }

    const byDue = (a, b) => new Date(a.endDate ?? 0) - new Date(b.endDate ?? 0);
    late.sort(byDue);
    upcoming.sort(byDue);

    const total = tasks.length;
    const completion = total ? Math.round((counts.completed / total) * 100) : 0;

    return { counts, total, completion, late, upcoming };
  }, [tasks]);

  const attention = [...stats.late, ...stats.upcoming].slice(0, 6);
  const recentTasks = [...tasks]
    .sort(
      (a, b) =>
        new Date(b.updatedAt ?? b.createdAt ?? 0) -
        new Date(a.updatedAt ?? a.createdAt ?? 0),
    )
    .slice(0, 5);

  const tasksLoading = !!projectId && tasksQuery.isPending;

  const noProjectNotice = (
    <EmptyRow
      title="No project selected"
      body="Pick a project to see its tasks here."
    >
      <Link
        href="/projects"
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
      >
        Go to projects
      </Link>
    </EmptyRow>
  );

  let attentionBody;
  if (!projectId) attentionBody = noProjectNotice;
  else if (tasksLoading) attentionBody = <RowsSkeleton />;
  else if (tasksQuery.isError)
    attentionBody = <ErrorRow what="Tasks" onRetry={tasksQuery.refetch} />;
  else if (!attention.length)
    attentionBody = (
      <EmptyRow
        title="You’re all caught up"
        body={
          stats.total
            ? "Nothing is late or due in the next 7 days."
            : "This project has no tasks yet."
        }
      />
    );
  else
    attentionBody = (
      <ul className="divide-y divide-slate-100">
        {attention.map((task) => {
          const due = task.endDate
            ? dueLabel(task.endDate)
            : { text: "Overdue", late: true };
          const meta = statusMeta(task.status);
          return (
            <li key={idOf(task)}>
              <Link
                href="/tasks"
                className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-slate-900">
                    {taskName(task)}
                  </span>
                  <span className="block text-sm text-slate-500">
                    {meta.label}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    due.late
                      ? "bg-red-50 text-red-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {due.text}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    );

  let breakdownBody;
  if (!projectId) breakdownBody = noProjectNotice;
  else if (tasksLoading)
    breakdownBody = (
      <div className="px-5 py-5" aria-busy="true">
        <div className="h-3 w-full animate-pulse rounded-full bg-slate-200 motion-reduce:animate-none" />
        <div className="mt-5 grid grid-cols-2 gap-4">
          {STATUSES.map((s) => (
            <div
              key={s.value}
              className="h-10 animate-pulse rounded bg-slate-100 motion-reduce:animate-none"
            />
          ))}
        </div>
      </div>
    );
  else if (tasksQuery.isError)
    breakdownBody = <ErrorRow what="Tasks" onRetry={tasksQuery.refetch} />;
  else if (!stats.total)
    breakdownBody = (
      <EmptyRow
        title="No tasks yet"
        body="Add tasks to see how work is spread across statuses."
      />
    );
  else
    breakdownBody = (
      <StatusBreakdown counts={stats.counts} total={stats.total} />
    );

  let projectsBody;
  if (projectsQuery.isPending) projectsBody = <RowsSkeleton rows={3} />;
  else if (projectsQuery.isError)
    projectsBody = <ErrorRow what="Projects" onRetry={projectsQuery.refetch} />;
  else if (!projects.length)
    projectsBody = (
      <EmptyRow
        title="No projects yet"
        body="Create a project to start organizing tasks."
      >
        <Link
          href="/create-project"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
        >
          <Icon name="plus" className="h-4 w-4" />
          Add project
        </Link>
      </EmptyRow>
    );
  else
    projectsBody = (
      <ul className="divide-y divide-slate-100">
        {projects.slice(0, 5).map((project) => {
          const id = idOf(project);
          const isActive = id === projectId;
          return (
            <li key={id}>
              <Link
                href={`/projects/${id}`}
                className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-semibold text-blue-700">
                  {project.name?.trim()?.[0]?.toUpperCase() || "P"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-slate-900">
                    {project.name}
                  </span>
                  <span className="block truncate text-sm text-slate-500">
                    {(project.members ?? []).length}{" "}
                    {(project.members ?? []).length === 1
                      ? "member"
                      : "members"}
                  </span>
                </span>
                {isActive && (
                  <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    Active
                  </span>
                )}
                <Icon
                  name="arrow"
                  className="h-4 w-4 shrink-0 text-slate-400"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    );

  let recentBody;
  if (!projectId) recentBody = noProjectNotice;
  else if (tasksLoading) recentBody = <RowsSkeleton rows={3} />;
  else if (tasksQuery.isError)
    recentBody = <ErrorRow what="Tasks" onRetry={tasksQuery.refetch} />;
  else if (!recentTasks.length)
    recentBody = <EmptyRow title="No recent activity" />;
  else
    recentBody = (
      <ul className="divide-y divide-slate-100">
        {recentTasks.map((task) => {
          const meta = statusMeta(task.status);
          const when = task.updatedAt ?? task.createdAt;
          return (
            <li
              key={idOf(task)}
              className="flex items-center gap-3 px-5 py-3.5"
            >
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium text-slate-900">
                  {taskName(task)}
                </span>
                <span className="block text-sm text-slate-500">
                  {meta.label}
                </span>
              </span>
              {when && (
                <span className="shrink-0 text-sm text-slate-500">
                  {shortDate.format(new Date(when))}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    );

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-slate-500">{longDate.format(new Date())}</p>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}
        </h2>
        <p className="text-[15px] text-slate-600">
          {activeProject?.name ? (
            <>
              Here’s where{" "}
              <span className="font-medium text-slate-900">
                {activeProject.name}
              </span>{" "}
              stands today.
            </>
          ) : (
            "Here’s an overview of your work."
          )}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Projects"
          value={projects.length}
          hint="You own or belong to"
          icon="folder"
          tone="blue"
          loading={projectsQuery.isPending}
        />
        <StatCard
          label="Tasks"
          value={projectId ? stats.total : "—"}
          hint={
            projectId
              ? `${stats.counts.ongoing} in progress`
              : "Select a project"
          }
          icon="tasks"
          tone="slate"
          loading={tasksLoading}
        />
        <StatCard
          label="Completion"
          value={projectId ? `${stats.completion}%` : "—"}
          hint={
            projectId
              ? `${stats.counts.completed} of ${stats.total} done`
              : "Select a project"
          }
          icon="check"
          tone="emerald"
          loading={tasksLoading}
        />
        <StatCard
          label="Late"
          value={projectId ? stats.late.length : "—"}
          hint={
            projectId
              ? stats.late.length
                ? "Need attention"
                : "Nothing overdue"
              : "Select a project"
          }
          icon="alert"
          tone="red"
          loading={tasksLoading}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Panel
          title="Needs attention"
          action={projectId && <PanelLink href="/tasks">Open board</PanelLink>}
          className="lg:col-span-3"
        >
          {attentionBody}
        </Panel>
        <Panel title="Tasks by status" className="lg:col-span-2">
          {breakdownBody}
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="Your projects"
          action={
            projects.length > 0 && (
              <PanelLink href="/projects">View all</PanelLink>
            )
          }
        >
          {projectsBody}
        </Panel>
        <Panel title="Recently updated">{recentBody}</Panel>
      </div>
    </div>
  );
}
