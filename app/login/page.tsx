"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Enter a valid email address." })),
  password: z.string().min(1, { error: "Enter your password." }),
});

type FieldErrors = Partial<Record<"email" | "password", string>>;

function friendlyMessage(code: string | undefined, fallback: string) {
  switch (code) {
    case "email_not_confirmed":
      return "Confirm your email address before logging in.";
    case "invalid_credentials":
      return "That email and password combination is incorrect.";
    case "over_request_rate_limit":
      return "Too many attempts. Wait a minute and try again.";
    default:
      return fallback || "Something went wrong. Please try again.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFieldErrors({});
    setFormError(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      const { fieldErrors: errors } = z.flattenError(parsed.error);
      setFieldErrors({
        email: errors.email?.[0],
        password: errors.password?.[0],
      });
      setIsPending(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword(parsed.data);

      if (error) {
        setFormError(friendlyMessage(error.code, error.message));
        return;
      }

      // The redirect target arrives in the query string, so it is only honoured
      // when it is a relative path. Without this check, ?next=https://evil.test
      // would turn this form into an open redirect.
      const requested = new URLSearchParams(window.location.search).get("next");
      const target =
        requested && requested.startsWith("/") && !requested.startsWith("//")
          ? requested
          : "/";

      // refresh() re-renders the server components, so the header picks up the
      // new session instead of waiting for a hard navigation.
      router.push(target);
      router.refresh();
    } catch {
      setFormError(
        "Could not reach Supabase. Check that your Supabase keys are set in .env.local.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Pick up your watchlist where you left it.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm text-zinc-300">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 focus:outline-none"
            placeholder="you@example.com"
          />
          {fieldErrors.email ? (
            <p id="email-error" className="mt-1 text-xs text-red-400">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm text-zinc-300">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? "password-error" : undefined}
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 focus:outline-none"
            placeholder="Your password"
          />
          {fieldErrors.password ? (
            <p id="password-error" className="mt-1 text-xs text-red-400">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        {formError ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
            {formError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Logging in…" : "Log in"}
        </button>

        <p className="text-center text-sm text-zinc-400">
          No account yet?{" "}
          <Link href="/signup" className="text-zinc-200 underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}