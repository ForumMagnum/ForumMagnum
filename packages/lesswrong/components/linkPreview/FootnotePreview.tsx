import React from 'react';
import Card from '@material-ui/core/Card';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useHover } from '../common/withHover';
import { EXPAND_FOOTNOTES_EVENT } from '../posts/PostsPage/CollapsedFootnotes';

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
})

const FootnotePreview = ({classes, href, onsite=false, id, rel, children}: {
  classes: ClassesType,
  href: string,
  onsite?: boolean,
  id?: string,
  rel?: string,
  children: React.ReactNode,
}) => {
  const { ContentStyles, LWPopper } = Components
  
  const { eventHandlers, hover, anchorEl } = useHover({
    eventProps: {
      pageElementContext: "linkPreview",
      hoverPreviewType: "DefaultPreview",
      href,
      onsite,
    },
  });
  
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
  
  return (
    <span {...eventHandlers}>
      {footnoteContentsNonempty && <LWPopper
        open={hover}
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

      <a
        href={href}
        id={id}
        rel={rel}
        onClick={() => window.dispatchEvent(new Event(EXPAND_FOOTNOTES_EVENT))}
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
