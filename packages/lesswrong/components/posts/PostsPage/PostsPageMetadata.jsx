import React from 'react'
import { registerComponent, Components } from 'meteor/vulcan:core';
import { Posts } from '../../../lib/collections/posts';
import { withStyles } from '@material-ui/core/styles'
import withUser from '../../common/withUser'

const styles = theme => ({
  metadata: {
    ...theme.typography.postStyle,
    position: 'absolute',
    right: '100%',
    width: 200,
    paddingRight: 30,
    textAlign: 'right',
    color: 'rgba(0,0,0,0.5)',
  },
  date: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(0,0,0,0.5)',
    marginBottom: -5
  },
  comments: {
    fontSize: 14,
  },
  actions: {
    display: 'inline',
    padding: '0 5px',
    lineHeight: '20px',
    fontSize: 14,
    "@media print": {
      display: 'none'
    },
    [theme.breakpoints.up('lg')]: {
      display: 'block',
      padding: 0
    }
  },
  eventTimes: {
    marginTop: "5px",
    fontSize: "14px",
    lineHeight: 1.25,
    fontWeight: 600,
  },
  eventLocation: {
    fontSize: "14px",
    fontWeight: 400,
    lineHeight: 1.25,
  },
  eventContact: {
    fontSize: "14px",
    fontWeight: 400,
    lineHeight: 1.25,
    marginBottom: "5px",
  },
  eventLinks: {
    fontWeight: 400,
  },
})

const PostsPageMetadata = ({classes, post, currentUser}) => {
  const { PostsEdit, PostsPageAdminActions } = Components
  const { isEvent, location, contactInfo, postedAt } = post
  return <div className={classes.metadata}>
    <div className={classes.date}>
      { isEvent ?
        <span>
          <div className={classes.eventTimes}> <Components.EventTime post={post} dense={false} /> </div>
          { location && <div className={classes.eventLocation}> {location} </div> }
          <div className={classes.eventLinks}> <Components.GroupLinks document={post} /></div>
          { contactInfo && <div className={classes.eventContact}> Contact: {contactInfo} </div> }
        </span>
        :
        <div className={classes.subtitle}>
          <Components.SimpleDate date={postedAt}/>
        </div>
      }
    </div>
    <div className={classes.comments}>
      <a href="#comments">{ getCommentCountStr(post) }</a>
    </div>
    <div className={classes.actions}>
      { Posts.canEdit(currentUser,post) && <PostsEdit post={post}/>}
      <PostsPageAdminActions post={post} />
    </div>
  </div>
}

registerComponent('PostsPageMetadata', PostsPageMetadata, withUser, withStyles(styles, {name: "PostsPageMetadata"}))

function getCommentCountStr(post) {
  let count = Posts.getCommentCount(post)
  if (!count) {
      return "No comments"
  } else if (count == 1) {
      return "1 comment"
  } else {
      return count + " comments"
  }
}
