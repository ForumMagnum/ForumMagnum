import React, { ReactNode, useEffect } from "react";
import SubscribedItem from "./SubscribedItem";
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
    marginBottom: 24,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[800],
    margin: 0,
  },
  subscriptionTypeDescription: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[500],
    marginTop: 2,
  },
  itemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
}));

export default function SubscriptionsList<TQuery, TExtractResult>({
  userId,
  collectionName,
  subscriptionType,
  query,
  extractDocument,
  renderDocument,
  title,
  subscriptionTypeDescription,
  readOnly,
  onLoaded,
}: {
  userId: string,
  collectionName: CollectionNameString,
  subscriptionType: string,
  query: TypedDocumentNode<TQuery, { documentId: string }>,
  extractDocument: (data: TQuery) => TExtractResult,
  renderDocument: (document: NonNullable<TExtractResult>) => ReactNode,
  title: React.ReactNode,
  subscriptionTypeDescription?: ReactNode,
  readOnly: boolean,
  onLoaded: (subscriptionType: string, hasItems: boolean) => void,
}) {
  const classes = useStyles(styles);

  const { data, loading, loadMoreProps } = useQueryWithLoadMore(SubscriptionStateMultiQuery, {
    variables: {
      selector: { subscriptionsOfType: { userId, collectionName, subscriptionType } },
      limit: 20,
      enableTotal: true,
    },
    itemsPerPage: 100,
  });

  const results = data?.subscriptions?.results;
  const hasResults = !!results && results.length > 0;

  useEffect(() => {
    if (!loading) {
      onLoaded(subscriptionType, hasResults);
    }
  }, [loading, hasResults, onLoaded, subscriptionType]);

  if (loading && !results) return <Loading />;
  if (!hasResults) return null;

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <h3 className={classes.title}>{title}</h3>
        {subscriptionTypeDescription && (
          <div className={classes.subscriptionTypeDescription}>
            {subscriptionTypeDescription}
          </div>
        )}
      </div>
      <div className={classes.itemList}>
        {results.map(result =>
          <SubscribedItem
            key={result._id}
            query={query}
            extractDocument={extractDocument}
            subscription={result}
            renderDocument={renderDocument}
            readOnly={readOnly}
          />
        )}
      </div>
      {!loadMoreProps.hidden && <LoadMore {...loadMoreProps} />}
    </div>
  );
}
