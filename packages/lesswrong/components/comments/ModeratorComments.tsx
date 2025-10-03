"use client";

import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { sectionTitleStyle } from '../common/SectionTitle';
import CommentsNode from "./CommentsNode";
import Loading from "../vulcan-core/Loading";
import LoadMore from "../common/LoadMore";
import SingleColumnSection from "../common/SingleColumnSection";
import { Typography } from "../common/Typography";
import { NetworkStatus } from "@apollo/client";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";

const CommentsListWithParentMetadataMultiQuery = gql(`
  query multiCommentModeratorCommentsQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsListWithParentMetadata
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) =>  ({
  root: {
    [theme.breakpoints.up('sm')]: {
      marginRight: theme.spacing.unit*4,
    }
  },
  title: {
    marginBottom: 8,
    ...sectionTitleStyle(theme),
  },
})


const ModeratorComments = ({classes, terms={view: "moderatorComments"}, truncated=true, noResultsMessage="No Comments Found"}: {
  classes: ClassesType<typeof styles>,
  terms?: CommentsViewTerms,
  truncated?: boolean,
  noResultsMessage?: string,
}) => {
  const { view, limit, ...selectorTerms } = terms;
  const { data, networkStatus, loadMoreProps } = useQueryWithLoadMore(CommentsListWithParentMetadataMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: limit ?? 10,
      enableTotal: false,
    },
  });

  const results = data?.comments?.results;

  const loadingInitial = networkStatus === NetworkStatus.loading;
  if (!loadingInitial && results && !results.length) {
    return (<Typography variant="body2">{noResultsMessage}</Typography>)
  }
  if (loadingInitial || !results) {
    return <Loading />
  }

  return (
    <SingleColumnSection>
      <div className={classes.title}>Moderator Comments</div>
      <div className={classes.root}>
        {results.map(comment =>
          <div key={comment._id}>
            <CommentsNode
              treeOptions={{
                condensed: false,
                post: comment.post || undefined,
                tag: comment.tag || undefined,
                showPostTitle: true,
                forceNotSingleLine: true,
              }}
              comment={comment}
              startThreadTruncated={truncated}
            />
          </div>
        )}
        <LoadMore {...loadMoreProps} />
      </div>
    </SingleColumnSection>
  )
}

export default registerComponent('ModeratorComments', ModeratorComments, {styles});



