import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ignite | Track Prices & Discover Games",
  description: "Browse popular, upcoming, and new games, track deals, and set price drop alerts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
        style={{ colorScheme: "dark" }}
      >
        <body className="min-h-full flex flex-col bg-black text-white font-sans selection:bg-[#ff7676] selection:text-white">
          <div className="flex flex-col flex-1">
            {children}
          </div>
          <Toaster position="bottom-right" theme="dark" closeButton />
        </body>
      </html>
    </ClerkProvider>
  );
}
