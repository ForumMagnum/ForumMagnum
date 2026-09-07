import React, { useState } from "react";
import type { Placement as PopperPlacementType } from "popper.js";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import PopperCard from "../common/PopperCard";
import LWClickAwayListener from "../common/LWClickAwayListener";
import { useMessages } from "../common/withMessages";
import { useTimezone } from "../common/withTimezone";
import { useTracking } from "../../lib/analyticsEvents";
import { defineStyles, useStyles } from "../hooks/useStyles";
import {
  getGoogleScholarSearchUrl,
  getPostBibtex,
  getPostCitation,
  getPostPlainTextCitation,
  getWaybackArchiveUrl,
  getWaybackSaveUrl,
  PostCitationSource,
} from "../../lib/collections/posts/citations";

const styles = defineStyles("CitePostPopover", (theme: ThemeType) => ({
  root: {
    width: 440,
    maxWidth: "calc(100vw - 32px)",
    maxHeight: "calc(100vh - 120px)",
    overflowY: "auto",
    padding: "12px 16px 16px",
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.text.normal,
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 12,
  },
  section: {
    marginBottom: 16,
    "&:last-child": {
      marginBottom: 0,
    },
  },
  sectionHeading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: theme.palette.grey[600],
    marginBottom: 4,
  },
  sectionActions: {
    display: "flex",
    gap: "4px",
    textTransform: "none",
    letterSpacing: 0,
    fontWeight: 400,
  },
  smallButton: {
    padding: "2px 8px",
    minWidth: 0,
    minHeight: 0,
    fontSize: 13,
    textTransform: "none",
  },
  citationText: {
    fontSize: 13,
    lineHeight: 1.5,
    padding: 10,
    background: theme.palette.grey[100],
    borderRadius: theme.borderRadius.small,
    overflowWrap: "anywhere",
    userSelect: "all",
  },
  bibtex: {
    fontFamily: theme.typography.code.fontFamily,
    fontSize: 11,
    lineHeight: 1.5,
    padding: 10,
    margin: 0,
    background: theme.palette.grey[100],
    borderRadius: theme.borderRadius.small,
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    userSelect: "all",
  },
  linkList: {
    margin: 0,
    paddingLeft: 18,
    fontSize: 13,
    lineHeight: 1.7,
  },
  link: {
    color: theme.palette.primary.main,
  },
  hint: {
    fontSize: 12,
    color: theme.palette.grey[600],
    marginTop: 4,
  },
}));

/**
 * The contents of the citation popover. Mounted fresh each time the popover
 * opens, so the "accessed" date reflects when it was opened.
 */
const CitePostPopoverContents = ({post}: {
  post: PostCitationSource,
}) => {
  const classes = useStyles(styles);
  const {flash} = useMessages();
  const {captureEvent} = useTracking();
  const {timezone} = useTimezone();
  const [accessedAt] = useState(() => new Date());

  // Use the reader's timezone so the cited date matches the date shown on the page
  const citation = getPostCitation(post, timezone);
  const plainText = getPostPlainTextCitation(citation);
  const bibtex = getPostBibtex(citation, post._id, accessedAt);
  const bibtexDownloadUrl = `/api/post/${post._id}/cite.bib`;

  const copy = (format: string, text: string) => {
    captureEvent("citePostCopied", {postId: post._id, format});
    navigator.clipboard.writeText(text).then(
      () => flash("Copied to clipboard"),
      () => flash("Failed to copy to clipboard"),
    );
  };

  const trackLink = (destination: string) => {
    captureEvent("citePostLinkClicked", {postId: post._id, destination});
  };

  return <div className={classes.root}>
    <div className={classes.title}>Cite this post</div>

    <div className={classes.section}>
      <div className={classes.sectionHeading}>
        <span>Plain text</span>
        <span className={classes.sectionActions}>
          <Button className={classes.smallButton} onClick={() => copy("plainText", plainText)}>Copy</Button>
        </span>
      </div>
      <div className={classes.citationText}>{plainText}</div>
    </div>

    <div className={classes.section}>
      <div className={classes.sectionHeading}>
        <span>BibTeX</span>
        <span className={classes.sectionActions}>
          <Button className={classes.smallButton} onClick={() => copy("bibtex", bibtex)}>Copy</Button>
          <Button
            className={classes.smallButton}
            href={bibtexDownloadUrl}
            onClick={() => trackLink("bibtexDownload")}
          >
            Download .bib
          </Button>
        </span>
      </div>
      <pre className={classes.bibtex}>{bibtex}</pre>
    </div>

    <div className={classes.section}>
      <div className={classes.sectionHeading}>
        <span>Google Scholar</span>
      </div>
      <ul className={classes.linkList}>
        <li>
          <a
            className={classes.link}
            href={getGoogleScholarSearchUrl(citation)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackLink("googleScholar")}
          >
            Find this post on Google Scholar
          </a>
        </li>
      </ul>
      <div className={classes.hint}>
        Post pages include Google Scholar citation metadata, so reference managers such as Zotero can import this post directly from its URL.
      </div>
    </div>

    <div className={classes.section}>
      <div className={classes.sectionHeading}>
        <span>Internet Archive</span>
      </div>
      <ul className={classes.linkList}>
        <li>
          <a
            className={classes.link}
            href={getWaybackArchiveUrl(citation.url)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackLink("waybackView")}
          >
            View the latest archived copy
          </a>
        </li>
        <li>
          <a
            className={classes.link}
            href={getWaybackSaveUrl(citation.url)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackLink("waybackSave")}
          >
            Archive the current version now
          </a>
        </li>
      </ul>
      <div className={classes.hint}>
        Citing an archived snapshot guarantees readers see the version you cited, even if the post is later edited.
      </div>
    </div>
  </div>;
};

/**
 * A popover offering ways to cite a post: a plain-text citation, a BibTeX
 * entry (copyable, or downloadable from /api/post/[id]/cite.bib), a Google
 * Scholar lookup, and Internet Archive links for a permanent snapshot of the
 * page. Anchored to the button whose menu opened it, and dismissed by
 * clicking anywhere else.
 */
const CitePostPopover = ({post, anchorEl, open, onClose, placement = "bottom-end"}: {
  post: PostCitationSource,
  anchorEl: HTMLElement | null,
  open: boolean,
  onClose: () => void,
  placement?: PopperPlacementType,
}) => {
  if (!open) return null;
  return <PopperCard open={open} anchorEl={anchorEl} placement={placement} allowOverflow flip>
    <LWClickAwayListener onClickAway={onClose}>
      <CitePostPopoverContents post={post} />
    </LWClickAwayListener>
  </PopperCard>;
};

export default CitePostPopover;
