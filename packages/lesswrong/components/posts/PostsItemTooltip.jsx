import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles'
import { truncate } from '../../lib/editor/ellipsize';
import withUser from "../common/withUser";

const styles = theme => ({
  tooltip:{
    position: "relative",
    left: -30,
  },
  root: {
    [theme.breakpoints.up('sm')]: {
      marginTop: theme.spacing.unit,
      marginBottom: theme.spacing.unit,
    },
  },
  tooltipInfo: {
    fontStyle: "italic"
  },
  tooltipTitle: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit*1.5,
    fontWeight: 600,
    fontSize: "1.2rem",
    [theme.breakpoints.down('sm')]: {
      display: "none"
    },
  },
  highlight: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit*2,
    fontSize: "1.1rem",
    [theme.breakpoints.down('sm')]: {
      display: "none"
    },
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
  },
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

const PostsItemTooltip = ({ post, classes, author, }) => {
  const { PostsUserAndCoauthors } = Components
  const postCategory = getPostCategory(post)
  const { wordCount = 0, htmlHighlight = "" } = post.contents || {}

  const highlight = truncate(htmlHighlight, 600)

  return <div className={classes.root}>
    <div className={classes.tooltipInfo}>
      {postCategory}
      { author && post.user && <span> by <PostsUserAndCoauthors post={post}/></span>}
    </div>
    <div dangerouslySetInnerHTML={{__html:highlight}}
      className={classes.highlight} />
    {(wordCount > 0) && <div className={classes.tooltipInfo}>
      {wordCount} words (approx. {Math.ceil(wordCount/300)} min read)
    </div>}
  </div>

}

registerComponent('PostsItemTooltip', PostsItemTooltip, withUser,
  withStyles(styles, { name: "PostsItemTooltip" })
);
