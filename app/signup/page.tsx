"use client";

import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const signupSchema = z.object({
  // Trimming and lowercasing before the request is what makes "A@B.com" and
  // "a@b.com" resolve to the same account instead of two separate ones.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Enter a valid email address." })),
  password: z.string().min(8, { error: "Use at least 8 characters." }),
});

type FieldErrors = Partial<Record<"email" | "password", string>>;

function friendlyMessage(code: string | undefined, fallback: string) {
  switch (code) {
    case "email_exists":
    case "user_already_exists":
      return "An account with this email already exists.";
    case "email_address_invalid":
      return "That email address does not look right.";
    case "weak_password":
      return "That password is too weak. Try a longer one.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Wait a minute and try again.";
    default:
      return fallback || "Something went wrong. Please try again.";
  }
}

export default function SignupPage() {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFieldErrors({});
    setFormError(null);
    setIsDuplicate(false);
    setIsSuccess(false);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const parsed = signupSchema.safeParse({
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
      const { data, error } = await supabase.auth.signUp(parsed.data);

      // Supabase reports a duplicate in two different ways depending on whether
      // email confirmation is switched on: either an explicit
      // user_already_exists error, or a placeholder user object with an empty
      // identities array. Both mean the same thing, so both are checked.
      const identityCount = data.user?.identities?.length ?? 0;

      if (error?.code === "user_already_exists" || identityCount === 0) {
        setIsDuplicate(true);
        return;
      }

      if (error) {
        setFormError(friendlyMessage(error.code, error.message));
        return;
      }

      // Only a user that actually came back with a linked identity is a real
      // registration rather than a disguised duplicate.
      if (identityCount > 0) {
        setIsSuccess(true);
      }
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
      <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Track what you want to watch and what you have already seen.
      </p>

      {isSuccess ? (
        <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-6 text-sm text-emerald-200">
          <p className="font-medium">Check your email to confirm your account.</p>
          <p className="mt-2 text-emerald-200/70">
            Supabase sends a confirmation link. Open it, then{" "}
            <Link href="/login" className="underline">
              log in
            </Link>
            .
          </p>
        </div>
      ) : (
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
              autoComplete="new-password"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 focus:outline-none"
              placeholder="At least 8 characters"
            />
            {fieldErrors.password ? (
              <p id="password-error" className="mt-1 text-xs text-red-400">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          {isDuplicate ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-200">
              An account with this email already exists.{" "}
              <Link href="/login" className="underline">
                Log in instead
              </Link>
              .
            </div>
          ) : null}

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
            {isPending ? "Creating account…" : "Sign up"}
          </button>

          <p className="text-center text-sm text-zinc-400">
            Already have an account?{" "}
            <Link href="/login" className="text-zinc-200 underline">
              Log in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
