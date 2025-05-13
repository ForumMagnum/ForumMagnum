import { registerComponent } from '../../../lib/vulcan-lib/components';
import React, { useState } from 'react';
import { truncate } from '../../../lib/editor/ellipsize';
import { postGetPageUrl, postGetKarma, postGetCommentCountStr } from '../../../lib/collections/posts/helpers';
import { Card } from "@/components/widgets/Paper";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { Link } from '../../../lib/reactRouterWrapper';
import { useSingle } from '../../../lib/crud/withSingle';
import { useForeignApolloClient } from '../../hooks/useForeignApolloClient';
import { POST_PREVIEW_ELEMENT_CONTEXT, POST_PREVIEW_WIDTH } from './helpers';
import type { PostsPreviewTooltipProps } from './PostsPreviewTooltip';
import PostsUserAndCoauthors from "../PostsUserAndCoauthors";
import PostsTitle from "../PostsTitle";
import ContentItemBody from "../../common/ContentItemBody";
import CommentsNodeInner from "../../comments/CommentsNode";
import BookmarkButton from "../BookmarkButton";
import FormatDate from "../../common/FormatDate";
import Loading from "../../vulcan-core/Loading";
import ContentStyles from "../../common/ContentStyles";
import EventTime from "../../localGroups/EventTime";

export const highlightSimplifiedStyles = {
  '& img': {
    display:"none"
  },
  '& hr': {
    display: "none"
  }
}

const highlightStyles = (theme: ThemeType) => ({
  marginTop: theme.spacing.unit*2.5,
  marginBottom: theme.spacing.unit*1.5,
  marginRight: theme.spacing.unit/2,
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

const styles = (theme: ThemeType) => ({
  root: {
    width: POST_PREVIEW_WIDTH,
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
    padding: theme.spacing.unit*1.5,
    paddingBottom: 0,
    paddingTop: 0
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.unit*1.5,
    paddingBottom: 0,
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
    alignItems: "center"
  },
  highlight: {
    ...highlightStyles(theme)
  },
  comment: {
    marginTop: theme.spacing.unit,
  },
  bookmark: {
    marginTop: -4,
    paddingRight: 4
  },
  continue: {
    color: theme.palette.grey[500],
    fontSize: "1rem",
    marginBottom: theme.spacing.unit,
  },
  wordCount: {
    display: "inline-block"
  },
  metadata: {
    marginLeft: 12,
    paddingTop: 2
  },
  smallText: {
    fontSize: ".9rem",
    color: theme.palette.grey[500],
    marginRight: theme.spacing.unit
  },
})

const getPostCategory = (post: PostsBase) => {
  const categories: Array<string> = [];

  if (post.isEvent) return null
  if (post.curatedDate) categories.push(`Curated Post`)
  if (post.af) categories.push(`AI Alignment Forum Post`);
  if (post.frontpageDate && !post.curatedDate && !post.af) categories.push(`Frontpage Post`)

  if (categories.length > 0)
    return categories.join(', ');
  else if (post.question)
    return "Question";
  else if (post.reviewedByUserId)
    return `Personal Blogpost`
  else
    return null;
}

type LWPostsPreviewTooltipProps = PostsPreviewTooltipProps & {
  classes: ClassesType<typeof styles>,
}

const LWPostsPreviewTooltip = ({
  postsList,
  post,
  hash,
  comment,
  dialogueMessageInfo,
  classes,
}: LWPostsPreviewTooltipProps) => {
  const [expanded, setExpanded] = useState(false)

  const foreignApolloClient = useForeignApolloClient();
  const isForeign = post?.fmCrosspost?.isCrosspost && !post.fmCrosspost.hostedHere && !!post.fmCrosspost.foreignPostId;
  const {document: postWithHighlight, loading} = useSingle({
    collectionName: "Posts",
    fragmentName: "HighlightWithHash",
    documentId: post?.fmCrosspost?.foreignPostId ?? post?._id,
    skip: !post || (!hash && !!post.contents),
    fetchPolicy: "cache-first",
    extraVariables: { hash: "String" },
    extraVariablesValues: {hash},
    apolloClient: isForeign ? foreignApolloClient : undefined,
  });

  const { dialogueMessageId, dialogueMessageContents } = dialogueMessageInfo ?? {}

  const {document: postWithDialogueMessage} = useSingle({
    collectionName: "Posts",
    fragmentName: "PostWithDialogueMessage",
    documentId: post?.fmCrosspost?.foreignPostId ?? post?._id,
    skip: !post || !dialogueMessageId,
    fetchPolicy: "cache-first",
    extraVariables: { dialogueMessageId: "String" },
    extraVariablesValues: {dialogueMessageId},
    apolloClient: isForeign ? foreignApolloClient : undefined,
  });

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
          <div>
            <div className={classes.title}>
              <PostsTitle post={post} wrap showIcons={false} />
            </div>
            <ContentStyles contentType="comment" className={classes.tooltipInfo}>
              { postsList && <span>
                {post.startTime && <EventTime post={post} />}
                {eventLocation}
                {postTags.map((tag, i) => <span key={tag._id}>{tag.name}{(i !== (postTags?.length - 1)) ? ",  " : ""}</span>)}
                {renderWordCount && <span>{" "}<span className={classes.wordCount}>({wordCount} words)</span></span>}
              </span>}
              { !postsList && <>
                {post.user && <PostsUserAndCoauthors post={post}/>}
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
            <BookmarkButton documentId={post._id} collectionName="Posts"/>
          </div>}
        </div>
        {renderedComment
          ? <div className={classes.comment}>
              <CommentsNodeInner
                treeOptions={{
                  post,
                  hideReply: true,
                  forceNotSingleLine: true,
                }}
                truncated
                comment={renderedComment}
                hoverPreview
                forceUnCollapsed
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

export default registerComponent('LWPostsPreviewTooltip', LWPostsPreviewTooltip, {styles});


