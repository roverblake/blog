import { requireAdmin } from "@/lib/session";
import { storageWarning } from "@/lib/storage";
import { testPasswordEnabled } from "@/lib/test-signin";
import "./studio.css";
import { StudioShell } from "./studio-nav";

export const metadata = { title: "Studio", robots: { index: false, follow: false } };

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const storage = await storageWarning();
  return (
    <div className="studio min-h-screen bg-white text-ink">
      {testPasswordEnabled() && (
        <div role="note" className="bg-[#fff4d6] px-6 py-2 text-[13px]">
          Test sign-in is on. Before launch, delete <code>TEST_ADMIN_PASSWORD</code> from Railway&apos;s Variables.
        </div>
      )}
      {storage && (
        <div role="alert" className="bg-[#fde8e4] px-6 py-2 text-[13px]">
          {storage}
        </div>
      )}
      <StudioShell>{children}</StudioShell>
    </div>
  );
}
