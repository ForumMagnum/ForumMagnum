import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { scoringFeaturesByName, RecommendationRubric } from '../../lib/recommendationTypes';

const styles = (theme: ThemeType): JssStyles => ({
  compactRubric: {
  },
  
  fullRubric: {
    background: theme.palette.panelBackground.default,
    marginTop: 16,
    marginLeft: 64,
    padding: 16,
    width: 300,
  },
  compactFeature: {
    padding: 8,
  },
  featureRow: {
  },
});

function renderRubricNumber(mode: "additive"|"multiplicative", value: number): string {
  if (mode==="multiplicative") {
    return "*" + value.toPrecision(3);
  } else {
    return (value>0 ? "+" : "") + value;
  }
}

const RecommendationsRubric = ({format, rubric, overallScore, classes}: {
  format: "compact"|"full",
  rubric: RecommendationRubric,
  overallScore: number,
  classes: ClassesType,
}) => {
  const { LWTooltip } = Components;
  
  if (format === "compact") {
    return <span className={classes.compactRubric}>
      {rubric.map(({feature: featureName, mode, value}) => <LWTooltip
        key={featureName}
        className={classes.compactFeature}
        title={<div>
          {scoringFeaturesByName[featureName].description}
        </div>}
      >
        {renderRubricNumber(mode, value)}
      </LWTooltip>)}

      <LWTooltip
        className={classes.compactFeature}
        title={<div>Overall Score</div>}
      >
        ={overallScore.toPrecision(3)}
      </LWTooltip>
    </span>
  } else {
    return <div className={classes.fullRubric}>
      {rubric.map(({feature: featureName, mode, value}) => <div key={featureName} className={classes.featureRow}>
        {scoringFeaturesByName[featureName].description}: {renderRubricNumber(mode, value)}
      </div>)}
      <div>
        Overall: {overallScore.toPrecision(3)}
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

