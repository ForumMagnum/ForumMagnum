import { getAutocompleteShortcut } from "@/components/editor/lexicalPlugins/autocomplete/LLMAutocompletePlugin";

describe("LLM autocomplete shortcuts", () => {
  it("does not claim Ctrl+Y when redo is available", () => {
    expect(getAutocompleteShortcut({
      ctrlKey: true,
      key: "y",
      shiftKey: false,
    }, true)).toBeNull();
  });

  it("uses Ctrl+Y for standard autocomplete when redo is unavailable", () => {
    expect(getAutocompleteShortcut({
      ctrlKey: true,
      key: "y",
      shiftKey: false,
    }, false)).toBe("standard");
  });

  it("keeps Ctrl+Shift+Y for the large-model autocomplete shortcut", () => {
    expect(getAutocompleteShortcut({
      ctrlKey: true,
      key: "Y",
      shiftKey: true,
    }, true)).toBe("largeModel");
  });
});
