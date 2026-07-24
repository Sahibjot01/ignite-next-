"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, Heart, Settings } from "lucide-react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NotificationsBell from "./notifications-bell";

export default function Navbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        {/* Logo and Title */}
        <div
          onClick={clearSearch}
          className="flex cursor-pointer items-center gap-3"
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

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="relative flex w-full max-w-md items-center gap-2 sm:w-auto"
        >
          <div className="relative w-full sm:w-80 md:w-96">
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

        {/* Navigation & Auth */}
        <div className="flex items-center gap-4">
          {isSignedIn ? (
            <>
              <Link href="/wishlist">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 hover:bg-surface hover:text-ink rounded-full text-ink-dim"
                >
                  <Heart className="h-4 w-4 text-coral fill-coral" />
                  <span className="hidden sm:inline font-semibold">
                    Wishlist
                  </span>
                </Button>
              </Link>
              <NotificationsBell />
              <Link href="/settings">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-surface hover:text-ink rounded-full text-ink-dim"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-hairline-strong focus:outline-none">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "h-7 w-7",
                    },
                  }}
                />
              </div>
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
