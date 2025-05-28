import React, { ReactNode } from "react";
import { useQuery } from '@apollo/client';
import Loading from "../vulcan-core/Loading";
import NotifyMeButton from "../notifications/NotifyMeButton";
import { SubscriptionType } from "@/lib/collections/subscriptions/helpers";
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { defineStyles, useStyles } from "../hooks/useStyles";

const styles = defineStyles('SubscribedItem', (theme: ThemeType) => ({
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
}));

export default function SubscribedItem<TQuery, TExtractResult>({
  query,
  subscription,
  renderDocument,
  extractDocument,
}: {
  query: TypedDocumentNode<TQuery, { documentId: string }>,
  subscription: SubscriptionState,
  renderDocument: (document: NonNullable<TExtractResult>) => ReactNode,
  extractDocument: (data: TQuery) => TExtractResult,
}) {
  const classes = useStyles(styles);
  
  const { data: fetchedResult, loading } = useQuery(query, {
    variables: {
      documentId: subscription.documentId ?? "",
    },
    skip: !subscription.documentId,
  });

  const document = fetchedResult ? extractDocument(fetchedResult) : null;

  if (loading) {
    return <Loading/>;
  }

  if (!document) {
    return null;
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
