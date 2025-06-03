import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import SunshineListTitle from "./SunshineListTitle";
import OmegaIcon from "../icons/OmegaIcon";
import AFSuggestCommentsItem from "./AFSuggestCommentsItem";
import LoadMore from "../common/LoadMore";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen/gql";

const SuggestAlignmentCommentMultiQuery = gql(`
  query multiCommentAFSuggestCommentsListQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SuggestAlignmentComment
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  icon: {
    marginRight: 4
  }
})


const AFSuggestCommentsList = ({ classes }: {
  classes: ClassesType<typeof styles>,
}) => {
  const { data, loadMoreProps } = useQueryWithLoadMore(SuggestAlignmentCommentMultiQuery, {
    variables: {
      selector: { alignmentSuggestedComments: {} },
      limit: 10,
      enableTotal: true,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    itemsPerPage: 30,
  });

  const results = data?.comments?.results;

  if (results && results.length) {
    return <div>
      <SunshineListTitle>
        <div><OmegaIcon className={classes.icon}/> Suggested Comments</div>
      </SunshineListTitle>
      {results.map(comment =>
        <div key={comment._id} >
          <AFSuggestCommentsItem comment={comment}/>
        </div>
      )}
      <LoadMore {...loadMoreProps}/>
    </div>
  } else {
    return null
  }
}

export default registerComponent('AFSuggestCommentsList', AFSuggestCommentsList, {styles});



