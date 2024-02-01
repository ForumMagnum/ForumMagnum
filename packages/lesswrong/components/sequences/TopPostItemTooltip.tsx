import React, { useState } from 'react';
import Card from '@material-ui/core/Card';
import { POST_PREVIEW_ELEMENT_CONTEXT, POST_PREVIEW_WIDTH } from '../posts/PostsPreviewTooltip/helpers';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import { truncate } from '../../lib/editor/ellipsize';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';

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

    color: theme.palette.text.normal,
    position: "relative",
    lineHeight: "1.7rem",
    fontFamily: theme.typography.postStyle.fontFamily,
    zIndex: theme.zIndexes.postItemTitle,
    [theme.breakpoints.down('xs')]: {
      paddingLeft: 2,
    },
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    alignItems: "center",
    ...theme.typography.postsItemTitle,
    [theme.breakpoints.down('xs')]: {
      whiteSpace: "unset",
      lineHeight: "1.8rem",
    },
    marginRight: theme.spacing.unit,
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

type TopPostItemTooltipProps = {
  post: PostsTopItemInfo,
  classes: ClassesType,
};

const TopPostItemTooltip = ({
  post,
  classes,
}: TopPostItemTooltipProps) => {
  const { ContentItemBody, Loading, ContentStyles } = Components
  const [expanded, setExpanded] = useState(false)

  const {document: postWithHighlight, loading} = useSingle({
    collectionName: "Posts",
    fragmentName: "HighlightWithHash",
    documentId: post?._id,
    skip: !post || !!post.contents,
    fetchPolicy: "cache-first",
    extraVariables: { hash: "String" },
    extraVariablesValues: { hash: null },
  });

  if (!post) return null
  
  const { wordCount = 0, htmlHighlight = "" } = post.contents || {}

  const highlightContents = postWithHighlight?.contents?.htmlHighlightStartingAtHash || post.customHighlight?.html || htmlHighlight

  const renderWordCount = (wordCount ?? 0) > 0;
  const truncatedHighlight = truncate(highlightContents, expanded ? 200 : 100, "words", `... <span class="expand">(more)</span>`)

  // const postCategory: string|null = getPostCategory(post);

  return <AnalyticsContext pageElementContext={POST_PREVIEW_ELEMENT_CONTEXT}>
      <Card className={classes.root}>
        <div className={classes.header}>
          <div>
            <div className={classes.title}>
              <Link to={postGetPageUrl(post)}>{post.title}</Link>
            </div>
            <ContentStyles contentType="comment" className={classes.tooltipInfo}>
              <span>
                {/* {post.startTime && <EventTime post={post} />} */}
                {/* {eventLocation} */}
                {/* {postCategory}
                {postCategory && (tags?.length > 0) && " – "}
                {tags?.map((tag, i) => <span key={tag._id}>{tag.name}{(i !== (post.tags?.length - 1)) ? ",  " : ""}</span>)} */}
                {renderWordCount && <span>{" "}<span className={classes.wordCount}>({wordCount} words)</span></span>}
              </span>
            </ContentStyles>
          </div>
        </div>
        {loading
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

const TopPostItemTooltipComponent = registerComponent('TopPostItemTooltip', TopPostItemTooltip, {styles});

declare global {
  interface ComponentTypes {
    TopPostItemTooltip: typeof TopPostItemTooltipComponent
  }
}
