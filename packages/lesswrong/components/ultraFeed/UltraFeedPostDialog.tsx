import React, { useEffect } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import DialogContent from "@material-ui/core/DialogContent";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useSingle } from "../../lib/crud/withSingle";
import { Link } from "../../lib/reactRouterWrapper";
import { postGetLink } from "@/lib/collections/posts/helpers";
import classnames from "classnames";
import { useMulti } from "@/lib/crud/withMulti";

const styles = defineStyles("UltraFeedPostDialog", (theme: ThemeType) => ({
  dialogContent: {
    padding: 20,
    paddingTop: 0,
    [theme.breakpoints.down('sm')]: {
      padding: 10,
      paddingTop: 0,
    }
  },
  titleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    marginBottom: 8,
  },
  title: { 
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '1.4rem',
    fontWeight: 600,
    opacity: 0.8,
    lineHeight: 1.15,
    textWrap: 'balance',
    width: '100%',
    '&:hover': {
      opacity: 0.9,
      textDecoration: 'none',
    },
    [theme.breakpoints.down('sm')]: {
      fontSize: '1.6rem',
    },
  },
  closeButton: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[500],
    fontWeight: 600,
    fontSize: "1.1rem",
    cursor: 'pointer',
    padding: 8,
    '&:hover': {
      color: theme.palette.grey[700],
    },
  },
  dialogPaper: {
    maxWidth: 765,
    margin: 4
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    padding: "40px 0",
  },
  voteContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    fontFamily: `${theme.palette.fonts.sansSerifStack} !important`,
  },
  voteBottom: {
    position: 'relative',
    fontSize: 42,
    textAlign: 'center',
    display: 'inline-block',
    marginLeft: 'auto',
    marginRight:'auto',
    marginBottom: 40,
    "@media print": { display: "none" },
    '& h1': {
      fontFamily: `${theme.palette.fonts.sansSerifStack} !important`,
    }
  },
  scrolledHighlight: {
    backgroundColor: `${theme.palette.primary.light}4c`,
  },
}));


function escapeRegExp(s: string) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Build a fuzzy regex that matches the snippet text allowing for 
 * arbitrary whitespace and HTML tags between words
 */
function snippetRegex(snippet: string): RegExp {
  // Collapse whitespace inside snippet first
  const compact = snippet.trim().replace(/\s+/g, ' ');

  // Allow ANY run of non‑letter/number characters (punctuation, whitespace) or HTML tags between words.
  // This covers commas, periods, line‑breaks as <br>, etc.
  const between = '(?:[^\\p{L}\\p{N}]+|<[^>]+>)+';

  const pattern = compact
    .split(' ')                  // individual words (already cleaned by generator)
    .map(escapeRegExp)           // escape special regex chars (should be none but safe)
    .join(between);

  return new RegExp(pattern, 'iu');
}

/**
 * Wraps the first occurrence of a snippet in the HTML with a span
 * Handles whitespace differences between truncated and full HTML
 */
function wrapSnippet(html: string, snippet?: string, anchorId = 'snippet-anchor', highlightClass = '') {
  if (!snippet || !html) return html;

  const directRegex = snippetRegex(snippet);
  const directMatch = directRegex.exec(html);
  
  if (directMatch) {
    // Found a precise location – wrap it and return.
    const startIdx = directMatch.index;
    const matchText = directMatch[0];

    return (
      html.slice(0, startIdx) +
      `<span id="${anchorId}" class="${highlightClass}">` +
      matchText +
      '</span>' +
      html.slice(startIdx + matchText.length)
    );
  }
  
  // If no match, return original HTML
  return html;
}

type UltraFeedPostDialogProps = {
  postId?: string;
  post?: never; // Use a fragment that includes contents.html
  onClose: () => void;
  snippet?: string;
} | {
  postId?: never;
  post: UltraFeedPostFragment; // Use a fragment that includes contents.html
  onClose: () => void;
  snippet?: string;
}

