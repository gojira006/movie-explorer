"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signupAction, type AuthState } from "@/lib/auth/actions";

const initialState: AuthState = {
  fieldErrors: {},
  formError: null,
  isDuplicateEmail: false,
  isSuccess: false,
  values: {},
};

const inputClass =
  "mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 focus:outline-none";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Creating account…" : "Sign up"}
    </button>
  );
}

export default function SignupPage() {
  const [state, formAction] = useActionState(signupAction, initialState);
  const { fieldErrors } = state;

  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Pick a username, then track what you want to watch and what you have
        already seen.
      </p>

      {state.isSuccess ? (
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
        // The username is created by a database trigger at signup, so it has to
        // travel through the Server Action rather than being sent from here.
        <form action={formAction} noValidate className="mt-8 space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm text-zinc-300">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              defaultValue={state.values.username}
              aria-invalid={Boolean(fieldErrors.username)}
              aria-describedby={fieldErrors.username ? "username-error" : undefined}
              className={inputClass}
              placeholder="your_name"
            />
            {fieldErrors.username ? (
              <p id="username-error" className="mt-1 text-xs text-red-400">
                {fieldErrors.username}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-zinc-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={state.values.email}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              className={inputClass}
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
              className={inputClass}
              placeholder="At least 8 characters"
            />
            {fieldErrors.password ? (
              <p id="password-error" className="mt-1 text-xs text-red-400">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          {state.isDuplicateEmail ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-200">
              An account with this email already exists.{" "}
              <Link href="/login" className="underline">
                Log in instead
              </Link>
              .
            </div>
          ) : null}

          {state.formError ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
              {state.formError}
            </div>
          ) : null}

          <SubmitButton />

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