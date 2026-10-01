import type { Metadata } from "next";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Log in",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;

  // proxy.ts sends signed-out visitors here with ?next= so they land back where
  // they were headed. It has to be read here and handed to the form as a prop:
  // a Server Action cannot see the query string.
  const next = typeof params.next === "string" ? params.next : "";

  return <LoginForm next={next} />;
}