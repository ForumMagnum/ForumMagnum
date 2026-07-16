import { localGroupMatchesSearch } from "@/components/localGroups/localGroupSearch";

const group = {
  name: "East Bay Rationalists",
  nameInAnotherLanguage: "Rationalistes de la baie",
  location: "Berkeley, California, United States",
};

describe("localGroupMatchesSearch", () => {
  it("matches group names case-insensitively", () => {
    expect(localGroupMatchesSearch(group, "east bay")).toBe(true);
  });

  it("matches locations using multiple search terms", () => {
    expect(localGroupMatchesSearch(group, "berkeley states")).toBe(true);
  });

  it("matches alternative-language names", () => {
    expect(localGroupMatchesSearch(group, "RATIONALISTES")).toBe(true);
  });

  it("does not match unrelated groups", () => {
    expect(localGroupMatchesSearch(group, "New York")).toBe(false);
  });

  it("treats blank searches as unfiltered", () => {
    expect(localGroupMatchesSearch(group, "   ")).toBe(true);
  });
});
