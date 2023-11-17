import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import classNames from 'classnames';
import { isEAForum } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  loadMorePadding: {
    paddingLeft: 16,
  },
  audioIcon: {
    width: 14,
    height: 14,
    color: theme.palette.grey[500],
    cursor: "pointer",
    '&:hover': {
      opacity: .5
    }
  },
  audioOnly: {
    color: theme.palette.primary.main
  }
});

const shouldShow = (belowFold: boolean, curatedDate: Date, currentUser: UsersCurrent | null) => {
  if (isEAForum) {
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

  const [audioOnly, setAudioOnly] = useState<boolean>(false)

  const { results, loadMoreProps, showLoadMore } = useMulti({
    terms: {
      ...terms, audioOnly
    },
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


  if (!shouldShow(!!belowFold, curatedDate, currentUser)) {
    return null
  }

  const { SunshineListTitle, SunshineCuratedSuggestionsItem, MetaInfo, FormatDate,
    LoadMore, LWTooltip, ForumIcon } = Components

  return (
    <div className={classes.root}>
      <SunshineListTitle>
        Suggestions for Curated
        <MetaInfo>
          <FormatDate date={curatedDate}/>
        </MetaInfo>
        <LWTooltip title="Filter to only show audio">
          <ForumIcon
            icon="VolumeUp"
            className={classNames(classes.audioIcon, {[classes.audioOnly]: audioOnly})}
            onClick={() => setAudioOnly(!audioOnly)}
          />
        </LWTooltip>
      </SunshineListTitle>
      {results?.map(post =>
        <div key={post._id} >
          <SunshineCuratedSuggestionsItem post={post} />
        </div>
      )}
      {showLoadMore && <div className={classes.loadMorePadding}>
        <LoadMore {...loadMoreProps}/>
      </div>}
    </div>
  )
}

const SunshineCuratedSuggestionsListComponent = registerComponent('SunshineCuratedSuggestionsList', SunshineCuratedSuggestionsList, {styles})

declare global {
  interface ComponentTypes {
    SunshineCuratedSuggestionsList: typeof SunshineCuratedSuggestionsListComponent
  }
}
