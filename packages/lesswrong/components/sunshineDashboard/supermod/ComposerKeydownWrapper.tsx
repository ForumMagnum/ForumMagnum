import React from 'react';
import { blurEditorOnEscape, callOnArrowDownPastEditorEnd } from '@/components/editor/focusLexicalEditor';

/**
 * Wrapper div for a supermod sidebar composer. Escape blurs the editor
 * (rather than letting the supermod Escape handler on document close the
 * detail view), and ArrowDown on the composer's last line hands focus to the
 * template search below it.
 */
const ComposerKeydownWrapper = ({ containerRef, onArrowDownPastEnd, className, children }: {
  containerRef: React.RefObject<HTMLDivElement | null>,
  onArrowDownPastEnd: () => void,
  className?: string,
  children: React.ReactNode,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    blurEditorOnEscape(e);
    callOnArrowDownPastEditorEnd(e, onArrowDownPastEnd);
  };
  return <div className={className} ref={containerRef} onKeyDown={handleKeyDown}>
    {children}
  </div>;
};

export default ComposerKeydownWrapper;
