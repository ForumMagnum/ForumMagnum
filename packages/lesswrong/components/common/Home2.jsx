import { Components, registerComponent, withUpdate } from 'meteor/vulcan:core';
import { getSetting } from 'meteor/vulcan:lib';
import React, { PureComponent } from 'react';
import withUser from '../common/withUser';
import { SplitComponent } from 'meteor/vulcan:routing';
import Users from 'meteor/vulcan:users';
import AddBoxIcon from '@material-ui/icons/AddBox';
import Tooltip from '@material-ui/core/Tooltip';

class Home2 extends PureComponent {
  state = { showShortformFeed: false }

  toggleShortformFeed = () => {
    this.setState(prevState => ({showShortformFeed: !prevState.showShortformFeed}))
  }

  toggleExpandComments = () => {
    const { updateUser, currentUser, router } = this.props

    // let query = _.clone(router.location.query) || {view: "magic"}
    // const currentExpanded = query.expandComments === "true" || (currentUser && currentUser.noCollapseCommentsFrontpage) || false;

    // const newFilter = (currentExpanded === "frontpage") ? "includeMetaAndPersonal" : "frontpage"
    if (currentUser) {
      updateUser({
        selector: { _id: currentUser._id},
        data: {
          noCollapseCommentsFrontpage: !(currentUser.noCollapseCommentsFrontpage),
        },
      })
    }
    // query.expandComments = !currentExpanded
    // const location = { pathname: router.location.pathname, query };
    // router.replace(location);
  }

  render () {
    const { currentUser } = this.props
    const { showShortformFeed } = this.state

    const { SingleColumnSection, SectionTitle, RecentDiscussionThreadsList, CommentsNewForm, HomeLatestPosts, TabNavigationMenu, RecommendationsAndCurated, SectionButton, SectionFooter, SectionFooterCheckbox } = Components

    const shouldRenderSidebar = Users.canDo(currentUser, 'posts.moderate.all') ||
        Users.canDo(currentUser, 'alignment.sidebar')
  
    const shortformFeedId = currentUser && currentUser.shortformFeedId
    const expandCommentsFrontpage = !(currentUser && currentUser.noCollapseCommentsFrontpage)

    return (
      <React.Fragment>
        {shouldRenderSidebar && <SplitComponent name="SunshineSidebar" />}
  
        <Components.HeadTags image={getSetting('siteImage')} />
        <TabNavigationMenu />
  
        <RecommendationsAndCurated configName="frontpage" />
        
        <HomeLatestPosts />
  
        <SingleColumnSection>
          <SectionTitle title="Recent Discussion">
            {/* {shortformFeedId &&  <div onClick={this.toggleShortformFeed}>
              <SectionButton>
                <AddBoxIcon />
                New Shortform Post
              </SectionButton>
            </div>} */}
          </SectionTitle>
          <SectionFooter>
            <Tooltip title={"Toggle whether recent discussion comments are expanded"}>
              <div>
                <SectionFooterCheckbox 
                  onClick={this.toggleExpandComments} 
                  value={expandCommentsFrontpage} 
                  label={"Expand Comments"} 
                  />
              </div>
            </Tooltip>
          </SectionFooter>
          {/* {showShortformFeed && <CommentsNewForm
              post={{_id:shortformFeedId}}
              type="comment"
            />} */}
          <RecentDiscussionThreadsList terms={{view: 'recentDiscussionThreadsList', limit:20}}/>
        </SingleColumnSection>
      </React.Fragment>
    )
  }
}

registerComponent(
  'Home2', 
  Home2, 
  withUser, 
  [withUpdate, {
    collection: Users,
    fragmentName: 'UsersCurrent',
  }]);
