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
  marginBottom: isEAForum ? 12 : 0,
  color: theme.palette.text.primary,
  [theme.breakpoints.down('sm')]: isEAForum
    ? {
      fontSize: '2.3rem',
      marginTop: 20,
    }
    : {
      fontSize: '2.5rem',
    },
  ...(isEAForum
    ? {
      fontSize: '3rem',
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
  },
  lastWord: {
    whiteSpace: "nowrap",
  },
  linkIcon: {
    color: theme.palette.grey[500],
    marginLeft: 14,
    fontSize: "0.8em",
  }
})

const PostsPageTitle = ({classes, post}: {
  classes: ClassesType,
  post: PostsDetails,
}) => {
  const parentPost = _.filter(post.sourcePostRelations, rel => !!rel.sourcePost)?.[0]?.sourcePost
  const { Typography, ForumIcon } = Components;
  const showLinkIcon = post.url && isEAForum;
  
  const mostOfTitle = post.title.split(" ").slice(0, -1).join(" ");
  const lastWordOfTitle = post.title.split(" ").slice(-1)[0];
  
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
        <Link to={postGetPageUrl(post)} className={classes.link}>
          {post.draft && <span className={classes.draft}>[Draft] </span>}
          {mostOfTitle}{mostOfTitle && " "}
          <span className={classes.lastWord}>
            {lastWordOfTitle}
            {showLinkIcon && <><ForumIcon className={classes.linkIcon} icon="BoldLink" /></>}
          </span>
        </Link>
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
