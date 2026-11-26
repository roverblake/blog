import { requireAdmin } from "@/lib/session";
import { testPasswordEnabled } from "@/lib/test-signin";
import "./studio.css";
import { StudioShell } from "./studio-nav";

export const metadata = { title: "Studio", robots: { index: false, follow: false } };

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="studio min-h-screen bg-white text-ink">
      {testPasswordEnabled() && (
        <div role="note" className="bg-[#fff4d6] px-6 py-2 text-[13px]">
          Test sign-in is on. Before launch, delete <code>TEST_ADMIN_PASSWORD</code> from Railway&apos;s Variables.
        </div>
      )}
      <StudioShell>{children}</StudioShell>
    </div>
  );
}
