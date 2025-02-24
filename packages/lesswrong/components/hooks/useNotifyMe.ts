import { MouseEvent, useCallback } from "react";
import { useTracking } from "../../lib/analyticsEvents";
import { useCreate } from "../../lib/crud/withCreate";
import { graphqlTypeToCollectionName } from "../../lib/vulcan-lib/collections";
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
import { userIsDefaultSubscribed, userSubscriptionStateIsFixed } from "../../lib/subscriptionUtil";

export type NotifyMeDocument =
  UsersProfile |
  UsersMinimumInfo |
  UserOnboardingAuthor |
  UserOnboardingTag |
  SequencesPageTitleFragment |
  CommentsList |
  PostsBase |
  PostsMinimumInfo |
  PostsBase_group |
  PostsAuthors_user;

const currentUserIsSubscribed = (
  currentUser: UsersCurrent|null,
  results: SubscriptionState[]|undefined,
  subscriptionType: SubscriptionType,
  collectionName: CollectionNameString,
  document: NotifyMeDocument,
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
  document: rawDocument,
  overrideSubscriptionType,
  hideIfNotificationsDisabled,
  hideForLoggedOutUsers,
  hideFlashes,
}: {
  document: NotifyMeDocument,
  overrideSubscriptionType?: SubscriptionType,
  hideIfNotificationsDisabled?: boolean,
  hideForLoggedOutUsers?: boolean,
  hideFlashes?: boolean,
}): NotifyMeConfig => {
  // __typename is added by apollo but it doesn't exist in the typesystem
  const document = rawDocument as NotifyMeDocument & {__typename: string};

  const currentUser = useCurrentUser();
  const {openDialog} = useDialog();
  const {flash} = useMessages();
  const {create: createSubscription} = useCreate({
    collectionName: "Subscriptions",
    fragmentName: "SubscriptionState",
  });

  const collectionName = graphqlTypeToCollectionName(document.__typename);
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

  const isSubscribed = currentUser ?
    currentUserIsSubscribed(
      currentUser,
      results,
      subscriptionType,
      collectionName,
      document,
    )
    : false;

  const onSubscribe = useCallback(async (e: MouseEvent) => {
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
      if (!hideFlashes) {
        flash({messageString: `Successfully ${
          isSubscribed ? "unsubscribed" : "subscribed"}`
        });
      }
    } catch(error) {
      if (!hideFlashes) {
        flash({messageString: error.message});
      }
    }
  }, [
    currentUser, openDialog, isSubscribed, captureEvent, document._id,
    collectionName, subscriptionType, createSubscription, invalidateCache,
    flash, hideFlashes,
  ]);

  // If we are hiding the notify element, don't return an onSubscribe.
  if (!currentUser && hideForLoggedOutUsers) {
    return {
      loading: false
    }
  }
  // By default, we allow logged out users to see the element and click on it,
  // so that we can prompt them with the login/sign up buttons.
  if (!currentUser) {
    return {
      loading: false,
      disabled: false,
      isSubscribed: false,
      onSubscribe,
    }
  }

  // In some cases we know what the state will be and don't want to load/wait on another network request
  const stateIsFixed = userSubscriptionStateIsFixed({user: currentUser, subscriptionType, documentId: document._id});
  if (stateIsFixed) {
    return {
      loading: false,
      disabled: true,
      isSubscribed,
    };
  }

  if (loading) {
    return {
      loading: true,
    };
  }

  if (hideIfNotificationsDisabled && !isSubscribed) {
    return {
      disabled: true,
      loading: false,
    };
  }

  return {
    loading: false,
    disabled: false,
    isSubscribed,
    onSubscribe,
  };
}
