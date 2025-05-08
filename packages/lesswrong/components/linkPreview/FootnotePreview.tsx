import React, { useCallback, useEffect, useState } from 'react';
import { Card } from "@/components/widgets/Paper";
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useHover } from '../common/withHover';
import { EXPAND_FOOTNOTES_EVENT } from '../posts/PostsPage/CollapsedFootnotes';
import { hasCollapsedFootnotes, hasSidenotes } from '@/lib/betas';
import classNames from 'classnames';
import { parseDocumentFromString } from '@/lib/domParser';
import { usePostsPageContext } from '../posts/PostsPage/PostsPageContext';
import { RIGHT_COLUMN_WIDTH_WITH_SIDENOTES, sidenotesHiddenBreakpoint } from '../posts/PostsPage/PostsPage';
import { useIsAboveBreakpoint } from '../hooks/useScreenWidth';
import { useHasSideItemsSidebar, SideItem } from '../contents/SideItems';
import { useDialog } from '../common/withDialog';
import { isRegularClick } from "@/components/posts/TableOfContents/TableOfContentsList";
import { isMobile } from '@/lib/utils/isMobile';
import { ContentStyleType, ContentStyles } from '../common/ContentStyles';
import { FootnoteDialog } from "./FootnoteDialog";
import { SideItemLine } from "../contents/SideItemLine";
import { LWPopper } from "../common/LWPopper";
import { ContentItemBody } from "../common/ContentItemBody";

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
    "& .footnote-back-link, & a[href^=\"#fnref\"]": {
      display: "none",
    },

    width: RIGHT_COLUMN_WIDTH_WITH_SIDENOTES,
    padding: 12,
    
    "& .footnote-content": {
      width: "auto !important",
      maxWidth: "100%",
      
      "& ul:first-child, & ol:first-child": {
        marginTop: 0,
      },
    },
  },

  footnoteMobileIndicator: {
    display: "none",
    [sidenotesHiddenBreakpoint(theme)]: {
      display: "inline-block",
    },
  },
  
  lineColor: {
    background: theme.palette.sideItemIndicator.footnote,
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
    maxWidth: "100%",
    maxHeight: 200,
    overflow: "hidden",

    color: theme.palette.greyAlpha(0.65),
    "$sidenoteHover &": {
      color: theme.palette.text.normal,
    },
    "& li": {
      fontSize: "0.9em",
      lineHeight: "1.4em",
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
    background: theme.palette.background.sidenoteBackground,
    borderRadius: 3,
    
    "& $sidenoteContent": {
      maxHeight: "unset",
    },
    "& $overflowFade": {
      display: "none",
    },
  },
})

