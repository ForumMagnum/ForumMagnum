import React, { ReactNode } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { commentBodyStyles } from "@/themes/stylePiping";
import { useCurrentUser } from "../common/withUser";
import { useMulti } from "@/lib/crud/withMulti";
import { useCountItemsContext } from "../hooks/CountItemsContext";

const styles = (theme: ThemeType) => ({
  root: {
    ...commentBodyStyles(theme),
  },
  title: {
    fontSize: "1.8rem !important",
  },
  subscriptionTypeDescription: {
    marginBottom: 10,
    fontStyle: "italic",
  },
});

const SubscriptionsList = ({
  collectionName,
  fragmentName,
  subscriptionType,
  renderDocument,
  title,
  subscriptionTypeDescription,
  classes,
}: {
  collectionName: CollectionNameString,
  fragmentName: keyof FragmentTypes,
  subscriptionType: string,
  renderDocument: (document: AnyBecauseTodo) => ReactNode,
  title: React.ReactNode,
  subscriptionTypeDescription?: String
  classes: ClassesType<typeof styles>,
}) => {
  const {SubscribedItem, SectionTitle, Loading, LoadMore} = Components;
  const currentUser = useCurrentUser();
  const countItemsContext = useCountItemsContext();

  const {results, loading, loadMoreProps, showLoadMore} = useMulti({
    terms: {
      view: "subscriptionsOfType",
      userId: currentUser?._id,
      collectionName: collectionName,
      subscriptionType: subscriptionType,
      limit: 20,
    },
    collectionName: "Subscriptions",
    fragmentName: "SubscriptionState",
    itemsPerPage: 100,
    enableTotal: true
  });

  if (!currentUser) {
    return null;
  }
  if (loading) {
    return <Loading/>;
  }
  if (!results) {
    return null;
  }
  if (results.length === 0) {
    return null;
  }

  countItemsContext?.addItems(results.length);

  return (
    <div className={classes.root}>
      <SectionTitle title={title} titleClassName={classes.title}/>
      {subscriptionTypeDescription &&
        <div className={classes.subscriptionTypeDescription}>
          {subscriptionTypeDescription}
        </div>
      }
      {results.map(result =>
        <SubscribedItem
          key={result._id}
          collectionName={collectionName}
          fragmentName={fragmentName}
          subscription={result}
          renderDocument={renderDocument}
        />
      )}
      {showLoadMore && <LoadMore {...loadMoreProps} />}
    </div>
  );
}

const SubscriptionsListComponent = registerComponent(
  "SubscriptionsList",
  SubscriptionsList,
  {styles},
);

declare global {
  interface ComponentTypes {
    SubscriptionsList: typeof SubscriptionsListComponent
  }
}
