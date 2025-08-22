import React from 'react'
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { Link } from '../../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../../lib/collections/posts/helpers';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import { Typography } from "../../common/Typography";
import ForumIcon from "../../common/ForumIcon";
import LWTooltip from "../../common/LWTooltip";

export const LW_POST_TITLE_FONT_SIZE = "3.75rem";

export const postPageTitleStyles = (theme: ThemeType) => ({
  ...theme.typography.display3,
  ...theme.typography.postStyle,
  ...theme.typography.headerStyle,
  marginTop: theme.isFriendlyUI ? 5 : 0,
  marginLeft: 0,
  marginBottom: theme.isFriendlyUI ? 12 : 0,
  color: theme.palette.text.primary,
  textWrap: theme.isBookUI ? "balance" : undefined,
  [theme.breakpoints.down('sm')]: theme.isFriendlyUI
    ? {
      fontSize: '2.3rem',
      marginTop: 20,
    }
    : {
      fontSize: '3.5rem',
    },
  ...(theme.isFriendlyUI
    ? {
      fontSize: '3rem',
    }
    : {
      fontSize: LW_POST_TITLE_FONT_SIZE,
      lineHeight: '1.1',
  }),
  [theme.breakpoints.down('xs')]: theme.isFriendlyUI
    ? {
      fontSize: '2.3rem',
    }
    : {
      fontSize: '2.5rem',
    },
})

const styles = defineStyles("PostsPageTitle", (theme: ThemeType) => ({
  root: {
    ...postPageTitleStyles(theme),
    ...(theme.isFriendlyUI && {
      lineHeight: 1.25,
      fontWeight: 700
    }),
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
}));

const PostsPageTitle = ({post, className}: {
  post: PostsDetails|PostsList,
  className?: string
}) => {
  const classes = useStyles(styles);
  const sourcePostRelations = ('sourcePostRelations' in post) ? post.sourcePostRelations : null;
  const parentPost = sourcePostRelations?.filter(rel => !!rel.sourcePost)?.[0]?.sourcePost;
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
      <Typography variant="display3" className={classNames(classes.root, className)}>
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

export default registerComponent('PostsPageTitle', PostsPageTitle);



