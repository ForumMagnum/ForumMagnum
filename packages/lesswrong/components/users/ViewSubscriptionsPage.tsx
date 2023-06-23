import React, {ReactNode} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import { commentGetPageUrlFromIds } from '../../lib/collections/comments/helpers';
import { tagGetUrl } from '../../lib/collections/tags/helpers';

const styles = (theme: ThemeType): JssStyles => ({
  subscribedItem: {
    display: "flex",
    ...theme.typography.commentStyle
  },
  subscribedItemDescription: {
    flexGrow: 1,
  },
});

const SubscriptionsList = ({collectionName, fragmentName, subscriptionType, noSubscriptionsMessage, renderDocument, title, classes}: {
  collectionName: CollectionNameString,
  fragmentName: keyof FragmentTypes,
  subscriptionType: string,
  noSubscriptionsMessage: string,
  renderDocument: (document: any)=>ReactNode,
  title: React.ReactNode,
  classes: ClassesType,
}) => {
  const { SubscribedItem, SectionTitle, Loading, LoadMore } = Components;
  const currentUser = useCurrentUser();
  
  const { results, loading, loadMoreProps, showLoadMore } = useMulti({
    terms: {
      view: "subscriptionsOfType",
      userId: currentUser?._id,
      collectionName: collectionName,
      subscriptionType: subscriptionType,
      limit: 50
    },
    collectionName: "Subscriptions",
    fragmentName: "SubscriptionState",
  });
  
  if (!currentUser)
    return null;
  if (loading)
    return <Loading/>
  if (!results)
    return null;
  
  return <div>
    <SectionTitle title={title}/>
    {results.map(result =>
      <SubscribedItem
        key={result._id}
        collectionName={collectionName}
        fragmentName={fragmentName}
        subscription={result}
        renderDocument={renderDocument}
      />
    )}
    {results.length===0 && <div className={classes.subscribedItem}>
      {noSubscriptionsMessage}
    </div>}
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
  renderDocument: (document: any)=>ReactNode,
  classes: ClassesType,
}) => {
  const { Loading, NotifyMeButton } = Components;
  const { document, loading } = useSingle({
    documentId: subscription.documentId,
    collectionName, fragmentName,
  });
  
  if (!document && !loading) return null
  if (loading) return <Loading/>
  
  return <div className={classes.subscribedItem}>
    <div className={classes.subscribedItemDescription}>
    {renderDocument(document)}
    </div>
    <NotifyMeButton
      document={document}
      subscriptionType={subscription.type}
      subscribeMessage="Resubscribe"
      unsubscribeMessage="Unsubscribe"
    />
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
    <SubscriptionsList
      title="Subscribed to Posts By Users"
      collectionName="Users"
      subscriptionType="newPosts"
      fragmentName="UsersMinimumInfo"
      renderDocument={(user: UsersMinimumInfo) => <UsersNameDisplay user={user}/>}
      noSubscriptionsMessage="You are not subscribed to any users' posts."
    />
    
    <SubscriptionsList
      title="Subscribed to Comments on Posts"
      collectionName="Posts"
      subscriptionType="newComments"
      fragmentName="PostsList"
      renderDocument={(post: PostsList) => post.title}
      noSubscriptionsMessage="You are not subscribed to comments on any posts."
    />

    <SubscriptionsList
      title="Subscribed to Dialogues (as a reader)"
      collectionName="Posts"
      subscriptionType="newDebateComments"
      fragmentName="PostsList"
      renderDocument={(post: PostsList) => post.title}
      noSubscriptionsMessage="You are not subscribed to any dialogues as a reader."
    />

    <SubscriptionsList
      title="Subscribed to Dialogues (as a participant)"
      collectionName="Posts"
      subscriptionType="newDebateReplies"
      fragmentName="PostsList"
      renderDocument={(post: PostsList) => post.title}
      noSubscriptionsMessage="You are not subscribed to any dialogues as a participant."
    />

    <SubscriptionsList
      title="Subscribed to Comment Replies"
      collectionName="Comments"
      subscriptionType="newReplies"
      fragmentName="CommentsListWithParentMetadata"
      renderDocument={(comment: CommentsListWithParentMetadata) => <Link to={commentGetPageUrlFromIds({postId: comment?.post?._id, postSlug: comment?.post?.slug, tagSlug: comment?.tag?.slug, tagCommentType: comment?.tagCommentType, commentId: comment?._id, permalink: true})}>
        author: {comment?.user?.displayName} post: {comment?.post?.title}
      </Link>}
      noSubscriptionsMessage="You are not subscribed to any comment replies."
    />

    <SubscriptionsList
      title="Subscribed to Local Groups"
      collectionName="Localgroups"
      subscriptionType="newEvents"
      fragmentName="localGroupsBase"
      renderDocument={(group: localGroupsBase) => group.name}
      noSubscriptionsMessage="You are not subscribed to any local groups."
    />

    <SubscriptionsList
      title="Subscribed to Tags"
      collectionName="Tags"
      subscriptionType="newTagPosts"
      fragmentName="TagPreviewFragment"
      renderDocument={(tag: TagPreviewFragment) => <Link to={tagGetUrl(tag)}>{tag.name}</Link>}
      noSubscriptionsMessage="You are not subscribed to any tags."
    />
    
    
  </SingleColumnSection>;
}

const ViewSubscriptionsPageComponent = registerComponent("ViewSubscriptionsPage", ViewSubscriptionsPage, {styles});
  
declare global {
  interface ComponentTypes {
    ViewSubscriptionsPage: typeof ViewSubscriptionsPageComponent,
  }
}
