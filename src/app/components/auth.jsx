"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePost } from "../hooks/use-post";
import { useAuth } from "../context/auth";

function Field({
  label,
  id,
  type = "text",
  value,
  onChange,
  error,
  autoComplete,
  children,
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`block w-full rounded-lg border bg-white px-3.5 py-2.5 text-[15px] text-slate-900 placeholder-slate-400 outline-none transition focus:ring-4 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
              : "border-slate-300 focus:border-blue-600 focus:ring-blue-100"
          } ${children ? "pr-16" : ""}`}
        />
        {children}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordField({ id, value, onChange, error, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field
      label="Password"
      id={id}
      type={visible ? "text" : "password"}
      value={value}
      onChange={onChange}
      error={error}
      autoComplete={autoComplete}
    >
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex items-center px-3.5 text-sm font-medium text-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:underline"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? "Hide" : "Show"}
      </button>
    </Field>
  );
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const { login } = useAuth();

  const loginHandler = usePost({
    url: "/api/v1/auth/login",
    title: "Login Successful",
    onSuccess: (data) => {
      router.push("/select-project");
      console.log(data?.data?.token);
      login(data?.data?.user, data?.data?.token);
    },
    queryKey: "",
  });

  const signupHandler = usePost({
    url: "/api/v1/auth/signup",
    title: "Signup Successful",
    onSuccess: (data) => {
      router.push("/create-project");
      setMode("login");

      setLoginForm({ email: signupForm.email, password: "" });
      login(data?.data?.user, data?.data?.token);
    },
    queryKey: "",
  });

  const isLogin = mode === "login";
  const isPending = isLogin ? loginHandler.isPending : signupHandler.isPending;

  const switchMode = (next) => {
    setMode(next);
    setErrors({});
  };

  const updateLogin = (key) => (e) => {
    setLoginForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const updateSignup = (key) => (e) => {
    setSignupForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validateLogin = () => {
    const next = {};
    if (!emailPattern.test(loginForm.email.trim()))
      next.email = "Enter a valid email address.";
    if (!loginForm.password) next.password = "Enter your password.";
    return next;
  };

  const validateSignup = () => {
    const next = {};
    if (!signupForm.firstName.trim()) next.firstName = "Enter your first name.";
    if (!signupForm.lastName.trim()) next.lastName = "Enter your last name.";
    if (!emailPattern.test(signupForm.email.trim()))
      next.email = "Enter a valid email address.";
    if (signupForm.password.length < 8)
      next.password = "Use at least 8 characters.";
    return next;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = isLogin ? validateLogin() : validateSignup();
    setErrors(next);
    if (Object.keys(next).length) return;

    if (isLogin) {
      loginHandler.mutate({
        email: loginForm.email.trim(),
        password: loginForm.password,
      });
    } else {
      signupHandler.mutate({
        firstName: signupForm.firstName.trim(),
        lastName: signupForm.lastName.trim(),
        email: signupForm.email.trim(),
        password: signupForm.password,
      });
    }
  };

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-blue-700 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1.5px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full border-[48px] border-blue-500/40"
        />
        <div className="relative flex items-center gap-2.5 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-lg font-bold text-blue-700">
            B
          </span>
          <span className="text-lg font-semibold tracking-tight">Brand</span>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight text-white">
            Everything you need, one sign-in away.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-blue-100">
            Pick up right where you left off, on any device.
          </p>
        </div>
        <p className="relative text-sm text-blue-200">
          © {new Date().getFullYear()} Brand
        </p>
      </aside>

      <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:min-h-0">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-lg font-bold text-white">
              B
            </span>
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              Brand
            </span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-[15px] text-slate-600">
            {isLogin
              ? "Log in with your email and password."
              : "It takes less than a minute."}
          </p>

          <div
            role="tablist"
            aria-label="Choose login or signup"
            className="mt-8 grid grid-cols-2 rounded-lg bg-slate-100 p-1"
          >
            {[
              { key: "login", label: "Log in" },
              { key: "signup", label: "Sign up" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={mode === tab.key}
                onClick={() => switchMode(tab.key)}
                className={`rounded-md py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  mode === tab.key
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
            {isLogin ? (
              <>
                <Field
                  label="Email"
                  id="email"
                  type="email"
                  value={loginForm.email}
                  onChange={updateLogin("email")}
                  error={errors.email}
                  autoComplete="email"
                />
                <PasswordField
                  id="password"
                  value={loginForm.password}
                  onChange={updateLogin("password")}
                  error={errors.password}
                  autoComplete="current-password"
                />
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field
                    label="First name"
                    id="firstName"
                    value={signupForm.firstName}
                    onChange={updateSignup("firstName")}
                    error={errors.firstName}
                    autoComplete="given-name"
                  />
                  <Field
                    label="Last name"
                    id="lastName"
                    value={signupForm.lastName}
                    onChange={updateSignup("lastName")}
                    error={errors.lastName}
                    autoComplete="family-name"
                  />
                </div>
                <Field
                  label="Email"
                  id="email"
                  type="email"
                  value={signupForm.email}
                  onChange={updateSignup("email")}
                  error={errors.email}
                  autoComplete="email"
                />
                <PasswordField
                  id="password"
                  value={signupForm.password}
                  onChange={updateSignup("password")}
                  error={errors.password}
                  autoComplete="new-password"
                />
              </>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-[15px] font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />
              )}
              {isPending
                ? isLogin
                  ? "Logging in…"
                  : "Creating account…"
                : isLogin
                  ? "Log in"
                  : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            {isLogin ? "New here? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => switchMode(isLogin ? "signup" : "login")}
              className="font-medium text-blue-700 hover:text-blue-800 hover:underline focus-visible:outline-none focus-visible:underline"
            >
              {isLogin ? "Create an account" : "Log in"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
