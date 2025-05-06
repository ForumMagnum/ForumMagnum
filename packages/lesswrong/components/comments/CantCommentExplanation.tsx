import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { userIsBannedFromAllPersonalPosts, userIsBannedFromAllPosts, userIsBannedFromPost } from '../../lib/collections/users/helpers';
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

const userBlockedCommentingReason = (user: UsersCurrent|DbUser|null, post: PostsDetails|DbPost, postAuthor: PostsAuthors_user|null): JSX.Element => {
  if (!user) {
    return <>Can't recognize user</>
  }

  if (userIsBannedFromPost(user, post, postAuthor)) {
    return <>This post's author has blocked you from commenting.</>
  }

  if (userIsBannedFromAllPosts(user, post, postAuthor)) {
    return <>This post's author has blocked you from commenting.</>
  }

  if (userIsBannedFromAllPersonalPosts(user, post, postAuthor)) {
    return <>This post's author has blocked you from commenting on any of their personal blog posts.</>
  }

  if (post?.commentsLocked) {
    return <>Comments on this post are disabled.</>
  }

  if (post?.commentsLockedToAccountsCreatedAfter) {
    return <>Comments on this post are disabled to accounts created after <Components.CalendarDate date={post.commentsLockedToAccountsCreatedAfter}/></>
  }

  return <>You cannot comment at this time</>
}

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
