import { subscriptionTypes } from "./schema";
import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface SubscriptionsViewTerms extends ViewTermsBase {
    view?: SubscriptionsViewName
    userId?: string
    collectionName?: string
    subscriptionType?: string
    documentId?: string
    type?: string
  }
}

function subscriptionState(terms: SubscriptionsViewTerms) {
  const { userId, documentId, collectionName, type} = terms
  return {
    selector: {userId, documentId, collectionName, type, deleted: false},
    options: {sort: {createdAt: -1}, limit: 1}
  };
}

function subscriptionsOfType(terms: SubscriptionsViewTerms) {
  return {
    selector: {
      userId: terms.userId,
      collectionName: terms.collectionName,
      type: terms.subscriptionType,
      deleted: false,
      state: "subscribed",
    },
    options: {sort: {createdAt: -1}}
  };
}

function membersOfGroup(terms: SubscriptionsViewTerms) {
  const { documentId } = terms;
  return {
    selector: {
      documentId,
      type: subscriptionTypes.newEvents,
      deleted: false,
      state: "subscribed",
    },
    options: {
      sort: {
        createdAt: -1,
      },
    },
  };
}

export const SubscriptionsViews = new CollectionViewSet('Subscriptions', {
  subscriptionState,
  subscriptionsOfType,
  membersOfGroup
});

