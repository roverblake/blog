import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Temporary test sign-in (TEST_ADMIN_PASSWORD). While a test sign-in is in
 * progress, the sign-in link is captured here instead of being emailed.
 */
export const linkCapture = new AsyncLocalStorage<{ url?: string }>();

export function testPasswordEnabled(): boolean {
  return (process.env.TEST_ADMIN_PASSWORD ?? "").length >= 8;
}
