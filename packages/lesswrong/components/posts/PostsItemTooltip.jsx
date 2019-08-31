import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles'
import { truncate } from '../../lib/editor/ellipsize';
import withUser from "../common/withUser";
import { postHighlightStyles, commentBodyStyles } from '../../themes/stylePiping'
import classNames from 'classnames';
import { Posts } from '../../lib/collections/posts';
import CommentIcon from '@material-ui/icons/ModeComment';

const styles = theme => ({
  root: {
    width: 305,
    backgroundColor: "white",
    [theme.breakpoints.up('sm')]: {
      marginTop: theme.spacing.unit,
      marginBottom: theme.spacing.unit,
    },
    ...postHighlightStyles(theme),
    padding: theme.spacing.unit*1.5,
    border: "solid 1px rgba(0,0,0,.2)",
    boxShadow: "0 0 10px rgba(0,0,0,.2)",
    '& img': {
      maxHeight: "200px"
    },
  },
  hideOnMobile: {
    [theme.breakpoints.down('sm')]: {
      display: "none"
    },
  },
  wide: {
    [theme.breakpoints.up('sm')]: {
      width: 550,
    },
  },
  tooltipInfo: {
    fontStyle: "italic",
    ...commentBodyStyles(theme),
    color: theme.palette.grey[600]
  },
  highlight: {
    marginTop: theme.spacing.unit*2.5,
    marginBottom: theme.spacing.unit*2.5,
    wordBreak: 'break-word',
    fontSize: "1.1rem",
    '& img': {
      display:"none"
    },
    '& h1': {
      fontSize: "1.2rem"
    },
    '& h2': {
      fontSize: "1.2rem"
    },
    '& h3': {
      fontSize: "1.1rem"
    },
    '& hr': {
      display: "none"
    },
    '& a': {
      // hide link-styling because it's infuriating that you can't actually click on them
      color: "unset",
      textDecorationColor: "none",
      textShadow: "none",
      backgroundImage: "none",
      underline: "none",
      '&:hover': {
        color: "unset",
        opacity: "unset"
      }
    },
  },
  commentIcon: {
    height: 15,
    width: 15,
    color: theme.palette.grey[400],
    position: "relative",
    top: 3,
    marginRight: 6,
    marginLeft: 12
  },
  comments: {
    [theme.breakpoints.up('sm')]: {
      float: "right"
    },
    [theme.breakpoints.down('xs')]: {
      display: "inline-block",
      marginRight: theme.spacing.unit*2,
    },
  },
  karma: {
    [theme.breakpoints.up('sm')]: {
      float: "right"
    },
    [theme.breakpoints.down('xs')]: {
      display: "inline-block",
      float: "left"
    },
  }
})

const getPostCategory = (post) => {
  const categories = [];
  const postOrQuestion = post.question ? "Question" : "Post"

  if (post.isEvent) categories.push(`Event`)
  if (post.curatedDate) categories.push(`Curated ${postOrQuestion}`)
  if (post.af) categories.push(`AI Alignment Forum ${postOrQuestion}`);
  if (post.meta) categories.push(`Meta ${postOrQuestion}`)
  if (post.frontpageDate && !post.curatedDate && !post.af) categories.push(`Frontpage ${postOrQuestion}`)
  
  if (categories.length > 0)
    return categories.join(', ');
  else
    return post.question ? `Question` : `Personal Blogpost`
}

const PostsItemTooltip = ({ showTitle, post, classes, showAuthor, showCategory, showKarma, showComments, wide=false, hideOnMobile=false, truncateLimit=600 }) => {
  const { PostsUserAndCoauthors, PostsTitle, ContentItemBody } = Components
  const { wordCount = 0, htmlHighlight = "" } = post.contents || {}

  const highlight = truncate(htmlHighlight, truncateLimit)
  const renderCommentCount = showComments && (Posts.getCommentCount(post) > 0)
  return <div className={classNames(classes.root, {[classes.wide]: wide, [classes.hideOnMobile]: hideOnMobile})}>
    {showTitle && <PostsTitle post={post} tooltip={false}/>}
    <div className={classes.tooltipInfo}>
      { showCategory && getPostCategory(post)}
      { showAuthor && post.user && <span> by <PostsUserAndCoauthors post={post} simple/></span>}
      { renderCommentCount && <span className={classes.comments}>
        <CommentIcon className={classes.commentIcon}/> 
          {Posts.getCommentCountStr(post)}
      </span>}
      { showKarma && <span className={classes.karma}>{Posts.getKarma(post)} karma</span>}
    </div>
    <div className={classes.highlight} dangerouslySetInnerHTML={{__html:highlight}} />
    {(wordCount > 0) && <div className={classes.tooltipInfo}>
      {wordCount} words (approx. {Math.ceil(wordCount/300)} min read)
    </div>}
  </div>

}

registerComponent('PostsItemTooltip', PostsItemTooltip, withUser,
  withStyles(styles, { name: "PostsItemTooltip" })
);