const FootnotePreviewInner = ({classes, href, id, rel, contentStyleType="postHighlight", children}: {
  classes: ClassesType<typeof footnotePreviewStyles>,
  href: string,
  id?: string,
  rel?: string,
  contentStyleType?: ContentStyleType,
  children: React.ReactNode,
}) => {
  const { openDialog } = useDialog();
  const [disableHover, setDisableHover] = useState(false);
  const { eventHandlers: anchorEventHandlers, hover: anchorHovered, anchorEl } = useHover({
    eventProps: {
      pageElementContext: "linkPreview",
      hoverPreviewType: "DefaultPreview",
      href,
    },
  });
  const { eventHandlers: sidenoteEventHandlers, hover: sidenoteHovered } = useHover();
  const eitherHovered = anchorHovered || sidenoteHovered;
  const [footnoteHTML,setFootnoteHTML] = useState<string|null>(null);
  
  useEffect(() => {
    const extractedFootnoteHTML = extractFootnoteHTML(href);
    if (extractedFootnoteHTML) {
      setFootnoteHTML((oldFootnoteHTML) => oldFootnoteHTML ?? extractedFootnoteHTML);
    }
  }, [href]);
  
  // TODO: Getting the footnote content from the DOM didn't necessarily work;
  // for example if the page was only showing an excerpt (with the rest hidden
  // behind a Read More), it won't be available, and might require a separate
  // network request to get the rest of the post/comment. Unfortunately in this
  // context, figuring out what that network request *is* is pretty complicated;
  // it could be anything with a content-editable field in it, and that
  // information isn't wired to pass through the hover-preview system.

  const onClick = useCallback((ev: React.MouseEvent) => {
    if (isRegularClick(ev) && isMobile() && footnoteHTML !== null) {
      setDisableHover(true);
      openDialog({
        name: "FootnoteDialog",
        contents: ({onClose}) => <FootnoteDialog
          onClose={onClose}
          footnoteHTML={footnoteHTML}
        />
      });
      ev.preventDefault();
    } else {
      window.dispatchEvent(new CustomEvent(EXPAND_FOOTNOTES_EVENT, {detail: href}));
    }
  }, [href, footnoteHTML, openDialog]);
  
  const postPageContext = usePostsPageContext();
  const post = postPageContext?.fullPost ?? postPageContext?.postPreload;
  const sidenotesDisabledOnPost = post?.disableSidenotes;
  const screenIsWideEnoughForSidenotes = useIsAboveBreakpoint("lg");
  const hasSideItemsSidebar = useHasSideItemsSidebar();
  const sidenoteIsVisible = hasSidenotes && hasSideItemsSidebar && !sidenotesDisabledOnPost && screenIsWideEnoughForSidenotes;

  return (
    <span>
      {footnoteHTML !== null && !disableHover && <LWPopper
        open={anchorHovered && !sidenoteIsVisible}
        anchorEl={anchorEl}
        placement="bottom-start"
        allowOverflow
      >
        <Card>
          <ContentStyles contentType={contentStyleType} className={classes.hovercard}>
            <div dangerouslySetInnerHTML={{__html: footnoteHTML || ""}} />
          </ContentStyles>
        </Card>
      </LWPopper>}
      
      {hasSidenotes && !sidenotesDisabledOnPost && footnoteHTML !== null &&
        <SideItem options={{offsetTop: -6}}>
          <div
            {...sidenoteEventHandlers}
            className={classNames(
              classes.sidenote,
              eitherHovered && classes.sidenoteHover
            )}
          >
            <SidenoteDisplay
              footnoteHref={href}
              footnoteHTML={footnoteHTML}
              contentStyleType={contentStyleType}
              classes={classes}
            />
          </div>
          <span className={classes.footnoteMobileIndicator} onClick={onClick}>
            <SideItemLine colorClass={classes.lineColor}/>
          </span>
        </SideItem>
      }

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

function extractFootnoteHTML(href: string): string|null {
  // Get the contents of the linked footnote.
  // This has a try-catch-ignore around it because the link doesn't necessarily
  // make a valid CSS selector; eg there are some posts in the DB with internal
  // links to anchors like "#fn:1" which will crash this because it has a ':' in
  // it.
  try {
    // `href` is (probably) an anchor link, of the form `#fn1234`. Since it starts
    // with a hash it can also be used as a CSS selector, which finds its contents
    // in the footer.
    const footnoteContentsElement = document.querySelector(href);
    const footnoteHTML = footnoteContentsElement?.innerHTML ?? null;
    
    
    if (footnoteContentsElement && isFootnoteContentsNonempty(footnoteContentsElement)) {
      return footnoteHTML;
    } else {
      return null;
    }
  // eslint-disable-next-line no-empty
  } catch(e) {
    return null;
  }
}

const isFootnoteContentsNonempty = (footnoteContentsElement: Element): boolean => {
  // Decide whether the footnote is nonempty. This is tricky because while there
  // are consistently formatted footnotes created by our editor plugins, there
  // are also wacky irregular footnotes present in imported HTML and similar
  // things. Eg https://www.lesswrong.com/posts/ACGeaAk6KButv2xwQ/the-halo-effect
  // We can't just condition on the footnote containing non-whitespace text,
  // because footnotes sometimes have their number and backlink in a place that
  // would be mistaken for their body. Our current heuristic is that a footnote
  // is nonempty if it contains at least one <p> which contains non-whitespace
  // text, which might false-negative on rare cases like an image-only footnote
  // but which seems to work in practice.
  return !!footnoteContentsElement
    && !!Array.from(footnoteContentsElement.querySelectorAll("p, li"))
      .reduce((acc, p) => acc + p.textContent, "").trim();
}

const SidenoteDisplay = ({footnoteHref, footnoteHTML, contentStyleType, classes}: {
  footnoteHref: string,
  footnoteHTML: string,
  contentStyleType: ContentStyleType,
  classes: ClassesType<typeof footnotePreviewStyles>,
}) => {
  const footnoteIndex = getFootnoteIndex(footnoteHref, footnoteHTML);

  return (
    <ContentStyles contentType={contentStyleType}>
      <span className={classes.sidenoteWithIndex}>
        {footnoteIndex !== null && <span className={classes.sidenoteIndex}>
          {footnoteIndex}{"."}
        </span>}
        <div className={classes.sidenoteContent}>
          <ContentItemBody dangerouslySetInnerHTML={{__html: footnoteHTML}} />
          <div className={classes.overflowFade} />
        </div>
      </span>
    </ContentStyles>
  );
}

function getFootnoteId(href: string, html: string): string|null {
  if (href.match(/^#fn.*/)) {
    return href.substring(3);
  } else {
    const { document: parsedFootnote } = parseDocumentFromString(html);
    const footnoteId = parsedFootnote
      .getElementsByClassName("footnote-back-link")
      ?.[0]
      ?.getAttribute("data-footnote-id")
    return footnoteId;
  }
}

/**
 * Given a footnote link (in the form of a link-anchor, and inner HTML for the
 * footnote reference), return a footnote-number (or null if we can't find one).
 * Because of different versions of the CkEditor footnote plugin, imported
 * posts, etc, we have several different strategies for doing this:
 *  - Find the footnote reference, and use the data-footnote-index prop
 *  - Find the footnote in the page footer, and if it's inside an <ol> tag, use
 *    its position within that tag's list of children
 * 
 * We specifically look for footnotes with an OL parent that has the "footnotes" class
 * to avoid using versions of the footnote that's present from the ckEditor edit form (present for quick-switching).
 */
function getFootnoteIndex(href: string, html: string): string|null {
  // Parse the footnote for its data-footnote-id, use that to find the footnote
  // reference (which is a span that wraps around the part of the footnote that
  // got hover-preview-ified), and take the data-footnote-index from that to
  // display.
  const footnoteId = getFootnoteId(href, html);
  if (!footnoteId) return null;

  const footnoteRef = document.getElementById("fnref"+footnoteId);
  const fromFootnoteIndexAttribute = footnoteRef?.getAttribute("data-footnote-index");
  
  if (fromFootnoteIndexAttribute) {
    return fromFootnoteIndexAttribute;
  }
  
  const allMatchingElements = Array.from(document.querySelectorAll(`#fn${footnoteId}`));
  
  // Try to find element with an OL parent with the "footnotes" class
  // This prevents using the version of the footnote from within quick-switch edit form that has a div parent instead of an ol
  const footnoteWithOlParent = allMatchingElements.find(el => 
    el.parentElement?.tagName === 'OL' &&
    el.parentElement.classList.contains('footnotes')
  );
  
  if (footnoteWithOlParent) {
    const parentElement = footnoteWithOlParent.parentElement;
    
    const olStartAttr = parentElement?.getAttribute("start");
    const olStart = olStartAttr ? parseInt(olStartAttr) : 1;

    let numPrecedingLiElements = 0;
    for (let i=0; i<(parentElement?.children.length ?? 0); i++) {
      const elem = parentElement?.children.item(i);
      if (elem === footnoteWithOlParent) {
        break;
      }
      if (elem?.tagName === 'LI') {
        numPrecedingLiElements++;
      }
    }
    
    return (olStart + numPrecedingLiElements).toString();
  }
  
  return null;
}

export const FootnotePreview = registerComponent('FootnotePreview', FootnotePreviewInner, {
  styles: footnotePreviewStyles,
});

declare global {
  interface ComponentTypes {
    FootnotePreview: typeof FootnotePreview
  }
}
