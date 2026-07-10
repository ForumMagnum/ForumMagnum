import React, { useState } from 'react';
import { truncate } from '../../../lib/editor/ellipsize';
import { postGetPageUrl, postGetKarma, postGetCommentCountStr } from '../../../lib/collections/posts/helpers';
import { Card } from "@/components/widgets/Paper";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { Link } from '../../../lib/reactRouterWrapper';
import { POST_PREVIEW_ELEMENT_CONTEXT, getPostPreviewWidth } from './helpers';
import type { PostsPreviewTooltipProps } from './PostsPreviewTooltip';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import PostsUserAndCoauthors from "../PostsUserAndCoauthors";
import PostsTitle from "../PostsTitle";
import { ContentItemBody } from "../../contents/ContentItemBody";
import CommentsNode from "../../comments/CommentsNode";
import BookmarkButton from "../BookmarkButton";
import FormatDate from "../../common/FormatDate";
import Loading from "../../vulcan-core/Loading";
import ContentStyles from "../../common/ContentStyles";
import EventTime from "../../localGroups/EventTime";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const PostWithDialogueMessageQuery = gql(`
  query LWPostsPreviewTooltip1($documentId: String, $dialogueMessageId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostWithDialogueMessage
      }
    }
  }
`);

const HighlightWithHashQuery = gql(`
  query LWPostsPreviewTooltip($documentId: String, $hash: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...HighlightWithHash
      }
    }
  }
`);

export const highlightSimplifiedStyles = {
  '& img': {
    display:"none"
  },
  '& hr': {
    display: "none"
  }
}

const highlightStyles = (theme: ThemeType) => ({
  marginTop: 20,
  marginBottom: 12,
  marginRight: 4,
  wordBreak: 'break-word',
  fontSize: "1.1rem",
  '& h1': {
    fontSize: "1.2rem"
  },
  '& h2': {
    fontSize: "1.2rem"
  },
  '& h3': {
    fontSize: "1.1rem"
  },
  '& li': {
    fontSize: "1.1rem"
  },
  '& .dialogue-message-header': {
    position: 'relative !important',
  },
  ...highlightSimplifiedStyles
})

