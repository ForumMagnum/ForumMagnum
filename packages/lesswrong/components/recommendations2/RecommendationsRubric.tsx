import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { scoringFeaturesByName, RecommendationRubric } from '../../lib/recommendationTypes';

const styles = (theme: ThemeType): JssStyles => ({
  compactRubric: {
  },
  
  fullRubric: {
  },
  compactFeature: {
    padding: 8,
  },
  featureRow: {
  },
});

const RecommendationsRubric = ({format, rubric, overallScore, classes}: {
  format: "compact"|"full",
  rubric: RecommendationRubric,
  overallScore: number,
  classes: ClassesType,
}) => {
  const { LWTooltip } = Components;
  
  if (format === "compact") {
    return <span className={classes.compactRubric}>
      {rubric.map(({feature: featureName, value}) => <LWTooltip
        key={featureName}
        className={classes.compactFeature}
        title={<div>
          {scoringFeaturesByName[featureName].description}
        </div>}
      >
        <>{value>0 ? "+":""}{value}</>
      </LWTooltip>)}

      <LWTooltip
        className={classes.compactFeature}
        title={<div>Overall Score</div>}
      >
        ={overallScore}
      </LWTooltip>
    </span>
  } else {
    return <div className={classes.fullRubric}>
      {rubric.map(({feature: featureName, value}) => <div key={featureName} className={classes.featureRow}>
        {scoringFeaturesByName[featureName].description}: {value}
      </div>)}
      <div>
        Overall: {overallScore}
      </div>
    </div>
  }
}

const RecommendationsRubricComponent = registerComponent("RecommendationsRubric", RecommendationsRubric, {styles});

declare global {
  interface ComponentTypes {
    RecommendationsRubric: typeof RecommendationsRubricComponent
  }
}

