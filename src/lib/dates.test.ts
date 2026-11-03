import { describe, expect, it } from "vitest";
import { formatGameDate, fromLocalInput, toLocalInput } from "./dates";

const PARIS = "Europe/Paris";

describe("fromLocalInput / toLocalInput", () => {
  it("converts Paris winter time (UTC+1)", () => {
    const date = fromLocalInput("2026-12-06T10:00", PARIS);
    expect(date.toISOString()).toBe("2026-12-06T09:00:00.000Z");
    expect(toLocalInput(date, PARIS)).toBe("2026-12-06T10:00");
  });

  it("converts Paris summer time (UTC+2)", () => {
    const date = fromLocalInput("2026-07-05T10:00", PARIS);
    expect(date.toISOString()).toBe("2026-07-05T08:00:00.000Z");
    expect(toLocalInput(date, PARIS)).toBe("2026-07-05T10:00");
  });

  it("handles the day clocks go forward", () => {
    expect(fromLocalInput("2026-03-29T10:00", PARIS).toISOString()).toBe(
      "2026-03-29T08:00:00.000Z",
    );
  });

  it("returns an invalid date for garbage", () => {
    expect(Number.isNaN(fromLocalInput("nope", PARIS).getTime())).toBe(true);
  });
});

describe("formatGameDate", () => {
  it("formats in French in the given time zone", () => {
    expect(formatGameDate(new Date("2026-12-06T09:00:00Z"), PARIS)).toBe(
      "Dimanche 6 décembre à 10:00",
    );
  });
});
