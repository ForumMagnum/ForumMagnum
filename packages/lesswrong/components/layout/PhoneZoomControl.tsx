"use client";

import { useLayoutEffect } from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useTheme } from '../themes/useTheme';

const styles = defineStyles('PhoneZoomControl', (theme: ThemeType) => ({
  '@global': {
    html: {
      [theme.breakpoints.down('xs')]: {
        // Allow scrolling in both directions, but not pinch/double-tap page zoom.
        touchAction: 'pan-x pan-y',
      },
    },
  },
}));

interface ViewportOverride {
  element: HTMLMetaElement,
  originalContent: string,
  appliedContent: string,
}

interface PhoneViewportState {
  mediaQuery: MediaQueryList,
  override: ViewportOverride | null,
}

function restoreViewport(state: PhoneViewportState) {
  const override = state.override;
  // Don't overwrite a newer viewport supplied by Next's metadata handling.
  if (override && override.element.content === override.appliedContent) {
    override.element.content = override.originalContent;
  }
  state.override = null;
}

function keepViewportDirective(directive: string) {
  return !/^\s*(maximum-scale|user-scalable)\s*=/i.test(directive);
}

function updateViewport(state: PhoneViewportState) {
  const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (!state.mediaQuery.matches || state.override?.element !== viewport) {
    restoreViewport(state);
  }
  if (!state.mediaQuery.matches || !viewport) return;
  if (state.override?.appliedContent === viewport.content) return;

  const originalContent = viewport.content;
  const appliedContent = `${originalContent.split(',').filter(keepViewportDirective).join(',')}, maximum-scale=1, user-scalable=no`;
  state.override = { element: viewport, originalContent, appliedContent };
  // touch-action controls gestures; the viewport limit separately prevents
  // iOS from zooming to focus small inputs and contenteditable editors.
  viewport.content = appliedContent;
}

export default function PhoneZoomControl() {
  useStyles(styles);
  const theme = useTheme();
  const mediaQuery = theme.breakpoints.down('xs').replace('@media ', '');

  useLayoutEffect(() => {
    const state: PhoneViewportState = {
      mediaQuery: window.matchMedia(mediaQuery),
      override: null,
    };
    const update = () => updateViewport(state);
    update();
    state.mediaQuery.addEventListener('change', update);

    // Next can replace or update its viewport metadata during navigation.
    // Reapply the phone restriction without creating a second viewport tag.
    const observer = new MutationObserver(update);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['content', 'name'],
    });
    return () => {
      observer.disconnect();
      state.mediaQuery.removeEventListener('change', update);
      restoreViewport(state);
    };
  }, [mediaQuery]);

  return null;
}
