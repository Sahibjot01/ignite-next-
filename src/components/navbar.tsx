"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, Heart, Settings, Library, Gift } from "lucide-react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NotificationsBell from "./notifications-bell";

function ProfileButton() {
  return (
    <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-hairline-strong focus:outline-none">
      <UserButton
        appearance={{
          elements: {
            userButtonAvatarBox: "h-7 w-7",
          },
        }}
      >
        {/* Folded in here instead of a separate top-level gear icon — one
            fewer icon competing for space on the mobile action row, and
            "Settings lives in the profile menu" is the pattern basically
            every app already uses, so nothing here needed re-teaching. */}
        <UserButton.MenuItems>
          <UserButton.Link
            label="Settings"
            labelIcon={<Settings className="h-4 w-4" />}
            href="/settings"
          />
        </UserButton.MenuItems>
      </UserButton>
    </div>
  );
}

export default function Navbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isOnVaultPage = pathname === "/vault";
  const { isSignedIn } = useUser();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );

  const handleSearch = (e: React.ChangeEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/");
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-hairline bg-void/80 backdrop-blur-md px-6 py-4 md:px-12">
      {/* Below `lg`, this renders as three explicit rows instead of trying
          to cram everything into one: [logo, avatar] / [centered action
          icons] / [search, full width]. Cramming all 6 nav items plus logo
          and search into one wrapping row (the previous approach) still
          left the action-icon row jammed flush against the edge with tiny
          gaps once the search bar dropped below it — technically no
          overflow, but visually lopsided and cluttered on an actual phone.
          Splitting avatar (paired with the logo, like most apps keep
          profile access immediately visible) from the other 3 action icons
          (their own centered row) fixes both the crowding and the
          alignment. At `lg` and up this collapses back into the original
          single-row desktop layout via the hidden/lg:flex pairs below. */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-3">
        {/* Logo and Title */}
        <div
          onClick={clearSearch}
          className="order-1 flex shrink-0 cursor-pointer items-center gap-3"
        >
          <Image
            src="/icons/logo.svg"
            alt="Ignite logo"
            width={32}
            height={32}
            className="h-8 w-8 hover:rotate-12 transition-transform duration-300"
          />
          <h1 className="font-display text-xl font-bold uppercase tracking-wider text-ink">
            Ignite<span className="text-coral">.</span>
          </h1>
        </div>

        {/* Row 1, mobile only: profile/sign-in sits next to the logo, same
            as almost every app's mobile header. Its own lg:flex twin lives
            at the end of the desktop cluster below. */}
        <div className="order-2 flex shrink-0 items-center lg:hidden">
          {isSignedIn ? (
            <ProfileButton />
          ) : (
            <SignInButton mode="modal">
              <Button
                variant="ghost"
                size="sm"
                className="text-ink-dim hover:bg-surface hover:text-ink rounded-full font-semibold"
              >
                Sign In
              </Button>
            </SignInButton>
          )}
        </div>

        {/* Row 2, mobile only: the remaining action icons, centered as
            their own group (not flush against an edge) and sized up
            (icon-lg) since these are now the only things on their row and
            can afford the extra tap-target size. "Free This Month" stays
            visible whether signed in or not, same as the desktop cluster —
            only Wishlist/Vault/notifications need an account. */}
        <div className="order-3 flex w-full basis-full items-center justify-center gap-3 lg:hidden">
          <Link href="/monthly-games">
            <Button
              variant="ghost"
              size="icon-lg"
              className="hover:bg-surface hover:text-ink rounded-full text-ink-dim"
            >
              <Gift className="h-5 w-5 text-coral" />
            </Button>
          </Link>
          {isSignedIn && (
            <>
              <Link href="/wishlist">
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="hover:bg-surface hover:text-ink rounded-full text-ink-dim"
                >
                  <Heart className="h-5 w-5 text-coral fill-coral" />
                </Button>
              </Link>
              <Link href="/vault">
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className={`animate-vault-glow rounded-full text-ink-dim hover:bg-surface hover:text-ink ${
                    isOnVaultPage ? "vault-glow-idle-off" : ""
                  }`}
                >
                  <Library className="h-5 w-5 text-coral fill-coral" />
                </Button>
              </Link>
              <NotificationsBell />
            </>
          )}
        </div>

        {/* Search Bar — full width on its own row below `lg`, inline
            between logo and nav (its original spot) at `lg` and up. */}
        <form
          onSubmit={handleSearch}
          className="order-4 flex w-full items-center gap-2 lg:order-2 lg:w-auto lg:flex-1 lg:justify-center"
        >
          <div className="relative w-full lg:w-72 xl:w-96">
            <Input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border-hairline text-ink placeholder-ink-faint rounded-full pl-10 pr-4 focus:ring-coral focus:border-coral"
            />
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          </div>
          <Button
            type="submit"
            className="bg-coral hover:bg-[#ff5858] text-void rounded-full font-bold px-6"
          >
            SEARCH
          </Button>
        </form>

        {/* Desktop (`lg` and up) — the original single-row layout, with
            labels back on and everything (including profile) in one
            group. Hidden entirely below `lg`, where the two rows above
            take over instead. */}
        <div className="order-5 hidden shrink-0 items-center gap-4 lg:flex">
          <Link href="/monthly-games">
            <Button
              variant="ghost"
              className="flex items-center gap-2 hover:bg-surface hover:text-ink rounded-full text-ink-dim"
            >
              <Gift className="h-4 w-4 text-coral" />
              <span className="font-semibold">Free This Month</span>
            </Button>
          </Link>
          {isSignedIn ? (
            <>
              <Link href="/wishlist">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 hover:bg-surface hover:text-ink rounded-full text-ink-dim"
                >
                  <Heart className="h-4 w-4 text-coral fill-coral" />
                  <span className="font-semibold">Wishlist</span>
                </Button>
              </Link>
              <Link href="/vault">
                <Button
                  variant="ghost"
                  className={`animate-vault-glow flex items-center gap-2 rounded-full text-ink-dim hover:bg-surface hover:text-ink ${
                    isOnVaultPage ? "vault-glow-idle-off" : ""
                  }`}
                >
                  <Library className="h-4 w-4 text-coral fill-coral" />
                  <span className="font-semibold">Vault</span>
                </Button>
              </Link>
              <NotificationsBell />
              <ProfileButton />
            </>
          ) : (
            <SignInButton mode="modal">
              <Button
                variant="ghost"
                className="text-ink-dim hover:bg-surface hover:text-ink rounded-full font-semibold"
              >
                Sign In
              </Button>
            </SignInButton>
          )}
        </div>
      </div>
    </nav>
  );
}