const UltraFeedPostDialog = ({
  postId,
  post,
  onClose,
  snippet,
}: UltraFeedPostDialogProps) => {
  const { LWDialog, FeedContentBody, Loading, CommentsListSection, PostsVote } = Components;
  const classes = useStyles(styles);

  const { document: fetchedPost, loading: loadingPost } = useSingle({
    documentId: postId,
    collectionName: "Posts",
    fragmentName: "UltraFeedPostFragment",
    skip: !!post, 
  });

  const { results: comments, loading: isCommentsLoading, totalCount: commentsTotalCount } = useMulti({
    terms: {
      view: "postCommentsTop",
      postId: postId ?? post?._id,
      limit: 50, // Consider pagination later if needed
    },
    collectionName: "Comments",
    fragmentName: "CommentsList",
    skip: !postId,
    enableTotal: true,
  });

  const fullPost = post ?? fetchedPost;
  const isLoading = loadingPost && !post;

  const anchorId = 'snippet-anchor';
  const htmlWithAnchor = wrapSnippet(fullPost?.contents?.html ?? '', snippet, anchorId, classes.scrolledHighlight);

  useEffect(() => {
    if (!snippet) return;
    const scrollAnchorId = anchorId;

    // Delay slightly to ensure DOM rendered
    const timer = setTimeout(() => {
      const anchorEl = window.document.getElementById(scrollAnchorId);
      const container = anchorEl?.closest('.MuiDialogContent-root') as HTMLElement | null;

      if (anchorEl && container) {
        const isScrollable = container.scrollHeight > container.clientHeight;

        if (isScrollable) {
          const elementRect = anchorEl.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const elementTopRelativeToContainer = elementRect.top - containerRect.top;
          const desiredScrollTop = container.scrollTop + elementTopRelativeToContainer - (container.clientHeight * 0.1);

          container.scrollTo({ top: desiredScrollTop, behavior: 'smooth' });
        } else {
          // eslint-disable-next-line no-console
          console.log('[UltraFeedPostDialog scroll] Container not scrollable', { scrollHeight: container.scrollHeight, clientHeight: container.clientHeight });
        }
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [snippet, classes.scrolledHighlight, htmlWithAnchor]);

  return (
    <LWDialog
      open={true}
      onClose={onClose}
      fullWidth
      dialogClasses={{
        paper: classes.dialogPaper,
      }}
    >
      <DialogContent className={classes.dialogContent}>
        {loadingPost && <div className={classes.loadingContainer}><Loading /></div>}
        {!loadingPost && fullPost && <div>
          <div className={classes.titleContainer}>
            <Link to={postGetLink(fullPost)} className={classes.title} onClick={(e) => { e.stopPropagation(); onClose(); /* Close dialog on click, allow navigation */ }}>
              {fullPost.title}
            </Link>
            <span className={classes.closeButton} onClick={onClose}>
              Close
            </span>
          </div>
            {isLoading && (
              <div className={classes.loadingContainer}>
                <Loading />
              </div>
            )}
            {!isLoading && htmlWithAnchor && (
              <FeedContentBody
                post={fullPost}
                html={htmlWithAnchor}
                wordCount={fullPost.contents?.wordCount || 0}
                linkToDocumentOnFinalExpand={false} // Not applicable
                hideSuffix={true} // No suffix needed
              />
            )}
            {!isLoading && !fullPost.contents?.html && (
              <div>Post content not available.</div>
            )}
        </div>}
        <div className={classes.voteBottom}>
          {fullPost && <PostsVote post={fullPost} useHorizontalLayout={false} isFooter />}
        </div>
        {isCommentsLoading && !isLoading && <Loading />}
        {!isCommentsLoading && comments && (
          <CommentsListSection 
            post={fullPost}
            comments={comments ?? []}
            totalComments={commentsTotalCount ?? 0}
            commentCount={(comments ?? []).length}
            loadMoreComments={() => {}}
            loadingMoreComments={false}
            highlightDate={undefined}
            setHighlightDate={() => {}}
            hideDateHighlighting={true}
            newForm={true}
          />
        )}
      </DialogContent>
    </LWDialog>
  );
};

const UltraFeedPostDialogComponent = registerComponent("UltraFeedPostDialog", UltraFeedPostDialog);

export default UltraFeedPostDialogComponent;

declare global {
  interface ComponentTypes {
    UltraFeedPostDialog: typeof UltraFeedPostDialogComponent
  }
}
