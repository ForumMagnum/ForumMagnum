import React, { useCallback } from 'react';
import Card from '@material-ui/core/Card';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useHover } from '../common/withHover';
import { EXPAND_FOOTNOTES_EVENT } from '../posts/PostsPage/CollapsedFootnotes';
import { hasCollapsedFootnotes, hasSidenotes } from '@/lib/betas';
import classNames from 'classnames';

const footnotePreviewStyles = (theme: ThemeType): JssStyles => ({
  hovercard: {
    padding: 16,
    ...theme.typography.body2,
    fontSize: "1.1rem",
    ...theme.typography.commentStyle,
    color: theme.palette.grey[800],
    maxWidth: 500,
    '& a': {
      color: theme.palette.primary.main,
    },
    
    "& .footnote-back-link": {
      display: "none",
    },
  },
  
  anchorHover: {
    background: theme.palette.greyAlpha(0.1),
  },

  sidenote: {
    "& .footnote-back-link": {
      display: "none",
    },
    paddingBottom: 24,
  },
  
  sidenoteHover: {
    background: theme.palette.greyAlpha(0.1),
  },
})

const FootnotePreview = ({classes, href, id, rel, children}: {
  classes: ClassesType,
  href: string,
  id?: string,
  rel?: string,
  children: React.ReactNode,
}) => {
  const { ContentStyles, SideItem, LWPopper } = Components
  
  const { eventHandlers: anchorEventHandlers, hover: anchorHovered, anchorEl } = useHover({
    eventProps: {
      pageElementContext: "linkPreview",
      hoverPreviewType: "DefaultPreview",
      href,
    },
  });
  const { eventHandlers: sidenoteEventHandlers, hover: sidenoteHovered } = useHover();
  const eitherHovered = anchorHovered || sidenoteHovered;
  
  let footnoteContentsNonempty = false;
  let footnoteHTML = "";
  
  // Get the contents of the linked footnote.
  // This has a try-catch-ignore around it because the link doesn't necessarily
  // make a valid CSS selector; eg there are some posts in the DB with internal
  // links to anchors like "#fn:1" which will crash this because it has a ':' in
  // it.
  try {
    // Grab contents of linked footnote if it exists
    footnoteHTML = document.querySelector(href)?.innerHTML || "";
    // Check whether the footnotehas nonempty contents
    footnoteContentsNonempty = !!Array.from(document.querySelectorAll(`${href} p`)).reduce((acc, p) => acc + p.textContent, "").trim();
  // eslint-disable-next-line no-empty
  } catch(e) { }
  
  // TODO: Getting the footnote content from the DOM didn't necessarily work;
  // for example if the page was only showing an excerpt (with the rest hidden
  // behind a Read More), it won't be available, and might require a separate
  // network request to get the rest of the post/comment. Unfortunately in this
  // context, figuring out what that network request *is* is pretty complicated;
  // it could be anything with a content-editable field in it, and that
  // information isn't wired to pass through the hover-preview system.

  const onClick = useCallback(() => {
    window.dispatchEvent(new CustomEvent(EXPAND_FOOTNOTES_EVENT, {detail: href}));
  }, [href]);

  return (
    <span>
      {footnoteContentsNonempty && <LWPopper
        open={anchorHovered}
        anchorEl={anchorEl}
        placement="bottom-start"
        allowOverflow
      >
        <Card>
          <ContentStyles contentType="postHighlight" className={classes.hovercard}>
            <div dangerouslySetInnerHTML={{__html: footnoteHTML || ""}} />
          </ContentStyles>
        </Card>
      </LWPopper>}
      
      {hasSidenotes && <SideItem>
        <div
          {...sidenoteEventHandlers}
          className={classNames(
            classes.sidenote,
            eitherHovered && classes.sidenoteHover
          )}
        >
          <ContentStyles contentType="postHighlight">
            <div dangerouslySetInnerHTML={{__html: footnoteHTML || ""}} />
          </ContentStyles>
        </div>
      </SideItem>}

      <a
        {...anchorEventHandlers}
        href={hasCollapsedFootnotes ? undefined : href}
        id={id}
        rel={rel}
        onClick={onClick}
        className={classNames(eitherHovered && classes.anchorHover)}
      >
        {children}
      </a>
    </span>
  );
}

const FootnotePreviewComponent = registerComponent('FootnotePreview', FootnotePreview, {
  styles: footnotePreviewStyles,
});

declare global {
  interface ComponentTypes {
    FootnotePreview: typeof FootnotePreviewComponent
  }
}
