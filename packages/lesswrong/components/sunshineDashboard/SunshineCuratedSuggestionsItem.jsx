import { Components, registerComponent, withEdit, withCurrentUser } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router'
import FontIcon from 'material-ui/FontIcon';
import moment from 'moment';
import Typography from '@material-ui/core/Typography';

class SunshineCuratedSuggestionsItem extends Component {

  handleCurate = () => {
    const { currentUser, post, editMutation } = this.props
    editMutation({
      documentId: post._id,
      set: {
        reviewForCuratedUserId: currentUser._id,
        curatedDate: new Date(),
      },
      unset: {}
    })
  }

  handleDisregardForCurated = () => {
    const { currentUser, post, editMutation } = this.props
    editMutation({
      documentId: post._id,
      set: {
        reviewForCuratedUserId: currentUser._id,
      },
      unset: {}
    })
  }

  handleSuggestCurated = () => {
    const { currentUser, post, editMutation } = this.props
    let suggestUserIds = _.clone(post.suggestForCuratedUserIds) || []
    if (!suggestUserIds.includes(currentUser._id)) {
      suggestUserIds.push(currentUser._id)
    }
    editMutation({
      documentId: post._id,
      set: {suggestForCuratedUserIds:suggestUserIds},
      unset: {}
    })
  }

  handleUnsuggestCurated = () => {
    const { currentUser, post, editMutation } = this.props
    let suggestUserIds = _.clone(post.suggestForCuratedUserIds) || []
    if (suggestUserIds.includes(currentUser._id)) {
      suggestUserIds = _.without(suggestUserIds, currentUser._id);
    }
    editMutation({
      documentId: post._id,
      set: {suggestForCuratedUserIds:suggestUserIds},
      unset: {}
    })
  }

  render () {
    if (this.props.post) {
      const { currentUser, post } = this.props
      return (
        <div className="sunshine-sidebar-item curated-suggestion">
          <Components.SidebarHoverOver
            hoverOverComponent={
              <div>
                <Typography variant="title">
                  <Link to={Posts.getPageUrl(post)}>
                    { post.title }
                  </Link>
                </Typography>
                <br/>
                <Components.PostsHighlight post={post}/>
              </div>
            }
          >
            <Components.SunshineListItem>
              <Link to={Posts.getPageUrl(post)}
                className="sunshine-sidebar-posts-title">
                  {post.title}
              </Link>
              <div>
                <Components.MetaInfo>
                  { post.baseScore }
                </Components.MetaInfo>
                <Components.MetaInfo>
                  <Link to={Users.getProfileUrl(post.user)}>
                      {post.user.displayName}
                  </Link>
                </Components.MetaInfo>
                {post.postedAt && <Components.MetaInfo>
                  {moment(new Date(post.postedAt)).fromNow()}
                </Components.MetaInfo>}
              </div>
              <Typography variant="caption">
                Endorsed by { post.suggestForCuratedUsernames }
              </Typography>
              <div className="sunshine-sidebar-posts-actions curated-suggestion">
                <span
                  className="sunshine-sidebar-posts-action clear"
                  title="Remove from Curation Suggestions"
                  onClick={this.handleDisregardForCurated}>
                  <FontIcon
                    style={{fontSize: "18px", color:"rgba(0,0,0,.25)"}}
                    className="material-icons">
                      clear
                  </FontIcon>
                </span>
                <span
                  className="sunshine-sidebar-posts-action curate"
                  title="Curate Post"
                  onClick={this.handleCurate}>
                  <FontIcon
                    style={{fontSize: "24px", color:"rgba(0,0,0,.25)"}}
                    className="material-icons">
                      star
                  </FontIcon>
                </span>
                { !post.suggestForCuratedUserIds || !post.suggestForCuratedUserIds.includes(currentUser._id) ?
                  <span
                    className="sunshine-sidebar-posts-action clear"
                    title="Endorse Curation"
                    onClick={this.handleSuggestCurated}>
                    <FontIcon
                      style={{fontSize: "18px", color:"rgba(0,0,0,.25)"}}
                      className="material-icons">
                        plus_one
                    </FontIcon>
                  </span> :
                  <span
                    className="sunshine-sidebar-posts-action clear"
                    title="Unendorse Curation"
                    onClick={this.handleUnsuggestCurated}>
                    <FontIcon
                      style={{fontSize: "18px", color:"rgba(0,0,0,.25)"}}
                      className="material-icons">
                        undo
                    </FontIcon>
                  </span>
                }
              </div>
            </Components.SunshineListItem>
          </Components.SidebarHoverOver>
        </div>
      )
    } else {
      return null
    }
  }
}

const withEditOptions = {
  collection: Posts,
  fragmentName: 'PostsList',
}
registerComponent(
  'SunshineCuratedSuggestionsItem',
  SunshineCuratedSuggestionsItem,
  [withEdit, withEditOptions],
  withCurrentUser
);
