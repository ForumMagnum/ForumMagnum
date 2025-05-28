import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import { commentGetPageUrlFromIds } from '../../lib/collections/comments/helpers';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import {
  allowSubscribeToSequencePosts,
  allowSubscribeToUserComments,
  userHasPeopleDirectory,
  userHasSubscribeTabFeed,
} from '../../lib/betas';
import { sequenceGetPageUrl } from '../../lib/collections/sequences/helpers';
import { isLW, taggingNamePluralSetting } from '../../lib/instanceSettings';
import { CountItemsContextProvider, useCountItemsContext } from '../hooks/CountItemsContext';
import SingleColumnSection from "../common/SingleColumnSection";
import SubscriptionsList from "./SubscriptionsList";
import UsersNameDisplay from "./UsersNameDisplay";
import {
  subscribedUserQuery,
  subscribedPostQuery,
  subscribedCommentQuery,
  subscribedLocalgroupQuery,
  subscribedTagQuery,
  subscribedSequenceQuery
} from './subscriptionQueries';

const styles = (theme: ThemeType) => ({
  noSubscriptions: {
    marginTop: 40,
    fontSize: 16,
    fontWeight: 400,
    fontFamily: theme.palette.fonts.sansSerifStack,
    "& a": {
      fontWeight: 500,
      color: theme.palette.primary.main,
    },
  },
});

const NoSubscriptionsMessage = ({currentUser, classes}: {
  currentUser: UsersCurrent,
  classes: ClassesType<typeof styles>,
}) => {
  const context = useCountItemsContext();
  const itemCount = context?.items.current ?? 0;
  if (itemCount > 0) {
    return null;
  }

  const usersLink = userHasPeopleDirectory(currentUser)
    ? <Link to="/people-directory">users</Link>
    : "users";

  return (
    <div className={classes.noSubscriptions}>
      You have no active subscriptions. Subscribe to{" "}
      <Link to={`/${taggingNamePluralSetting.get()}`}>{taggingNamePluralSetting.get()}</Link>,{" "}
      <Link to="/allPosts">posts</Link>, or {usersLink}{" "}
      to receive notifications for new content.
    </div>
  );
}

