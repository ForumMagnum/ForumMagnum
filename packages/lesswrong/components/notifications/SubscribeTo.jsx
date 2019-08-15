import React, { Component } from 'react';
import { Components, withMessages, registerComponent, Utils, useMulti, withCreate } from 'meteor/vulcan:core';
import { Subscriptions } from '../../lib/collections/subscriptions/collection'
import { defaultSubscriptionTypeTable } from '../../lib/collections/subscriptions/mutations'
import { userIsDefaultSubscribed } from '../../lib/subscriptionUtil.js';
import { useCurrentUser } from '../common/withUser';

const SubscribeTo = ({
  document,
  subscriptionType: overrideSubscriptionType,
  createSubscription, // From withCreate HoC
  flash, // From withMessages HoC
  subscribeMessage, unsubscribeMessage,
  className="",
}) => {
  const currentUser = useCurrentUser();
  
  const documentType = Utils.getCollectionNameFromTypename(document.__typename);
  const collectionName = Utils.capitalize(documentType);
  const subscriptionType = overrideSubscriptionType || defaultSubscriptionTypeTable[collectionName];
  
  // Get existing subscription, if there is one
  const { results, loading } = useMulti({
    terms: {
      view: "subscriptionState",
      documentId: document._id,
      userId: currentUser._id,
      subscriptionType,
      collectionName,
      limit: 1
    },
    
    collection: Subscriptions,
    queryName: 'subscriptionState',
    fragmentName: 'SubscriptionState',
    enableTotal: false,
    ssr: true
  });
  
  if (loading) {
    return <Components.Loading/>
  }
  
  const isSubscribed = () => {
    // Get the last element of the results array, which will be the most recent subscription
    if (results && results.length > 0) {
      // Get the newest subscription entry (Mingo doesn't enforce the limit:1)
      const currentSubscription = _.max(results, result=>new Date(result.createdAt).getTime());
      
      if (currentSubscription.state === "subscribed")
        return true;
      else if (currentSubscription.state === "suppressed")
        return false;
    }
    return userIsDefaultSubscribed({
      user: currentUser,
      subscriptionType, collectionName, document
    });
  }
  const onSubscribe = async (e) => {
    try {
      e.preventDefault();
      
      const newSubscription = {
        state: isSubscribed() ? 'suppressed' : 'subscribed',
        documentId: document._id,
        collectionName,
        type: subscriptionType,
      }
      createSubscription({data: newSubscription})

      // success message will be for example posts.subscribed
      flash({messageString: `Successfully ${isSubscribed() ? "unsubscribed" : "subscribed"}`});
    } catch(error) {
      flash({messageString: error.message});
    }
  }

  // can't subscribe to yourself
  if (!currentUser || !document || (collectionName === 'Users' && document._id === currentUser._id)) {
    return null;
  }

  return <a className={className} onClick={onSubscribe}>
    { isSubscribed() ? unsubscribeMessage : subscribeMessage }
  </a>
}

registerComponent('SubscribeTo', SubscribeTo,
  withMessages,
  [withCreate, {
    collection: Subscriptions,
    fragmentName: 'SubscriptionState',
  }]
);


