import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';

const styles = (theme: ThemeType) => ({
  icon: {
    marginRight: 4
  }
})


const AFSuggestPostsList = ({ classes }: {
  classes: ClassesType<typeof styles>,
}) => {
  const { results, loadMoreProps } = useMulti({
    terms: {view:"alignmentSuggestedPosts"},
    collectionName: "Posts",
    fragmentName: 'SuggestAlignmentPost',
    fetchPolicy: 'cache-and-network',
  });
  const { SunshineListTitle, OmegaIcon, AFSuggestPostsItem, LoadMore } = Components;
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

const AFSuggestPostsListComponent = registerComponent('AFSuggestPostsList', AFSuggestPostsList, {styles});

declare global {
  interface ComponentTypes {
    AFSuggestPostsList: typeof AFSuggestPostsListComponent
  }
}

