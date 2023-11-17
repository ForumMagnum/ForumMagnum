import { Components, registerComponent} from '../../lib/vulcan-lib';
import React, { FC } from 'react';
import classNames from 'classnames';
import moment from '../../lib/moment-timezone';
import { useTimezone } from '../common/withTimezone';
import { isAF } from '../../lib/instanceSettings';
import { AnalyticsContext } from '../../lib/analyticsEvents'

const styles = (theme: ThemeType): JssStyles => ({
  read: {
    opacity: ".8"
  },
  karma: {
    minWidth:20,
    textAlign: "center",
    display: "inline-block",
  },
  info: {
    display: "inline",
    color: theme.palette.text.dim3,
    marginRight: theme.spacing.unit,
    fontSize: "1.1rem",
    ...theme.typography.commentStyle
  },
  calendarIcon: {
    marginRight: theme.spacing.unit
  }
})

export const DateWithoutTime: FC<{date: Date}> = ({date}) => {
  const { timezone } = useTimezone();
  return <span>{moment(date).tz(timezone).format("MMM Do")}</span>
}

const PostsItemMeta = ({post, read, classes}: {
  post: PostsList,
  read?: boolean,
  classes: ClassesType,
}) => {
  const baseScore = isAF ? post.afBaseScore : post.baseScore
  const afBaseScore = !isAF && post.af ? post.afBaseScore : null
  const { FormatDate, FooterTagList, PostsUserAndCoauthors, LWTooltip, AddToCalendarButton } = Components;
  return <span className={classNames({[classes.read]:read})}>

      {!post.shortform && !post.isEvent && <span className={classes.info}>
        <LWTooltip title={<div>
          This post has { baseScore || 0 } karma<br/>
          ({ post.voteCount} votes)
        </div>}>
          <span className={classes.karma}>
            { baseScore || 0 }
          </span>
        </LWTooltip>
      </span>}

      { post.isEvent && <span className={classes.info}>
        {post.startTime && (
          <span className={classes.calendarIcon}>
            <AddToCalendarButton post={post} />
          </span>
        )}
        {post.startTime
          ? <LWTooltip title={<Components.EventTime post={post} />}>
              <DateWithoutTime date={post.startTime} />
            </LWTooltip>
          : <LWTooltip title={<span>To Be Determined</span>}>
              <span>TBD</span>
            </LWTooltip>}
      </span>}

      { post.isEvent && !post.onlineEvent && <span className={classes.info}>
        <Components.EventVicinity post={post} />
      </span>}

      <span className={classes.info}>
        <PostsUserAndCoauthors post={post} showMarkers />
      </span>

      { afBaseScore && <span className={classes.info}>
        <LWTooltip title={<div>
          { afBaseScore } karma on alignmentforum.org
        </div>}>
          <span>Ω { afBaseScore }</span>
        </LWTooltip>
      </span>}

      {!post.isEvent && <span className={classes.info}>
        <AnalyticsContext pageElementContext="tagsList">
          <FooterTagList post={post} hideScore hideAddTag smallText/>
        </AnalyticsContext>
      </span>}

      {post.postedAt && !post.isEvent && <span className={classes.info}>
        <FormatDate date={post.postedAt}/>
      </span>}
    </span>
};

const PostsItemMetaComponent = registerComponent('PostsItemMeta', PostsItemMeta, {styles});

declare global {
  interface ComponentTypes {
    PostsItemMeta: typeof PostsItemMetaComponent
  }
}
