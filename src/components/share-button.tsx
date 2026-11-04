"use client";

import { Check, Share } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Opens the phone's share sheet (e.g. to post in Messenger), or copies the link. */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      variant="outline"
      size="icon-lg"
      className="size-11 rounded-full"
      aria-label={copied ? "Lien copié" : "Partager le lien du match"}
      onClick={share}
    >
      {copied ? <Check aria-hidden /> : <Share aria-hidden />}
    </Button>
  );
}
