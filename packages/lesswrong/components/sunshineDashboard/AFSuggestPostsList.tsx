import { Components, registerComponent } from 'meteor/vulcan:core';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import { Posts } from '../../lib/collections/posts';

const styles = theme => ({
  icon: {
    marginRight: 4
  }
})


const AFSuggestPostsList = ({ terms, classes }) => {
  const { results } = useMulti({
    terms,
    collection: Posts,
    fragmentName: 'SuggestAlignmentPost',
    fetchPolicy: 'cache-and-network',
  });
  if (results && results.length) {
    return (
      <div>
        <Components.SunshineListTitle>
          <Components.OmegaIcon className={classes.icon}/> Suggested Posts
        </Components.SunshineListTitle>
        {results.map(post =>
          <div key={post._id} >
            <Components.AFSuggestPostsItem post={post}/>
          </div>
        )}
      </div>
    )
  } else {
    return null
  }
}

const AFSuggestPostsListComponent = registerComponent('AFSuggestPostsList', AFSuggestPostsList, {styles});

declare global {
  interface ComponentTypes {
    AFSuggestPostsList: typeof AFSuggestPostsListComponent
  }
}

