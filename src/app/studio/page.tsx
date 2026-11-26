import { requireAdmin } from "@/lib/session";

// Placeholder: the real dashboard comes in the Studio step.
export default async function StudioPage() {
  const session = await requireAdmin();
  return (
    <main>
      <h1>Studio</h1>
      <p>Signed in as {session.user.email}. The editor will live here.</p>
    </main>
  );
}
