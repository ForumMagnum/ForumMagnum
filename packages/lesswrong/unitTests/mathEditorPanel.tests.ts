import { getMathEditorPanelStyle } from "@/components/editor/lexicalPlugins/math/MathEditorPanel";

describe("getMathEditorPanelStyle", () => {
  it("positions the panel in document coordinates", () => {
    const style = getMathEditorPanelStyle(
      { left: 100, width: 40, bottom: 200 },
      12,
      300,
    );

    expect(style).toEqual({
      left: 132,
      top: 508,
      transform: "translateX(-50%)",
    });
  });
});
