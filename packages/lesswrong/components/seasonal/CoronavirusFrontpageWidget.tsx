import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { TagRels } from '../../lib/collections/tagRels/collection';
import { useMulti } from '../../lib/crud/withMulti';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser'

const CoronavirusFrontpageWidget = ({settings}) => {
  const { SectionSubtitle, RecommendationsList, LWTooltip, SectionFooter } = Components

  const currentUser = useCurrentUser();

  // if (settings.hideReview) return null
  if (settings.hideCoronavirus) return null

  const samplingAlgorithm = {
    method: "sample",
    count: 3,
    scoreOffset: 0,
    scoreExponent: 0,
    personalBlogpostModifier: 0,
    frontpageModifier: 0,
    curatedModifier: 0,
    coronavirus: true, 
    onlyUnread: false,
    excludeDefaultRecommendations: true
  }

  return (
    <div>
      <SectionSubtitle>
        <LWTooltip title={"View all posts related to COVID-19"} placement="top-start">
          <Link to="/tag/coronavirus">Coronavirus Tag</Link>
        </LWTooltip>
      </SectionSubtitle>
      <AnalyticsContext listContext={"coronavirusWidget"} capturePostItemOnMount>
        <RecommendationsList algorithm={samplingAlgorithm} showLoginPrompt={false} />
      </AnalyticsContext>
      {!currentUser && <SectionFooter>
        <Link to={"/tag/coronavirus"}>
          View All Coronavirus Posts
        </Link>
        <Link to={"/coronavirus-link-database"}>
          C19 Links Database
        </Link>
      </SectionFooter>}
    </div>
  )
}

const CoronavirusFrontpageWidgetComponent = registerComponent('CoronavirusFrontpageWidget', CoronavirusFrontpageWidget);

declare global {
  interface ComponentTypes {
    CoronavirusFrontpageWidget: typeof CoronavirusFrontpageWidgetComponent
  }
}
