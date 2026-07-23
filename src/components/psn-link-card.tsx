"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Gamepad2,
  Loader2,
  ShieldCheck,
  Unlink,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { linkPsnAccount, unlinkPsnAccount, PsnAccount } from "@/lib/actions";
import { toast } from "sonner";

type PsnStatus = Pick<
  PsnAccount,
  "online_id" | "linked_at" | "refresh_token_expires_at"
> | null;

interface PsnLinkCardProps {
  initialAccount: PsnStatus;
}

export default function PsnLinkCard({ initialAccount }: PsnLinkCardProps) {
  const router = useRouter();
  const [account, setAccount] = useState(initialAccount);
  const [npsso, setNpsso] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setAccount(initialAccount);
  }, [initialAccount]);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!npsso.trim()) {
      toast.error("Paste your NPSSO value first");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await linkPsnAccount(npsso.trim());
      if (res.success) {
        toast.success("PlayStation account linked!");
        setNpsso("");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to link account");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlink = async () => {
    setIsSubmitting(true);
    try {
      const res = await unlinkPsnAccount();
      if (res.success) {
        toast.success("PlayStation account unlinked");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to unlink account");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <Gamepad2 className="h-5 w-5 text-[#ff7676]" />
        <div>
          <h4 className="text-sm font-bold text-zinc-300">
            PlayStation Account
          </h4>
          <p className="text-xs text-zinc-500">
            Link your PSN account to unlock library import and free-game
            alerts
          </p>
        </div>
      </div>

      {account ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-zinc-900/50 p-4 border border-zinc-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">
                  {account.online_id}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Connected
                  {account.linked_at
                    ? ` ${format(new Date(account.linked_at), "MMM d, yyyy")}`
                    : ""}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={handleUnlink}
              className="border-zinc-800 hover:border-red-900 hover:bg-red-950/20 text-zinc-400 hover:text-red-400 rounded-full h-8 shrink-0"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Unlink className="h-3.5 w-3.5 mr-1.5" />
              )}
              Unlink
            </Button>
          </div>
          <p className="text-[10px] text-zinc-500 italic">
            Unlinking removes your stored session — you can relink anytime
            with a fresh NPSSO value.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <ol className="text-xs text-zinc-400 space-y-1.5 list-decimal list-inside">
            <li>
              Log in at{" "}
              <a
                href="https://www.playstation.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ff7676] hover:underline inline-flex items-center gap-0.5"
              >
                playstation.com
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              In the same browser, visit{" "}
              <a
                href="https://ca.account.sony.com/api/v1/ssocookie"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ff7676] hover:underline inline-flex items-center gap-0.5"
              >
                this Sony URL
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>Copy the value after {`"npsso":`} and paste it below</li>
          </ol>

          <form onSubmit={handleLink} className="space-y-3">
            <Input
              type="text"
              placeholder="Paste your NPSSO value"
              value={npsso}
              onChange={(e) => setNpsso(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 rounded-full h-10 text-sm focus:ring-[#ff7676] focus:border-[#ff7676]"
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#ff7676] hover:bg-[#ff5858] text-white rounded-full font-bold h-10 text-sm"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Link Account"
              )}
            </Button>
          </form>

          <p className="text-[10px] text-zinc-500 italic">
            Your session is encrypted before storage and never leaves our
            server. The NPSSO value itself is single-use and expires within
            minutes.
          </p>
        </div>
      )}
    </div>
  );
}
