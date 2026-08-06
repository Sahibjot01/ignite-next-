"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col min-h-screen bg-void text-ink">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="clip-notch-lg flex max-w-md flex-col items-center border border-dashed border-hairline-strong bg-surface/40 px-8 py-12 text-center">
          <div className="mb-4 rounded-full border border-hairline-strong bg-surface-2 p-4 text-coral">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="font-display text-lg font-medium text-ink">
            Something went wrong
          </h2>
          <p className="mt-1.5 max-w-sm text-xs text-ink-faint">
            We had trouble loading this page — could be a brief hiccup with
            one of our data sources. Give it another try.
          </p>
          <Button
            onClick={() => unstable_retry()}
            className="mt-6 rounded-full bg-coral px-6 font-bold text-void hover:bg-[#ff5858]"
          >
            Try Again
          </Button>
        </div>
      </main>
    </div>
  );
}
