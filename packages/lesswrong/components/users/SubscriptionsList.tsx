import React, { ReactNode } from "react";
import { commentBodyStyles } from "@/themes/stylePiping";
import { useCurrentUser } from "../common/withUser";
import { useMulti } from "@/lib/crud/withMulti";
import { useCountItemsContext } from "../hooks/CountItemsContext";
import SubscribedItem from "./SubscribedItem";
import SectionTitle from "../common/SectionTitle";
import Loading from "../vulcan-core/Loading";
import LoadMore from "../common/LoadMore";
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { defineStyles, useStyles } from "../hooks/useStyles";

const styles = defineStyles('SubscriptionsList', (theme: ThemeType) => ({
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
}));

export default function SubscriptionsList<TQuery, TExtractResult>({
  collectionName,
  subscriptionType,
  query,
  extractDocument,
  renderDocument,
  title,
  subscriptionTypeDescription,
}: {
  collectionName: CollectionNameString,
  subscriptionType: string,
  query: TypedDocumentNode<TQuery, { documentId: string }>,
  extractDocument: (data: TQuery) => TExtractResult,
  renderDocument: (document: NonNullable<TExtractResult>) => ReactNode,
  title: React.ReactNode,
  subscriptionTypeDescription?: string
}) {
  const classes = useStyles(styles);
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
          query={query}
          extractDocument={extractDocument}
          subscription={result}
          renderDocument={renderDocument}
        />
      )}
      {showLoadMore && <LoadMore {...loadMoreProps} />}
    </div>
  );
}
