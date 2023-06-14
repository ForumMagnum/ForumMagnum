import { registerComponent, Components } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import { truncate } from '../../lib/editor/ellipsize';
import { postGetPageUrl, postGetKarma, postGetCommentCountStr } from '../../lib/collections/posts/helpers';
import Card from '@material-ui/core/Card';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { Link } from '../../lib/reactRouterWrapper';
import { sortTags } from '../tagging/FooterTagList';
import { useSingle } from '../../lib/crud/withSingle';
import {useForeignApolloClient} from '../hooks/useForeignApolloClient';

export const POST_PREVIEW_WIDTH = 400

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
  ...highlightSimplifiedStyles
})

const styles = (theme: ThemeType): JssStyles => ({
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

  if (post.isEvent) categories.push(`Event`)
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

const PostsPreviewTooltip = ({ postsList, post, hash, classes, comment }: {
  postsList?: boolean,
  hash?: string|null,
  post: PostsList|SunshinePostsList|null,
  classes: ClassesType,
  comment?: any,
}) => {
  const { PostsUserAndCoauthors, PostsTitle, ContentItemBody, CommentsNode, BookmarkButton, LWTooltip, FormatDate, Loading, ContentStyles } = Components
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

  if (!post) return null
  
  const { wordCount = 0, htmlHighlight = "" } = post.contents || {}

  const highlight = post.debate
    ? post.dialogTooltipPreview
    : postWithHighlight?.contents?.htmlHighlightStartingAtHash || post.customHighlight?.html || htmlHighlight

  const renderWordCount = !comment && (wordCount > 0)
  const truncatedHighlight = truncate(highlight, expanded ? 200 : 100, "words", `... <span class="expand">(more)</span>`)

  const renderedComment = comment || post.bestAnswer

  const tags = sortTags(post.tags, t=>t)
  
  const postCategory: string|null = getPostCategory(post);

  return <AnalyticsContext pageElementContext="hoverPreview">
      <Card className={classes.root}>
        <div className={classes.header}>
          <div>
            <div className={classes.title}>
              <PostsTitle post={post} wrap showIcons={false} />
            </div>
            <ContentStyles contentType="comment" className={classes.tooltipInfo}>
              { postsList && <span> 
                {postCategory}
                {postCategory && (tags?.length > 0) && " – "}
                {tags?.map((tag, i) => <span key={tag._id}>{tag.name}{(i !== (post.tags?.length - 1)) ? ",  " : ""}</span>)}
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
            <BookmarkButton post={post}/>
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

const PostsPreviewTooltipComponent = registerComponent('PostsPreviewTooltip', PostsPreviewTooltip, {styles});

declare global {
  interface ComponentTypes {
    PostsPreviewTooltip: typeof PostsPreviewTooltipComponent
  }
}
