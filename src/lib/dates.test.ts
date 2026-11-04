import { describe, expect, it } from "vitest";
import { dateParts, formatGameDate, fromLocalInput, toLocalInput } from "./dates";

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

describe("dateParts", () => {
  it("splits a date into French display pieces", () => {
    expect(dateParts(new Date("2026-11-08T16:00:00Z"), PARIS)).toEqual({
      weekday: "Dimanche",
      weekdayShort: "DIM",
      day: "8",
      month: "novembre",
      monthShort: "NOV",
      time: "17:00",
    });
  });

  it("keeps French month abbreviations distinct (juin vs juillet)", () => {
    const month = (iso: string) => dateParts(new Date(iso), PARIS).monthShort;
    expect(month("2026-06-07T16:00:00Z")).toBe("JUIN");
    expect(month("2026-07-05T16:00:00Z")).toBe("JUIL");
    expect(month("2026-02-01T16:00:00Z")).toBe("FÉVR");
    expect(month("2026-12-06T16:00:00Z")).toBe("DÉC");
  });
});
