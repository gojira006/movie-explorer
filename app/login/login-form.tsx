"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type AuthState } from "@/lib/auth/actions";

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
      {pending ? "Logging in…" : "Log in"}
    </button>
  );
}

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(loginAction, initialState);
  const { fieldErrors } = state;

  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Pick up your watchlist where you left it.
      </p>

      <form action={formAction} noValidate className="mt-8 space-y-4">
        {/* Only honoured when it is a relative path, so this cannot be used to
            turn the login form into an open redirect. */}
        <input type="hidden" name="next" value={next} />

        <div>
          <label htmlFor="identifier" className="block text-sm text-zinc-300">
            Email or username
          </label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            defaultValue={state.values.identifier}
            aria-invalid={Boolean(fieldErrors.identifier)}
            aria-describedby={
              fieldErrors.identifier ? "identifier-error" : undefined
            }
            className={inputClass}
            placeholder="you@example.com"
          />
          {fieldErrors.identifier ? (
            <p id="identifier-error" className="mt-1 text-xs text-red-400">
              {fieldErrors.identifier}
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
            className={inputClass}
            placeholder="Your password"
          />
          {fieldErrors.password ? (
            <p id="password-error" className="mt-1 text-xs text-red-400">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        {state.formError ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
            {state.formError}
          </div>
        ) : null}

        <SubmitButton />

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