import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { Posts } from '../../lib/collections/posts';

const SunshineCuratedSuggestionsList = ({ terms }) => {
  const { results, loading, count, totalCount, loadMore, showLoadMore } = useMulti({
    terms,
    collection: Posts,
    fragmentName: 'PostsList',
    enableTotal: true,
    itemsPerPage: 60
  });
  
  if (loading) return <Components.Loading/>;
  
  const { SunshineListTitle, SunshineCuratedSuggestionsItem, LastCuratedDate, LoadMore } = Components
    
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
        {showLoadMore && <LoadMore
          loadMore={() => {
            loadMore();
          }}
          count={count}
          totalCount={totalCount}
        />}
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

