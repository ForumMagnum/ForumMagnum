import { registerComponent, Components } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import { truncate } from '../../lib/editor/ellipsize';
import { postHighlightStyles, commentBodyStyles } from '../../themes/stylePiping'
import { postGetPageUrl, postGetKarma, postGetCommentCountStr } from '../../lib/collections/posts/helpers';
import Card from '@material-ui/core/Card';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { Link } from '../../lib/reactRouterWrapper';
import { sortTags } from '../tagging/FooterTagList';

export const POST_PREVIEW_WIDTH = 400

export const highlightSimplifiedStyles = {
  '& img': {
    display:"none"
  },
  '& hr': {
    display: "none"
  }
}

export const highlightStyles = (theme: ThemeType) => ({
  ...postHighlightStyles(theme),
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
  ...highlightSimplifiedStyles
})

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: POST_PREVIEW_WIDTH,
    position: "relative",
    padding: theme.spacing.unit*1.5,
    paddingBottom: 0,
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
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  title: {
    marginBottom: -6,
  },
  tooltipInfo: {
    marginLeft: 2,
    fontStyle: "italic",
    ...commentBodyStyles(theme),
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
    marginLeft: -13,
    marginRight: -13,
    marginBottom: -9
  },
  bookmark: {
    marginTop: -4,
    paddingRight: 4
  },
  continue: {
    ...postHighlightStyles(theme),
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
  karmaIcon: {
    marginRight: -2,
    marginTop: 2,
    height: 15,
    color: "rgba(0,0,0,.19)"
  },
  commentIcon: {
    marginLeft: 6,
    marginTop: 2,
    // position: "relative",
    marginRight: -1,
    height: 13,
    color: "rgba(0,0,0,.19)"
  }
})

const getPostCategory = (post: PostsBase) => {
  const categories: Array<string> = [];

  if (post.isEvent) categories.push(`Event`)
  if (post.curatedDate) categories.push(`Curated Post`)
  if (post.af) categories.push(`AI Alignment Forum Post`);
  if (post.meta) categories.push(`Meta Post`)
  if (post.frontpageDate && !post.curatedDate && !post.af) categories.push(`Frontpage Post`)

  if (categories.length > 0)
    return categories.join(', ');
  else
    return post.question ? `Question` : `Personal Blogpost`
}

const PostsPreviewTooltip = ({ postsList, post, classes, comment }: {
  postsList?: boolean,
  post: PostsList|SunshinePostsList|null,
  classes: ClassesType,
  comment?: any,
}) => {
  const { PostsUserAndCoauthors, PostsTitle, ContentItemBody, CommentsNode, BookmarkButton, LWTooltip } = Components
  const [expanded, setExpanded] = useState(false)

  if (!post) return null

  const { wordCount = 0, htmlHighlight = "" } = post.contents || {}

  const highlight = post.customHighlight?.html || htmlHighlight

  const renderWordCount = !comment && (wordCount > 0)
  const truncatedHighlight = truncate(highlight, expanded ? 200 : 100, "words", `... <span class="expand">(more)</span>`)

  const renderedComment = comment || post.bestAnswer

  const tags = sortTags(post.tags, t=>t)

  return <AnalyticsContext pageElementContext="hoverPreview">
      <Card className={classes.root}>
        <div className={classes.header}>
          <div>
            <div className={classes.title}>
              <PostsTitle post={post} wrap showIcons={false} />
            </div>
            <div className={classes.tooltipInfo}>
              { postsList && <span> 
                {getPostCategory(post)}
                {(tags?.length > 0) && " – "}
                {tags?.map((tag, i) => <span key={tag._id}>{tag.name}{(i !== (post.tags?.length - 1)) ? ",  " : ""}</span>)}
                {renderWordCount && <span>{" "}<span className={classes.wordCount}>({wordCount} words)</span></span>}
              </span>}
              { !postsList && <>
                {post.user && <LWTooltip title="Author">
                  <PostsUserAndCoauthors post={post} simple/>
                </LWTooltip>}
                <div className={classes.metadata}>
                  <LWTooltip title={`${postGetKarma(post)} karma`}>
                    <span className={classes.smallText}>{postGetKarma(post)} karma</span>
                  </LWTooltip>
                  <LWTooltip title={`${postGetCommentCountStr(post)}`}>
                    <span className={classes.smallText}>{postGetCommentCountStr(post)}</span>
                  </LWTooltip>
                </div>
              </>}
            </div>
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
                }}
                truncated
                comment={renderedComment}
                hoverPreview
                forceNotSingleLine
              />
            </div>
          : <div onClick={() => setExpanded(true)}>
              <ContentItemBody
                className={classes.highlight}
                dangerouslySetInnerHTML={{__html: truncatedHighlight }}
                description={`post ${post._id}`}
              />
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
