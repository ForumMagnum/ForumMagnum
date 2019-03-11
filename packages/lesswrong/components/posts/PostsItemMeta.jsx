import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
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
  },
  karma: {
    minWidth:20,
    textAlign: "center",
    display: "inline-block",
  },
})

const DateWithoutTime = withTimezone(
  ({date, timezone}) =>
    <span>{moment(date).tz(timezone).format("MMM Do")}</span>
);

const PostsItemMeta = ({classes, currentUser, post, read}) => {
  const { wordCount = 0 } = post.contents || {}
  const baseScore = getSetting('AlignmentForum', false) ? post.afBaseScore : post.baseScore
  const afBaseScore = !getSetting('AlignmentForum', false) && post.af ? post.afBaseScore : null
  const { MetaInfo, FormatDate, EventTime, EventVicinity, PostsStats, PostsUserAndCoauthors } = Components;
  return <span className={classNames({[classes.read]:read})}>

      <MetaInfo>
        <Tooltip title={<div>
          This post has { baseScore || 0 } karma<br/>
          ({ post.voteCount} votes)
        </div>}>
          <span className={classes.karma}>
            { baseScore || 0 }
          </span>
        </Tooltip>
      </MetaInfo>

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

      {post.postedAt && !post.isEvent && <MetaInfo>
        <FormatDate date={post.postedAt}/>
      </MetaInfo>}

      {!!wordCount && !post.isEvent && <MetaInfo>
        <Tooltip title={`${wordCount} words`}>
          <span>{parseInt(wordCount/300) || 1 } min read</span>
        </Tooltip>
      </MetaInfo>}

      { currentUser && currentUser.isAdmin &&
        <PostsStats post={post} />
      }

      { afBaseScore && <MetaInfo>
        <Tooltip title={<div>
          { afBaseScore } karma on alignmentforum.org
        </div>}>
          <span>Ω { afBaseScore }</span>
        </Tooltip>
      </MetaInfo>}
    </span>
};

registerComponent('PostsItemMeta', PostsItemMeta, withUser, withStyles(styles, {name: "PostsItemMeta"}))
