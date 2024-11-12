import React from 'react';
import { Components, registerComponent, RouterLocation } from '../../lib/vulcan-lib';
import { useHover } from '../common/withHover';
import { Link } from '../../lib/reactRouterWrapper';
import { useTagPreview } from './useTag';
import { linkStyle } from '../linkPreview/PostLinkPreview';
import { removeUrlParameters } from '../../lib/routeUtil';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  ...linkStyle(theme),
  count: {
    color: theme.palette.secondary.main, // grey[500],
    fontSize: ".9em",
    position: "relative",
    marginLeft: 3,
    marginRight: 0
  },
  voteBar: {
    width: 5,
    backgroundColor: theme.palette.secondary.main,
    display: "inline-block",
    marginRight: 1,
    height: '1em'
  },
  voteBarContainer: {
    display: "inline-flex",
    alignItems: "flex-end",
    height: '0.9em',
    marginLeft: 5,
  }
});

function normalizeTagLink(link: string) {
  return removeUrlParameters(link, ["showPostCount", "useTagName"]);
}

const TagHoverPreview = ({
  href,
  targetLocation,
  postCount=6,
  noPrefetch,
  children,
  classes,
}: {
  href: string,
  targetLocation: RouterLocation,
  postCount?: number,
  noPrefetch?: boolean,
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  const { params: {slug}, hash } = targetLocation;
  // Slice the hash to remove the leading # (which won't be a part of the
  // element ID in the dom) eg: "Further_reading"
  const hashId = hash.slice(1);

  const {tag} = useTagPreview(slug, hashId, {skip: noPrefetch});
  const { showPostCount: showPostCountQuery, useTagName: useTagNameQuery } = targetLocation.query
  const showPostCount = showPostCountQuery === "true" // query parameters are strings
  const tagName = useTagNameQuery === "true" ? tag?.name : undefined // query parameters are strings

  // Remove showPostCount and useTagName query parameters from the link, if present
  const linkTarget = normalizeTagLink(href);

  const votes = [5, 0, 0, 1, 2, 7, 19, 20, 9, 3]
  const maxVote = Math.max(...votes)
  const normalizedVoteHeights = votes.map(vote => vote / maxVote)

  const {TagsTooltip} = Components;
  const isRead = tag?.isRead;
  return (
    <TagsTooltip
      tagSlug={slug}
      hash={hashId}
      As="span"
      previewPostCount={postCount}
      noPrefetch={noPrefetch}
    >
      <Link
        className={classNames(
          !showPostCount && classes.link,
          isRead && classes.visited,
        )}
        to={linkTarget}
      >
        {tagName ?? children}
        <span className={classes.voteBarContainer}>
          {normalizedVoteHeights.map((height, index) => (
            <span key={index} className={classes.voteBar} style={{maxHeight: `${height * 100}%`}} />
          ))}
        </span>
      </Link>
      {!!(showPostCount && tag?.postCount) &&
        <span className={classes.count}>({tag?.postCount})</span>
      }
    </TagsTooltip>
  );
}

const TagHoverPreviewComponent = registerComponent("TagHoverPreview", TagHoverPreview, {styles});

declare global {
  interface ComponentTypes {
    TagHoverPreview: typeof TagHoverPreviewComponent
  }
}
