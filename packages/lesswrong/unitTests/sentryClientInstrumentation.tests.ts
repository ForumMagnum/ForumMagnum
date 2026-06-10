const mockInit = jest.fn();
const mockBreadcrumbsIntegration = jest.fn((options: unknown) => ({
  name: "Breadcrumbs",
  options,
}));
const mockDedupeIntegration = jest.fn(() => ({name: "Dedupe"}));
const mockExtraErrorDataIntegration = jest.fn(() => ({name: "ExtraErrorData"}));

jest.mock("@/lib/sentryWrapper", () => ({
  getSentry: () => ({
    init: mockInit,
    breadcrumbsIntegration: mockBreadcrumbsIntegration,
    dedupeIntegration: mockDedupeIntegration,
    extraErrorDataIntegration: mockExtraErrorDataIntegration,
  }),
}));

describe("instrumentation-client", () => {
  beforeEach(() => {
    jest.resetModules();
    mockInit.mockClear();
    mockBreadcrumbsIntegration.mockClear();
    mockDedupeIntegration.mockClear();
    mockExtraErrorDataIntegration.mockClear();
  });

  it("leaves native browser console output alone", () => {
    require("../../../instrumentation-client.js");

    expect(mockBreadcrumbsIntegration).toHaveBeenCalledWith({
      console: false,
    });
    expect(mockInit).toHaveBeenCalledWith(expect.objectContaining({
      integrations: expect.arrayContaining([
        expect.objectContaining({name: "Breadcrumbs"}),
        expect.objectContaining({name: "Dedupe"}),
        expect.objectContaining({name: "ExtraErrorData"}),
      ]),
    }));
  });
});
