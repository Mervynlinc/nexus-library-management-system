"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button/Button";
import TextInput from "@/components/ui/TextInput/TextInput";

interface LoginFormState {
  username: string;
  password: string;
}

const ERROR_MESSAGES = {
  usernameRequired: "Username is required.",
  passwordRequired: "Password is required.",
  invalid: "Invalid username or password.",
};

/**
 * Stub only — no backend/auth exists yet (see AGENTS.md build order).
 * Replaced by a real POST /api/login once the Express server is built.
 * Currently always rejects so the invalid-credentials error state renders.
 */
function loginRequest(payload: LoginFormState): Promise<void> {
  console.log("login payload:", payload);
  return Promise.reject(new Error(ERROR_MESSAGES.invalid));
}

export default function LoginPage() {
  const [form, setForm] = useState<LoginFormState>({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [isShaking, setIsShaking] = useState(false);

  function update<K extends keyof LoginFormState>(
    key: K,
    value: LoginFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: typeof errors = {};
    if (!form.username.trim()) {
      nextErrors.username = ERROR_MESSAGES.usernameRequired;
    }
    if (!form.password) {
      nextErrors.password = ERROR_MESSAGES.passwordRequired;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setIsShaking(true);
      return;
    }

    try {
      await loginRequest(form);
    } catch (err) {
      setErrors({
        password:
          err instanceof Error ? err.message : ERROR_MESSAGES.invalid,
      });
      setIsShaking(true);
    }
  }

  return (
    <main className="flex h-screen items-center justify-center overflow-hidden bg-bg p-6 font-sans">
      <div className="flex w-full max-w-4xl bg-surface shadow-card">
        <div className="relative hidden w-[40%] self-stretch md:block">
          <Image
            src="/images/shelf.webp"
            alt="Library shelves"
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        </div>

        <div className="w-full px-8 py-12 md:w-[60%] md:px-12">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 9h16"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <circle cx="7" cy="6" r="1" fill="white" />
              </svg>
            </span>
            <span className="text-lg font-semibold text-text-primary">
              Nexus Library Management System
            </span>
          </div>

          <h1 className="mt-8 text-[22px] font-semibold text-text-primary">
            Login to your account
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Welcome back. Enter your credentials to sign in.
          </p>

          <form
            onAnimationEnd={(e) => {
              if (e.animationName === "shake") {
                setIsShaking(false);
              }
            }}
            className={`mt-8 flex flex-col gap-5 ${
              isShaking ? "error-shake" : ""
            }`}
            noValidate
            onSubmit={handleSubmit}
          >
            <TextInput
              label="Username"
              name="username"
              autoComplete="username"
              placeholder="your-username"
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
              error={errors.username}
            />

            <TextInput
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              error={errors.password}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors duration-150 ease-out hover:bg-primary-tint hover:text-primary"
                >
                  {showPassword ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                      <path
                        d="M4 4l16 16"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </button>
              }
            />

            <div className="flex items-center">
              <a
                href="#"
                className="text-sm font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
              >
                Forgot Password? - Contact administrator
              </a>
            </div>

            <Button type="submit" fullWidth>
              Login
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}