import { Components, registerComponent } from 'meteor/vulcan:core'
import { getSetting } from 'meteor/vulcan:lib'
import React, { PureComponent } from 'react'
import withUser from '../common/withUser'
import Users from 'meteor/vulcan:users'

class HomeEA extends PureComponent {
  render () {
    const { currentUser } = this.props
    const { showShortformFeed } = this.state

    // TODO;
    const {
      SingleColumnSection,
      SectionTitle,
      RecentDiscussionThreadsList,
      CommentsNewForm,
      HomeLatestPosts,
      ConfigurableRecommendationsList,
      SectionButton,
      HeadTags,
    } = Components

    const shouldRenderSidebar = Users.canDo(currentUser, 'posts.moderate.all') ||
      Users.canDo(currentUser, 'alignment.sidebar')

    return (
      <React.Fragment>
        {shouldRenderSidebar && <SplitComponent name="SunshineSidebar" />}

        <HeadTags image={getSetting('siteImage')} />

        {currentUser?.beta &&
          <ConfigurableRecommendationsList configName="frontpage" />
        }

        <HomeLatestPosts />
        <RecentDiscussionThreadsList terms={{view: 'recentDiscussionThreadsList', limit:20}}/>
      </React.Fragment>
    )
  }
}

registerComponent('HomeEA', HomeEA, withUser)
