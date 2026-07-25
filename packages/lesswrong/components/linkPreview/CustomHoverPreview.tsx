import React, { useContext, useMemo } from 'react';
import { Card } from '@/components/widgets/Paper';
import { sanitize } from '@/lib/utils/sanitize';
import { prettifyLinkUrl } from '@/lib/utils/prettifyLinkUrl';
import { useHover } from '../common/withHover';
import ContentStyles from '../common/ContentStyles';
import LWPopper from '../common/LWPopper';
import { ContentItemBody } from '../contents/ContentItemBody';
import { InteractionWrapper } from '../common/useClickableCell';
import type { ContentStyleType } from '@/components/common/ContentStylesValues';
import { defineStyles, useStyles } from '../hooks/useStyles';

/**
 * How deeply custom previews may nest. A preview body is itself rendered through
 * ContentItemBody, so a link inside a preview can carry its own preview; without a bound
 * a document could nest them indefinitely.
 */
const MAX_PREVIEW_DEPTH = 3;

const CustomPreviewDepthContext = React.createContext<number>(0);

/**
 * Set while rendering inside a custom hover preview's anchor text. The preview span wraps the
 * link, so this flows down to HoverPreviewLink and tells it to render a plain link rather than
 * attaching the destination's own preview — otherwise a linked phrase with a custom preview
 * would pop up two cards.
 */
export const SuppressDefaultLinkPreviewContext = React.createContext<boolean>(false);

const styles = defineStyles('CustomHoverPreview', (theme: ThemeType) => ({
  hovercard: {
    padding: 16,
    ...theme.typography.body2,
    fontSize: '1.1rem',
    ...theme.typography.commentStyle,
    color: theme.palette.grey[800],
    maxWidth: 500,
    '& a': {
      color: theme.palette.primary.main,
    },
  },
  url: {
    marginTop: 9,
    ...theme.typography.commentStyle,
    fontSize: '1rem',
    color: theme.palette.grey[600],
    // The prettified url is already short, but a long slug still has to stay on one line.
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 1,
    overflow: 'hidden',
    overflowWrap: 'anywhere',
  },
}));

/**
 * Text carrying an author-written hover preview. May wrap a link — in which case this preview
 * replaces whatever preview the destination would otherwise get — or plain unlinked text.
 * See HoverPreviewNode for the editor side.
 */
const CustomHoverPreview = ({ previewHtml, href, contentStyleType = 'comment', children }: {
  previewHtml: string,
  href?: string,
  contentStyleType?: ContentStyleType,
  children: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  const depth = useContext(CustomPreviewDepthContext);

  const { eventHandlers, hover, everHovered, anchorEl } = useHover({
    eventProps: { pageElementContext: 'linkPreview', hoverPreviewType: 'CustomHoverPreview', href },
  });

  // sanitize-html does not recurse into attribute values, so the document-level sanitize()
  // that let this attribute through did NOT sanitize what is inside it.
  const sanitizedHtml = useMemo(() => sanitize(previewHtml), [previewHtml]);
  const prettyUrl = useMemo(() => (href ? prettifyLinkUrl(href) : ''), [href]);

  if (depth >= MAX_PREVIEW_DEPTH || !sanitizedHtml) {
    return <>{children}</>;
  }

  return (
    <span {...eventHandlers} className="hoverPreview">
      {everHovered && <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start" clickable flip>
        <InteractionWrapper>
          <Card>
            <ContentStyles contentType={contentStyleType} className={classes.hovercard}>
              <CustomPreviewDepthContext.Provider value={depth + 1}>
                <ContentItemBody dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
              </CustomPreviewDepthContext.Provider>
              {prettyUrl && <div className={classes.url}>{prettyUrl}</div>}
            </ContentStyles>
          </Card>
        </InteractionWrapper>
      </LWPopper>}
      <SuppressDefaultLinkPreviewContext.Provider value={true}>
        {children}
      </SuppressDefaultLinkPreviewContext.Provider>
    </span>
  );
};

export default CustomHoverPreview;
