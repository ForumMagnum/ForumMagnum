import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import { forumTypeSetting } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  loadMorePadding: {
    paddingLeft: 16,
  },
});

const shouldShow = (belowFold: boolean, curatedDate: Date, currentUser: UsersCurrent | null) => {
  if (forumTypeSetting.get() === "EAForum") {
    return !belowFold && currentUser?.isAdmin;
  } else {
    const twoAndAHalfDaysAgo = new Date(new Date().getTime()-(2.5*24*60*60*1000));
    return belowFold || (curatedDate <= twoAndAHalfDaysAgo);
  }
}

const SunshineCuratedSuggestionsList = ({ terms, belowFold, classes }:{
  terms: PostsViewTerms,
  belowFold?: boolean,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();

  const { results, loadMoreProps, showLoadMore } = useMulti({
    terms,
    collectionName: "Posts",
    fragmentName: 'PostsList',
    enableTotal: true,
    itemsPerPage: 60
  });

  const { results: curatedResults } = useMulti({
    terms: {view:'curated', limit:1},
    collectionName: "Posts",
    fragmentName: 'PostsList',
  });
  const curatedDate = curatedResults ? new Date(curatedResults[0]?.curatedDate) : new Date();
  const twoAndAHalfDaysAgo = new Date(new Date().getTime()-(2.5*24*60*60*1000));

  if (!shouldShow(!!belowFold, curatedDate, currentUser)) {
    return null
  }

  const { SunshineListTitle, SunshineCuratedSuggestionsItem, MetaInfo, FormatDate, LoadMore } = Components
    
  if (results && results.length) {
    return (
      <div className={classes.root}>
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
        {showLoadMore && <div className={classes.loadMorePadding}>
          <LoadMore {...loadMoreProps}/>
        </div>}
      </div>
    )
  } else {
    return null
  }
}

const SunshineCuratedSuggestionsListComponent = registerComponent('SunshineCuratedSuggestionsList', SunshineCuratedSuggestionsList, {styles})

declare global {
  interface ComponentTypes {
    SunshineCuratedSuggestionsList: typeof SunshineCuratedSuggestionsListComponent
  }
}
