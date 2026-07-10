'use client';

import React, { useMemo } from 'react';
import ContentStyles from '@/components/common/ContentStyles';
import { ContentItemBody } from '@/components/contents/ContentItemBody';
import { renderChunkMarkdownToHtml, type ConversationEventChunk } from './conversationEventFormat';

// Renders one conversation-event chunk. `text` and `thinking` chunks pass
// through the shared markdown pipeline (`renderChunkMarkdownToHtml` →
// `ContentItemBody`) and reuse the `llmChat` content-styles scope; everything
// else (tool_use, tool_result, etc.) renders verbatim. The markdown render is
// memoized on `chunk.text` so re-renders of the parent row don't re-parse.
export const ChunkContent = ({ chunk, className }: { chunk: ConversationEventChunk; className?: string }) => {
  const html = useMemo(
    () => (chunk.kind === 'text' || chunk.kind === 'thinking' ? renderChunkMarkdownToHtml(chunk.text) : null),
    [chunk.kind, chunk.text],
  );
  if (html !== null) {
    return (
      <ContentStyles contentType="llmChat" className={className}>
        <ContentItemBody dangerouslySetInnerHTML={{ __html: html }} />
      </ContentStyles>
    );
  }
  return <div className={className}>{chunk.text}</div>;
};
