export interface WidgetState {
  viewMode: 'code' | 'preview';
  previewHeight: number;
  htmlContent: string;
}

export function refreshIframeWidgetPreviewHtmlContent(
  widgets: Map<string, WidgetState>,
  widgetKeys: Iterable<string>,
  readHtmlContent: (key: string) => string,
): Map<string, WidgetState> {
  let next: Map<string, WidgetState> | null = null;
  for (const key of widgetKeys) {
    const state = (next ?? widgets).get(key);
    if (!state || state.viewMode !== 'preview') {
      continue;
    }

    const htmlContent = readHtmlContent(key);
    if (state.htmlContent === htmlContent) {
      continue;
    }

    if (!next) {
      next = new Map(widgets);
    }
    next.set(key, { ...state, htmlContent });
  }

  return next ?? widgets;
}
