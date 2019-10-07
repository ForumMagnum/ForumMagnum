import React from 'react';
import { Components, registerComponent, useMulti, useSingle } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import { Subscriptions } from '../../lib/collections/subscriptions/collection.js';
import { useCurrentUser } from '../common/withUser.js';

const styles = {
  subscribedItem: {
    display: "flex",
  },
  subscribedItemDescription: {
    flexGrow: 1,
  },
};

const SubscriptionsList = ({collectionName, fragmentName, subscriptionType, renderDocument}) => {
  const { SubscribedItem } = Components;
  const currentUser = useCurrentUser();
  
  const { results, loading } = useMulti({
    terms: {
      view: "subscriptionsOfType",
      userId: currentUser?._id,
      collectionName: collectionName,
      subscriptionType: subscriptionType,
    },
    collection: Subscriptions,
    queryName: "SubscriptionsOfTypeQuery",
    fragmentName: "SubscriptionState",
  });
  
  if (!currentUser)
    return null;
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
  </div>
}
registerComponent("SubscriptionsList", SubscriptionsList);

const SubscribedItem = ({collectionName, fragmentName, subscription, renderDocument, classes}) => {
  const { Loading } = Components;
  const { document, loading, error } = useSingle({
    documentId: subscription.documentId,
    collectionName, fragmentName,
    queryName: "SubscribedDocumentQuery",
  });
  
  if (loading)
    return <Loading/>
  
  return <div className={classes.subscribedItem}>
    <div className={classes.subscribedItemDescription}>
    {renderDocument(document)}
    </div>
    <div>Unsubscribe</div>
  </div>
  
}
registerComponent("SubscribedItem", SubscribedItem,
  withStyles(styles, {name: "SubscribedItem"}));

const ViewSubscriptionsPage = ({classes}) => {
  const { SingleColumnSection, SectionTitle, SubscriptionsList, UsersNameDisplay } = Components;
  
  return <SingleColumnSection>
    <SubscriptionsList
      title="Subscribed to Posts By Users"
      collectionName="Users"
      subscriptionType="newPosts"
      fragmentName="UsersMinimumInfo"
      renderDocument={user => <UsersNameDisplay user={user}/>}
    />
    
    <SubscriptionsList
      title="Subscribed to Comments on Posts"
      collectionName="Posts"
      subscriptionType=""
      fragmentName=""
      renderDocument={post => post.title}/>}
    />
    
    <SectionTitle title="Subscribed to Comments on Posts"/>
  </SingleColumnSection>;
}

registerComponent("ViewSubscriptionsPage", ViewSubscriptionsPage,
  withStyles(styles, {name: "ViewSubscriptionsPage"}));
