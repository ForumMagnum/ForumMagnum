import React, { ReactNode } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { gql as dynamicGql, useQuery } from '@apollo/client';
import { getFragment } from "@/lib/vulcan-lib/fragments";
import Loading from "../vulcan-core/Loading";
import NotifyMeButton from "../notifications/NotifyMeButton";
import type { SubscriptionState } from "@/lib/generated/gql-codegen/graphql";
import { SubscriptionType } from "@/lib/collections/subscriptions/helpers";

const styles = (theme: ThemeType) => ({
  root: {
    marginLeft: -6,
    display: "flex",
    padding: 6,
    borderRadius: 3,
    ...theme.typography.commentStyle,
    '&:hover': {
      backgroundColor: theme.palette.grey[200],
    },
  },
  description: {
    marginLeft: 8,
    fontWeight: 500,
  },
  unsubscribeButton: {
    minWidth: 83,
    opacity: 0.7,
    wordBreak: "keep-all"
  },
});

const SubscribedItem = ({
  collectionName,
  fragmentName,
  subscription,
  renderDocument,
  classes,
}: {
  collectionName: CollectionNameString,
  fragmentName: keyof FragmentTypes,
  subscription: SubscriptionState,
  renderDocument: (document: AnyBecauseTodo) => ReactNode,
  classes: ClassesType<typeof styles>
}) => {
  const fragment = getFragment(fragmentName);

  const query = dynamicGql`
    query SubscribedItem($documentId: String!) {
      ${collectionName}(input: { selector: { _id: $documentId } }) {
        ${`...${fragmentName}`}
      }
    }
    ${fragment}
  `;

  const { data: fetchedResult, loading } = useQuery(query, {
    variables: {
      documentId: subscription.documentId,
    },
    skip: !subscription.documentId,
  });

  const document = fetchedResult?.[collectionName];

  if (!document && !loading) {
    return null;
  }
  if (loading) {
    return <Loading/>;
  }

  return (
    <div className={classes.root}>
      <NotifyMeButton
        document={document}
        subscriptionType={(subscription.type ?? undefined) as SubscriptionType | undefined}
        subscribeMessage="Resubscribe"
        unsubscribeMessage="Unsubscribe"
        className={classes.unsubscribeButton}
      />
      <div className={classes.description}>
        {renderDocument(document)}
      </div>
    </div>
  );
}

export default registerComponent(
  "SubscribedItem",
  SubscribedItem,
  {styles},
);


