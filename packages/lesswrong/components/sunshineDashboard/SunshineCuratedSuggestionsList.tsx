import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { useMulti } from '../../lib/crud/withMulti';
import { Posts } from '../../lib/collections/posts';

const styles = theme => ({
  root: {
    opacity:.2,
    '&:hover': {
      opacity: 1,
    }
  }
})


const SunshineCuratedSuggestionsList = ({ terms, classes }) => {
  const { results } = useMulti({
    terms,
    collection: Posts,
    fragmentName: 'PostsList'
  });
  const { SunshineListTitle, SunshineCuratedSuggestionsItem, LastCuratedDate } = Components
  if (results && results.length) {
    return (
      <div className={classes.root}>
        <SunshineListTitle>
          Suggestions for Curated
          <LastCuratedDate terms={{view:'curated', limit:1}}/>
        </SunshineListTitle>
        {results.map(post =>
          <div key={post._id} >
            <SunshineCuratedSuggestionsItem post={post}/>
          </div>
        )}
      </div>
    )
  } else {
    return null
  }
}

const SunshineCuratedSuggestionsListComponent = registerComponent('SunshineCuratedSuggestionsList', SunshineCuratedSuggestionsList, {styles});

declare global {
  interface ComponentTypes {
    SunshineCuratedSuggestionsList: typeof SunshineCuratedSuggestionsListComponent
  }
}

