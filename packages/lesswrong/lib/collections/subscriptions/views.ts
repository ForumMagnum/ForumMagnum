import { Subscriptions } from "./collection"
import { subscriptionTypes } from "./schema";

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

Subscriptions.addView("subscriptionState", function (terms: SubscriptionsViewTerms) {
  const { userId, documentId, collectionName, type} = terms
  return {
    selector: {userId, documentId, collectionName, type, deleted: false},
    options: {sort: {createdAt: -1}, limit: 1}
  };
});

Subscriptions.addView("subscriptionsOfType", function (terms: SubscriptionsViewTerms) {
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
});

Subscriptions.addView("membersOfGroup", (terms) => {
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
});

