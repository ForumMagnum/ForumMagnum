import React from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { Link } from '../../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../../lib/collections/posts/helpers';
import { isFriendlyUI } from '../../../themes/forumTheme';

export const postPageTitleStyles = (theme: ThemeType) => ({
  ...theme.typography.display3,
  ...theme.typography.postStyle,
  ...theme.typography.headerStyle,
  marginTop: isFriendlyUI ? 5 : 0,
  marginLeft: 0,
  marginBottom: isFriendlyUI ? 12 : 0,
  color: theme.palette.text.primary,
  [theme.breakpoints.down('sm')]: isFriendlyUI
    ? {
      fontSize: '2.3rem',
      marginTop: 20,
    }
    : {
      fontSize: '2.5rem',
    },
  ...(isFriendlyUI
    ? {
      fontSize: '3rem',
    }
    : {}),
})

const styles = (theme: ThemeType) => ({
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
    display: "inline-block",
  },
  linkIcon: {
    color: theme.palette.grey[500],
    marginLeft: 14,
    fontSize: "0.8em",
  },
  dialogueIcon: {
    color: theme.palette.grey[500],
    marginLeft: 14,
    fontSize: "1em",
    transform: "translateY(5px)",
  },
})

const PostsPageTitle = ({classes, post}: {
  post: PostsDetails|PostsList,
  classes: ClassesType<typeof styles>,
}) => {
  const sourcePostRelations = ('sourcePostRelations' in post) ? post.sourcePostRelations : null;
  const parentPost = sourcePostRelations?.filter(rel => !!rel.sourcePost)?.[0]?.sourcePost;
  const { Typography, ForumIcon, LWTooltip } = Components;
  const showLinkIcon = post.url && isFriendlyUI;
  const showDialogueIcon = post.collabEditorDialogue && isFriendlyUI;

  const words = post.title.trim().split(/\s+/);
  const mostOfTitle = words.slice(0, -1).join(" ");
  const lastWordOfTitle = words[words.length - 1];

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
            {showLinkIcon &&
              <LWTooltip title="Link post">
                <ForumIcon className={classes.linkIcon} icon="BoldLink" />
              </LWTooltip>
            }
            {showDialogueIcon &&
              <LWTooltip title="Dialogue">
                <ForumIcon className={classes.dialogueIcon} icon="ChatBubbleLeftRight" />
              </LWTooltip>
            }
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
