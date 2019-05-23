import { Components, registerComponent } from 'meteor/vulcan:core'
import { getSetting } from 'meteor/vulcan:lib'
import React, { PureComponent } from 'react'
import withUser from '../common/withUser'
import { SplitComponent } from 'meteor/vulcan:routing'
import Users from 'meteor/vulcan:users'
import AddBoxIcon from '@material-ui/icons/AddBox'

class HomeEA extends PureComponent {
  state = { showShortformFeed: false }

  toggleShortformFeed = () => {
    this.setState(prevState => ({showShortformFeed: !prevState.showShortformFeed}))
  }

  render () {
    const { currentUser } = this.props
    const { showShortformFeed } = this.state

    const {
      SingleColumnSection,
      SectionTitle,
      RecentDiscussionThreadsList,
      CommentsNewForm,
      HomeLatestPosts,
      ConfigurableRecommendationsList,
      SectionButton
    } = Components

    const shouldRenderSidebar = Users.canDo(currentUser, 'posts.moderate.all') ||
      Users.canDo(currentUser, 'alignment.sidebar')

    const shortformFeedId = currentUser && currentUser.shortformFeedId

    return (
      <React.Fragment>
        {shouldRenderSidebar && <SplitComponent name="SunshineSidebar" />}

        <Components.HeadTags image={getSetting('siteImage')} />

        {currentUser && Users.isAdmin(currentUser) &&
          <ConfigurableRecommendationsList configName="frontpage" />
        }

        <HomeLatestPosts />

        <SingleColumnSection>
          <SectionTitle title="Recent Discussion">
            {shortformFeedId &&  <div onClick={this.toggleShortformFeed}>
              <SectionButton>
                <AddBoxIcon />
                New Shortform Post
              </SectionButton>
            </div>}
          </SectionTitle>
          {showShortformFeed && <CommentsNewForm
            post={{_id:shortformFeedId}}
            type="comment"
          />}
          <RecentDiscussionThreadsList terms={{view: 'recentDiscussionThreadsList', limit:20}}/>
        </SingleColumnSection>
      </React.Fragment>
    )
  }
}

registerComponent('HomeEA', HomeEA, withUser)
