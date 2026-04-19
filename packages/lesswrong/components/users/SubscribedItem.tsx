import React, { ReactNode } from "react";
import { useQuery } from "@/lib/crud/useQuery";
import Loading from "../vulcan-core/Loading";
import NotifyMeButton from "../notifications/NotifyMeButton";
import { SubscriptionType } from "@/lib/collections/subscriptions/helpers";
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { defineStyles, useStyles } from "../hooks/useStyles";

const styles = defineStyles('SubscribedItem', (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    padding: '6px 8px',
    marginLeft: -8,
    borderRadius: 4,
    fontSize: 14,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[800],
    '&:hover': {
      background: theme.palette.greyAlpha(0.04),
    },
  },
  description: {
    marginLeft: 8,
    fontWeight: 500,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  unsubscribeButton: {
    minWidth: 83,
    opacity: 0.6,
    fontSize: 12,
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
        optimisticIsSubscribed={subscription.state === "subscribed"}
      />
      <div className={classes.description}>
        {renderDocument(document)}
      </div>
    </div>
  );
}
