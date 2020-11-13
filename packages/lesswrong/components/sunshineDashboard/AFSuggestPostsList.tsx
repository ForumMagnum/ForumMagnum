import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import { Posts } from '../../lib/collections/posts';

const styles = (theme: ThemeType): JssStyles => ({
  icon: {
    marginRight: 4
  }
})


const AFSuggestPostsList = ({ terms, classes }: {
  terms: any,
  classes: ClassesType,
}) => {
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
          <div><Components.OmegaIcon className={classes.icon}/> Suggested Posts</div>
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

