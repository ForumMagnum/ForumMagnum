import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import React from 'react';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

const styles = theme => ({
  read: {
    opacity: ".8"
  }
})

const PostsItemMeta = ({classes, currentUser, post, read}) => {
  const baseScore = getSetting('AlignmentForum', false) ? post.afBaseScore : post.baseScore
  const afBaseScore = !getSetting('AlignmentForum', false) && post.af ? post.afBaseScore : null
  const { MetaInfo, PostsEdit, FromNowDate, EventTime, PostsStats, PostsUserAndCoauthors } = Components;

  return <span className={classNames({[classes.read]:read})}>
      { Posts.canEdit(currentUser,post) && <MetaInfo>
        <PostsEdit post={post}/>
      </MetaInfo>}
      { post.user && <MetaInfo>
        <PostsUserAndCoauthors post={post}/>
      </MetaInfo>}
      { post.feed && post.feed.user && <MetaInfo>
        {post.feed.nickname}
      </MetaInfo>}
      <MetaInfo>
        { baseScore || 0 } { baseScore == 1 ? "point" : "points"}
      </MetaInfo>
      { afBaseScore && <MetaInfo>
        Ω { afBaseScore || 0 }
      </MetaInfo>}
      {post.postedAt && !post.isEvent && <MetaInfo>
        <FromNowDate date={post.postedAt}/>
      </MetaInfo>}
      {post.wordCount && !post.isEvent && <MetaInfo>
        {parseInt(post.wordCount/300) || 1 } min read
      </MetaInfo>}
      { post.isEvent && post.startTime && <MetaInfo>
        <EventTime post={post} dense={true} />
      </MetaInfo>}
      { post.isEvent && post.location && <MetaInfo>
        {post.location}
      </MetaInfo>}
      { currentUser && currentUser.isAdmin &&
        <PostsStats post={post} />
      }
    </span>
};

registerComponent('PostsItemMeta', PostsItemMeta, withUser, withStyles(styles, {name: "PostsItemMeta"}))
