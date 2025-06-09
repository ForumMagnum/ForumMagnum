import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import SunshineListTitle from "./SunshineListTitle";
import OmegaIcon from "../icons/OmegaIcon";
import AFSuggestPostsItem from "./AFSuggestPostsItem";
import LoadMore from "../common/LoadMore";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";

const SuggestAlignmentPostMultiQuery = gql(`
  query multiPostAFSuggestPostsListQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SuggestAlignmentPost
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


const AFSuggestPostsList = ({ classes }: {
  classes: ClassesType<typeof styles>,
}) => {
  const { data, loadMoreProps } = useQueryWithLoadMore(SuggestAlignmentPostMultiQuery, {
    variables: {
      selector: { alignmentSuggestedPosts: {} },
      limit: 10,
      enableTotal: false,
    },
    fetchPolicy: 'cache-and-network',
  });

  const results = data?.posts?.results;

  if (results && results.length) {
    return <div>
      <SunshineListTitle>
        <div><OmegaIcon className={classes.icon}/> Suggested Posts</div>
      </SunshineListTitle>
      {results.map(post =>
        <div key={post._id} >
          <AFSuggestPostsItem post={post}/>
        </div>
      )}
      <LoadMore {...loadMoreProps}/>
    </div>
  } else {
    return null
  }
}

export default registerComponent('AFSuggestPostsList', AFSuggestPostsList, {styles});



