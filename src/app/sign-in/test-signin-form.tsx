"use client";

import { useActionState, useEffect } from "react";
import { testSignIn } from "./test-actions";

/** Shown only while TEST_ADMIN_PASSWORD is set. */
export function TestSignInForm() {
  const [state, action, pending] = useActionState(testSignIn, null);
  // Open the one-time sign-in link in the browser, which sets the sign-in cookie.
  useEffect(() => {
    if (state?.url) window.location.assign(state.url);
  }, [state]);
  return (
    <form action={action} className="mx-auto mt-10 flex w-full max-w-[440px] flex-col gap-3 border-t border-rule pt-6">
      <p className="m-0 text-center text-[16px] text-slate italic">Test sign-in for the site owner (turned off at launch)</p>
      <div className="inline-form">
        <label htmlFor="test-password" className="sr-only">
          Test password
        </label>
        <input id="test-password" name="password" type="password" required autoComplete="current-password" placeholder="Test password" />
        <button type="submit" className="btn-secondary" disabled={pending}>
          {pending ? "…" : "Enter"}
        </button>
      </div>
      {state?.error && (
        <p role="alert" className="m-0 text-[16px]">
          {state.error}
        </p>
      )}
    </form>
  );
}
