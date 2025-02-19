import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { userBlockedCommentingReason } from '../../lib/collections/users/helpers';
import classNames from 'classnames';
import { moderationEmail } from '../../lib/publicSettings';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
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
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const author = post.user;
  const email = moderationEmail.get()
  if (isFriendlyUI && post.shortform) {
    return null;
  }
  return (
    <div className={classNames("i18n-message", "author_has_banned_you", classes.root)}>
      { userBlockedCommentingReason(currentUser, post, author)}{" "}
      { email && <span>
        (Questions? Send an email to <a className={classes.emailLink} href={`mailto:${email}`}>{email}</a>)
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
