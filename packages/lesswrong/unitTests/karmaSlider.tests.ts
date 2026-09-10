import { karmaStops, karmaRangeWithBound, karmaRangeFromStops, stopsFromKarmaRange, formatKarmaRange } from "../components/search/karmaSlider";

it("maps the full stop range to no filter and inner stops to bounds", () => {
  const last = karmaStops.length - 1;
  expect(karmaRangeFromStops(0, last)).toEqual({});
  expect(karmaRangeFromStops(3, last)).toEqual({min: karmaStops[3]});
  expect(karmaRangeFromStops(0, 4)).toEqual({max: karmaStops[4]});
  expect(karmaRangeFromStops(2, 5)).toEqual({min: karmaStops[2], max: karmaStops[5]});
});

it("finds the nearest stops for a range and formats it for people", () => {
  expect(stopsFromKarmaRange({})).toEqual([0, karmaStops.length - 1]);
  expect(stopsFromKarmaRange({min: 10, max: 100})).toEqual([karmaStops.indexOf(10), karmaStops.indexOf(100)]);
  expect(stopsFromKarmaRange({min: 12})).toEqual([karmaStops.indexOf(10), karmaStops.length - 1]);
  expect(formatKarmaRange({})).toBe("Any karma");
  expect(formatKarmaRange({min: 10})).toBe("Karma ≥ 10");
  expect(formatKarmaRange({max: 100})).toBe("Karma ≤ 100");
  expect(formatKarmaRange({min: 10, max: 100})).toBe("Karma 10 – 100");
});

it("keeps exact bounds, supports negative values and opens cleared bounds", () => {
  expect(karmaRangeWithBound({max: 67}, "min", "13")).toEqual({min: 13, max: 67});
  expect(karmaRangeWithBound({min: 13, max: 67}, "min", "")).toEqual({min: undefined, max: 67});
  expect(karmaRangeWithBound({}, "min", "-1234")).toEqual({min: -1234});
  expect(karmaRangeWithBound({}, "max", "99999")).toEqual({max: 99999});
});

it("keeps numeric edits ordered and ignores invalid bounds", () => {
  expect(karmaRangeWithBound({max: 10}, "min", "20")).toEqual({min: 20, max: 20});
  expect(karmaRangeWithBound({min: 10}, "max", "5")).toEqual({min: 5, max: 5});
  expect(karmaRangeWithBound({min: 10}, "max", "Infinity")).toEqual({min: 10});
  expect(karmaRangeWithBound({min: 10}, "max", "2.5")).toEqual({min: 10});
});
