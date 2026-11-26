"use client";

import React from 'react';
import { useCurrentUser } from '../common/withUser';
import Loading from "../vulcan-core/Loading";
import SingleColumnSection from "../common/SingleColumnSection";
import EmailPreview, { EmailPreviewHeaders } from "../notifications/EmailPreview";
import { maybeDate } from '@/lib/utils/dateUtils';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { Link } from '@/lib/reactRouterWrapper';

const emailHistoryFragmentMultiQuery = gql(`
  query multiLWEventEmailHistoryQuery($selector: LWEventSelector, $limit: Int, $enableTotal: Boolean) {
    lWEvents(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...emailHistoryFragment
      }
      totalCount
    }
  }
`);

const styles = defineStyles('EmailHistory', (theme: ThemeType) => ({
  curationEmail: {
    marginBottom: 40,
  },
  postLink: {
    color: theme.palette.primary.main,
  },
  recommendedPosts: {
    display: "flex",
    flexWrap: "wrap",
    columnGap: 12,
  },
}));

const PostIdLink = ({postId}: {postId: string}) => {
  const classes = useStyles(styles);
  return <Link className={classes.postLink} to={`/posts/${postId}`}>{postId}</Link>;
};

const CurationEmailEntry = ({email, sentDate, postId, recommendedPostIds}: {
  email: EmailPreview,
  sentDate?: Date,
  postId: string,
  recommendedPostIds: string[],
}) => {
  const classes = useStyles(styles);
  return <div className={classes.curationEmail}>
    <EmailPreviewHeaders
      email={email}
      sentDate={sentDate}
      extraHeaders={[
        { name: "Body", content: "Not stored for curation emails" },
        { name: "Post", content: <PostIdLink postId={postId}/> },
        {
          name: "Recommended",
          content: <span className={classes.recommendedPosts}>
            {recommendedPostIds.map(id => <PostIdLink key={id} postId={id}/>)}
          </span>,
        },
      ]}
    />
  </div>;
}

export const EmailHistoryPage = () => {
  const currentUser = useCurrentUser();
  if (!currentUser) return <div/>

  return <SingleColumnSection>
    <EmailHistory
      terms={{view: "emailHistory", userId: currentUser._id}}
    />
  </SingleColumnSection>
}


export const EmailHistory = ({terms}: {terms: LWEventsViewTerms}) => {
  const { view, limit, ...selectorTerms } = terms;
  const { data } = useQuery(emailHistoryFragmentMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: limit ?? 10,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.lWEvents?.results;
  if (!results) return <Loading/>

  return <>{results.map((lwEvent) => {
    const sentDate = maybeDate(lwEvent.createdAt) ?? undefined;
    const curationEmail = lwEvent.properties.curationEmail;
    if (curationEmail) {
      return <CurationEmailEntry
        key={lwEvent._id}
        email={lwEvent.properties}
        sentDate={sentDate}
        postId={curationEmail.postId}
        recommendedPostIds={curationEmail.recommendedPostIds}
      />;
    }
    return <EmailPreview key={lwEvent._id} email={lwEvent.properties} sentDate={sentDate}/>;
  })}</>
}
