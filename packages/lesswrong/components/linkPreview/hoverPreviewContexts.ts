import React from 'react';

/**
 * These live in their own module because the components that read them form an
 * import cycle: ContentItemBody renders CustomHoverPreview, which renders a
 * ContentItemBody for the preview body. A context created in either of those
 * modules could be read before it is initialized.
 */

/** How many preview cards deep the content being rendered is; 0 is the document itself. */
export const CustomPreviewDepthContext = React.createContext<number>(0);

/**
 * Tells an enclosed HoverPreviewLink to render a plain link, so a linked phrase
 * with a custom preview doesn't pop up two cards.
 */
export const SuppressDefaultLinkPreviewContext = React.createContext<boolean>(false);
