"use client";

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
      <p role="status">
        If that address belongs to a subscriber, a sign-in link is on its way. Check your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="email">Email address</label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Email me a sign-in link"}
      </button>
      {state === "error" && (
        <p role="alert">Something went wrong, or too many tries. Please wait a few minutes and try again.</p>
      )}
    </form>
  );
}
