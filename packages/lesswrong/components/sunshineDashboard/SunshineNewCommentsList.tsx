import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import SunshineNewCommentsItem from "./SunshineNewCommentsItem";
import SunshineListTitle from "./SunshineListTitle";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";

const CommentsListWithParentMetadataMultiQuery = gql(`
  query multiCommentSunshineNewCommentsListQuery($selector: CommentSelector, $limit: Int) {
    comments(selector: $selector, limit: $limit) {
      results {
        ...CommentsListWithParentMetadata
      }
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
      limit: limit ?? 10,
    },
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.comments?.results;
  
  if (results && results.length) {
    return (
      <div className={classes.root}>
        <SunshineListTitle>
          Unreviewed Comments
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



