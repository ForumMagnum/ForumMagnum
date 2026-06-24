import {
  refreshIframeWidgetPreviewHtmlContent,
  type WidgetState,
} from "@/components/lexical/embeds/IframeWidgetEmbed/previewState";

function createWidgetState(overrides: Partial<WidgetState> = {}): WidgetState {
  return {
    viewMode: 'preview',
    previewHeight: 400,
    htmlContent: '<p>old</p>',
    ...overrides,
  };
}

describe("iframe widget preview state", () => {
  it("updates cached HTML for previewed widgets", () => {
    const widgets = new Map([
      ['widget-1', createWidgetState()],
    ]);

    const next = refreshIframeWidgetPreviewHtmlContent(
      widgets,
      ['widget-1'],
      () => '<p>new</p>',
    );

    expect(next).not.toBe(widgets);
    expect(next.get('widget-1')).toEqual({
      viewMode: 'preview',
      previewHeight: 400,
      htmlContent: '<p>new</p>',
    });
  });

  it("leaves code-mode widgets unchanged", () => {
    const widgets = new Map([
      ['widget-1', createWidgetState({ viewMode: 'code' })],
    ]);

    const next = refreshIframeWidgetPreviewHtmlContent(
      widgets,
      ['widget-1'],
      () => '<p>new</p>',
    );

    expect(next).toBe(widgets);
    expect(next.get('widget-1')?.htmlContent).toBe('<p>old</p>');
  });

  it("keeps the same map when preview HTML has not changed", () => {
    const widgets = new Map([
      ['widget-1', createWidgetState()],
    ]);

    const next = refreshIframeWidgetPreviewHtmlContent(
      widgets,
      ['widget-1'],
      () => '<p>old</p>',
    );

    expect(next).toBe(widgets);
  });
});
