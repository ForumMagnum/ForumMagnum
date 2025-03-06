import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
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
import SingleColumnSection from "@/components/common/SingleColumnSection";
import SubscriptionsList from "@/components/users/SubscriptionsList";
import UsersNameDisplay from "@/components/users/UsersNameDisplay";

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
          fragmentName="UsersMinimumInfo"
          renderDocument={(user: UsersMinimumInfo) => <UsersNameDisplay user={user} tooltipPlacement='top' hideFollowButton />}
          subscriptionTypeDescription="These users will appear in the feed on your frontpage Subscribed Tab"
        />
      }

      <SubscriptionsList
        title="Notifications for New Posts by Users"
        collectionName="Users"
        subscriptionType="newPosts"
        fragmentName="UsersMinimumInfo"
        renderDocument={(user: UsersMinimumInfo) => <UsersNameDisplay user={user}/>}
        subscriptionTypeDescription="Manage onsite and offsite notification preferences in your account settings"
      />

      {allowSubscribeToUserComments && <SubscriptionsList
        title="Notifications for All New Comments by Users"
        collectionName="Users"
        subscriptionType="newUserComments"
        fragmentName="UsersMinimumInfo"
        renderDocument={(user: UsersMinimumInfo) => <UsersNameDisplay user={user}/>}
        subscriptionTypeDescription="Manage onsite and offsite (email) notification preferences in your account settings"
      />}

      <SubscriptionsList
        title="Notifications of Comments on Posts"
        collectionName="Posts"
        subscriptionType="newComments"
        fragmentName="PostsList"
        renderDocument={(post: PostsList) => post.title}
        subscriptionTypeDescription="You will receive notifications for any new comments on these posts"
      />

      <SubscriptionsList
        title="Notification of Dialogue Activity (as a reader)"
        collectionName="Posts"
        subscriptionType="newPublishedDialogueMessages"
        fragmentName="PostsList"
        renderDocument={(post: PostsList) => post.title}
        subscriptionTypeDescription="You will be notified of new activity in these dialogues."
      />

      <SubscriptionsList
        title="Notification of Dialogue Activity (as a participant)"
        collectionName="Posts"
        subscriptionType="newDialogueMessages"
        fragmentName="PostsList"
        renderDocument={(post: PostsList) => post.title}
        subscriptionTypeDescription="You will be notified of new activity by your dialogue partners on these dialogues."
      />

      {isLW && <SubscriptionsList
        title="Subscribed to Old-Style Dialogues (as a reader)"
        collectionName="Posts"
        subscriptionType="newDebateComments"
        fragmentName="PostsList"
        renderDocument={(post: PostsList) => post.title}
      />}

      <SubscriptionsList
        title="Subscribed to Old-Style dialogues (as a participant)"
        collectionName="Posts"
        subscriptionType="newDebateReplies"
        fragmentName="PostsList"
        renderDocument={(post: PostsList) => post.title}
      />

      <SubscriptionsList
        title="Notifications of Comment Replies"
        collectionName="Comments"
        subscriptionType="newReplies"
        fragmentName="CommentsListWithParentMetadata"
        renderDocument={(comment: CommentsListWithParentMetadata) => <Link to={commentGetPageUrlFromIds({postId: comment?.post?._id, postSlug: comment?.post?.slug, tagSlug: comment?.tag?.slug, tagCommentType: comment?.tagCommentType, commentId: comment?._id, permalink: true})}>
          author: {comment?.user?.displayName}, post: {comment?.post?.title}
        </Link>}
        subscriptionTypeDescription="You will get notifications on replies to these comments."
      />

      <SubscriptionsList
        title="Notifications of Local Groups Activity"
        collectionName="Localgroups"
        subscriptionType="newEvents"
        fragmentName="localGroupsBase"
        renderDocument={(group: localGroupsBase) => group.name}
        subscriptionTypeDescription="You will be notified of new events from these Local Groups"
      />

      <SubscriptionsList
        title="Notification of New Posts with Tags"
        collectionName="Tags"
        subscriptionType="newTagPosts"
        fragmentName="TagPreviewFragment"
        renderDocument={(tag: TagPreviewFragment) => <Link to={tagGetUrl(tag)}>{tag.name}</Link>}
        subscriptionTypeDescription="You will be notified when posts have these tags added"
      />

      {allowSubscribeToSequencePosts && <SubscriptionsList
        title="Notifications of New Post Added to Sequences"
        collectionName="Sequences"
        subscriptionType="newSequencePosts"
        fragmentName="SequencesPageTitleFragment"
        renderDocument={(sequence: SequencesPageTitleFragment) => <Link to={sequenceGetPageUrl(sequence)}>{sequence.title}</Link>}
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

const ViewSubscriptionsPageComponent = registerComponent(
  "ViewSubscriptionsPage",
  ViewSubscriptionsPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    ViewSubscriptionsPage: typeof ViewSubscriptionsPageComponent,
  }
}

export default ViewSubscriptionsPageComponent;
