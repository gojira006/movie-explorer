"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type AuthField = "username" | "email" | "identifier" | "password";

export type AuthState = {
  fieldErrors: Partial<Record<AuthField, string>>;
  formError: string | null;
  isDuplicateEmail: boolean;
  isSuccess: boolean;
  // React resets an uncontrolled form the moment an action finishes, which would
  // wipe everything the person just typed. These carry the non-secret fields
  // back so a validation error costs them only the field that was wrong. The
  // password is deliberately absent.
  values: { username?: string; email?: string; identifier?: string };
};

function emptyState(): AuthState {
  return {
    fieldErrors: {},
    formError: null,
    isDuplicateEmail: false,
    isSuccess: false,
    values: {},
  };
}

function readField(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value : "";
}

// Names that would let a username impersonate a part of the site, or collide
// with the address a person is about to type. Compared lowercased, because
// /BROWSE and /browse are the same route.
const RESERVED_USERNAMES = new Set([
  "admin",
  "support",
  "api",
  "login",
  "signup",
  "auth",
  "watchlist",
  "browse",
  "search",
  "movie",
  "settings",
]);

// One message for every way a login can fail. Distinguishing "no such username"
// from "wrong password" would turn this form into a tool for discovering which
// usernames exist.
const INVALID_CREDENTIALS = "Invalid login credentials.";
const USERNAME_TAKEN = "That username is already taken.";
const RATE_LIMITED = "Too many attempts. Wait a minute and try again.";

const signupSchema = z.object({
  username: z
    .string({ error: "Enter a username." })
    .trim()
    .min(3, { error: "Use at least 3 characters." })
    .max(20, { error: "Use at most 20 characters." })
    .regex(/^[A-Za-z0-9_]+$/, {
      error: "Use letters, numbers, and underscores only.",
    }),
  // Trimming and lowercasing before the request is what makes "A@B.com" and
  // "a@b.com" resolve to the same account instead of two separate ones.
  email: z
    .string({ error: "Enter an email address." })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Enter a valid email address." })),
  password: z.string().min(8, { error: "Use at least 8 characters." }),
});

const loginSchema = z.object({
  identifier: z
    .string({ error: "Enter your email or username." })
    .trim()
    .min(1, { error: "Enter your email or username." }),
  password: z.string().min(1, { error: "Enter your password." }),
});

// The unique index is on lower(username), so a plain equality match would miss
// someone typing "alice" when "Alice" is taken. ilike is the PostgREST
// equivalent -- but `_` is a SQL wildcard and `_` is also a legal username
// character, so "some_name" would otherwise match "someXname" and be reported
// as taken. Escaping the wildcards first is what makes the check honest.
function escapeLikePattern(value: string) {
  return value.replace(/([\\%_])/g, "\\$1");
}

// Reads another user's profile row, which the anon key cannot do because the
// only policy is `auth.uid() = id`. Returns null when nobody owns the name.
async function findUserIdByUsername(username: string): Promise<string | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .ilike("username", escapeLikePattern(username))
    .limit(1);

  if (error) {
    throw new Error(`Could not look up that username: ${error.message}`);
  }

  const row = data?.[0] as { id?: string } | undefined;

  return row?.id ?? null;
}

// The email never leaves the server. Resolving it here and handing it straight
// to signInWithPassword is the whole reason these forms are Server Actions: a
// browser-side lookup would have to ship a username-to-email map to the client.
async function resolveLoginEmail(identifier: string): Promise<string | null> {
  if (identifier.includes("@")) {
    return identifier.toLowerCase();
  }

  const userId = await findUserIdByUsername(identifier);

  if (!userId) {
    return null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);

  if (error) {
    throw new Error(`Could not look up that username: ${error.message}`);
  }

  return data.user.email ?? null;
}

// Only relative paths are honoured, so ?next=https://evil.test cannot turn the
// login form into an open redirect.
function safeNext(value: FormDataEntryValue | null) {
  const requested = typeof value === "string" ? value : "";

  return requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";
}

function signupFriendlyMessage(code: string | undefined, fallback: string) {
  switch (code) {
    case "email_address_invalid":
      return "That email address does not look right.";
    case "weak_password":
      return "That password is too weak. Try a longer one.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return RATE_LIMITED;
    default:
      return fallback || "Something went wrong. Please try again.";
  }
}

