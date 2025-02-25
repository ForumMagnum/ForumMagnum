import React, { ReactNode } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useSingle } from "@/lib/crud/withSingle";

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
  const {Loading, NotifyMeButton} = Components;
  const {document, loading} = useSingle({
    documentId: subscription.documentId,
    collectionName, fragmentName,
  });

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

const SubscribedItemComponent = registerComponent(
  "SubscribedItem",
  SubscribedItem,
  {styles},
);

declare global {
  interface ComponentTypes {
    SubscribedItem: typeof SubscribedItemComponent
  }
}
