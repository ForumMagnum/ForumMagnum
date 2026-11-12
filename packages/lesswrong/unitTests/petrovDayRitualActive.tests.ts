import { isPetrovDayRitualActive } from "../components/seasonal/petrovDay/petrov-day-story/useIsPetrovDayRitualActive";

describe("isPetrovDayRitualActive", () => {
  test("is active for as long as it is September 26 anywhere in the world", () => {
    const expectations: Array<[string, boolean]> = [
      ["2026-09-25T09:59:59Z", false],
      ["2026-09-25T10:00:00Z", true],
      ["2026-09-26T12:00:00Z", true],
      ["2026-09-27T11:59:59Z", true],
      ["2026-09-27T12:00:00Z", false],
    ];
    for (const [isoTime, expectedActive] of expectations) {
      expect([isoTime, isPetrovDayRitualActive(new Date(isoTime))]).toEqual([isoTime, expectedActive]);
    }
  });
});
