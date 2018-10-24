import { Components as C, registerComponent, getSetting } from 'meteor/vulcan:core';
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

  return <span className={classNames({[classes.read]:read})}>
      { Posts.canEdit(currentUser,post) && <C.MetaInfo>
        <C.PostsEdit post={post}/>
      </C.MetaInfo>}
      { post.user && <C.MetaInfo>
        <C.UsersName user={post.user}/>
      </C.MetaInfo>}
      { post.feed && post.feed.user && <C.MetaInfo>
        {post.feed.nickname}
      </C.MetaInfo>}
      <C.MetaInfo>
        { baseScore || 0 } { baseScore == 1 ? "point" : "points"}
      </C.MetaInfo>
      { afBaseScore && <C.MetaInfo>
        Ω { afBaseScore || 0 }
      </C.MetaInfo>}
      {post.postedAt && !post.isEvent && <C.MetaInfo>
        <C.FromNowDate date={post.postedAt}/>
      </C.MetaInfo>}
      {post.wordCount && !post.isEvent && <C.MetaInfo>
        {parseInt(post.wordCount/300) || 1 } min read
      </C.MetaInfo>}
      { post.isEvent && post.startTime && <C.MetaInfo>
        <C.EventTime post={post} dense={true} />
      </C.MetaInfo>}
      { post.isEvent && post.location && <C.MetaInfo>
        {post.location}
      </C.MetaInfo>}
      {currentUser && currentUser.isAdmin &&
        <C.PostsStats post={post} />
      }
    </span>
};

registerComponent('PostsItemMeta', PostsItemMeta, withUser, withStyles(styles, {name: "PostsItemMeta"}))
