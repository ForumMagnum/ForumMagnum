import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React, { FC } from 'react';
import classNames from 'classnames';
import { isAF } from '../../lib/instanceSettings';
import { AnalyticsContext } from '../../lib/analyticsEvents'
import FormatDate from "@/components/common/FormatDate";
import FooterTagList from "@/components/tagging/FooterTagList";
import PostsUserAndCoauthors from "@/components/posts/PostsUserAndCoauthors";
import LWTooltip from "@/components/common/LWTooltip";
import AddToCalendarButton from "@/components/posts/AddToCalendar/AddToCalendarButton";
import EventVicinity from "@/components/localGroups/EventVicinity";
import EventTime from "@/components/localGroups/EventTime";

const styles = (theme: ThemeType) => ({
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
  return <FormatDate date={date} granularity='date' format={"MMM Do"} />
}

const PostsItemMeta = ({post, read, hideTags, classes}: {
  post: PostsList,
  read?: boolean,
  hideTags?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const baseScore = isAF ? post.afBaseScore : post.baseScore
  const showAfScore = (!isAF && post.af);
  const afBaseScore = showAfScore ? post.afBaseScore : null
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
          ? <LWTooltip title={<EventTime post={post} />}>
              <DateWithoutTime date={post.startTime} />
            </LWTooltip>
          : <LWTooltip title={<span>To Be Determined</span>}>
              <span>TBD</span>
            </LWTooltip>}
      </span>}

      { post.isEvent && !post.onlineEvent && <span className={classes.info}>
        <EventVicinity post={post} />
      </span>}

      <span className={classes.info}>
        <PostsUserAndCoauthors post={post} showMarkers />
      </span>

      { showAfScore && <span className={classes.info}>
        <LWTooltip title={<div>
          { afBaseScore } karma on alignmentforum.org
        </div>}>
          <span>Ω { afBaseScore }</span>
        </LWTooltip>
      </span>}

      {!post.isEvent && !hideTags && <span className={classes.info}>
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

export default PostsItemMetaComponent;
