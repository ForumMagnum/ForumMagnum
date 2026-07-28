import React, { useContext, useMemo } from 'react';
import classNames from 'classnames';
import { Card } from '@/components/widgets/Paper';
import { sanitize } from '@/lib/utils/sanitize';
import { prettifyLinkUrl } from '@/lib/utils/prettifyLinkUrl';
import { HOVER_PREVIEW_CLASS, MAX_HOVER_PREVIEW_DEPTH } from '@/lib/utils/hoverPreviewConstants';
import ContentStyles from '../common/ContentStyles';
import LWTooltip from '../common/LWTooltip';
import { ContentItemBody } from '../contents/ContentItemBody';
import { footnotePreviewStyles } from './FootnotePreview';
import { CustomPreviewDepthContext, SuppressDefaultLinkPreviewContext } from './hoverPreviewContexts';
import type { ContentStyleType } from '@/components/common/ContentStylesValues';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles('CustomHoverPreview', (theme: ThemeType) => ({
  url: {
    marginTop: 9,
    ...theme.typography.commentStyle,
    fontSize: '1rem',
    color: theme.palette.grey[600],
    // A long slug still has to stay on one line.
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 1,
    overflow: 'hidden',
    overflowWrap: 'anywhere',
  },
}));

/**
 * The class carries the dashed underline (see stylePiping), and the stored
 * span it came from usually has it already, so don't repeat it.
 */
function previewAnchorClassName(className: string|undefined): string {
  return classNames(HOVER_PREVIEW_CLASS, className?.split(' ').filter(c => c !== HOVER_PREVIEW_CLASS));
}

/**
 * Text carrying an author-written hover preview, wrapping a link or
 * plain text. See HoverPreviewNode for the editor side.
 *
 * The card shell -- hover handling, popper, lazy mount, touch-screen
 * suppression -- is LWTooltip's.
 */
const CustomHoverPreview = ({ previewHtml, href, contentStyleType = 'comment', className, children }: {
  previewHtml: string,
  href?: string,
  contentStyleType?: ContentStyleType,
  className?: string,
  children: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  // The card itself looks exactly like a footnote preview; share the rule.
  const cardClasses = useStyles(footnotePreviewStyles);
  const depth = useContext(CustomPreviewDepthContext);

  // sanitize() does not recurse into attributes, so the body that
  // arrived inside one is still unsanitized here.
  const sanitizedHtml = useMemo(() => sanitize(previewHtml), [previewHtml]);
  const prettyUrl = useMemo(() => (href ? prettifyLinkUrl(href) : ''), [href]);

  if (depth >= MAX_HOVER_PREVIEW_DEPTH || !sanitizedHtml) {
    return <>{children}</>;
  }

  const card = <Card>
    <ContentStyles contentType={contentStyleType} className={cardClasses.hovercard}>
      <CustomPreviewDepthContext.Provider value={depth + 1}>
        <ContentItemBody dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
      </CustomPreviewDepthContext.Provider>
      {prettyUrl && <div className={classes.url}>{prettyUrl}</div>}
    </ContentStyles>
  </Card>;

  return <LWTooltip
    title={card}
    tooltip={false}
    clickable
    // Text in the post must not reflow because a phrase carries a preview.
    inlineBlock={false}
    hideOnTouchScreens
    className={previewAnchorClassName(className)}
    analyticsProps={{ pageElementContext: 'linkPreview', hoverPreviewType: 'CustomHoverPreview' }}
    otherEventProps={{ href }}
  >
    <SuppressDefaultLinkPreviewContext.Provider value={true}>
      {children}
    </SuppressDefaultLinkPreviewContext.Provider>
  </LWTooltip>;
};

export default CustomHoverPreview;
