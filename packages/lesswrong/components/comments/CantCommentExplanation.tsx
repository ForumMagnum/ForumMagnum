import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import Users from '../../lib/collections/users/collection';
import classNames from 'classnames';
import { forumTypeSetting } from '../../lib/instanceSettings';

const styles = theme => ({
  root: {
    padding: "1em 0",
  },
  emailLink: {
    textDecoration: "underline !important",
  
    "&:hover": {
      color: "rgba(0,0,0,.5)"
    }
  },
});

const CantCommentExplanation = ({post, classes}: {
  post: PostsDetails,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  return (
    <div className={classNames("i18n-message", "author_has_banned_you", classes.root)}>
      { Users.blockedCommentingReason(currentUser, post)}
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
