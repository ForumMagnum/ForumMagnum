import React, { useCallback, useContext, useState } from 'react';
import Card from '@material-ui/core/Card';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useHover } from '../common/withHover';
import { EXPAND_FOOTNOTES_EVENT } from '../posts/PostsPage/CollapsedFootnotes';
import { hasCollapsedFootnotes, hasSidenotes } from '@/lib/betas';
import classNames from 'classnames';
import { SideItemContentContext } from '../contents/SideItems';
import { truncate } from '@/lib/editor/ellipsize';
import { parseDocumentFromString } from '@/lib/domParser';
import { usePostsPageContext } from '../posts/PostsPage/PostsPageContext';
import { RIGHT_COLUMN_WIDTH_WITH_SIDENOTES, sidenotesHiddenBreakpoint } from '../posts/PostsPage/PostsPage';
import { useIsAboveBreakpoint } from '../hooks/useScreenWidth';

const footnotePreviewStyles = (theme: ThemeType) => ({
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
    border: `2px solid ${theme.palette.primary.dark}`,
    margin: -2,
    borderRadius: 2,
  },

  sidenote: {
    [sidenotesHiddenBreakpoint(theme)]: {
      display: "none",
    },
    "& .footnote-back-link": {
      display: "none",
    },

    width: RIGHT_COLUMN_WIDTH_WITH_SIDENOTES,
    padding: 12,
    
    "& .footnote-content": {
      width: "auto !important",
    },
  },

  sidenoteWithIndex: {
    display: "flex",
  },

  sidenoteIndex: {
    display: "inline-block",
    verticalAlign: "top",
    fontSize: 15,
    marginRight: 0,
    whiteSpace: "nowrap",
    lineHeight: "19px",

    color: theme.palette.greyAlpha(0.65),
    "$sidenoteHover &": {
      color: theme.palette.text.normal,
    },
  },
  
  sidenoteContent: {
    display: "inline-block",
    position: "relative",
    verticalAlign: "top",
    fontSize: 15,
    lineHeight: "19px",
    maxHeight: 200,
    overflowY: "hidden",

    color: theme.palette.greyAlpha(0.65),
    "$sidenoteHover &": {
      color: theme.palette.text.normal,
    },
  },
  
  overflowFade: {
    position: "absolute",
    top: 160,
    height: 40,
    width: "100%",
    background: `linear-gradient(0deg,${theme.palette.background.pageActiveAreaBackground},transparent)`,
  },
  
  sidenoteHover: {
    background: theme.palette.greyAlpha(0.1),
    //background: theme.palette.background.pageActiveAreaBackground,
    
    "& $sidenoteContent": {
      maxHeight: "unset",
      overflowY: "visible",
    },
    "& $overflowFade": {
      display: "none",
    },
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
  
  const postPageContext = usePostsPageContext();
  const post = postPageContext?.fullPost ?? postPageContext?.postPreload;
  const sidenotesDisabledOnPost = post?.disableSidenotes;
  const screenIsWideEnoughForSidenotes = useIsAboveBreakpoint("md");
  const sidenoteIsVisible = hasSidenotes && !sidenotesDisabledOnPost && screenIsWideEnoughForSidenotes;

  return (
    <span>
      {footnoteContentsNonempty && <LWPopper
        open={anchorHovered && !sidenoteIsVisible}
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
      
      {hasSidenotes && !sidenotesDisabledOnPost && <SideItem options={{offsetTop: -6}}>
        <div
          {...sidenoteEventHandlers}
          className={classNames(
            classes.sidenote,
            eitherHovered && classes.sidenoteHover
          )}
        >
          <SidenoteDisplay
            footnoteHTML={footnoteHTML}
            classes={classes}
          />
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

const SidenoteDisplay = ({footnoteHTML, classes}: {
  footnoteHTML: string,
  classes: ClassesType,
}) => {
  const { ContentStyles } = Components;
  const sideItemContext = useContext(SideItemContentContext);
  const [isTruncated,setIsTruncated] = useState(true);
  
  const maybeTruncatedHTML = isTruncated
    ? truncate(footnoteHTML, 20, "words", "")
    : footnoteHTML;
  const isActuallyTruncated = (maybeTruncatedHTML !== footnoteHTML);
  
  function expand() {
    setIsTruncated(false);
    sideItemContext?.resizeItem();
  }
  
  // Parse the footnote for its data-footnote-id, use that to find the footnote
  // reference (which is a span that wraps around the part of the footnote that
  // got hover-preview-ified), and take the data-footnote-index from that to
  // display.
  const { document: parsedFootnote } = parseDocumentFromString(footnoteHTML);
  const footnoteId = parsedFootnote
    .getElementsByClassName("footnote-back-link")
    ?.[0]
    ?.getAttribute("data-footnote-id")
  const footnoteIndex = footnoteId
    ? (document.getElementById("fnref"+footnoteId)
        ?.getAttribute("data-footnote-index"))
    : undefined;

  return (
    <ContentStyles contentType="postHighlight">
      <span className={classes.sidenoteWithIndex} onClick={ev => expand()}>
        <span className={classes.sidenoteIndex}>{footnoteIndex}{"."}</span>
        {/*<div className={classes.sidenoteContent} dangerouslySetInnerHTML={{__html: maybeTruncatedHTML}} />*/}
        <div className={classes.sidenoteContent}>
          <div dangerouslySetInnerHTML={{__html: footnoteHTML}} />
          <div className={classes.overflowFade} />
        </div>
      </span>
    </ContentStyles>
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
