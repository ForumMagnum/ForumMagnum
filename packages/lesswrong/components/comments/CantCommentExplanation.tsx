import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { userBlockedCommentingReason } from '../../lib/collections/users/helpers';
import classNames from 'classnames';
import { forumTypeSetting } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: "1em 0",
  },
  emailLink: {
    textDecoration: "underline !important",
  
    "&:hover": {
      color: theme.palette.link.dim,
    }
  },
});

const CantCommentExplanation = ({post, classes}: {
  post: PostsDetails,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const author = post.user;
  return (
    <div className={classNames("i18n-message", "author_has_banned_you", classes.root)}>
      { userBlockedCommentingReason(currentUser, post, author)}
      { forumTypeSetting.get() !== 'AlignmentForum' && <span>
        (Questions? Send an email to <a className={classes.emailLink} href="mailto:moderation@lesserwrong.com">moderation@lesserwrong.com</a>)
      </span> }
    </div>
  );
}

const CantCommentExplanationComponent = registerComponent(
  'CantCommentExplanation', CantCommentExplanation, {styles}
);

declare global {
  interface ComponentTypes {
    CantCommentExplanation: typeof CantCommentExplanationComponent,
  }
}
