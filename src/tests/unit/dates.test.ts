import {
  daysAgoISODate,
  formatShortISODate,
  toManausISODate,
  weekdayIndexFromISODate,
} from "@/lib/dates";

describe("dates (America/Manaus)", () => {
  test("maps instants after 20h Manaus to the same local day, not the UTC day", () => {
    // 2026-10-30 02:00 UTC = 2026-10-29 22:00 in Manaus
    expect(toManausISODate(new Date("2026-10-30T02:00:00Z"))).toBe("2026-10-29");
  });

  test("maps early-morning Manaus to the previous UTC day", () => {
    // 2026-10-29 03:00 UTC = 2026-10-28 23:00 in Manaus
    expect(toManausISODate(new Date("2026-10-29T03:00:00Z"))).toBe("2026-10-28");
  });

  test("keeps midday instants on the same date", () => {
    expect(toManausISODate(new Date("2026-10-29T16:00:00Z"))).toBe("2026-10-29");
  });

  test("daysAgoISODate returns consecutive Manaus dates", () => {
    const today = daysAgoISODate(0);
    const yesterday = daysAgoISODate(1);
    const diffMs =
      new Date(`${today}T00:00:00Z`).getTime() - new Date(`${yesterday}T00:00:00Z`).getTime();
    expect(diffMs).toBe(86_400_000);
  });

  test("weekdayIndexFromISODate returns the day-of-week index", () => {
    // 2026-10-29 is a Thursday
    expect(weekdayIndexFromISODate("2026-10-29")).toBe(4);
    // 2026-11-01 is a Sunday
    expect(weekdayIndexFromISODate("2026-11-01")).toBe(0);
  });

  test("formatShortISODate renders pt-BR short date", () => {
    expect(formatShortISODate("2026-10-29")).toBe("29 de out.");
  });
});
