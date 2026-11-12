import { redirect } from "next/navigation";

export default function Home() {
  // The real redirect lives in next.config.ts (instant 307). This page is kept as
  // the App Router entry point and a fallback for environments without it.
  redirect("/dashboard");
}
