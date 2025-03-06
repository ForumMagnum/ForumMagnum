import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import classNames from 'classnames';
import { isEAForum, isLWorAF } from '../../lib/instanceSettings';
import { Link } from '@/lib/reactRouterWrapper';
import SunshineListTitle from "@/components/sunshineDashboard/SunshineListTitle";
import SunshineCuratedSuggestionsItem from "@/components/sunshineDashboard/SunshineCuratedSuggestionsItem";
import MetaInfo from "@/components/common/MetaInfo";
import FormatDate from "@/components/common/FormatDate";
import LoadMore from "@/components/common/LoadMore";
import LWTooltip from "@/components/common/LWTooltip";
import ForumIcon from "@/components/common/ForumIcon";

const styles = (theme: ThemeType) => ({
  root: {
    padding: 16,
  },
  loadMorePadding: {
    paddingLeft: 16,
  },
  audioIcon: {
    width: 14,
    height: 14,
    color: theme.palette.grey[500],
    cursor: "pointer",
    '&:hover': {
      opacity: 0.5,
    }
  },
  audioOnly: {
    color: theme.palette.primary.main,
  },
  // Styling variations
  warning: {
    backgroundColor: `${theme.palette.error.main}10`,
    border: `3px solid ${theme.palette.error.main}`,
    '& $title, & $date': {
      color: theme.palette.error.main,
    },
  },
  alert: {
    backgroundColor: `${theme.palette.error.main}15`,
    border: `4px solid ${theme.palette.error.main}`,
    '& $title': {
      color: theme.palette.error.main,
      fontSize: '1.5rem',
    },
    '& $date': {
      color: theme.palette.error.main,
      fontWeight: 600,
    },
  },
  urgent: {
    backgroundColor: `${theme.palette.error.main}30`,
    border: `10px solid ${theme.palette.error.main}`,
    '& $title': {
      color: theme.palette.error.main,
      fontSize: '2.0rem',
    },
    '& $date': {
      color: theme.palette.error.main,
      fontWeight: 900,
    },
  },
});

const shouldShow = (belowFold: boolean, curatedDate: Date, currentUser: UsersCurrent | null) => {
  if (isEAForum) {
    return !belowFold && currentUser?.isAdmin;
  } else {
    const twoAndAHalfDaysAgo = new Date(new Date().getTime()-(2.5*24*60*60*1000));
    return belowFold || (curatedDate <= twoAndAHalfDaysAgo);
  }
}

const SunshineCuratedSuggestionsList = ({ terms, belowFold, classes, setCurationPost }: {
  terms: PostsViewTerms,
  belowFold?: boolean,
  classes: ClassesType<typeof styles>,
  setCurationPost?: (post: PostsList) => void,
}) => {
  const currentUser = useCurrentUser();

  const [audioOnly, setAudioOnly] = useState<boolean>(false)

  const { results, loadMoreProps, showLoadMore } = useMulti({
    terms: {
      ...terms, audioOnly
    },
    collectionName: "Posts",
    fragmentName: 'SunshineCurationPostsList',
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

  let statusClass = '';
  if (isLWorAF) {
    const daysSinceCurated = Math.floor(
      (new Date().getTime() - curatedDate.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (daysSinceCurated >= 6) {
      statusClass = classes.urgent;
    } else if (daysSinceCurated >= 4) {
      statusClass = classes.alert;
    } else if (daysSinceCurated >= 3) {
      statusClass = classes.warning;
    }
  }
  return (
    <div className={classNames(classes.root, statusClass)}>
      <SunshineListTitle>
        <Link to={`/admin/curation`}>Suggestions for Curated</Link>
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
          <SunshineCuratedSuggestionsItem post={post} setCurationPost={setCurationPost}/>
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

export default SunshineCuratedSuggestionsListComponent;
