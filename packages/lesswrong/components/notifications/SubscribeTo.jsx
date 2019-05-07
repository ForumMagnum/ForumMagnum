import React, { Component } from 'react';
import { withMessages, registerComponent, Utils, withMulti, withCreate } from 'meteor/vulcan:core';
import { Subscriptions } from '../../lib/collections/subscriptions/collection'
import { defaultSubscriptionTypeTable } from '../../lib/collections/subscriptions/mutations'
import mapProps from 'recompose/mapProps'
import withUser from '../common/withUser';

const getSubscribeAction = subscribed => subscribed ? 'unsubscribe' : 'subscribe'

class SubscribeTo extends Component {
  isSubscribed = () => {
    const { results } = this.props
    if (!results || results.length === 0) return false
    // Get the last element of the results array, which will be the most recent subscription
    const currentSubscription = results[results.length-1]
    return !!(currentSubscription.state === "subscribed")
  }
  onSubscribe = async (e) => {
    const { document, createSubscription, collectionName, flash } = this.props;
    try {
      e.preventDefault();
      
      const newSubscription = {
        state: this.isSubscribed() ? 'suppressed' : 'subscribed',
        documentId: document._id,
        collectionName,
        type: defaultSubscriptionTypeTable[collectionName]
      }
      createSubscription({data: newSubscription})

      // success message will be for example posts.subscribed
      flash({messageString: `Successfully ${this.isSubscribed() ? "unsubscribed" : "subscribed"}`});
    } catch(error) {
      flash({messageString: error.message});
    }
  }

  render() {
    const { currentUser, document, collectionName, documentType, subscribeMessage, unsubscribeMessage } = this.props;
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
  const documentType = Utils.getCollectionNameFromTypename(document.__typename)
  const collectionName = Utils.capitalize(documentType)
  return {
    document,
    collectionName,
    currentUser,
    type,
    documentType,
    terms: {
      view: "subscriptionState",
      documentId: document._id,
      userId: currentUser._id,
      type: type || defaultSubscriptionTypeTable[collectionName],
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


