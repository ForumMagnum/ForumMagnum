import type { MouseEvent } from "react";
import { useTracking } from "../../lib/analyticsEvents";
import { useCreate } from "../../lib/crud/withCreate";
import { getCollectionName } from "../../lib/vulcan-lib";
import { useDialog } from "../common/withDialog";
import { useMessages } from "../common/withMessages";
import { useCurrentUser } from "../common/withUser";
import {
  defaultSubscriptionTypeTable,
  isDefaultSubscriptionType,
} from "../../lib/collections/subscriptions/mutations";
import type { SubscriptionType } from "../../lib/collections/subscriptions/schema";
import { useMulti } from "../../lib/crud/withMulti";
import { max } from "underscore";
import { userIsDefaultSubscribed } from "../../lib/subscriptionUtil";

const currentUserIsSubscribed = (
  currentUser: UsersCurrent|null,
  results: SubscriptionState[]|undefined,
  subscriptionType: AnyBecauseTodo,
  collectionName: CollectionNameString,
  document: AnyBecauseTodo,
) => {
  // Get the last element of the results array, which will be the most
  // recent subscription
  if (results && results.length > 0) {
    // Get the newest subscription entry (Mingo doesn't enforce the limit:1)
    const currentSubscription = max(
      results,
      (result) => new Date(result.createdAt).getTime(),
    );

    if (currentSubscription.state === "subscribed") {
      return true;
    } else if (currentSubscription.state === "suppressed") {
      return false;
    }
  }
  return userIsDefaultSubscribed({
    user: currentUser,
    subscriptionType,
    collectionName,
    document,
  });
}

export type NotifyMeConfig = {
  loading: boolean,
  disabled?: boolean,
  isSubscribed?: boolean,
  onSubscribe?: (event: MouseEvent) => Promise<void>,
}

export const useNotifyMe = ({
  document,
  overrideSubscriptionType,
  hideIfNotificationsDisabled,
}: {
  document: AnyBecauseTodo,
  overrideSubscriptionType?: SubscriptionType,
  hideIfNotificationsDisabled?: boolean,
}): NotifyMeConfig => {
  const currentUser = useCurrentUser();
  const {openDialog} = useDialog();
  const {flash} = useMessages();
  const {create: createSubscription} = useCreate({
    collectionName: "Subscriptions",
    fragmentName: "SubscriptionState",
  });

  const collectionName = getCollectionName(document.__typename);
  if (!isDefaultSubscriptionType(collectionName)) {
    throw new Error(`Collection ${collectionName} is not subscribable`);
  }

  const documentType = collectionName.toLowerCase();
  const subscriptionType = overrideSubscriptionType ??
    defaultSubscriptionTypeTable[collectionName];
  const {captureEvent} = useTracking({
    eventType: "subscribeClicked",
    eventProps: {documentId: document._id, documentType: documentType},
  });

  // Get existing subscription, if there is one
  const {results, loading, invalidateCache} = useMulti({
    terms: {
      view: "subscriptionState",
      documentId: document._id,
      userId: currentUser?._id,
      type: subscriptionType,
      collectionName,
      limit: 1,
    },
    collectionName: "Subscriptions",
    fragmentName: "SubscriptionState",
    enableTotal: false,
    skip: !currentUser
  });

  if (loading) {
    return {
      loading: true,
    };
  };

  const isSubscribed = currentUserIsSubscribed(
    currentUser,
    results,
    subscriptionType,
    collectionName,
    document,
  );

  // Can't subscribe to yourself
  if (collectionName === 'Users' && document._id === currentUser?._id) {
    return {
      disabled: true,
      loading: false,
    };
  }

  if (hideIfNotificationsDisabled && !isSubscribed) {
    return {
      disabled: true,
      loading: false,
    };
  }

  const onSubscribe = async (e: MouseEvent) => {
    if (!currentUser) {
      openDialog({componentName: "LoginPopup"});
      return;
    }

    try {
      e.preventDefault();
      const subscriptionState = isSubscribed ? "suppressed" : "subscribed";
      captureEvent("subscribeClicked", {state: subscriptionState});

      const newSubscription = {
        state: subscriptionState,
        documentId: document._id,
        collectionName,
        type: subscriptionType,
      } as const;

      await createSubscription({data: newSubscription});

      // We have to manually invalidate the cache as this hook can sometimes be
      // unmounted before the create mutation has finished (eg; when used inside
      // a dropdown item) which means that the automatic cache invalidation code
      // won't be able to find the relevant query
      invalidateCache();

      // Success message will be for example posts.subscribed
      flash({messageString: `Successfully ${
        isSubscribed ? "unsubscribed" : "subscribed"}`
      });
    } catch(error) {
      flash({messageString: error.message});
    }
  }

  return {
    loading: false,
    disabled: false,
    isSubscribed,
    onSubscribe,
  };
}
