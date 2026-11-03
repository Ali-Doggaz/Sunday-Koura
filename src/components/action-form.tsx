"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/actions/run";

type Props = {
  action: (prev: ActionResult, form: FormData) => Promise<ActionResult>;
  submitLabel: string;
  children: React.ReactNode;
  className?: string;
};

/** A form that runs a server action and shows its error, if any. */
export function ActionForm({ action, submitLabel, children, className }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className={className ?? "flex flex-col gap-3"}>
      {children}
      <Button type="submit" disabled={pending}>
        {submitLabel}
      </Button>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
