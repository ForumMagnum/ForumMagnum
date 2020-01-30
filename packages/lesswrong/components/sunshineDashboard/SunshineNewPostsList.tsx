import { Components, registerComponent } from 'meteor/vulcan:core';
import { useMulti } from '../../lib/crud/withMulti';
import React, { Component } from 'react';
import { Posts } from '../../lib/collections/posts';
import Users from 'meteor/vulcan:users';
import { useCurrentUser } from '../common/withUser';

const styles = theme => ({
  root: {
    backgroundColor:"rgba(0,80,0,.08)"
  }
})

const SunshineNewPostsList = ({ terms, classes }) => {
  const { results, totalCount } = useMulti({
    terms,
    collection: Posts,
    fragmentName: 'PostsList',
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

