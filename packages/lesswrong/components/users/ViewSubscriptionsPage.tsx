import React, {ReactNode} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import { commentGetPageUrlFromIds } from '../../lib/collections/comments/helpers';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { allowSubscribeToSequencePosts, allowSubscribeToUserComments, userHasSubscribeTabFeed } from '../../lib/betas';
import { sequenceGetPageUrl } from '../../lib/collections/sequences/helpers';
import { isLW } from '../../lib/instanceSettings';
import { Class } from 'type-fest';
import { commentBodyStyles } from '@/themes/stylePiping';
import { isFriendlyUI } from '@/themes/forumTheme';

const styles = (theme: ThemeType) => ({
  subscriptionsListRoot: {
    ...commentBodyStyles(theme),
  },
  subscriptionListTitle: {
    fontSize: "1.8rem !important",
  },
  subscribedItem: {
    marginLeft: -6,
    display: "flex",
    padding: 6,
    borderRadius: 3,
    ...theme.typography.commentStyle,
    '&:hover': {
      backgroundColor: theme.palette.grey[200],
    },
  },
  subscribedItemDescription: {
    marginLeft: 8,
    fontWeight: 500,
  },
  subscriptionTypeDescription: {
    marginBottom: 10,
    fontStyle: "italic",
  },
  unsubscribeButton: {
    width: isFriendlyUI ? 87 :82,
    opacity: 0.7
  },
});

const SubscriptionsList = ({collectionName, fragmentName, subscriptionType, renderDocument, title, subscriptionTypeDescription, classes}: {
  collectionName: CollectionNameString,
  fragmentName: keyof FragmentTypes,
  subscriptionType: string,
  renderDocument: (document: any) => ReactNode,
  title: React.ReactNode,
  subscriptionTypeDescription?: String
  classes: ClassesType<typeof styles>,
}) => {
  const { SubscribedItem, SectionTitle, Loading, LoadMore } = Components;
  const currentUser = useCurrentUser();
  
  const { results, loading, loadMoreProps, showLoadMore } = useMulti({
    terms: {
      view: "subscriptionsOfType",
      userId: currentUser?._id,
      collectionName: collectionName,
      subscriptionType: subscriptionType,
      limit: 20,
    },
    collectionName: "Subscriptions",
    fragmentName: "SubscriptionState",
    itemsPerPage: 100,
    enableTotal: true
  });
  
  if (!currentUser)
    return null;
  if (loading)
    return <Loading/>
  if (!results)
    return null;
  if (results.length === 0)
    return null;
  
  return <div className={classes.subscriptionsListRoot}>
    <SectionTitle title={title} className={classes.subscriptionListTitle}/>
    {subscriptionTypeDescription && <div className={classes.subscriptionTypeDescription}>
      {subscriptionTypeDescription}
    </div>}
    {results.map(result =>
      <SubscribedItem
        key={result._id}
        collectionName={collectionName}
        fragmentName={fragmentName}
        subscription={result}
        renderDocument={renderDocument}
      />
    )}
    {showLoadMore && <LoadMore {...loadMoreProps} />}
  </div>
}

const SubscriptionsListComponent = registerComponent("SubscriptionsList", SubscriptionsList, {styles});

declare global {
  interface ComponentTypes {
    SubscriptionsList: typeof SubscriptionsListComponent
  }
}

const SubscribedItem = ({collectionName, fragmentName, subscription, renderDocument, classes}: {
  collectionName: CollectionNameString,
  fragmentName: keyof FragmentTypes,
  subscription: SubscriptionState,
  renderDocument: (document: any) => ReactNode,
  classes: ClassesType<typeof styles>
}) => {
  const { Loading, NotifyMeButton } = Components;
  const { document, loading } = useSingle({
    documentId: subscription.documentId,
    collectionName, fragmentName,
  });
  
  if (!document && !loading) return null
  if (loading) return <Loading/>
  
  return <div className={classes.subscribedItem}>
    <NotifyMeButton
      document={document}
      subscriptionType={subscription.type}
      subscribeMessage="Resubscribe"
      unsubscribeMessage="Unsubscribe"
      className={classes.unsubscribeButton}
    />
    <div className={classes.subscribedItemDescription}>
    {renderDocument(document)}
    </div>
  </div>
  
}

