import { getCityName } from "@/components/localGroups/TabNavigationEventsList";

describe("getCityName", () => {
  it("uses the saved location when an in-person global event has no parsed Google location", () => {
    const cityName = getCityName({
      googleLocation: null,
      location: "Berkeley, CA",
    });

    expect(cityName).toBe("Berkeley, CA");
  });

  it("extracts the preferred city from parsed Google location data", () => {
    const cityName = getCityName({
      googleLocation: {
        address_components: [
          { long_name: "California", types: ["administrative_area_level_1", "political"] },
          { long_name: "Berkeley", types: ["locality", "political"] },
          { long_name: "United States", types: ["country", "political"] },
        ],
      },
      location: "Berkeley, CA",
    });

    expect(cityName).toBe("Berkeley");
  });

  it("does not label an event as online when no location data is available", () => {
    const cityName = getCityName({
      googleLocation: null,
      location: null,
    });

    expect(cityName).toBeNull();
  });
});
