import { describe, expect, it } from "vitest";
import { entriesToPromote, signUpClosedReason, statusForNewEntry, takenSpots } from "./rules";
import type { ParticipationStatus } from "@/db/schema";

const at = (minute: number) => new Date(Date.UTC(2026, 0, 1, 10, minute));
const entry = (id: string, status: ParticipationStatus, minute: number) => ({
  id,
  status,
  createdAt: at(minute),
});

describe("takenSpots", () => {
  it("counts confirmed and pending entries, not the waiting list", () => {
    expect(
      takenSpots([
        entry("a", "confirmed", 1),
        entry("b", "pending_confirmation", 2),
        entry("c", "waitlisted", 3),
      ]),
    ).toBe(2);
  });
});

describe("statusForNewEntry", () => {
  it("confirms while there is space", () => {
    expect(statusForNewEntry(2, [entry("a", "confirmed", 1)])).toBe("confirmed");
  });

  it("waitlists when the game is full, counting pending spots", () => {
    expect(
      statusForNewEntry(2, [entry("a", "confirmed", 1), entry("b", "pending_confirmation", 2)]),
    ).toBe("waitlisted");
  });
});

describe("entriesToPromote", () => {
  it("promotes the first in line for each free spot", () => {
    const entries = [
      entry("a", "confirmed", 1),
      entry("late", "waitlisted", 9),
      entry("early", "waitlisted", 5),
      entry("middle", "waitlisted", 7),
    ];
    expect(entriesToPromote(3, entries)).toEqual(["early", "middle"]);
  });

  it("promotes nobody when the game is full", () => {
    expect(entriesToPromote(1, [entry("a", "confirmed", 1), entry("b", "waitlisted", 2)])).toEqual(
      [],
    );
  });

  it("promotes nobody when the game is over capacity", () => {
    const entries = [
      entry("a", "confirmed", 1),
      entry("b", "confirmed", 2),
      entry("c", "waitlisted", 3),
    ];
    expect(entriesToPromote(1, entries)).toEqual([]);
  });
});

describe("signUpClosedReason", () => {
  const now = at(0);
  const open = { cancelledAt: null, locked: false, startsAt: at(30) };

  it("is open for an upcoming, unlocked game", () => {
    expect(signUpClosedReason(open, now)).toBeNull();
  });

  it("is closed when cancelled, started or locked", () => {
    expect(signUpClosedReason({ ...open, cancelledAt: now }, now)).toMatch(/annulé/);
    expect(signUpClosedReason({ ...open, startsAt: now }, now)).toMatch(/commencé/);
    expect(signUpClosedReason({ ...open, locked: true }, now)).toMatch(/fermées/);
  });
});
