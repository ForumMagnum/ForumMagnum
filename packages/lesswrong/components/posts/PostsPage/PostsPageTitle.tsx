import React from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { Link } from '../../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../../lib/collections/posts/helpers';
import * as _ from 'underscore';
import { isEAForum } from '../../../lib/instanceSettings';

export const postPageTitleStyles = (theme: ThemeType): JssStyles => ({
  ...theme.typography.display3,
  ...theme.typography.postStyle,
  ...theme.typography.headerStyle,
  marginTop: isEAForum ? 5 : 0,
  marginLeft: 0,
  marginBottom: isEAForum ? theme.spacing.unit : 0,
  color: theme.palette.text.primary,
  [theme.breakpoints.down('sm')]: isEAForum
    ? {
      fontSize: '2.1rem',
      marginTop: 20,
    }
    : {
      fontSize: '2.5rem',
    },
  ...(isEAForum
    ? {
      fontSize: '2.5rem',
    }
    : {}),
})

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...postPageTitleStyles(theme)
  },
  draft: {
    color: theme.palette.text.dim4
  },
  question: {
    color: theme.palette.text.dim3,
    display: "block",
  },
  link: {
    '&:hover': {
      opacity: "unset"
    }
  }
})

const PostsPageTitle = ({classes, post}: {
  classes: ClassesType,
  post: PostsDetails,
}) => {
  const parentPost = _.filter(post.sourcePostRelations, rel => !!rel.sourcePost)?.[0]?.sourcePost
  const { Typography } = Components;
  
  return (
    <div>
      {post.question && !parentPost && <Typography variant="title">
        <Link to="/questions" className={classes.question}>
          [ Question ]
        </Link>
      </Typography>}
      {post.question && parentPost && <Typography variant="title">
        <Link to={postGetPageUrl(parentPost)} className={classes.question}>
          [ Parent Question — {parentPost.title} ]
        </Link>
      </Typography>}
      <Typography variant="display3" className={classes.root}>
        <Link to={postGetPageUrl(post)} className={classes.link}>{post.draft && <span className={classes.draft}>[Draft] </span>}
        {post.title}</Link>
      </Typography>
    </div>
  )
}


const PostsPageTitleComponent = registerComponent('PostsPageTitle', PostsPageTitle, {styles});

declare global {
  interface ComponentTypes {
    PostsPageTitle: typeof PostsPageTitleComponent
  }
}
