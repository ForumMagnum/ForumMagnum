import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import { Posts } from '../../lib/collections/posts';
import Users from '../../lib/collections/users/collection';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    backgroundColor:"rgba(0,80,0,.08)"
  }
})

const SunshineNewPostsList = ({ terms, classes }: {
  terms: any,
  classes: ClassesType,
}) => {
  const { results, totalCount=0 } = useMulti({
    terms,
    collection: Posts,
    fragmentName: 'SunshinePostsList',
    enableTotal: true,
    ssr: true
  });
  const currentUser = useCurrentUser();
  
  const { SunshineListCount, SunshineListTitle, SunshineNewPostsItem } = Components
  if (results && results.length && Users.canDo(currentUser, "posts.moderate.all")) {
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

