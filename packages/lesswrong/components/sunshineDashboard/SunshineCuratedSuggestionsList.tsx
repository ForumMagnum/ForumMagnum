import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { useMulti } from '../../lib/crud/withMulti';
import { Posts } from '../../lib/collections/posts';

const SunshineCuratedSuggestionsList = ({ terms }) => {
  const { results, loading } = useMulti({
    terms,
    collection: Posts,
    fragmentName: 'PostsList'
  });
  
  if (loading) return <Components.Loading/>;
  
  const { SunshineListTitle, SunshineCuratedSuggestionsItem, LastCuratedDate } = Components
  if (results && results.length) {
    return (
      <div>
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

const SunshineCuratedSuggestionsListComponent = registerComponent('SunshineCuratedSuggestionsList', SunshineCuratedSuggestionsList);

declare global {
  interface ComponentTypes {
    SunshineCuratedSuggestionsList: typeof SunshineCuratedSuggestionsListComponent
  }
}

