import React, { useCallback, useState } from 'react';
import { useCurrentUser } from '@/components/common/withUser';
import { Link } from '@/lib/reactRouterWrapper';
import { commentGetPageUrlFromIds } from '@/lib/collections/comments/helpers';
import { tagGetUrl } from '@/lib/collections/tags/helpers';
import { sequenceGetPageUrl } from '@/lib/collections/sequences/helpers';
import {
  allowSubscribeToSequencePosts,
  allowSubscribeToUserComments,
  userHasSubscribeTabFeed,
} from '@/lib/betas';
import { isLW } from '@/lib/instanceSettings';
import UsersNameDisplay from '../UsersNameDisplay';
import SubscriptionsList from '../SubscriptionsList';
import {
  subscribedUserQuery,
  subscribedPostQuery,
  subscribedCommentQuery,
  subscribedLocalgroupQuery,
  subscribedTagQuery,
  subscribedSequenceQuery,
} from '../subscriptionQueries';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('DashboardSubscriptionsTab', (theme: ThemeType) => ({
  noSubscriptions: {
    marginTop: 24,
    fontSize: 14,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[500],
    '& a': {
      fontWeight: 500,
      color: theme.palette.primary.main,
    },
  },
}));

const notificationSettingsLink = (
  <Link to="/account?tab=settings-notifications">notification settings</Link>
);

