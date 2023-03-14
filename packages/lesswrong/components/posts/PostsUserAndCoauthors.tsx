import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';
import ModeCommentIcon from '@material-ui/icons/ModeComment';
import classNames from 'classnames';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { postCoauthorIsPending } from '../../lib/collections/posts/helpers';
import type { PopperPlacementType } from '@material-ui/core/Popper'

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
  }
});

const getTopCommentAuthor = (post: PostsList | SunshinePostsList) => {
  if (post.question) {
    return post.bestAnswer?.user;
  }

  if (post.debate) {
    return post.unreadDebateComments;
  }

  return post.lastPromotedComment?.user;
};

const PostsUserAndCoauthors = ({post, abbreviateIfLong=false, classes, simple=false, tooltipPlacement = "left", newPromotedComments}: {
  post: PostsList | SunshinePostsList,
  abbreviateIfLong?: boolean,
  classes: ClassesType,
  simple?: boolean,
  tooltipPlacement?: PopperPlacementType,
  newPromotedComments?: boolean
}) => {
  const { UsersName, UserNameDeleted } = Components
  if (!post.user || post.hideAuthor)
    return <UserNameDeleted/>;

  if (post.debate) {
    const participants = [post.user, ...post.coauthors];
    const lastUnreadParticipant = post.unreadDebateComments?.lastParticipant;

    console.log({ unreadDebateComments: post.unreadDebateComments });

    let otherParticipants = participants;
    if (lastUnreadParticipant) {
      otherParticipants = participants.filter(participant => participant._id !== lastUnreadParticipant._id);
    }

    return <div className={abbreviateIfLong ? classes.lengthLimited : classes.lengthUnlimited}>
      {otherParticipants.map((participant, idx) =>
        <React.Fragment key={participant._id}>
          {idx !== 0 ? ", " : ""}<UsersName user={participant} simple={simple} tooltipPlacement={tooltipPlacement}/>
        </React.Fragment>
      )}
      {lastUnreadParticipant && <span className={classNames(classes.topCommentAuthor, {[classes.new]: newPromotedComments})}>
        {", "}<ModeCommentIcon className={classNames(classes.topAuthorIcon, {[classes.new]: newPromotedComments})}/>
        <UsersName user={lastUnreadParticipant} simple={simple} tooltipPlacement={tooltipPlacement} />
      </span>}
    </div>;
  }

  const topCommentAuthor = post.question ? post.bestAnswer?.user : post.lastPromotedComment?.user
  const renderTopCommentAuthor = (forumTypeSetting.get() && topCommentAuthor && topCommentAuthor._id != post.user._id)
  
  return <div className={abbreviateIfLong ? classes.lengthLimited : classes.lengthUnlimited}>
    {<UsersName user={post.user} simple={simple} tooltipPlacement={tooltipPlacement} />}
    {post.coauthors.filter(({ _id }) => !postCoauthorIsPending(post, _id)).map((coauthor) =>
      <React.Fragment key={coauthor._id}>
        {", "}<UsersName user={coauthor} simple={simple} tooltipPlacement={tooltipPlacement}/>
      </React.Fragment>
    )}
    {renderTopCommentAuthor && <span className={classNames(classes.topCommentAuthor, {[classes.new]: newPromotedComments})}>
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
