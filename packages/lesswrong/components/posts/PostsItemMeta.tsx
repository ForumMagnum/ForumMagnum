import { Components, registerComponent} from '../../lib/vulcan-lib';
import React from 'react';
import { useCurrentUser } from '../common/withUser';
import classNames from 'classnames';
import moment from '../../lib/moment-timezone';
import { useTimezone } from '../common/withTimezone';
import { forumTypeSetting } from '../../lib/instanceSettings';

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

const DateWithoutTime = ({date}) => {
  const { timezone } = useTimezone();
  return <span>{moment(date).tz(timezone).format("MMM Do")}</span>
}

const PostsItemMeta = ({post, read, classes}: {
  post: PostsList,
  read?: boolean,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { wordCount = 0 } = post.contents || {}
  const baseScore = forumTypeSetting.get() === 'AlignmentForum' ? post.afBaseScore : post.baseScore
  const afBaseScore = forumTypeSetting.get() !== 'AlignmentForum' && post.af ? post.afBaseScore : null
  const { MetaInfo, FormatDate, PostsStats, PostsUserAndCoauthors, LWTooltip } = Components;
  return <span className={classNames({[classes.read]:read})}>

      {!post.shortform && <MetaInfo>
        <LWTooltip title={<div>
          This post has { baseScore || 0 } karma<br/>
          ({ post.voteCount} votes)
        </div>}>
          <span className={classes.karma}>
            { baseScore || 0 }
          </span>
        </LWTooltip>
      </MetaInfo>}

      { post.isEvent && <MetaInfo>
        {post.startTime
          ? <LWTooltip title={<Components.EventTime post={post} />}>
              <DateWithoutTime date={post.startTime} />
            </LWTooltip>
          : <LWTooltip title={<span>To Be Determined</span>}>
              <span>TBD</span>
            </LWTooltip>}
      </MetaInfo>}

      { post.isEvent && <MetaInfo>
        <Components.EventVicinity post={post} />
      </MetaInfo>}

      <MetaInfo>
        <PostsUserAndCoauthors post={post}/>
      </MetaInfo>

      {post.postedAt && !post.isEvent && <MetaInfo>
        <FormatDate date={post.postedAt}/>
      </MetaInfo>}

      {!!wordCount && !post.isEvent && <MetaInfo>
        <LWTooltip title={`${wordCount} words`}>
          <span>{Math.floor(wordCount/300) || 1 } min read</span>
        </LWTooltip>
      </MetaInfo>}

      { currentUser && currentUser.isAdmin &&
        <PostsStats post={post} />
      }

      { afBaseScore && <MetaInfo>
        <LWTooltip title={<div>
          { afBaseScore } karma on alignmentforum.org
        </div>}>
          <span>Ω { afBaseScore }</span>
        </LWTooltip>
      </MetaInfo>}
    </span>
};

const PostsItemMetaComponent = registerComponent('PostsItemMeta', PostsItemMeta, {styles});

declare global {
  interface ComponentTypes {
    PostsItemMeta: typeof PostsItemMetaComponent
  }
}

