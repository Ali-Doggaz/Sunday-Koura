"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/actions/run";

type Props = Omit<React.ComponentProps<typeof Button>, "action" | "type"> & {
  action: () => Promise<ActionResult>;
  /** Asks the user before running the action. */
  confirmMessage?: string;
};

/** A button that runs a server action and shows its error, if any. */
export function ActionButton({ action, confirmMessage, children, ...buttonProps }: Props) {
  const [state, formAction, pending] = useActionState(() => action(), null);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault();
      }}
      className="contents"
    >
      <Button type="submit" disabled={pending} {...buttonProps}>
        {children}
      </Button>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