const DashboardSubscriptionsTab = ({userId, isOwnAccount}: {userId: string, isOwnAccount: boolean}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [sectionResults, setSectionResults] = useState<Record<string, boolean>>({});

  const onSectionLoaded = useCallback((subscriptionType: string, hasItems: boolean) => {
    setSectionResults((prev) =>
      prev[subscriptionType] === hasItems ? prev : {...prev, [subscriptionType]: hasItems}
    );
  }, []);

  if (!currentUser) return null;

  const sharedProps = {
    userId,
    readOnly: !isOwnAccount,
    onLoaded: onSectionLoaded,
  };

  const sections = [
    ...(userHasSubscribeTabFeed(currentUser) ? [
      <SubscriptionsList
        {...sharedProps}
        key="newActivityForFeed"
        title="Users you are following"
        subscriptionTypeDescription="These users will appear in the feed on your frontpage Subscribed Tab"
        collectionName="Users"
        subscriptionType="newActivityForFeed"
        query={subscribedUserQuery}
        extractDocument={(data) => data?.user?.result}
        renderDocument={(user) => <UsersNameDisplay user={user} tooltipPlacement="top" hideFollowButton />}
      />
    ] : []),

    <SubscriptionsList
      {...sharedProps}
      key="newPosts"
      title="Notifications for new posts by users"
      subscriptionTypeDescription={<>Manage onsite and offsite notification preferences in your {notificationSettingsLink}</>}
      collectionName="Users"
      subscriptionType="newPosts"
      query={subscribedUserQuery}
      extractDocument={(data) => data?.user?.result}
      renderDocument={(user) => <UsersNameDisplay user={user} />}
    />,

    ...(allowSubscribeToUserComments ? [
      <SubscriptionsList
        {...sharedProps}
        key="newUserComments"
        title="Notifications for all new comments by users"
        subscriptionTypeDescription={<>Manage onsite and offsite (email) notification preferences in your {notificationSettingsLink}</>}
        collectionName="Users"
        subscriptionType="newUserComments"
        query={subscribedUserQuery}
        extractDocument={(data) => data?.user?.result}
        renderDocument={(user) => <UsersNameDisplay user={user} />}
      />
    ] : []),

    <SubscriptionsList
      {...sharedProps}
      key="newComments"
      title="Notifications of comments on posts"
      subscriptionTypeDescription="You will receive notifications for any new comments on these posts"
      collectionName="Posts"
      subscriptionType="newComments"
      query={subscribedPostQuery}
      extractDocument={(data) => data?.post?.result}
      renderDocument={(post) => post.title}
    />,

    <SubscriptionsList
      {...sharedProps}
      key="newPublishedDialogueMessages"
      title="Notification of dialogue activity (as a reader)"
      subscriptionTypeDescription="You will be notified of new activity in these dialogues."
      collectionName="Posts"
      subscriptionType="newPublishedDialogueMessages"
      query={subscribedPostQuery}
      extractDocument={(data) => data?.post?.result}
      renderDocument={(post) => post.title}
    />,

    <SubscriptionsList
      {...sharedProps}
      key="newDialogueMessages"
      title="Notification of dialogue activity (as a participant)"
      subscriptionTypeDescription="You will be notified of new activity by your dialogue partners on these dialogues."
      collectionName="Posts"
      subscriptionType="newDialogueMessages"
      query={subscribedPostQuery}
      extractDocument={(data) => data?.post?.result}
      renderDocument={(post) => post.title}
    />,

    ...(isLW() ? [
      <SubscriptionsList
        {...sharedProps}
        key="newDebateComments"
        title="Subscribed to old-style dialogues (as a reader)"
        collectionName="Posts"
        subscriptionType="newDebateComments"
        query={subscribedPostQuery}
        extractDocument={(data) => data?.post?.result}
        renderDocument={(post) => post.title}
      />
    ] : []),

    <SubscriptionsList
      {...sharedProps}
      key="newDebateReplies"
      title="Subscribed to old-style dialogues (as a participant)"
      collectionName="Posts"
      subscriptionType="newDebateReplies"
      query={subscribedPostQuery}
      extractDocument={(data) => data?.post?.result}
      renderDocument={(post) => post.title}
    />,

    <SubscriptionsList
      {...sharedProps}
      key="newReplies"
      title="Notifications of comment replies"
      subscriptionTypeDescription="You will get notifications on replies to these comments."
      collectionName="Comments"
      subscriptionType="newReplies"
      query={subscribedCommentQuery}
      extractDocument={(data) => data?.comment?.result}
      renderDocument={(comment) => (
        <Link to={commentGetPageUrlFromIds({
          postId: comment?.post?._id,
          postSlug: comment?.post?.slug,
          tagSlug: comment?.tag?.slug,
          tagCommentType: comment?.tagCommentType,
          commentId: comment?._id,
          permalink: true,
        })}>
          {comment?.user?.displayName} on {comment?.post?.title}
        </Link>
      )}
    />,

    <SubscriptionsList
      {...sharedProps}
      key="newEvents"
      title="Notifications of local groups activity"
      subscriptionTypeDescription="You will be notified of new events from these Local Groups"
      collectionName="Localgroups"
      subscriptionType="newEvents"
      query={subscribedLocalgroupQuery}
      extractDocument={(data) => data?.localgroup?.result}
      renderDocument={(group) => group.name}
    />,

    <SubscriptionsList
      {...sharedProps}
      key="newTagPosts"
      title="Notification of new posts with tags"
      subscriptionTypeDescription="You will be notified when posts have these tags added"
      collectionName="Tags"
      subscriptionType="newTagPosts"
      query={subscribedTagQuery}
      extractDocument={(data) => data?.tag?.result}
      renderDocument={(tag) => <Link to={tagGetUrl(tag)}>{tag.name}</Link>}
    />,

    ...(allowSubscribeToSequencePosts() ? [
      <SubscriptionsList
        {...sharedProps}
        key="newSequencePosts"
        title="Notifications of new post added to sequences"
        subscriptionTypeDescription="You will be notified when new posts are added to these sequences"
        collectionName="Sequences"
        subscriptionType="newSequencePosts"
        query={subscribedSequenceQuery}
        extractDocument={(data) => data?.sequence?.result}
        renderDocument={(sequence) => <Link to={sequenceGetPageUrl(sequence)}>{sequence.title}</Link>}
      />
    ] : []),
  ];

  const allSectionsLoaded = Object.keys(sectionResults).length >= sections.length;
  const hasAnySubscriptions = Object.values(sectionResults).some(Boolean);

  return (
    <AnalyticsContext pageElementContext="dashboardSubscriptionsTab">
      {sections}

      {allSectionsLoaded && !hasAnySubscriptions && (
        <div className={classes.noSubscriptions}>
          {isOwnAccount
            ? <>
                You have no active subscriptions. Subscribe to{' '}
                <Link to="/wikitags">wikitags</Link>,{' '}
                <Link to="/allPosts">posts</Link>, or users{' '}
                to receive notifications for new content.
              </>
            : <>This user has no active subscriptions.</>
          }
        </div>
      )}
    </AnalyticsContext>
  );
};

export default DashboardSubscriptionsTab;
