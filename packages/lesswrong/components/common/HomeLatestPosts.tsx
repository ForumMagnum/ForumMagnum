import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { useTimezone } from './withTimezone';
import { AnalyticsContext, useOnMountTracking } from '../../lib/analyticsEvents';
import { FilterSettings, useFilterSettings } from '../../lib/filterSettings';
import moment from '../../lib/moment-timezone';
import { useCurrentTime } from '../../lib/utils/timeUtil';
import { isEAForum, isLW, isLWorAF, taggingNamePluralSetting, taggingNameSetting} from '../../lib/instanceSettings';
import { sectionTitleStyle } from '../common/SectionTitle';
import { AllowHidingFrontPagePostsContext } from '../dropdowns/posts/PostActions';
import { HideRepeatedPostsProvider } from '../posts/HideRepeatedPostsContext';
import classNames from 'classnames';
import {useUpdateCurrentUser} from "../hooks/useUpdateCurrentUser";
import { reviewIsActive } from '../../lib/reviewUtils';
import { forumSelect } from '../../lib/forumTypeUtils';
import { frontpageDaysAgoCutoffSetting } from '../../lib/scoring';
import { isFriendlyUI } from '../../themes/forumTheme';
import { EA_FORUM_TRANSLATION_TOPIC_ID } from '../../lib/collections/tags/collection';
import Select from '@material-ui/core/Select';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import { latestPostsAlgorithmsSetting } from '../../lib/publicSettings';

const titleWrapper = isLWorAF ? {
  marginBottom: 8
} : {
  display: "flex",
  marginBottom: 8,
  flexWrap: "wrap",
  alignItems: "center"
};

const styles = (theme: ThemeType): JssStyles => ({
  titleWrapper,
  title: {
    ...sectionTitleStyle(theme),
    display: "inline",
    marginRight: "auto"
  },
  toggleFilters: {
    [theme.breakpoints.up('sm')]: {
      display: "none"
    },
  },
  hide: {
      display: "none"
  },
  hideOnMobile: {
    [theme.breakpoints.down('sm')]: {
      display: "none"
    },
  },
  hideOnDesktop: {
    [theme.breakpoints.up('md')]: {
      display: "none"
    },
  },
})

const latestPostsName = isFriendlyUI ? 'New & upvoted' : 'Latest Posts'

const filterSettingsToggleLabels = forumSelect({
  EAForum: {
    desktopVisible: "Customize feed",
    desktopHidden: "Customize feed",
    mobileVisible: "Customize feed",
    mobileHidden: "Customize feed",
  },
  default: {
    desktopVisible: "Customize Feed (Hide)",
    desktopHidden: "Customize Feed",
    mobileVisible: "Customize Feed (Hide)",
    mobileHidden: "Customize Feed (Show)",
  }
})

const advancedSortingText = isFriendlyUI
  ? "Advanced sorting & filtering"
  : "Advanced Sorting/Filtering";

const defaultLimit = isFriendlyUI ? 11 : 13;

const applyConstantFilters = (filterSettings: FilterSettings): FilterSettings => {
  if (!isEAForum) {
    return filterSettings;
  }
  const tags = filterSettings.tags.filter(
    ({tagId}) => tagId !== EA_FORUM_TRANSLATION_TOPIC_ID,
  );
  tags.push({
    tagId: EA_FORUM_TRANSLATION_TOPIC_ID,
    tagName: "Translation",
    filterMode: "Hidden",
  });
  return {
    ...filterSettings,
    tags,
  };
}

const getDefaultDesktopFilterSettingsVisibility = (currentUser: UsersCurrent | null, selectedAlgorithm?: string) => {
  if (isFriendlyUI) {
    return false;
  }

  if (!userIsAdmin(currentUser)) {
    return !currentUser?.hideFrontpageFilterSettingsDesktop;
  }

  if (selectedAlgorithm === 'lesswrong-classic') {
    return true;
  }

  return false;
};

const shouldShowAlgorithmPicker = (currentUser: UsersCurrent | null) => {
  return isLW && userIsAdmin(currentUser);
};

const getDefaultAlgorithm = (currentUser: UsersCurrent | null) => {
  if (!shouldShowAlgorithmPicker(currentUser)) {
    return undefined;
  }

  return latestPostsAlgorithmsSetting.get()[0];
};

