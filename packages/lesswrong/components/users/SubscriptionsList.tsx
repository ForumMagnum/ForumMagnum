import React, { ReactNode } from "react";
import { commentBodyStyles } from "@/themes/stylePiping";
import { useCurrentUser } from "../common/withUser";
import { useCountItemsContext } from "../hooks/CountItemsContext";
import SubscribedItem from "./SubscribedItem";
import SectionTitle from "../common/SectionTitle";
import Loading from "../vulcan-core/Loading";
import LoadMore from "../common/LoadMore";
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";

const SubscriptionStateMultiQuery = gql(`
  query multiSubscriptionSubscriptionsListQuery($selector: SubscriptionSelector, $limit: Int, $enableTotal: Boolean) {
    subscriptions(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SubscriptionState
      }
      totalCount
    }
  }
`);

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

  const { data, loading, loadMoreProps } = useQueryWithLoadMore(SubscriptionStateMultiQuery, {
    variables: {
      selector: { subscriptionsOfType: { userId: currentUser?._id, collectionName: collectionName, subscriptionType: subscriptionType } },
      limit: 20,
      enableTotal: true,
    },
    itemsPerPage: 100,
  });

  const results = data?.subscriptions?.results;
  const showLoadMore = !loadMoreProps.hidden;

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
