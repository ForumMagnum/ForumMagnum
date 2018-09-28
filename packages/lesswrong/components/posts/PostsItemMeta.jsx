import { Components as C, registerComponent, getSetting } from 'meteor/vulcan:core';
import { Posts } from 'meteor/example-forum';
import React from 'react';
import withUser from '../common/withUser';
import moment from 'moment';

const PostsItemMeta = ({currentUser, post}) => {
  const baseScore = getSetting('AlignmentForum', false) ? post.afBaseScore : post.baseScore

  return <span>
      { Posts.options.mutations.edit.check(currentUser, post) && <C.MetaInfo>
        <C.PostsEdit post={post} />
      </C.MetaInfo>}
      { post.user && <C.MetaInfo>
        <C.UsersName user={post.user}/>
      </C.MetaInfo>}
      { post.feed && post.feed.user && <C.MetaInfo>
        {post.feed.nickname}
      </C.MetaInfo>}
      {post.postedAt && !post.isEvent && <C.MetaInfo>
        <C.FromDate date={post.postedAt}/>
      </C.MetaInfo>}
      <C.MetaInfo>
        { baseScore || 0 } { baseScore == 1 ? "point" : "points"}
      </C.MetaInfo>
      {post.wordCount && !post.isEvent && <C.MetaInfo>
        {parseInt(post.wordCount/300) || 1 } min read
      </C.MetaInfo>}
      { post.isEvent && post.startTime && <C.MetaInfo>
        {moment(post.startTime).calendar()}
      </C.MetaInfo>}
      { post.isEvent && post.location && <C.MetaInfo>
        {post.location}
      </C.MetaInfo>}
      {currentUser && currentUser.isAdmin &&
        <C.PostsStats post={post} />
      }
    </span>
};

registerComponent('PostsItemMeta', PostsItemMeta, withUser)
