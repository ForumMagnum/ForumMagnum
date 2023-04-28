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
  },
})

const FootnotePreview = ({classes, href, innerHTML, onsite=false, id, rel}: {
  classes: ClassesType,
  href: string,
  innerHTML: string,
  onsite?: boolean,
  id?: string,
  rel?: string
}) => {
  const { LWPopper } = Components
  
  const { eventHandlers, hover, anchorEl } = useHover({
    pageElementContext: "linkPreview",
    hoverPreviewType: "DefaultPreview",
    href,
    onsite
  });
  
  let footnoteContentsNonempty = false;
  let footnoteMinusBacklink = "";
  
  // Get the contents of the linked footnote.
  // This has a try-catch-ignore around it because the link doesn't necessarily
  // make a valid CSS selector; eg there are some posts in the DB with internal
  // links to anchors like "#fn:1" which will crash this because it has a ':' in
  // it.
  try {
    // Grab contents of linked footnote if it exists
    const footnoteHTML = document.querySelector(href)?.innerHTML;
    // Remove the backlink anchor tag. Note that this regex is deliberately very narrow;
    // a more permissive regex would introduce risk of XSS, since we're not re-validating
    // after this transform.
    footnoteMinusBacklink = footnoteHTML?.replace(/<a href="#fnref[a-zA-Z0-9]*">\^<\/a>/g, '') || "";
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
          <div className={classes.hovercard}>
            <div dangerouslySetInnerHTML={{__html: footnoteMinusBacklink || ""}} />
          </div>
        </Card>
      </LWPopper>}

      <a
        href={href}
        dangerouslySetInnerHTML={{__html: innerHTML}}
        id={id}
        rel={rel}
        onClick={() => window.dispatchEvent(new Event(EXPAND_FOOTNOTES_EVENT))}
      />
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
