import React, { ReactNode } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useSingle } from "@/lib/crud/withSingle";
import { Loading } from "../vulcan-core/Loading";
import { SubscribeTo } from "../notifications/NotifyMeButton";

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

const SubscribedItemInner = ({
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
  const {document, loading} = useSingle({
    documentId: subscription.documentId ?? undefined,
    collectionName, fragmentName,
    skip: !subscription.documentId,
  });

  if (!document && !loading) {
    return null;
  }
  if (loading) {
    return <Loading/>;
  }

  return (
    <div className={classes.root}>
      <SubscribeTo
        document={document}
        subscriptionType={subscription.type}
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

export const SubscribedItem = registerComponent(
  "SubscribedItem",
  SubscribedItemInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    SubscribedItem: typeof SubscribedItem
  }
}
