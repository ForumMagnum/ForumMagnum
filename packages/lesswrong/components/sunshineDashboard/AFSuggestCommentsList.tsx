import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';

const styles = (theme: ThemeType): JssStyles => ({
  icon: {
    marginRight: 4
  }
})


const AFSuggestCommentsList = ({ terms, classes }: {
  terms: CommentsViewTerms,
  classes: ClassesType,
}) => {
  const { results } = useMulti({
    terms,
    collectionName: "Comments",
    fragmentName: 'SuggestAlignmentComment',
    fetchPolicy: 'cache-and-network',
  });
  
  if (results && results.length) {
    return (
      <div>
        <Components.SunshineListTitle>
          <div><Components.OmegaIcon className={classes.icon}/> Suggested Comments</div>
        </Components.SunshineListTitle>
        {results.map(comment =>
          <div key={comment._id} >
            <Components.AFSuggestCommentsItem comment={comment}/>
          </div>
        )}
      </div>
    )
  } else {
    return null
  }
}

const AFSuggestCommentsListComponent = registerComponent('AFSuggestCommentsList', AFSuggestCommentsList, {styles});

declare global {
  interface ComponentTypes {
    AFSuggestCommentsList: typeof AFSuggestCommentsListComponent
  }
}

