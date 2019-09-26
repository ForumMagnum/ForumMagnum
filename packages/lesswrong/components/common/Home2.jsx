import { Components, registerComponent, useMulti } from 'meteor/vulcan:core';
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

const defaultCenter = {lat: 39.5, lng: -43.636047}
const Home2 = ({currentUser, classes}) => {
  const { results: userWhoLaunchedNukes = [], refetch } = useMulti({
    terms: {view: "areWeNuked"},
    collection: Users,
    queryName: "areWeNuked",
    fragmentName: "UsersProfile",
    limit: 1,
    ssr: true
  });


  const { RecentDiscussionThreadsList, HomeLatestPosts, RecommendationsAndCurated, CommunityMapWrapper } = Components

  const shouldRenderSidebar = Users.canDo(currentUser, 'posts.moderate.all') ||
      Users.canDo(currentUser, 'alignment.sidebar')
  const { lat, lng } = defaultCenter
  const { query } = useLocation()

  if (userWhoLaunchedNukes?.length) {
    return <Components.PetrovDayLossScreen />
  }
  const mapEventTerms = { view: 'nearbyEvents', lat, lng, filters: query?.filters || []}

  return (
    <React.Fragment>  
      {shouldRenderSidebar && <Components.SunshineSidebar/>}
      {!currentUser?.hideFrontpageMap && <div className={classes.map}>
        <CommunityMapWrapper terms={mapEventTerms} showHideMap petrovButton petrovRefetch={refetch}/>
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
