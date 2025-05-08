import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';

const styles = (theme: ThemeType) => ({
  icon: {
    marginRight: 4
  }
})


const AFSuggestPostsListInner = ({ classes }: {
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

export const AFSuggestPostsList = registerComponent('AFSuggestPostsList', AFSuggestPostsListInner, {styles});

declare global {
  interface ComponentTypes {
    AFSuggestPostsList: typeof AFSuggestPostsList
  }
}

