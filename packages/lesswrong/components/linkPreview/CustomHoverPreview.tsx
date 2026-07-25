import React, { useContext, useMemo } from 'react';
import { Card } from '@/components/widgets/Paper';
import { Link } from '@/lib/reactRouterWrapper';
import { classifyLink } from '@/lib/routeUtil';
import { sanitize } from '@/lib/utils/sanitize';
import { prettifyLinkUrl } from '@/lib/utils/prettifyLinkUrl';
import { useHover } from '../common/withHover';
import AnalyticsTracker from '../common/AnalyticsTracker';
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
 * A link whose author attached a custom hover preview, shown instead of whatever preview
 * the destination would otherwise get. The body is author-written HTML carried on the
 * anchor's data-hover-preview attribute; see PreviewLinkNode for the editor side.
 */
const CustomHoverPreview = ({ href, previewHtml, id, rel, className, contentStyleType = 'comment', children }: {
  href: string,
  previewHtml: string,
  id?: string,
  rel?: string,
  className?: string,
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
  const prettyUrl = useMemo(() => prettifyLinkUrl(href), [href]);

  const linkBody = classifyLink(href) === 'onsite'
    ? <Link to={href} id={id} rel={rel} className={className}>{children}</Link>
    : <AnalyticsTracker eventType="link" eventProps={{ to: href }}>
        <a href={href} id={id} rel={rel} className={className}>{children}</a>
      </AnalyticsTracker>;

  if (depth >= MAX_PREVIEW_DEPTH || !sanitizedHtml) {
    return linkBody;
  }

  return (
    <span {...eventHandlers}>
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
      {linkBody}
    </span>
  );
};

export default CustomHoverPreview;