const HomeLatestPosts = ({classes}: {classes: ClassesType}) => {
  const location = useLocation();
  const updateCurrentUser = useUpdateCurrentUser();
  const currentUser = useCurrentUser();

  // TODO: default to e.g. the first algorithm from db settings, if the user is an admin
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string | undefined>(getDefaultAlgorithm(currentUser));

  const {filterSettings, setPersonalBlogFilter, setTagFilter, removeTagFilter} = useFilterSettings()
  // While hiding desktop settings is stateful over time, on mobile the filter settings always start out hidden
  // (except that on the EA Forum/FriendlyUI it always starts out hidden)
  const defaultDesktopFilterSettingsVisibility = getDefaultDesktopFilterSettingsVisibility(currentUser, selectedAlgorithm);
  const [filterSettingsVisibleDesktop, setFilterSettingsVisibleDesktop] = useState(defaultDesktopFilterSettingsVisibility);
  const [filterSettingsVisibleMobile, setFilterSettingsVisibleMobile] = useState(false);
  const { timezone } = useTimezone();
  const { captureEvent } = useOnMountTracking({
    eventType:"frontpageFilterSettings",
    eventProps: {
      filterSettings,
      filterSettingsVisible: filterSettingsVisibleDesktop,
      pageSectionContext: "latestPosts"
    },
    captureOnMount: true,
  })
  const { query } = location;
  const {
    SingleColumnSection, PostsList2, TagFilterSettings, LWTooltip, SettingsButton,
    CuratedPostsList, SectionTitle, StickiedPosts, MenuItem, RecombeePostsList
  } = Components
  const limit = parseInt(query.limit) || defaultLimit;

  const now = useCurrentTime();
  const dateCutoff = moment(now).tz(timezone).subtract(frontpageDaysAgoCutoffSetting.get(), 'days').format("YYYY-MM-DD");

  const recentPostsTerms = {
    ...query,
    filterSettings: applyConstantFilters(filterSettings),
    after: dateCutoff,
    view: "magic",
    forum: true,
    limit:limit
  }
  
  const changeShowTagFilterSettingsDesktop = () => {
    setFilterSettingsVisibleDesktop(!filterSettingsVisibleDesktop)
    if (isLWorAF) {
      void updateCurrentUser({hideFrontpageFilterSettingsDesktop: filterSettingsVisibleDesktop})
    }
    
    captureEvent("filterSettingsClicked", {
      settingsVisible: !filterSettingsVisibleDesktop,
      settings: filterSettings,
    })
  }

  const showCurated = isFriendlyUI || (isLW && reviewIsActive())

  const updateSelectedAlgorithm = (selectedAlgorithm: string) => {
    const showFilterSettings = selectedAlgorithm === 'lesswrong-classic';
    setFilterSettingsVisibleDesktop(showFilterSettings);
    setSelectedAlgorithm(selectedAlgorithm);
  };

  const algorithmPicker = (
    <Select
      value={selectedAlgorithm}
      onChange={(e) => updateSelectedAlgorithm(e.target.value)}
    >
      {/* TODO: map over algorithms from db settings? */}
      {latestPostsAlgorithmsSetting.get().map(algorithm => (
        <MenuItem key={algorithm} value={algorithm}>{algorithm}</MenuItem>
      ))}
    </Select>
  );

  const showAlgorithmPicker = shouldShowAlgorithmPicker(currentUser);

  const customizeTagFilterSettingsButton = (
    <LWTooltip
      title={`Use these buttons to increase or decrease the visibility of posts based on ${taggingNameSetting.get()}. Use the "+" button at the end to add additional ${taggingNamePluralSetting.get()} to boost or reduce them.`}
      hideOnTouchScreens
    >
      <SettingsButton
        className={classes.hideOnMobile}
        label={filterSettingsVisibleDesktop ?
          filterSettingsToggleLabels.desktopVisible :
          filterSettingsToggleLabels.desktopHidden}
        showIcon={false}
        onClick={changeShowTagFilterSettingsDesktop}
      />
      <SettingsButton
        className={classes.hideOnDesktop}
        label={filterSettingsVisibleMobile ?
          filterSettingsToggleLabels.mobileVisible :
          filterSettingsToggleLabels.mobileHidden}
        showIcon={false}
        onClick={() => {
          setFilterSettingsVisibleMobile(!filterSettingsVisibleMobile)
          captureEvent("filterSettingsClicked", {
            settingsVisible: !filterSettingsVisibleMobile,
            settings: filterSettings,
            pageSectionContext: "latestPosts"
          })
        }} />
    </LWTooltip>
  );

  const useClassicLWAlgorithm = !selectedAlgorithm || selectedAlgorithm === 'lesswrong-classic';

  const postsList = useClassicLWAlgorithm
    ? (<PostsList2
        terms={recentPostsTerms}
        alwaysShowLoadMore
        hideHiddenFrontPagePosts
      >
        <Link to={"/allPosts"}>{advancedSortingText}</Link>
      </PostsList2>)
    : (<RecombeePostsList algorithm={selectedAlgorithm} />);

  return (
    <AnalyticsContext pageSectionContext="latestPosts">
      <SingleColumnSection>
        <SectionTitle title={latestPostsName} noTopMargin={isFriendlyUI} noBottomPadding>
          {showAlgorithmPicker ? algorithmPicker : customizeTagFilterSettingsButton}
        </SectionTitle>
  
        <AnalyticsContext pageSectionContext="tagFilterSettings">
          <div className={classNames({
            [classes.hideOnDesktop]: !filterSettingsVisibleDesktop,
            [classes.hideOnMobile]: !filterSettingsVisibleMobile,
          })}>
            <TagFilterSettings
              filterSettings={filterSettings} setPersonalBlogFilter={setPersonalBlogFilter} setTagFilter={setTagFilter} removeTagFilter={removeTagFilter}
            />
          </div>
        </AnalyticsContext>
        {isFriendlyUI && <StickiedPosts />}
        <HideRepeatedPostsProvider>
          {showCurated && <CuratedPostsList />}
          <AnalyticsContext listContext={"latestPosts"}>
            {/* Allow hiding posts from the front page*/}
            <AllowHidingFrontPagePostsContext.Provider value={true}>
              {postsList}
            </AllowHidingFrontPagePostsContext.Provider>
          </AnalyticsContext>
        </HideRepeatedPostsProvider>
      </SingleColumnSection>
    </AnalyticsContext>
  )
}

const HomeLatestPostsComponent = registerComponent('HomeLatestPosts', HomeLatestPosts, {styles});

declare global {
  interface ComponentTypes {
    HomeLatestPosts: typeof HomeLatestPostsComponent
  }
}
