"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function SignInForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const { error } = await authClient.signIn.magicLink({ email, callbackURL: next });
    setState(error ? "error" : "sent");
  }

  if (state === "sent") {
    return (
      <p role="status" className="text-center text-[19px] leading-normal">
        If that address belongs to a subscriber, a sign-in link is on its way. Check your inbox; the link works for 15 minutes.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-[440px] flex-col gap-3.5">
      <div className="inline-form">
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Send link"}
        </button>
      </div>
      {state === "error" && (
        <p role="alert" className="m-0 text-[16px]">
          Something went wrong, or there were too many tries. Please wait a few minutes and try again.
        </p>
      )}
      <p className="m-0 text-center text-[16px] text-slate italic">
        Not a subscriber yet? <Link href="/subscribe" className="underline">Subscribe free</Link>.
      </p>
    </form>
  );
}
