"use client";
import React from 'react';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import ConfigurableRecommendationsList from "./ConfigurableRecommendationsList";
import RecommendationsPageCuratedList from "./RecommendationsPageCuratedList";
import SpotlightHistory from "../spotlights/SpotlightHistory";
import { useForumType } from '../hooks/useForumType';

const RecommendationsPage = () => {
  const { isLW } = useForumType();

  return (
    <AnalyticsContext pageSectionContext={"recommendationsPage"} capturePostItemOnMount>
      {isLW && <SpotlightHistory/>}
      <RecommendationsPageCuratedList/>
      <ConfigurableRecommendationsList configName="recommendationspage" />
    </AnalyticsContext>
  )
};

export default RecommendationsPage;



