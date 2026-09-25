import type React from "react";

/**
 * Key handler for single-line fields that save on blur: Enter finishes
 * editing instead of submitting or adding a line break. Ignored while an
 * input method is composing text, where Enter confirms the composition.
 */
export function blurOnEnter(event: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) {
  if (event.key === "Enter" && !event.nativeEvent.isComposing) {
    event.preventDefault();
    event.currentTarget.blur();
  }
}
