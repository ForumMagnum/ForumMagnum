import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';
import ModeCommentIcon from '@material-ui/icons/ModeComment';
import ForumIcon from '@material-ui/icons/Forum';
import classNames from 'classnames';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { postCoauthorIsPending } from '../../lib/collections/posts/helpers';
import type { PopperPlacementType } from '@material-ui/core/Popper'
import { usePostsUserAndCoauthors } from './usePostsUserAndCoauthors';

const styles = (theme: ThemeType): JssStyles => ({
  lengthLimited: {
    maxWidth: 310,
    textOverflow: "ellipsis",
    overflowX: "hidden",
    textAlign: "right",
    [theme.breakpoints.down('xs')]: {
      maxWidth: 160
    },
  },
  lengthUnlimited: {
    display: "inline",
  },
  topCommentAuthor: {
    color: theme.palette.grey[500],
    fontSize: ".95rem"
  },
  topAuthorIcon: {
    width: 12,
    height: 12,
    color: theme.palette.icon.topAuthor,
    position: "relative",
    top: 2,
    marginRight: 4,
    marginLeft: 2,
  },
  new: {
    color: theme.palette.primary.main
  },
  unreadDebateComments: {
    display: 'flex'
  },
  unreadDebateCommentCount: {
    paddingLeft: 4
  },
  unreadDebateCommentsIcon: {
    height: 14,
    position: 'relative',
    top: 2
  }
});

const PostsUserAndCoauthors = ({post, abbreviateIfLong=false, classes, simple=false, tooltipPlacement = "left", newPromotedComments}: {
  post: PostsList | SunshinePostsList,
  abbreviateIfLong?: boolean,
  classes: ClassesType,
  simple?: boolean,
  tooltipPlacement?: PopperPlacementType,
  newPromotedComments?: boolean
}) => {
  const {isAnon, topCommentAuthor, authors} = usePostsUserAndCoauthors(post);

  const { UsersName, UserNameDeleted } = Components

  if (post.debate) {
    const { unreadDebateCommentCount } = post;

    return (
      <div className={classes.unreadDebateComments}>
        <div className={abbreviateIfLong ? classes.lengthLimited : classes.lengthUnlimited}>
          {authors.map((participant, idx) =>
            <React.Fragment key={participant._id}>
              {idx !== 0 ? ", " : ""}<UsersName user={participant} simple={simple} tooltipPlacement={tooltipPlacement}/>
            </React.Fragment>
          )}
        </div>
        {unreadDebateCommentCount && <div className={classNames(classes.unreadDebateCommentCount, classes.new)}>
          <ForumIcon className={classes.unreadDebateCommentsIcon}/>
          {unreadDebateCommentCount}
        </div>}
      </div>
    );
  }

  if (isAnon)
    return <UserNameDeleted/>;

  return <div className={abbreviateIfLong ? classes.lengthLimited : classes.lengthUnlimited}>
    {authors.map((author, i) =>
      <React.Fragment key={author._id}>
        {i > 0 ? ", " : ""}
        <UsersName user={author} simple={simple} tooltipPlacement={tooltipPlacement}/>
      </React.Fragment>
    )
    }
    {topCommentAuthor && <span className={classNames(classes.topCommentAuthor, {[classes.new]: newPromotedComments})}>
      {", "}<ModeCommentIcon className={classNames(classes.topAuthorIcon, {[classes.new]: newPromotedComments})}/>
      <UsersName user={topCommentAuthor || undefined} simple={simple} tooltipPlacement={tooltipPlacement} />
    </span>}
  </div>;
};

const PostsUserAndCoauthorsComponent = registerComponent("PostsUserAndCoauthors", PostsUserAndCoauthors, {styles});

declare global {
  interface ComponentTypes {
    PostsUserAndCoauthors: typeof PostsUserAndCoauthorsComponent
  }
}