// Every branch that swallows a Supabase failure logs it. These messages are the
// only place the underlying reason exists -- the browser only ever sees the
// generic text below -- so without this, a misconfiguration is undiagnosable.
function report(scope: string, error: { code?: string; message: string }) {
  console.error(`[${scope}] Supabase error ${error.code ?? "(no code)"}: ${error.message}`);
}

export async function signupAction(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const state = emptyState();

  state.values = {
    username: readField(formData, "username"),
    email: readField(formData, "email"),
  };

  const parsed = signupSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);

    state.fieldErrors = {
      username: fieldErrors.username?.[0],
      email: fieldErrors.email?.[0],
      password: fieldErrors.password?.[0],
    };

    return state;
  }

  const { username, email, password } = parsed.data;

  if (RESERVED_USERNAMES.has(username.toLowerCase())) {
    state.fieldErrors.username = "That username is reserved. Pick another.";
    return state;
  }

  if (!isSupabaseConfigured() || !isAdminConfigured()) {
    state.formError =
      "Could not reach Supabase. Check that your Supabase keys are set in .env.local.";
    return state;
  }

  // A courtesy check, not the enforcement: two people can pick the same name in
  // the same second, so the unique index is what actually decides. That is why
  // the trigger failure below is handled as a duplicate too.
  try {
    if (await findUserIdByUsername(username)) {
      state.fieldErrors.username = USERNAME_TAKEN;
      return state;
    }
  } catch (lookupError) {
    console.error("[signup] username lookup failed:", lookupError);
    state.formError = "Could not check that username right now. Please try again.";
    return state;
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // Lands in raw_user_meta_data, which is where the profile trigger reads it.
    options: { data: { username } },
  });

  // The trigger inserts into a NOT NULL column inside the same transaction as
  // the sign-up, so a name that slipped past the check above fails the whole
  // registration. Supabase surfaces that as a generic database error, and the
  // index name is the only clue about what actually went wrong.
  if (error && /profiles_username_lower_key|database error saving new user/i.test(error.message)) {
    report("signup", error);
    state.fieldErrors.username = USERNAME_TAKEN;
    return state;
  }

  // The error is the only trustworthy signal here. data.user is null for every
  // failure GoTrue reports, so treating "no user" as "already registered" would
  // relabel a misconfiguration as a duplicate address.
  if (error) {
    report("signup", error);

    state.isDuplicateEmail =
      error.code === "user_already_exists" || error.code === "email_exists";

    if (!state.isDuplicateEmail) {
      state.formError = signupFriendlyMessage(error.code, error.message);
    }

    return state;
  }

  if (!data.user) {
    console.error("[signup] Supabase returned neither a user nor an error.");
    state.formError = "Sign-up did not complete. Please try again.";
    return state;
  }

  // With *Confirm email* on, GoTrue hides a duplicate behind a fake user object
  // rather than an error, so an empty identities array is the remaining signal
  // that this address is taken.
  if ((data.user.identities?.length ?? 0) === 0) {
    state.isDuplicateEmail = true;
    return state;
  }

  state.isSuccess = true;

  return state;
}

export async function loginAction(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const state = emptyState();

  state.values = { identifier: readField(formData, "identifier") };

  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);

    state.fieldErrors = {
      identifier: fieldErrors.identifier?.[0],
      password: fieldErrors.password?.[0],
    };

    return state;
  }

  if (!isSupabaseConfigured() || !isAdminConfigured()) {
    state.formError =
      "Could not reach Supabase. Check that your Supabase keys are set in .env.local.";
    return state;
  }

  let email: string | null = null;

  try {
    email = await resolveLoginEmail(parsed.data.identifier);
  } catch (lookupError) {
    console.error("[login] username lookup failed:", lookupError);
    state.formError = "Could not reach Supabase. Please try again.";
    return state;
  }

  if (!email) {
    state.formError = INVALID_CREDENTIALS;
    return state;
  }

  // The server client, not the browser one: only a Server Action can write the
  // session cookies that proxy.ts then keeps fresh.
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error) {
    report("login", error);

    // Unknown account, wrong password, unconfirmed email and disabled account
    // all collapse to one message. Rate limiting stays distinct because it is
    // about this visitor's own behaviour, not about anyone's account.
    state.formError =
      error.code === "over_request_rate_limit" ||
      error.code === "over_email_send_rate_limit"
        ? RATE_LIMITED
        : INVALID_CREDENTIALS;

    return state;
  }

  // Sign-in only set the cookies. Redirecting forces the server to render again,
  // so the header and the watchlist pick up the new session.
  redirect(safeNext(formData.get("next")));
}