const ViewSubscriptionsList = ({currentUser, classes}: {
  currentUser: UsersCurrent,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <SingleColumnSection>
      {userHasSubscribeTabFeed(currentUser) &&
        <SubscriptionsList
          title="Users You Are Following"
          collectionName="Users"
          subscriptionType="newActivityForFeed"
          query={subscribedUserQuery}
          extractDocument={(data) => data?.user?.result}
          renderDocument={(user) => <UsersNameDisplay user={user} tooltipPlacement='top' hideFollowButton />}
          subscriptionTypeDescription="These users will appear in the feed on your frontpage Subscribed Tab"
        />
      }

      <SubscriptionsList
        title="Notifications for New Posts by Users"
        collectionName="Users"
        subscriptionType="newPosts"
        query={subscribedUserQuery}
        extractDocument={(data) => data?.user?.result}
        renderDocument={(user) => <UsersNameDisplay user={user}/>}
        subscriptionTypeDescription="Manage onsite and offsite notification preferences in your account settings"
      />

      {allowSubscribeToUserComments && <SubscriptionsList
        title="Notifications for All New Comments by Users"
        collectionName="Users"
        subscriptionType="newUserComments"
        query={subscribedUserQuery}
        extractDocument={(data) => data?.user?.result}
        renderDocument={(user) => <UsersNameDisplay user={user}/>}
        subscriptionTypeDescription="Manage onsite and offsite (email) notification preferences in your account settings"
      />}

      <SubscriptionsList
        title="Notifications of Comments on Posts"
        collectionName="Posts"
        subscriptionType="newComments"
        query={subscribedPostQuery}
        extractDocument={(data) => data?.post?.result}
        renderDocument={(post) => post.title}
        subscriptionTypeDescription="You will receive notifications for any new comments on these posts"
      />

      <SubscriptionsList
        title="Notification of Dialogue Activity (as a reader)"
        collectionName="Posts"
        subscriptionType="newPublishedDialogueMessages"
        query={subscribedPostQuery}
        extractDocument={(data) => data?.post?.result}
        renderDocument={(post) => post.title}
        subscriptionTypeDescription="You will be notified of new activity in these dialogues."
      />

      <SubscriptionsList
        title="Notification of Dialogue Activity (as a participant)"
        collectionName="Posts"
        subscriptionType="newDialogueMessages"
        query={subscribedPostQuery}
        extractDocument={(data) => data?.post?.result}
        renderDocument={(post) => post.title}
        subscriptionTypeDescription="You will be notified of new activity by your dialogue partners on these dialogues."
      />

      {isLW && <SubscriptionsList
        title="Subscribed to Old-Style Dialogues (as a reader)"
        collectionName="Posts"
        subscriptionType="newDebateComments"
        query={subscribedPostQuery}
        extractDocument={(data) => data?.post?.result}
        renderDocument={(post) => post.title}
      />}

      <SubscriptionsList
        title="Subscribed to Old-Style dialogues (as a participant)"
        collectionName="Posts"
        subscriptionType="newDebateReplies"
        query={subscribedPostQuery}
        extractDocument={(data) => data?.post?.result}
        renderDocument={(post) => post.title}
      />

      <SubscriptionsList
        title="Notifications of Comment Replies"
        collectionName="Comments"
        subscriptionType="newReplies"
        query={subscribedCommentQuery}
        extractDocument={(data) => data?.comment?.result}
        renderDocument={(comment) => <Link to={commentGetPageUrlFromIds({postId: comment?.post?._id, postSlug: comment?.post?.slug, tagSlug: comment?.tag?.slug, tagCommentType: comment?.tagCommentType, commentId: comment?._id, permalink: true})}>
          author: {comment?.user?.displayName}, post: {comment?.post?.title}
        </Link>}
        subscriptionTypeDescription="You will get notifications on replies to these comments."
      />

      <SubscriptionsList
        title="Notifications of Local Groups Activity"
        collectionName="Localgroups"
        subscriptionType="newEvents"
        query={subscribedLocalgroupQuery}
        extractDocument={(data) => data?.localgroup?.result}
        renderDocument={(group) => group.name}
        subscriptionTypeDescription="You will be notified of new events from these Local Groups"
      />

      <SubscriptionsList
        title="Notification of New Posts with Tags"
        collectionName="Tags"
        subscriptionType="newTagPosts"
        query={subscribedTagQuery}
        extractDocument={(data) => data?.tag?.result}
        renderDocument={(tag) => <Link to={tagGetUrl(tag)}>{tag.name}</Link>}
        subscriptionTypeDescription="You will be notified when posts have these tags added"
      />

      {allowSubscribeToSequencePosts && <SubscriptionsList
        title="Notifications of New Post Added to Sequences"
        collectionName="Sequences"
        subscriptionType="newSequencePosts"
        query={subscribedSequenceQuery}
        extractDocument={(data) => data?.sequence?.result}
        renderDocument={(sequence) => <Link to={sequenceGetPageUrl(sequence)}>{sequence.title}</Link>}
        subscriptionTypeDescription="You will be notified when new posts are added to these sequences"
      />}

      <NoSubscriptionsMessage currentUser={currentUser} classes={classes} />
    </SingleColumnSection>
  );
}

const ViewSubscriptionsPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();

  if (!currentUser) {
    return <SingleColumnSection>
      Log in to manage your subscriptions.
    </SingleColumnSection>;
  }

  return (
    <CountItemsContextProvider>
      <ViewSubscriptionsList currentUser={currentUser} classes={classes} />
    </CountItemsContextProvider>
  );
}

export default registerComponent(
  "ViewSubscriptionsPage",
  ViewSubscriptionsPage,
  {styles},
);


