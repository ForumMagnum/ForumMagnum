import { Components, registerComponent } from 'meteor/vulcan:core';
import { getSetting } from 'meteor/vulcan:lib';
import React from 'react';
import { Link } from 'react-router';
import withUser from '../common/withUser';
import Checkbox from '@material-ui/core/Checkbox';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  includePersonal: {
    textAlign: "right",
    marginRight: theme.spacing.unit,
  },
  checkbox: {
    padding: 0,
    paddingRight: theme.spacing.unit
  }
})

const Home = ({ currentUser, router, classes }, context) => {
  const { TabNavigationMenu, SingleColumnSection, SectionTitle, SectionSubtitle, MetaInfo } = Components
  const currentView = _.clone(router.location.query).view || (currentUser && currentUser.currentFrontpageFilter) || (currentUser ? "frontpage" : "curated");
  let recentPostsTerms = _.isEmpty(router.location.query) ? {view: currentView, limit: 10} : _.clone(router.location.query)

  recentPostsTerms.forum = true
  if (recentPostsTerms.view === "curated" && currentUser) {
    recentPostsTerms.offset = 3
  }

  const curatedPostsTerms = {view:"curated", limit:3}
  let recentPostsTitle = "Recent Posts"
  switch (recentPostsTerms.view) {
    case "frontpage":
      recentPostsTitle = "Frontpage Posts"; break;
    case "curated":
      if (currentUser) {
        recentPostsTitle = "More Curated"; break;
      } else {
        recentPostsTitle = "Curated Posts"; break;
      }
    case "community":
      recentPostsTitle = "All Posts"; break;
    default:
      return "Recent Posts";
  }

  const lat = currentUser && currentUser.mongoLocation && currentUser.mongoLocation.coordinates[1]
  const lng = currentUser && currentUser.mongoLocation && currentUser.mongoLocation.coordinates[0]
  let eventsListTerms = {
    view: 'events',
    limit: 3,
  }
  if (lat && lng) {
    eventsListTerms = {
      view: 'nearbyEvents',
      lat: lat,
      lng: lng,
      limit: 3,
    }
  }

  return (
    <div>
      <Components.HeadTags image={getSetting('siteImage')} />
      <TabNavigationMenu />
      <Components.RecommendedReading />
      {currentUser &&
        <SingleColumnSection>
          <SectionTitle title="Curated Content">
            <Components.SubscribeWidget view={recentPostsTerms.view} />
          </SectionTitle>
          <Components.PostsList terms={curatedPostsTerms} showHeader={false} showLoadMore={false}/>
        </SingleColumnSection>}
      <SingleColumnSection >
        <SectionTitle title={recentPostsTitle}>
          <Components.SubscribeWidget view={recentPostsTerms.view} />
        </SectionTitle>
        <Components.PostsList terms={recentPostsTerms} showHeader={false} />
        <div className={classes.includePersonal}>
            <Checkbox classes={{root: classes.checkbox}}/> <MetaInfo>Include Personal Blogposts</MetaInfo>
        </div>
      </SingleColumnSection>
      <SingleColumnSection>
        <SectionTitle title={<Link to="/community">Community</Link>} />
        <Components.PostsList
          terms={eventsListTerms}
          showLoadMore={false}
          showHeader={false} />
      </SingleColumnSection>
      <SingleColumnSection>
      <SectionTitle title={<Link to="/AllComments">Recent Discussion</Link>} />
        <Components.RecentDiscussionThreadsList terms={{view: 'recentDiscussionThreadsList', limit:6}}/>
      </SingleColumnSection>
    </div>
  )
};

registerComponent('Home', Home, withUser, withStyles(styles, {name: "Home"}));
