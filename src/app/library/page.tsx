import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import Navbar from "@/components/navbar";
import SectionHead from "@/components/section-head";
import { getPsnAccountStatus, getLibraryGames } from "@/lib/actions";
import { formatPlayDuration } from "@/lib/psn";
import { format } from "date-fns";
export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const psnAccount = await getPsnAccountStatus();

  let content;

  if (!psnAccount) {
    content = (
      <div className="text-center py-16">
        <p className="text-ink-dim mb-4">
          Link your PlayStation account to see your Library.
        </p>
        <Link
          href="/settings"
          className="text-coral hover:underline font-semibold"
        >
          Go to Settings
        </Link>
      </div>
    );
  } else {
    const result = await getLibraryGames();

    if (!result.success) {
      const sessionExpired = result.error.includes("session expired");
      content = (
        <div className="text-center py-16">
          <p className="text-ink-dim mb-4">
            {sessionExpired
              ? result.error
              : `Couldn't load your library: ${result.error}`}
          </p>
          <Link
            href="/settings"
            className="text-coral hover:underline font-semibold"
          >
            Check your PlayStation connection
          </Link>
        </div>
      );
    } else {
      content = (
        <ul className="space-y-2">
          {result.games.map((game) => (
            <li
              key={game.titleId}
              className="p-4 bg-surface border border-hairline rounded-lg text-ink"
            >
              {game.name}
              {formatPlayDuration(game.playDuration)}
              {format(new Date(game.lastPlayedDateTime), "MMM d, yyyy")}
            </li>
          ))}
        </ul>
      );
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-void text-ink">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-8 md:px-12">
        <div className="mb-10">
          <SectionHead
            eyebrow="Library"
            title="Your Library"
            sub="Your PlayStation play history, pulled straight from your account."
            accent="platinum"
          />
        </div>
        {content}
      </main>
    </div>
  );
}
