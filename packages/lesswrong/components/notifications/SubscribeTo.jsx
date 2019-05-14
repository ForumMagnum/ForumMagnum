import React, { Component } from 'react';
import { withMessages, registerComponent, Utils, withMulti, withCreate } from 'meteor/vulcan:core';
import { Subscriptions } from '../../lib/collections/subscriptions/collection'
import { defaultSubscriptionTypeTable } from '../../lib/collections/subscriptions/mutations'
import { userIsDefaultSubscribed } from '../../lib/subscriptionUtil.js';
import mapProps from 'recompose/mapProps'
import withUser from '../common/withUser';

class SubscribeTo extends Component {
  isSubscribed = () => {
    const { results, currentUser, subscriptionType, collectionName, document } = this.props
    // Get the last element of the results array, which will be the most recent subscription
    if (results && results.length > 0) {
      const currentSubscription = results[results.length-1]
      if (currentSubscription.state === "subscribed")
        return true;
    }
    return userIsDefaultSubscribed({
      user: currentUser,
      subscriptionType, collectionName, document
    });
  }
  onSubscribe = async (e) => {
    const { document, createSubscription, collectionName, flash, subscriptionType } = this.props;
    try {
      e.preventDefault();
      
      const newSubscription = {
        state: this.isSubscribed() ? 'suppressed' : 'subscribed',
        documentId: document._id,
        collectionName,
        type: subscriptionType,
      }
      createSubscription({data: newSubscription})

      // success message will be for example posts.subscribed
      flash({messageString: `Successfully ${this.isSubscribed() ? "unsubscribed" : "subscribed"}`});
    } catch(error) {
      flash({messageString: error.message});
    }
  }

  render() {
    const { currentUser, document, collectionName, subscribeMessage, unsubscribeMessage } = this.props;
    // can't subscribe to yourself
    if (!currentUser || !document || (collectionName === 'Users' && document._id === currentUser._id)) {
      return null;
    }

    const className = this.props.className || "";
    return <a className={className} onClick={this.onSubscribe}>
      { this.isSubscribed() ? unsubscribeMessage : subscribeMessage }
    </a>
  }

}

const remapProps = ({document, currentUser, type, ...rest}) => {
  const documentType = Utils.getCollectionNameFromTypename(document.__typename);
  const collectionName = Utils.capitalize(documentType);
  const subscriptionType = type || defaultSubscriptionTypeTable[collectionName];
  
  return {
    document,
    collectionName,
    currentUser,
    subscriptionType,
    documentType,
    terms: {
      view: "subscriptionState",
      documentId: document._id,
      userId: currentUser._id,
      subscriptionType,
      collectionName,
      limit: 1
    },
    ...rest
  }
}
//Note: the order of HoCs matters in this case, since we need to have access to currentUser before we call mapProps
registerComponent('SubscribeTo', SubscribeTo,
  withUser, withMessages,
  mapProps(remapProps),
  [withMulti, {
    collection: Subscriptions,
    queryName: 'subscriptionState',
    fragmentName: 'SubscriptionState',
    enableTotal: false,
    ssr: true
  }],
  [withCreate, {
    collection: Subscriptions,
    fragmentName: 'SubscriptionState',
  }]
);


