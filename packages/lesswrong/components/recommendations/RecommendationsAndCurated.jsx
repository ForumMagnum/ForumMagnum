import React, { PureComponent } from 'react';
import { Components, registerComponent, withUpdate } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import Users from 'meteor/vulcan:users';
import { getRecommendationSettings } from './RecommendationsAlgorithmPicker'
import { withContinueReading } from './withContinueReading';
import {AnalyticsContext} from "../../lib/analyticsEvents";

const styles = theme => ({
  section: {
    marginTop: -12,
  },
  curated: {
    marginTop: theme.spacing.unit,
    display: "block"
  },
});

const defaultFrontpageSettings = {
  method: "sample",
  count: 3,
  scoreOffset: 0,
  scoreExponent: 3,
  personalBlogpostModifier: 0,
  frontpageModifier: 10,
  curatedModifier: 50,
}


class RecommendationsAndCurated extends PureComponent {

  render() {
    const { continueReading, classes, currentUser } = this.props;
    const { SingleColumnSection, ContinueReadingList, PostsList2, RecommendationsList, SectionTitle, SubSection, BookmarksList } = Components;

    const configName = "frontpage"
    const settings = getRecommendationSettings({currentUser, configName})

    // const curatedTooltip = <div>
    //   <div>Every few days, LessWrong moderators manually curate posts that are well written and informative.</div>
    //   <div><em>(Click to see more curated posts)</em></div>
    // </div>

    // const coreReadingTooltip = <div>
    //   <div>Collections of posts that form the core background knowledge of the LessWrong community</div>
    // </div>

    // const continueReadingTooltip = <div>
    //   <div>The next posts in sequences you've started reading, but not finished.</div>
    // </div>

    // const bookmarksTooltip = <div>
    //   <div>Individual posts that you've bookmarked</div>
    //   <div><em>(Click to see all)</em></div>
    // </div>

    // // Disabled during 2018 Review
    // const allTimeTooltip = <div>
    //   <div>
    //     A weighted, randomized sample of the highest karma posts
    //     {settings.onlyUnread && " that you haven't read yet"}.
    //   </div>
    //   <div><em>(Click to see more recommendations)</em></div>
    // </div>

    // defaultFrontpageSettings does not contain anything that overrides a user
    // editable setting, so the reverse ordering here is fine
    const frontpageRecommendationSettings = {
      ...settings,
      ...defaultFrontpageSettings
    }

    const renderBookmarks = (currentUser?.bookmarkedPostsMetadata?.length > 0) && !settings.hideBookmarks
    const renderContinueReading = (continueReading?.length > 0) && !settings.hideContinueReading
    // const curatedUrl = "/allPosts?filter=curated&sortedBy=new&timeframe=allTime"

    return <SingleColumnSection className={classes.section}>
      <SectionTitle title="Recommendations"/>

      {
        renderContinueReading && 
          <SubSection>
            <ContinueReadingList continueReading={continueReading} />
          </SubSection>
      }

      {
        renderBookmarks && 
          <SubSection>
            <AnalyticsContext listContext={"frontpageBookmarksList"} capturePostItemOnMount>
              <BookmarksList limit={3} />
            </AnalyticsContext>
          </SubSection>
      }

      {/* Disabled during 2018 Review */}
      {
        !settings.hideFrontpage &&
          <SubSection>
            <AnalyticsContext listContext={"frontpageFromTheArchives"} capturePostItemOnMount>
              <RecommendationsList algorithm={frontpageRecommendationSettings} />
            </AnalyticsContext>
          </SubSection>
      }

      <SubSection>
        <AnalyticsContext listContext={"curatedPosts"}>
          <PostsList2 terms={{view:"curated", limit:3}} showLoadMore={false} hideLastUnread={true}/>
        </AnalyticsContext>
      </SubSection>
    </SingleColumnSection>
  }
}

registerComponent("RecommendationsAndCurated", RecommendationsAndCurated,
  [withUpdate, {
    collection: Users,
    fragmentName: "UsersCurrent",
  }],
  withContinueReading,
  withUser, withStyles(styles, {name: "RecommendationsAndCurated"}));
