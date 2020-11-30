import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    backgroundColor:"rgba(0,80,0,.08)"
  }
})

const SunshineNewPostsList = ({ terms, classes }: {
  terms: PostsViewTerms,
  classes: ClassesType,
}) => {
  const { results, totalCount } = useMulti({
    terms,
    collectionName: "Posts",
    fragmentName: 'SunshinePostsList',
    enableTotal: true,
  });
  const currentUser = useCurrentUser();
  
  const { SunshineListCount, SunshineListTitle, SunshineNewPostsItem } = Components
  if (results && results.length && userCanDo(currentUser, "posts.moderate.all")) {
    return (
      <div className={classes.root}>
        <SunshineListTitle>
          Unreviewed Posts <SunshineListCount count={totalCount}/>
        </SunshineListTitle>
        {results.map(post =>
          <div key={post._id} >
            <SunshineNewPostsItem post={post}/>
          </div>
        )}
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

