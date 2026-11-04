"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/actions/run";

type Props = {
  action: (prev: ActionResult, form: FormData) => Promise<ActionResult>;
  submitLabel: string;
  submitVariant?: React.ComponentProps<typeof Button>["variant"];
  children: React.ReactNode;
  className?: string;
};

/** A form that runs a server action and shows its error, if any. */
export function ActionForm({ action, submitLabel, submitVariant, children, className }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className={className ?? "flex flex-col gap-3"}>
      {children}
      <Button
        type="submit"
        variant={submitVariant}
        disabled={pending}
        className="h-11 rounded-xl px-4 font-semibold"
      >
        {submitLabel}
      </Button>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
