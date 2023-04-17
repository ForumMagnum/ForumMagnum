import React, { useState } from "react";
import Select from "@material-ui/core/Select";
import Input from "@material-ui/core/Input";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import type { RecommendationsAlgorithmWithStrategy } from "../../lib/collections/users/recommendationSettings";

const styles = (theme: ThemeType) => ({
  root: {
    [theme.breakpoints.down('sm')]: {
      paddingTop: 30
    }
  },
  inputParam: {
    marginBottom: 20,
  },
});

const RecommendationsSamplePage = ({classes}: {
  classes: ClassesType,
}) => {
  const [strategy, setStrategy] = useState("moreFromTag");
  const [postId, setPostId] = useState("jk7A3NMdbxp65kcJJ");

  const algorithm: RecommendationsAlgorithmWithStrategy = {
    strategy: {
      name: strategy,
      postId,
    },
    count: 3,
  };

  const {
    SingleColumnSection, SectionTitle, MenuItem, RecommendationsList,
  } = Components;

  return (
    <AnalyticsContext pageContext="eaYearWrapped">
      <div className={classes.root}>
        <SingleColumnSection>
          <SectionTitle title="Recommendations Sample"/>
          <div className={classes.inputParam}>
            <Select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
            >
              <MenuItem value="moreFromTag">More from tag</MenuItem>
              <MenuItem value="moreFromAuthor">More from author</MenuItem>
            </Select>
          </div>
          <div className={classes.inputParam}>
            <Input
              value={postId}
              onChange={(e) => setPostId(e.target.value)}
            />
          </div>
          <RecommendationsList algorithm={algorithm} />
        </SingleColumnSection>
      </div>
    </AnalyticsContext>
  );
}

const RecommendationsSamplePageComponent = registerComponent(
  "RecommendationsSamplePage",
  RecommendationsSamplePage,
  {styles},
);


declare global {
  interface ComponentTypes {
    RecommendationsSamplePage: typeof RecommendationsSamplePageComponent,
  }
}
