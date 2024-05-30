import React, { useRef } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { InteractionWrapper } from "../common/useClickableCell";
import classNames from "classnames";
import { isAF } from "../../lib/instanceSettings";
import { Link } from '../../lib/reactRouterWrapper';
import { postGetLink, postGetLinkTarget, postGetPageUrl } from "../../lib/collections/posts/helpers";

const styles = (theme: ThemeType) => ({
  root: {
    color: theme.palette.grey[600],
    width: "100%",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "start"
  },
  interactionWrapper: {
    display: "flex",
    alignItems: "center",
    "&:hover": {
      opacity: 1,
    },
    marginRight: 6,
  },
  icon: {
    width: 16,
  },
  eventOrganizer: {
    display: "flex",
    fontSize: "14px",
  },
  authorsList: {
    fontSize: "1.1rem",
  },
  read: {
    opacity: ".8"
  },
  linkIcon: {
    fontSize: "1.2rem",
    opacity: 0.9
  },
  karma: {
    textAlign: "center",
    display: "inline-block",
  },
  karmaIcon: {
    fonsize: "1.1rem",
    opacity: 0.8,
  },
  linkPost: {
    marginLeft: -4
  },
  info: {
    display: "flex",
    color: theme.palette.text.dim3,
    marginRight: 8,
    fontSize: "1.1rem",
    textWrap: "nowrap",
    ...theme.typography.commentStyle,
  },
  dot: {
    opacity: 0.8,
    marginLeft: 4,
    fontWeight: 600,
  }
});

const FeedPostCardMeta = ({post, useCuratedDate=true, className, classes}: {
  post: PostsList | SunshinePostsList,
  useEventStyles?: boolean,
  useCuratedDate?: boolean,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const authorExpandContainer = useRef(null);

  const {
    TruncatedAuthorsList, PostsItemDate, ForumIcon, LWTooltip, EventTime, FormatDate
  } = Components;

  // TODO: Think about styling for events

  const baseScore = (isAF ? post.afBaseScore : post.baseScore) ?? 0
  const showAfScore = !isAF && post.af && !post.shortform && !post.isEvent;
  const afBaseScore = showAfScore ? post.afBaseScore : null

  const separatorElement = <span className={classes.dot}>·</span>

  const linkPostMessage = <div>
    This is a linkpost for <a
      href={postGetLink(post)}
      target={postGetLinkTarget(post)}
    >{post.url}</a>
  </div>

  const linkPostIcon =  post.url && <span className={classNames(classes.linkPost, classes.info)}>
    <Link to={postGetPageUrl(post)}>
        <LWTooltip title={linkPostMessage} placement="left">
          <a href={postGetLink(post)}><ForumIcon icon="Link" className={classes.linkIcon}/></a>
        </LWTooltip>
    </Link>
  </span>

  const dateElement = post.postedAt && !post.isEvent && <div className={classes.info}>
        <FormatDate date={post.postedAt}/>
        {post.url && separatorElement}
      </div>
  
  const baseScoreElement = !post.shortform && !post.isEvent && <span className={classes.info}>
    <LWTooltip title={<div>
      This post has { baseScore } karma<br/>
      ({ post.voteCount} votes)
    </div>}>
      <span className={classes.karma}>
        <span>{ baseScore }</span>
      </span>
    </LWTooltip>
    {separatorElement}
  </span>

  const afScoreElement = showAfScore && <span className={classes.info}>
    <LWTooltip title={<div>
      { afBaseScore } karma on alignmentforum.org
    </div>}>
      <span>Ω { afBaseScore }</span>
    </LWTooltip>
    {separatorElement}
  </span>

  const authorsListElement = <InteractionWrapper className={classes.interactionWrapper}>
    <TruncatedAuthorsList
      post={post}
      expandContainer={authorExpandContainer}
      className={classes.authorsList}
    />
    {separatorElement}
  </InteractionWrapper>

  return (
    <div
      className={classNames(classes.root, className)}
      ref={authorExpandContainer}
    >
      {baseScoreElement}
      {afScoreElement}
      {authorsListElement}
      {dateElement}
      {linkPostIcon}
    </div>
  );
}

const FeedPostCardMetaComponent = registerComponent(
  "FeedPostCardMeta",
  FeedPostCardMeta,
  {styles, stylePriority: -1},
);

declare global {
  interface ComponentTypes {
    FeedPostCardMeta: typeof FeedPostCardMetaComponent,
  }
}
