import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import withUser from '../common/withUser';
import Users from 'meteor/vulcan:users';
import { useLocation } from '../../lib/routeUtil';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  map: {
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  }
})

const Home2 = ({currentUser, classes}) => {
  const { RecentDiscussionThreadsList, HomeLatestPosts, RecommendationsAndCurated, CommunityMapWrapper } = Components

  const shouldRenderSidebar = Users.canDo(currentUser, 'posts.moderate.all') ||
      Users.canDo(currentUser, 'alignment.sidebar')
  const { lat, lng } = Users.getLocation(currentUser)
  const { query } = useLocation()
  const mapEventTerms = { view: 'nearbyEvents', lat, lng, filters: query?.filters || []}
  
  return (
    <React.Fragment>
      {shouldRenderSidebar && <Components.SunshineSidebar/>}
      {!currentUser?.hideFrontpageMap && <div className={classes.map}>
        <CommunityMapWrapper terms={mapEventTerms} />
      </div>}
      
      <RecommendationsAndCurated configName="frontpage" />
      <HomeLatestPosts />
      <RecentDiscussionThreadsList
        terms={{view: 'recentDiscussionThreadsList', limit:20}}
        commentsLimit={4}
        maxAgeHours={18}
        af={false}
      />
    </React.Fragment>
  )
}

registerComponent('Home2', Home2, withUser, withStyles(styles, {name: "Home2"}));