const styles = defineStyles('LWPostsPreviewTooltip', (theme: ThemeType) => ({
  root: {
    width: getPostPreviewWidth(),
    position: "relative",
    '& img': {
      maxHeight: "200px"
    },
    [theme.breakpoints.down('xs')]: {
      display: "none"
    },
    '& .expand': {
      color: theme.palette.grey[600],
      fontSize: "1rem",
      cursor: "pointer"
    }
  },
  postPreview: {
    maxHeight: 450,
    padding: 12,
    paddingBottom: 0,
    paddingTop: 0
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    paddingBottom: 0,
  },
  headerMain: {
    // Flex item holding title + metadata line. Needs explicit minWidth: 0
    // so descendants are allowed to shrink below their intrinsic width --
    // otherwise the ellipsis truncation on the username never triggers.
    minWidth: 0,
    flex: 1,
  },
  title: {
    marginBottom: -6,
  },
  tooltipInfo: {
    marginLeft: 2,
    ...theme.typography.italic,
    fontSize: "1.1rem",
    color: theme.palette.grey[600],
    display: "flex",
    alignItems: "center",
    // Allow the username child to shrink below its intrinsic width so the
    // ellipsis truncation below actually kicks in instead of overflowing.
    minWidth: 0,
  },
  userAndCoauthors: {
    // Long display names previously wrapped mid-word, pushing the karma /
    // comments / date metadata onto a second line (sometimes in the middle of
    // the username itself). Constrain this wrapper to a single line with
    // ellipsis truncation so unusually long names stay clipped inline.
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  highlight: {
    ...highlightStyles(theme)
  },
  comment: {
    marginTop: 8,
  },
  bookmark: {
    marginTop: -4,
    paddingRight: 4
  },
  continue: {
    color: theme.palette.grey[500],
    fontSize: "1rem",
    marginBottom: 8,
  },
  wordCount: {
    display: "inline-block"
  },
  metadata: {
    marginLeft: 12,
    paddingTop: 2,
    // Keep "N karma / N comments / Nd" on a single line even when the
    // sibling username takes up most of the available width.
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  smallText: {
    fontSize: ".9rem",
    color: theme.palette.grey[500],
    marginRight: 8
  },
}))

const LWPostsPreviewTooltip = ({postsList, post, hash, comment, dialogueMessageInfo}: PostsPreviewTooltipProps) => {
  const classes = useStyles(styles);
  const [expanded, setExpanded] = useState(false)

  const { loading, data: dataHighlight } = useQuery(HighlightWithHashQuery, {
    variables: { documentId: post?.fmCrosspost?.foreignPostId ?? post?._id, hash },
    skip: !post || (!hash && !!post.contents),
    fetchPolicy: "cache-first",
  });
  const postWithHighlight = dataHighlight?.post?.result;

  const { dialogueMessageId, dialogueMessageContents } = dialogueMessageInfo ?? {}

  const { data: dataPostDialogueMessage } = useQuery(PostWithDialogueMessageQuery, {
    variables: { documentId: post?.fmCrosspost?.foreignPostId ?? post?._id, dialogueMessageId },
    skip: !post || !dialogueMessageId,
    fetchPolicy: "cache-first",
  });
  const postWithDialogueMessage = dataPostDialogueMessage?.post?.result;

  if (!post) return null
  
  const { wordCount = 0, htmlHighlight = "" } = post.contents || {}

  const highlightContents = postWithHighlight?.contents?.htmlHighlightStartingAtHash || post.customHighlight?.html || htmlHighlight

  let highlight;
  if (post.collabEditorDialogue) {
    highlight = postWithDialogueMessage?.dialogueMessageContents ?? dialogueMessageContents ?? highlightContents
  } else if (post.debate) {
    highlight = post.dialogTooltipPreview
  } else {
    highlight = highlightContents
  }

  const renderWordCount = !comment && !post.isEvent && ((wordCount ?? 0) > 0)
  const truncatedHighlight = truncate(highlight, expanded ? 200 : 100, "words", `... <span class="expand">(more)</span>`)

  const renderedComment = comment || post.bestAnswer
  
  let eventLocation = post.onlineEvent ? <div>Online event</div> : null
  if (post.isEvent && post.location) {
    eventLocation = <div>{post.location}</div>
  }

  const postTags = post.tags?.slice(0,2)

  return <AnalyticsContext pageElementContext={POST_PREVIEW_ELEMENT_CONTEXT}>
      <Card className={classes.root}>
        <div className={classes.header}>
          <div className={classes.headerMain}>
            <div className={classes.title}>
              <PostsTitle post={post} wrap showIcons={false} />
            </div>
            <ContentStyles contentType="comment" className={classes.tooltipInfo}>
              { postsList && <span>
                {post.startTime && <EventTime post={post} />}
                {eventLocation}
                {postTags?.map((tag, i) => <span key={tag?._id}>{tag?.name}{(i !== (postTags?.length - 1)) ? ",  " : ""}</span>)}
                {renderWordCount && <span>{" "}<span className={classes.wordCount}>({wordCount} words)</span></span>}
              </span>}
              { !postsList && <>
                {post.user && <div className={classes.userAndCoauthors}><PostsUserAndCoauthors post={post}/></div>}
                <div className={classes.metadata}>
                  <span className={classes.smallText}>{postGetKarma(post)} karma</span>
                  <span className={classes.smallText}>{postGetCommentCountStr(post)}</span>
                  <span className={classes.smallText}>
                    <FormatDate date={post.postedAt}/>
                  </span>
                </div>
              </>}
            </ContentStyles>
          </div>
          { !postsList && <div className={classes.bookmark}>
            <BookmarkButton documentId={post._id} collectionName="Posts" initial={post.isBookmarked}/>
          </div>}
        </div>
        {renderedComment
          ? <div className={classes.comment}>
              <CommentsNode
                treeOptions={{
                  post,
                  hideReply: true,
                  forceNotSingleLine: true,
                }}
                truncated
                comment={renderedComment}
                hoverPreview
                forceUnCollapsed
                noAutoScroll
              />
            </div>
          : loading
            ? <Loading/>
            : <div onClick={() => setExpanded(true)} className={classes.postPreview}>
                <ContentStyles contentType="postHighlight" className={classes.highlight}>
                  <ContentItemBody
                    dangerouslySetInnerHTML={{__html: truncatedHighlight }}
                    description={`post ${post._id}`}
                  />
                </ContentStyles>
                {expanded && <Link to={postGetPageUrl(post)}><div className={classes.continue} >
                  (Continue Reading)
                </div></Link>}
              </div>
        }
    </Card>
  </AnalyticsContext>

}

export default LWPostsPreviewTooltip


