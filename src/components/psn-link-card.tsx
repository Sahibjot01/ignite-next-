"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Gamepad2,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Unlink,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  linkPsnAccount,
  unlinkPsnAccount,
  PsnConnectionStatus,
} from "@/lib/actions";
import { toast } from "sonner";

interface PsnLinkCardProps {
  initialStatus: PsnConnectionStatus;
}

export default function PsnLinkCard({
  initialStatus: status,
}: PsnLinkCardProps) {
  const router = useRouter();
  const [npsso, setNpsso] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const linkForm = (
    <>
      <ol className="text-xs text-ink-dim space-y-1.5 list-decimal list-inside">
        <li>
          Log in at{" "}
          <a
            href="https://www.playstation.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-coral hover:underline inline-flex items-center gap-0.5"
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
            className="text-coral hover:underline inline-flex items-center gap-0.5"
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
          className="bg-surface-2 border-hairline text-ink placeholder-ink-faint rounded-full h-10 text-sm focus:ring-coral focus:border-coral"
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-coral hover:bg-[#ff5858] text-void rounded-full font-bold h-10 text-sm"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Link Account"
          )}
        </Button>
      </form>

      <p className="text-[10px] text-ink-faint italic">
        Your session is encrypted before storage and never leaves our server.
        The NPSSO value itself is single-use and expires within minutes.
      </p>
    </>
  );

  return (
    <div className="clip-notch-sm border border-hairline bg-surface p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <Gamepad2 className="h-5 w-5 text-coral" />
        <div>
          <h4 className="font-display text-sm font-semibold text-ink">
            PlayStation Account
          </h4>
          <p className="text-xs text-ink-faint">
            Link your PSN account to unlock library import and free-game alerts
          </p>
        </div>
      </div>

      {status.linked && status.valid && (
        <div className="space-y-4">
          <div className="rounded-lg bg-surface-2/50 p-4 border border-hairline flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-ink">
                  {status.online_id}
                </p>
                <p className="text-xs text-ink-faint mt-0.5">
                  Connected
                  {status.linked_at
                    ? ` ${format(new Date(status.linked_at), "MMM d, yyyy")}`
                    : ""}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={handleUnlink}
              className="border-hairline-strong hover:border-red-900 hover:bg-red-950/20 text-ink-dim hover:text-red-400 rounded-full h-8 shrink-0"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Unlink className="h-3.5 w-3.5 mr-1.5" />
              )}
              Unlink
            </Button>
          </div>
          <p className="text-[10px] text-ink-faint italic">
            Unlinking removes your stored session — you can relink anytime with
            a fresh NPSSO value.
          </p>
        </div>
      )}

      {status.linked && !status.valid && (
        <div className="space-y-4">
          <div className="rounded-lg bg-amber-950/20 p-4 border border-amber-900/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-ink">
                  {status.online_id}
                </p>
                <p className="text-xs text-amber-500/80 mt-0.5">
                  Session expired — relink below to restore access
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={handleUnlink}
              className="border-hairline-strong hover:border-red-900 hover:bg-red-950/20 text-ink-dim hover:text-red-400 rounded-full h-8 shrink-0"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Unlink className="h-3.5 w-3.5 mr-1.5" />
              )}
              Unlink
            </Button>
          </div>
          {linkForm}
        </div>
      )}

      {!status.linked && <div className="space-y-4">{linkForm}</div>}
    </div>
  );
}
