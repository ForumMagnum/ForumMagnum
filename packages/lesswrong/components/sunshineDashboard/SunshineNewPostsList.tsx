import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';

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
  const { results, totalCount, refetch, loadMoreProps, showLoadMore } = useMulti({
    terms,
    collectionName: "Posts",
    fragmentName: 'SunshinePostsList',
    enableTotal: true,
  });
  const currentUser = useCurrentUser();
  
  const { SunshineListCount, SunshineListTitle, SunshineNewPostsItem, LoadMore } = Components
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

const SunshineNewPostsListComponent = registerComponent('SunshineNewPostsList', SunshineNewPostsList, {styles});

declare global {
  interface ComponentTypes {
    SunshineNewPostsList: typeof SunshineNewPostsListComponent
  }
}

