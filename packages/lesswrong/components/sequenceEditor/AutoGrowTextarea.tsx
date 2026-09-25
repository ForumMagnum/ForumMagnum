import React, { useEffect, useRef } from "react";

function fitHeight(textarea: HTMLTextAreaElement | null) {
  if (!textarea) return;
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

/**
 * A textarea that grows to fit its contents, for editing text in place where
 * it would otherwise be displayed. With `singleLine`, Enter finishes editing
 * (by blurring) instead of adding a line break, but long text still wraps.
 */
const AutoGrowTextarea = ({ className, value, onChange, onBlur, placeholder, ariaLabel, autoFocus, singleLine, onFocus }: {
  className: string,
  value: string,
  onChange: (value: string) => void,
  onBlur: () => void,
  placeholder: string,
  ariaLabel?: string,
  autoFocus?: boolean,
  singleLine?: boolean,
  onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void,
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => fitHeight(ref.current), [value]);
  // The height also depends on the width (text wraps differently) and on the
  // web font, which may load after the first render.
  useEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;
    let lastWidth = textarea.clientWidth;
    const observer = new ResizeObserver(() => {
      // Only react to width changes; fitHeight itself changes the height.
      if (textarea.clientWidth !== lastWidth) {
        lastWidth = textarea.clientWidth;
        fitHeight(textarea);
      }
    });
    observer.observe(textarea);
    void document.fonts?.ready.then(() => fitHeight(textarea));
    return () => observer.disconnect();
  }, []);
  return <textarea
    ref={ref}
    rows={1}
    className={className}
    value={value}
    placeholder={placeholder}
    aria-label={ariaLabel ?? placeholder}
    autoFocus={autoFocus}
    onFocus={onFocus}
    onChange={(e) => onChange(singleLine ? e.target.value.replace(/\n/g, " ") : e.target.value)}
    onBlur={onBlur}
    onKeyDown={(e) => {
      if (singleLine && e.key === "Enter") {
        e.preventDefault();
        e.currentTarget.blur();
      }
    }}
  />;
};

export default AutoGrowTextarea;
