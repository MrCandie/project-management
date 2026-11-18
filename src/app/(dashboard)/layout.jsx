"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useGet from "../hooks/use-get";
import { useProject } from "../context/project";
import { useAuth } from "../context/auth";

function DashboardIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      {...props}
    >
      <rect x="3.5" y="3.5" width="7" height="9" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
      <rect x="3.5" y="15.5" width="7" height="5" rx="1.5" />
    </svg>
  );
}

function ProjectsIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7.5Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TasksIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      {...props}
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <path
        d="m8 12.5 2.5 2.5L16 9.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M5.2 7.7a.75.75 0 0 1 1.06.02L10 11.6l3.74-3.88a.75.75 0 1 1 1.08 1.04l-4.28 4.44a.75.75 0 0 1-1.08 0L5.18 8.76a.75.75 0 0 1 .02-1.06Z" />
    </svg>
  );
}

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.79 6.8-6.8a1 1 0 0 1 1.4 0Z" />
    </svg>
  );
}

function LogoutIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M14 4.5h3.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H14M10 16l-4-4 4-4M6 12h10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { label: "Projects", href: "/projects", icon: ProjectsIcon },
  { label: "Tasks", href: "/tasks", icon: TasksIcon },
];

function isActive(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`);
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

function userName(user) {
  if (!user) return "";
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.name ||
    user.email ||
    ""
  );
}

function userInitials(user) {
  const name = userName(user);
  if (!name) return "U";
  const parts = name.split(/[\s@]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function useDismiss(open, setOpen, ref) {
  useEffect(() => {
    if (!open) return;
    const onPointer = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        ref.current?.querySelector("[data-trigger]")?.focus();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen, ref]);
}

function moveFocus(e, container) {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
  const items = [...(container?.querySelectorAll("[data-menu-item]") ?? [])];
  if (!items.length) return;
  e.preventDefault();
  const index = items.indexOf(document.activeElement);
  let next = 0;
  if (e.key === "ArrowDown") next = index < 0 ? 0 : (index + 1) % items.length;
  if (e.key === "ArrowUp") next = index <= 0 ? items.length - 1 : index - 1;
  if (e.key === "End") next = items.length - 1;
  items[next].focus();
}

function Logo() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-base font-bold text-blue-700">
        B
      </span>
      <span className="text-base font-semibold tracking-tight text-white">
        Brand
      </span>
    </Link>
  );
}

function ProjectSwitcher({ onSwitched }) {
  const { activeProject, updateProject: setActiveProject } = useProject();
  const { data, isPending, isError, refetch } = useGet(
    "/api/v1/project",
    "projects",
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);
  const panelRef = useRef(null);
  const searchRef = useRef(null);

  useDismiss(open, setOpen, wrapperRef);

  const projects = toList(data, "projects");
  const activeId = idOf(activeProject);
  const q = query.trim().toLowerCase();
  const filtered = q
    ? projects.filter((p) => (p.name ?? "").toLowerCase().includes(q))
    : projects;

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    requestAnimationFrame(() => {
      if (searchRef.current) searchRef.current.focus();
      else panelRef.current?.querySelector("[data-menu-item]")?.focus();
    });
  }, [open]);

  const choose = (project) => {
    console.log(project);
    setActiveProject(project);
    setOpen(false);
    onSwitched?.();
  };

  const closeAndNavigate = () => {
    setOpen(false);
    onSwitched?.();
  };

  const initial = activeProject?.name?.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <div ref={wrapperRef} className="relative px-3">
      <p
        id="project-switcher-label"
        className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wide text-blue-200"
      >
        Project
      </p>
      <button
        type="button"
        data-trigger
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby="project-switcher-label project-switcher-value"
        className="flex w-full items-center gap-2.5 rounded-lg bg-blue-800/60 px-2.5 py-2 text-left text-white ring-1 ring-inset ring-blue-500/50 transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-sm font-semibold text-blue-700">
          {initial}
        </span>
        <span
          id="project-switcher-value"
          className={`min-w-0 flex-1 truncate text-sm font-medium ${activeProject ? "" : "text-blue-100"}`}
        >
          {activeProject?.name ?? "Select a project"}
        </span>
        <ChevronIcon
          className={`h-4 w-4 shrink-0 text-blue-200 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          ref={panelRef}
          onKeyDown={(e) => moveFocus(e, panelRef.current)}
          className="absolute left-3 right-3 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          {projects.length > 5 && (
            <div className="border-b border-slate-100 p-2">
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a project"
                aria-label="Find a project"
                className="block w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}

          <div className="max-h-64 overflow-y-auto py-1">
            {isPending && (
              <p className="px-3 py-3 text-sm text-slate-500">
                Loading projects…
              </p>
            )}
            {isError && (
              <div className="px-3 py-3 text-sm text-slate-700">
                Projects couldn’t be loaded.{" "}
                <button
                  type="button"
                  data-menu-item
                  onClick={() => refetch()}
                  className="font-medium text-blue-700 hover:underline focus-visible:outline-none focus-visible:underline"
                >
                  Try again
                </button>
              </div>
            )}
            {!isPending && !isError && !projects.length && (
              <p className="px-3 py-3 text-sm text-slate-500">
                You don’t have any projects yet.
              </p>
            )}
            {!isPending &&
              !isError &&
              projects.length > 0 &&
              !filtered.length && (
                <p className="px-3 py-3 text-sm text-slate-500">
                  No projects match “{query}”.
                </p>
              )}
            {!isPending && !isError && filtered.length > 0 && (
              <ul role="listbox" aria-label="Projects">
                {filtered.map((project) => {
                  const id = idOf(project);
                  const selected = id === activeId;
                  return (
                    <li key={id} role="option" aria-selected={selected}>
                      <button
                        type="button"
                        data-menu-item
                        onClick={() => choose(project)}
                        className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition focus-visible:outline-none ${
                          selected
                            ? "bg-blue-50 text-blue-800"
                            : "text-slate-800 hover:bg-slate-50 focus-visible:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-semibold ${
                            selected
                              ? "bg-blue-700 text-white"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {project.name?.trim()?.[0]?.toUpperCase() || "P"}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {project.name}
                        </span>
                        {selected && (
                          <CheckIcon className="h-4 w-4 shrink-0 text-blue-700" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-100 py-1">
            <Link
              href="/create-project"
              data-menu-item
              onClick={closeAndNavigate}
              className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
            >
              <PlusIcon className="h-4 w-4" />
              New project
            </Link>
            <Link
              href="/projects"
              data-menu-item
              onClick={closeAndNavigate}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
            >
              <ProjectsIcon className="h-4 w-4" />
              Manage projects
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarNav({ pathname, onNavigate }) {
  return (
    <nav aria-label="Main" className="flex-1 px-3 py-4">
      <ul className="space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                  active
                    ? "bg-white text-blue-700"
                    : "text-blue-100 hover:bg-blue-600 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SidebarFooter({ onLogout }) {
  return (
    <div className="border-t border-blue-600 p-3">
      <button
        type="button"
        onClick={onLogout}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-blue-100 transition hover:bg-blue-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <LogoutIcon className="h-5 w-5 shrink-0" />
        Log out
      </button>
    </div>
  );
}

function SidebarContent({ pathname, onNavigate, onLogout }) {
  return (
    <>
      <div className="pt-2">
        <ProjectSwitcher onSwitched={onNavigate} />
      </div>
      <SidebarNav pathname={pathname} onNavigate={onNavigate} />
      <SidebarFooter onLogout={onLogout} />
    </>
  );
}

function AccountMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const menuRef = useRef(null);

  useDismiss(open, setOpen, ref);

  useEffect(() => {
    if (open)
      requestAnimationFrame(() =>
        menuRef.current?.querySelector("[data-menu-item]")?.focus(),
      );
  }, [open]);

  const name = userName(user);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        data-trigger
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 transition hover:bg-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        {userInitials(user)}
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Account"
          onKeyDown={(e) => moveFocus(e, menuRef.current)}
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          {(name || user?.email) && (
            <div className="border-b border-slate-100 px-4 py-3">
              {name && (
                <p className="truncate text-sm font-semibold text-slate-900">
                  {name}
                </p>
              )}
              {user?.email && user.email !== name && (
                <p className="truncate text-sm text-slate-500">{user.email}</p>
              )}
            </div>
          )}
          <div className="py-1">
            <button
              type="button"
              role="menuitem"
              data-menu-item
              onClick={onLogout}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-red-700 transition hover:bg-red-50 focus-visible:bg-red-50 focus-visible:outline-none"
            >
              <LogoutIcon className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { user } = useAuth();
  const { setActiveProject } = useProject();
  const [mobileOpen, setMobileOpen] = useState(false);

  const current = navItems.find((item) => isActive(pathname, item.href));
  const title = current?.label ?? "Dashboard";

  const logout = () => {
    try {
      localStorage.clear();
    } catch {}
    setActiveProject?.(null);
    setMobileOpen(false);
    router.replace("/");
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-blue-700 lg:flex">
        <div className="flex h-16 items-center px-5">
          <Logo />
        </div>
        <SidebarContent pathname={pathname} onLogout={logout} />
      </aside>

      <div
        className={`fixed inset-0 z-40 lg:hidden ${mobileOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!mobileOpen}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-slate-900/50 transition-opacity motion-reduce:transition-none ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          id="mobile-sidebar"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-blue-700 shadow-xl transition-transform duration-200 motion-reduce:transition-none ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between px-5">
            <Logo />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              tabIndex={mobileOpen ? 0 : -1}
              className="rounded-md p-2 text-blue-100 transition hover:bg-blue-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          {mobileOpen && (
            <SidebarContent
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
              onLogout={logout}
            />
          )}
        </aside>
      </div>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            aria-controls="mobile-sidebar"
            aria-expanded={mobileOpen}
            className="-ml-1 rounded-md p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 lg:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>

          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            {title}
          </h1>

          <div className="ml-auto flex items-center gap-3">
            <AccountMenu user={user} onLogout={logout} />
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
