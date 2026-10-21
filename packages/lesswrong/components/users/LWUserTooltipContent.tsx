import { useForumType } from '@/components/hooks/useForumType';
import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { userHasSubscribeTabFeed } from '@/lib/betas';
import { useCurrentUser } from '../common/withUser';
import { commentBodyStyles } from '@/themes/stylePiping';
import ContentStyles from "../common/ContentStyles";
import TagSmallPostLink from "../tagging/TagSmallPostLink";
import FollowUserButton from "./FollowUserButton";
import UserMetaInfo from "./UserMetaInfo";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { userGetProfileUrl } from '@/lib/collections/users/helpers';
import { Link } from '@/lib/reactRouterWrapper';

const PostsListMultiQuery = gql(`
  query multiPostLWUserTooltipContentQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PostsList
      }
      totalCount
    }
  }
`);

const UserTooltipProfileQuery = gql(`
  query userTooltipProfileQuery($documentId: String) {
    user(input: { selector: { documentId: $documentId } }) {
      result {
        ...UsersProfile
      }
    }
  }
`);

const BIO_MAX_HEIGHT = 200;

const styles = defineStyles('LWUserTooltipContent', (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    width: 350,
    maxWidth: "unset",
    fontSize: 14,
    fontWeight: 450,
    lineHeight: "19.5px",
    padding: 16,
    // Allow room for the tooltip's padding and a gap at the viewport edges.
    maxHeight: "calc(100vh - 64px)",
    overflowY: "auto",
    '& > *': {
      flexShrink: 0,
    },
    color: theme.palette.text.primary,
    background: theme.palette.panelBackground.default,
    boxShadow: theme.palette.boxShadow.lwTagHoverOver,
    ...theme.typography.postStyle
  },
  header: {
    display: "flex",
    flexDirection: "column",
    maxWidth: 400,
  },
  name: {
    marginTop: 4,
    fontSize: "1.7rem",
    fontWeight: 400,
    color: theme.palette.grey["A400"],
  },
  metaRow: {
    marginTop: 8,
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    justifyContent: "space-between",
    alignItems: "center",
    color: theme.palette.grey["600"],
    fontSize: "1.1rem",
  },
  userMetaInfo: {
    minWidth: 0,
    flexWrap: "wrap",
    rowGap: 4,
  },
  bio: {
    marginTop: 8,
    lineHeight: "1.3rem",
  },
  bioText: {
    ...commentBodyStyles(theme),
    marginTop: 0,
    display: "flow-root",
  },
  bioCollapsed: {
    maxHeight: BIO_MAX_HEIGHT,
    overflow: "hidden",
  },
  bioExpand: {
    ...theme.typography.commentStyle,
    display: "block",
    marginTop: 4,
    padding: 0,
    border: "none",
    background: "none",
    color: theme.palette.text.dim,
    fontSize: 13,
    cursor: "pointer",
    '&:hover': {
      color: theme.palette.text.primary,
    },
  },
  posts: {
    marginTop: 8,
    paddingTop: 8,
    borderTop: theme.palette.border.extraFaint,
    overflow: "hidden",
  },
  postPlaceholder: {
    // Match TagSmallPostLink's line height and its 2px top/bottom margins.
    height: `calc(${theme.typography.body2.lineHeight} + 4px)`,
    display: "flex",
    alignItems: "center",
    '&::before': {
      content: '""',
      width: "100%",
      height: 14,
      borderRadius: 3,
      background: theme.palette.greyAlpha(0.08),
      animation: '$postPlaceholderPulse 1.8s ease-in-out infinite',
      '@media (prefers-reduced-motion: reduce)': {
        animation: "none",
      },
    },
  },
  '@keyframes postPlaceholderPulse': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },
}));

export const LWUserTooltipContent = ({hideFollowButton=false, user}: {
  hideFollowButton?: boolean,
  user: UsersMinimumInfo,
}) => {
  const { forumType } = useForumType();
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();

  const { htmlBio, displayName } = user;
  const bioId = useId();
  const bioRef = useRef<HTMLDivElement>(null);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [bioNeedsExpansion, setBioNeedsExpansion] = useState(false);

  useLayoutEffect(() => {
    const bio = bioRef.current;
    if (!bio) return;

    const measureBio = () => {
      setBioNeedsExpansion(bio.getBoundingClientRect().height > BIO_MAX_HEIGHT);
    };
    measureBio();
    const observer = new ResizeObserver(measureBio);
    observer.observe(bio);
    return () => observer.disconnect();
  }, [htmlBio]);

  const { data, loading } = useQuery(PostsListMultiQuery, {
    variables: {
      selector: { userPosts: { userId: user._id, sortedBy: "new" } },
      limit: 3,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const { data: profileData } = useQuery(UserTooltipProfileQuery, {
    variables: { documentId: user._id },
  });

  const enrichedUser = profileData?.user?.result
    ? { ...user, voteReceivedCount: profileData.user.result.voteReceivedCount }
    : user;

  const results = data?.posts?.results;
  // postCount only counts owned, approved, non-draft, non-rejected posts.
  // userPosts includes coauthors and has different visibility filters, so this
  // is an estimate, particularly for users with fewer than three visible posts.
  const placeholderPostCount = Math.min(3, Math.max(0, user.postCount));
  const showPosts = results ? results.some(post => !!post) : loading && placeholderPostCount > 0;

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <div className={classes.name}>
          <Link to={userGetProfileUrl(user)}>{displayName}</Link>
        </div>
        <div className={classes.metaRow}>
          <UserMetaInfo user={enrichedUser} className={classes.userMetaInfo} />
          {!hideFollowButton && userHasSubscribeTabFeed(currentUser, forumType) && <FollowUserButton user={user} />}
        </div>
      </div>

      {htmlBio && <div className={classes.bio}>
        <div id={bioId} className={classNames({[classes.bioCollapsed]: !bioExpanded})}>
          <ContentStyles contentType='postHighlight'>
            <div ref={bioRef} className={classes.bioText} dangerouslySetInnerHTML={{__html: htmlBio}} />
          </ContentStyles>
        </div>
        {bioNeedsExpansion && <button
          type="button"
          className={classes.bioExpand}
          aria-expanded={bioExpanded}
          aria-controls={bioId}
          onClick={() => setBioExpanded(!bioExpanded)}
        >
          {bioExpanded ? "Show less" : "Show more"}
        </button>}
      </div>}
      {showPosts && <div className={classes.posts}>
        {results ? results.map((post) => post &&
          <TagSmallPostLink
            key={post._id}
            post={post}
            hideAuthor
            disableHoverPreview
          />
        ) : Array.from({length: placeholderPostCount}, (_, index) =>
          <div key={index} className={classes.postPlaceholder} aria-hidden="true" />
        )}
      </div>}
    </div>
);
}

export default LWUserTooltipContent;
