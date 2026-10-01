import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

async function logOut() {
  "use server";

  const supabase = await createClient();
  await supabase.auth.signOut();

  // Sign-out only clears the cookies. Redirecting forces the server to render
  // the header again, which is what makes the logged-out links come back.
  redirect("/");
}

export default async function AuthNav() {
  // The header renders on every page, so a missing key must degrade to "no
  // account controls" rather than take the whole site down.
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex shrink-0 items-center gap-3 text-sm">
        <Link href="/login" className="text-zinc-300 hover:text-white">
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-lg bg-white px-3 py-1.5 font-medium text-zinc-900 transition hover:bg-zinc-200"
        >
          Sign up
        </Link>
      </div>
    );
  }

  // RLS allows a user to read exactly one table row: their own profile. No
  // service-role client is needed here, and none should be.
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as { username?: string } | null;

  // A profile is missing when the account was created before username.sql ran,
  // or when that script has not been run yet at all. Falling back to the email
  // keeps the header readable instead of rendering an empty slot.
  const label = profile?.username || user.email;

  return (
    <div className="flex shrink-0 items-center gap-3 text-sm">
      <span className="hidden max-w-[18ch] truncate text-zinc-400 sm:inline">
        {label}
      </span>
      <form action={logOut}>
        <button
          type="submit"
          className="rounded-lg border border-white/10 px-3 py-1.5 text-zinc-300 transition hover:bg-white/5 hover:text-white"
        >
          Log out
        </button>
      </form>
    </div>
  );
}
