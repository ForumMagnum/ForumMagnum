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

const DashboardSubscriptionsTab = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [hasAnySubscriptions, setHasAnySubscriptions] = useState(false);

  const onSectionHasItems = useCallback(() => {
    setHasAnySubscriptions(true);
  }, []);

  if (!currentUser) return null;

  return (
    <AnalyticsContext pageElementContext="dashboardSubscriptionsTab">
      {userHasSubscribeTabFeed(currentUser) && (
        <SubscriptionsList
          title="Users you are following"
          subscriptionTypeDescription="These users will appear in the feed on your frontpage Subscribed Tab"
          collectionName="Users"
          subscriptionType="newActivityForFeed"
          query={subscribedUserQuery}
          extractDocument={(data) => data?.user?.result}
          renderDocument={(user) => <UsersNameDisplay user={user} tooltipPlacement="top" hideFollowButton />}
          onHasItems={onSectionHasItems}
        />
      )}

      <SubscriptionsList
        title="Notifications for new posts by users"
        subscriptionTypeDescription="Manage onsite and offsite notification preferences in your account settings"
        collectionName="Users"
        subscriptionType="newPosts"
        query={subscribedUserQuery}
        extractDocument={(data) => data?.user?.result}
        renderDocument={(user) => <UsersNameDisplay user={user} />}
        onHasItems={onSectionHasItems}
      />

      {allowSubscribeToUserComments && (
        <SubscriptionsList
          title="Notifications for all new comments by users"
          subscriptionTypeDescription="Manage onsite and offsite (email) notification preferences in your account settings"
          collectionName="Users"
          subscriptionType="newUserComments"
          query={subscribedUserQuery}
          extractDocument={(data) => data?.user?.result}
          renderDocument={(user) => <UsersNameDisplay user={user} />}
          onHasItems={onSectionHasItems}
        />
      )}

      <SubscriptionsList
        title="Notifications of comments on posts"
        subscriptionTypeDescription="You will receive notifications for any new comments on these posts"
        collectionName="Posts"
        subscriptionType="newComments"
        query={subscribedPostQuery}
        extractDocument={(data) => data?.post?.result}
        renderDocument={(post) => post.title}
        onHasItems={onSectionHasItems}
      />

      <SubscriptionsList
        title="Notification of dialogue activity (as a reader)"
        subscriptionTypeDescription="You will be notified of new activity in these dialogues."
        collectionName="Posts"
        subscriptionType="newPublishedDialogueMessages"
        query={subscribedPostQuery}
        extractDocument={(data) => data?.post?.result}
        renderDocument={(post) => post.title}
        onHasItems={onSectionHasItems}
      />

      <SubscriptionsList
        title="Notification of dialogue activity (as a participant)"
        subscriptionTypeDescription="You will be notified of new activity by your dialogue partners on these dialogues."
        collectionName="Posts"
        subscriptionType="newDialogueMessages"
        query={subscribedPostQuery}
        extractDocument={(data) => data?.post?.result}
        renderDocument={(post) => post.title}
        onHasItems={onSectionHasItems}
      />

      {isLW() && (
        <SubscriptionsList
          title="Subscribed to old-style dialogues (as a reader)"
          collectionName="Posts"
          subscriptionType="newDebateComments"
          query={subscribedPostQuery}
          extractDocument={(data) => data?.post?.result}
          renderDocument={(post) => post.title}
          onHasItems={onSectionHasItems}
        />
      )}

      <SubscriptionsList
        title="Subscribed to old-style dialogues (as a participant)"
        collectionName="Posts"
        subscriptionType="newDebateReplies"
        query={subscribedPostQuery}
        extractDocument={(data) => data?.post?.result}
        renderDocument={(post) => post.title}
        onHasItems={onSectionHasItems}
      />

      <SubscriptionsList
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
        onHasItems={onSectionHasItems}
      />

      <SubscriptionsList
        title="Notifications of local groups activity"
        subscriptionTypeDescription="You will be notified of new events from these Local Groups"
        collectionName="Localgroups"
        subscriptionType="newEvents"
        query={subscribedLocalgroupQuery}
        extractDocument={(data) => data?.localgroup?.result}
        renderDocument={(group) => group.name}
        onHasItems={onSectionHasItems}
      />

      <SubscriptionsList
        title="Notification of new posts with tags"
        subscriptionTypeDescription="You will be notified when posts have these tags added"
        collectionName="Tags"
        subscriptionType="newTagPosts"
        query={subscribedTagQuery}
        extractDocument={(data) => data?.tag?.result}
        renderDocument={(tag) => <Link to={tagGetUrl(tag)}>{tag.name}</Link>}
        onHasItems={onSectionHasItems}
      />

      {allowSubscribeToSequencePosts() && (
        <SubscriptionsList
          title="Notifications of new post added to sequences"
          subscriptionTypeDescription="You will be notified when new posts are added to these sequences"
          collectionName="Sequences"
          subscriptionType="newSequencePosts"
          query={subscribedSequenceQuery}
          extractDocument={(data) => data?.sequence?.result}
          renderDocument={(sequence) => <Link to={sequenceGetPageUrl(sequence)}>{sequence.title}</Link>}
          onHasItems={onSectionHasItems}
        />
      )}

      {!hasAnySubscriptions && (
        <div className={classes.noSubscriptions}>
          You have no active subscriptions. Subscribe to{' '}
          <Link to="/wikitags">wikitags</Link>,{' '}
          <Link to="/allPosts">posts</Link>, or users{' '}
          to receive notifications for new content.
        </div>
      )}
    </AnalyticsContext>
  );
};

export default DashboardSubscriptionsTab;
