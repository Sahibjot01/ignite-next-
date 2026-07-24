import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Navbar from "@/components/navbar";
import PsnLinkCard from "@/components/psn-link-card";
import SectionHead from "@/components/section-head";
import { getPsnAccountStatus } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const psnAccount = await getPsnAccountStatus();

  return (
    <div className="flex flex-col min-h-screen bg-void text-ink">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-8 md:px-12">
        <div className="mb-10">
          <SectionHead
            eyebrow="Account"
            title="Settings"
            sub="Manage connected accounts and integrations."
            accent="platinum"
          />
        </div>

        <PsnLinkCard initialAccount={psnAccount} />
      </main>
    </div>
  );
}
