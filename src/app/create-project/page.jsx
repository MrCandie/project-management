"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePost } from "../hooks/use-post";

const PROJECTS_PATH = "/projects";
const NAME_MAX = 100;
const DESCRIPTION_MAX = 500;

export default function CreateProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", description: "" });
  const [errors, setErrors] = useState({});

  const createHandler = usePost({
    url: "/api/v1/project",
    title: "Project created",
    onSuccess: () => {
      router.push("/select-project");
    },
    queryKey: "projects",
  });

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    const name = form.name.trim();
    if (!name) next.name = "Enter a project name.";
    else if (name.length > NAME_MAX)
      next.name = `Keep the name under ${NAME_MAX} characters.`;
    if (form.description.trim().length > DESCRIPTION_MAX)
      next.description = `Keep the description under ${DESCRIPTION_MAX} characters.`;
    return next;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;
    createHandler.mutate({
      name: form.name.trim(),
      description: form.description.trim(),
    });
  };

  const isPending = createHandler.isPending;
  const descriptionLength = form.description.length;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
        <Link
          href={PROJECTS_PATH}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-blue-700 focus-visible:outline-none focus-visible:underline"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.83 10l3.94 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z"
              clipRule="evenodd"
            />
          </svg>
          Back to projects
        </Link>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900">
          New project
        </h1>
        <p className="mt-1.5 text-[15px] text-slate-600">
          Give it a name now. You can change the details later.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <div className="space-y-6 px-5 py-6 sm:px-6">
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700"
              >
                Project name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={update("name")}
                maxLength={NAME_MAX + 20}
                autoFocus
                autoComplete="off"
                placeholder="e.g. Website redesign"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
                className={`block w-full rounded-lg border bg-white px-3.5 py-2.5 text-[15px] text-slate-900 placeholder-slate-400 outline-none transition focus:ring-4 ${
                  errors.name
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-300 focus:border-blue-600 focus:ring-blue-100"
                }`}
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-red-600">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-slate-700"
                >
                  Description{" "}
                  <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <span
                  className={`text-xs tabular-nums ${
                    descriptionLength > DESCRIPTION_MAX
                      ? "text-red-600"
                      : "text-slate-500"
                  }`}
                  aria-live="polite"
                >
                  {descriptionLength}/{DESCRIPTION_MAX}
                </span>
              </div>
              <textarea
                id="description"
                name="description"
                rows={5}
                value={form.description}
                onChange={update("description")}
                placeholder="What is this project about?"
                aria-invalid={!!errors.description}
                aria-describedby={
                  errors.description ? "description-error" : undefined
                }
                className={`block w-full resize-y rounded-lg border bg-white px-3.5 py-2.5 text-[15px] leading-relaxed text-slate-900 placeholder-slate-400 outline-none transition focus:ring-4 ${
                  errors.description
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-300 focus:border-blue-600 focus:ring-blue-100"
                }`}
              />
              {errors.description && (
                <p id="description-error" className="text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Link
              href={PROJECTS_PATH}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />
              )}
              {isPending ? "Creating project…" : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
