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
          <Components.SidebarHoverOver hoverOverComponent={
              <Typography variant="body2">
                <Link to={Posts.getPageUrl(post)}>
                  <strong>{ post.title }</strong>
                </Link>
                <Components.PostsHighlight post={post}/>
              </Typography>
          }>
            <Components.SunshineListItem>
              <Link to={Posts.getPageUrl(post)}
                className="sunshine-sidebar-posts-title">
                  {post.title}
              </Link>
              <div className="sunshine-sidebar-content-hoverover">
                <Link to={Posts.getPageUrl(post)}>
                  <h4>{ post.title }</h4>
                </Link>
                { post.url && <p className="sunshine-post-highlight-linkpost">
                  This is a linkpost for <Link to={Posts.getLink(post)} target={Posts.getLinkTarget(post)}>{post.url}</Link>
                </p>}
                <div dangerouslySetInnerHTML={{__html:post.htmlHighlight}} />
              </div>
              <div className="sunshine-sidebar-item-meta">
                <span className="karma">
                  { post.baseScore }
                </span>
                <Link
                  className="sunshine-sidebar-posts-author"
                  to={Users.getProfileUrl(post.user)}>
                    {post.user.displayName}
                </Link>
                {post.postedAt && <span className="posts-item-date">
                  {moment(new Date(post.postedAt)).fromNow()}
                </span>}
              </div>
              <div className="curated-suggestion-suggestion-by">
                Endorsed by { post.suggestForCuratedUsernames }
              </div>
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
