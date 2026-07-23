import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Navbar from "@/components/navbar";
import PsnLinkCard from "@/components/psn-link-card";
import { getPsnAccountStatus } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const psnAccount = await getPsnAccountStatus();

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-8 md:px-12">
        <div className="space-y-2 mb-8 border-l-4 border-[#ff7676] pl-4">
          <h1 className="text-3xl font-black tracking-wider uppercase">
            Settings
          </h1>
          <p className="text-sm text-zinc-400">
            Manage connected accounts and integrations.
          </p>
        </div>

        <PsnLinkCard initialAccount={psnAccount} />
      </main>
    </div>
  );
}