const SubscribedItemComponent = registerComponent("SubscribedItem", SubscribedItem, {styles});

declare global {
  interface ComponentTypes {
    SubscribedItem: typeof SubscribedItemComponent
  }
}

const ViewSubscriptionsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { SingleColumnSection, SubscriptionsList, UsersNameDisplay } = Components;
  const currentUser = useCurrentUser();
  
  if (!currentUser) {
    return <SingleColumnSection>
      Log in to manage your subscriptions.
    </SingleColumnSection>;
  }
  
  return <SingleColumnSection>
    {userHasSubscribeTabFeed(currentUser) && <SubscriptionsList
      title="Users You Are Following"
      collectionName="Users"
      subscriptionType="newActivityForFeed"
      fragmentName="UsersMinimumInfo"
      renderDocument={(user: UsersMinimumInfo) => <UsersNameDisplay user={user} tooltipPlacement='top' hideFollowButton />}
      subscriptionTypeDescription="These users will appear in the feed on your frontpage Subscribed Tab"
    />}
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
      title="Notification of Comments on Posts"
      collectionName="Posts"
      subscriptionType="newComments"
      fragmentName="PostsList"
      renderDocument={(post: PostsList) => post.title}
      subscriptionTypeDescription="You will receive notifications for any new comments on these posts"
    />

    <SubscriptionsList
      title="Subscribed to Dialogues (as a reader)"
      collectionName="Posts"
      subscriptionType="newPublishedDialogueMessages"
      fragmentName="PostsList"
      renderDocument={(post: PostsList) => post.title}
      subscriptionTypeDescription="You will be notified of new activity in these dialogues."
    />

    <SubscriptionsList
      title="Subscribed to Dialogues (as a participant)"
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
      title="Notification of Comment Replies"
      collectionName="Comments"
      subscriptionType="newReplies"
      fragmentName="CommentsListWithParentMetadata"
      renderDocument={(comment: CommentsListWithParentMetadata) => <Link to={commentGetPageUrlFromIds({postId: comment?.post?._id, postSlug: comment?.post?.slug, tagSlug: comment?.tag?.slug, tagCommentType: comment?.tagCommentType, commentId: comment?._id, permalink: true})}>
        author: {comment?.user?.displayName}, post: {comment?.post?.title}
      </Link>}
      subscriptionTypeDescription="You will get notifications on replies to these comments."
    />

    <SubscriptionsList
      title="Subscribed to Local Groups"
      collectionName="Localgroups"
      subscriptionType="newEvents"
      fragmentName="localGroupsBase"
      renderDocument={(group: localGroupsBase) => group.name}
      subscriptionTypeDescription="You will be notified of new events from these Local Groups"
    />

    <SubscriptionsList
      title="Subscribed to Tags"
      collectionName="Tags"
      subscriptionType="newTagPosts"
      fragmentName="TagPreviewFragment"
      renderDocument={(tag: TagPreviewFragment) => <Link to={tagGetUrl(tag)}>{tag.name}</Link>}
      subscriptionTypeDescription="You will be notified when posts have these tags added"
    />
    
    {allowSubscribeToSequencePosts && <SubscriptionsList
      title="Subscribed to Sequences"
      collectionName="Sequences"
      subscriptionType="newSequencePosts"
      fragmentName="SequencesPageTitleFragment"
      renderDocument={(sequence: SequencesPageTitleFragment) => <Link to={sequenceGetPageUrl(sequence)}>{sequence.title}</Link>}
      subscriptionTypeDescription="You will be notified when new posts are added to these sequences"
    />}
    
  </SingleColumnSection>;
}

const ViewSubscriptionsPageComponent = registerComponent("ViewSubscriptionsPage", ViewSubscriptionsPage, {styles});
  
declare global {
  interface ComponentTypes {
    ViewSubscriptionsPage: typeof ViewSubscriptionsPageComponent,
  }
}
