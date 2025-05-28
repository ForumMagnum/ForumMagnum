import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import SunshineListCount from "./SunshineListCount";
import SunshineNewCommentsItem from "./SunshineNewCommentsItem";
import SunshineListTitle from "./SunshineListTitle";
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const CommentsListWithParentMetadataMultiQuery = gql(`
  query multiCommentSunshineNewCommentsListQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsListWithParentMetadata
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.panelBackground.sunshineNewComments,
  }
})

const SunshineNewCommentsList = ({ terms, classes }: {
  terms: CommentsViewTerms,
  classes: ClassesType<typeof styles>,
}) => {
  const { view, limit, ...selectorTerms } = terms;
  const { data } = useQuery(CommentsListWithParentMetadataMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: 10,
      enableTotal: true,
    },
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.comments?.results;
  const totalCount = data?.comments?.totalCount ?? 0;
  
  if (results && results.length) {
    return (
      <div className={classes.root}>
        <SunshineListTitle>
          Unreviewed Comments <SunshineListCount count={totalCount}/>
        </SunshineListTitle>
        {results.map(comment =>
          <div key={comment._id} >
            <SunshineNewCommentsItem comment={comment}/>
          </div>
        )}
      </div>
    )
  } else {
    return null
  }
}

export default registerComponent('SunshineNewCommentsList', SunshineNewCommentsList, {styles});



