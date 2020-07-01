import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { Posts } from '../../lib/collections/posts';

const SunshineCuratedSuggestionsList = ({ terms, belowFold }:{
  terms: any,
  belowFold?: boolean
}) => {
  const { results, count, totalCount, loadMore, showLoadMore } = useMulti({
    terms,
    collection: Posts,
    fragmentName: 'PostsList',
    enableTotal: true,
    itemsPerPage: 60
  });

  const { results: curatedResults } = useMulti({
    terms: {view:'curated', limit:1},
    collection: Posts,
    fragmentName: 'PostsList',
  });
  const curatedDate = new Date(curatedResults && curatedResults[0]?.curatedDate)
  const twoDaysAgo = new Date(new Date().getTime()-(2*24*60*60*1000));

  if (!belowFold && (curatedDate > twoDaysAgo)) return null
  
  const { SunshineListTitle, SunshineCuratedSuggestionsItem, MetaInfo, FormatDate, LoadMore } = Components
    
  if (results && results.length) {
    return (
      <div>
        <SunshineListTitle>
          Suggestions for Curated
          <MetaInfo>
            <FormatDate date={curatedDate}/>
          </MetaInfo>
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

const SunshineCuratedSuggestionsListComponent = registerComponent('SunshineCuratedSuggestionsList', SunshineCuratedSuggestionsList)

declare global {
  interface ComponentTypes {
    SunshineCuratedSuggestionsList: typeof SunshineCuratedSuggestionsListComponent
  }
}

