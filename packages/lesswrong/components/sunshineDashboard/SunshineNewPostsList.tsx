import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import SunshineListCount from "./SunshineListCount";
import SunshineListTitle from "./SunshineListTitle";
import SunshineNewPostsItem from "./SunshineNewPostsItem";
import LoadMore from "../common/LoadMore";
import { useQuery } from "@apollo/client";
import { useLoadMore } from "@/components/hooks/useLoadMore";
import { gql } from "@/lib/generated/gql-codegen/gql";

const SunshinePostsListMultiQuery = gql(`
  query multiPostSunshineNewPostsListQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SunshinePostsList
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.panelBackground.sunshineNewPosts,
  },
  loadMorePadding: {
    paddingLeft: 16
  }
})

const SunshineNewPostsList = ({ terms, classes }: {
  terms: PostsViewTerms,
  classes: ClassesType<typeof styles>,
}) => {
  const { view, limit, ...selectorTerms } = terms;
  const { data, loading, refetch, fetchMore } = useQuery(SunshinePostsListMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: 10,
      enableTotal: true,
    },
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.posts?.results;

  const loadMoreProps = useLoadMore({
    data: data?.posts,
    loading,
    fetchMore,
    initialLimit: 10,
    itemsPerPage: 10,
    enableTotal: true,
    resetTrigger: terms
  });

  const totalCount = data?.posts?.totalCount ?? 0;
  const showLoadMore = !loadMoreProps.hidden;

  const currentUser = useCurrentUser();
  if (results && results.length && userCanDo(currentUser, "posts.moderate.all")) {
    return (
      <div className={classes.root}>
        <SunshineListTitle>
          Unreviewed Posts <SunshineListCount count={totalCount}/>
        </SunshineListTitle>
        {results.map(post =>
          <div key={post._id} >
            <SunshineNewPostsItem post={post} refetch={refetch}/>
          </div>
        )}
      
      {showLoadMore && <div className={classes.loadMorePadding}>
        <LoadMore {...loadMoreProps}/>
      </div>}
      </div>
    )
  } else {
    return null
  }
}

export default registerComponent('SunshineNewPostsList', SunshineNewPostsList, {styles});



