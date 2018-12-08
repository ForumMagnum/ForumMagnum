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
  },
  karma: {
    minWidth:20,
    textAlign: "center",
    display: "inline-block",
    color: "rgba(0,0,0,.3)"
  },
})

const PostsItemMeta = ({classes, currentUser, post, read, timezone}) => {
  const baseScore = getSetting('AlignmentForum', false) ? post.afBaseScore : post.baseScore
  const afBaseScore = !getSetting('AlignmentForum', false) && post.af ? post.afBaseScore : null
  const { MetaInfo, PostsEdit, FormatDate, EventTime, EventVicinity, PostsStats, PostsUserAndCoauthors } = Components;
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

      {post.postedAt && !post.isEvent && <MetaInfo>
        <FormatDate date={post.postedAt}/>
      </MetaInfo>}

      {post.wordCount && !post.isEvent && <MetaInfo>
        <Tooltip title={`${post.wordCount} words`}>
          <span>{parseInt(post.wordCount/300) || 1 } min read</span>
        </Tooltip>
      </MetaInfo>}

      { Posts.canEdit(currentUser,post) && <MetaInfo>
        <span className={classes.secondaryInfo}><PostsEdit post={post}/></span>
      </MetaInfo>}

      { currentUser && currentUser.isAdmin &&
        <PostsStats post={post} />
      }

      { afBaseScore && <MetaInfo>
        <Tooltip title={<div>
          { afBaseScore || 0 } karma on alignmentform.org
        </div>}>
          <span>Ω { afBaseScore || 0 }</span>
        </Tooltip>
      </MetaInfo>}
    </span>
};

registerComponent('PostsItemMeta', PostsItemMeta, withUser, withStyles(styles, {name: "PostsItemMeta"}), withTimezone)
