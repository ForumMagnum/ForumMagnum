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

const DateWithoutTime = withTimezone(
  ({date, timezone}) => 
    <span>{moment(date).tz(timezone).format("MMM Do")}</span>
);

const PostsItemMeta = ({classes, currentUser, post, read}) => {
  const baseScore = getSetting('AlignmentForum', false) ? post.afBaseScore : post.baseScore
  const afBaseScore = !getSetting('AlignmentForum', false) && post.af ? post.afBaseScore : null
  const { MetaInfo, PostsEdit, FormatDate, EventTime, EventVicinity, PostsStats, PostsUserAndCoauthors } = Components;
  return <span className={classNames({[classes.read]:read})}>
      { Posts.canEdit(currentUser,post) && <MetaInfo>
        <PostsEdit post={post}/>
      </MetaInfo>}

      { post.isEvent && <MetaInfo>
        {post.startTime
          ? <Tooltip title={<EventTime post={post} />}>
              <DateWithoutTime date={post.startTime} />
            </Tooltip>
          : <Tooltip title={<span>To Be Determined</span>}>
              <span>TBD</span>
            </Tooltip>}
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
        <FormatDate date={post.postedAt}/>
      </MetaInfo>}

      {post.wordCount && !post.isEvent && <MetaInfo>
        {parseInt(post.wordCount/300) || 1 } min read
      </MetaInfo>}

      { currentUser && currentUser.isAdmin &&
        <PostsStats post={post} />
      }
    </span>
};

registerComponent('PostsItemMeta', PostsItemMeta, withUser, withStyles(styles, {name: "PostsItemMeta"}))
