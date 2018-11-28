import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import React from 'react';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import Tooltip from '@material-ui/core/Tooltip';
import moment from 'moment';
import withTimezone from '../common/withTimezone';

const styles = theme => ({
  read: {
    opacity: ".8"
  }
})

const PostsItemMeta = ({classes, currentUser, post, read, timezone}) => {
  const baseScore = getSetting('AlignmentForum', false) ? post.afBaseScore : post.baseScore
  const afBaseScore = !getSetting('AlignmentForum', false) && post.af ? post.afBaseScore : null
  const { MetaInfo, PostsEdit, FromNowDate, EventTime, EventVicinity, PostsStats, PostsUserAndCoauthors } = Components;
  return <span className={classNames({[classes.read]:read})}>
      { Posts.canEdit(currentUser,post) && <MetaInfo>
        <PostsEdit post={post}/>
      </MetaInfo>}

      { post.isEvent && <MetaInfo>
        <Tooltip title={
          post.startTime ? <EventTime post={post} /> : <span>To Be Determined</span>}
          >
          {post.startTime ? <span>{moment(post.startTime).tz(timezone).format("MMM Do")}</span>
            : <span>TBD</span>
          }
        </Tooltip>
      </MetaInfo>}

      { post.isEvent && <MetaInfo>
        <EventVicinity post={post} />
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

      { currentUser && currentUser.isAdmin &&
        <PostsStats post={post} />
      }
    </span>
};

registerComponent('PostsItemMeta', PostsItemMeta, withUser, withStyles(styles, {name: "PostsItemMeta"}), withTimezone)
