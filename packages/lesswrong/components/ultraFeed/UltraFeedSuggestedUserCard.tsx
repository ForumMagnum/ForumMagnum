import React, { useCallback, useState, useRef } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useDialog } from '../common/withDialog';
import FollowUserButton from "../users/FollowUserButton";
import UserMetaInfo from "../users/UserMetaInfo";
import { Link } from '../../lib/reactRouterWrapper';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import ContentStyles from "../common/ContentStyles";
import UltraFeedUserDialog from "./UltraFeedUserDialog";
import LWTooltip from "../common/LWTooltip";
import { commentBodyStyles } from '@/themes/stylePiping';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import Loading from "../vulcan-core/Loading";
import TagSmallPostLink from '../tagging/TagSmallPostLink';

const UserRecentPostsQuery = gql(`
  query UserRecentPostsForCompactCard($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PostsList
      }
    }
  }
`);

const styles = defineStyles("UltraFeedSuggestedUserCard", (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    boxSizing: 'border-box',
    height: 152,
    fontSize: 14,
    fontWeight: 450,
    lineHeight: "19.5px",
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.panelBackground.default,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 8,
    padding: 16,
    minHeight: 140,
    overflow: 'hidden',
    transition: 'box-shadow 0.2s ease',
    cursor: 'pointer',
    ...theme.typography.postStyle,
    '&:hover': {
      boxShadow: theme.palette.boxShadow.default,
    },
  },
  nameRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  name: {
    fontSize: "1.8rem",
    fontWeight: 400,
    lineHeight: "1.2",
    color: theme.palette.grey["A400"],
    flex: "1 1 auto",
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  nameLink: {
    color: 'inherit',
    textDecoration: 'none',
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.7,
    },
  },
  followButtonWrapper: {
    flexShrink: 0,
    '& .LWTooltip-root': {
      pointerEvents: 'none',
    }
  },
  metaRow: {
    fontSize: "0.9rem",
    marginBottom: 8,
    color: theme.palette.grey[600],
    '& .UserMetaInfo-info': {
      marginRight: 12,
    },
  },
  bio: {
    marginBottom: 8,
    lineHeight: "1.2rem",
    fontSize: "0.9rem",
  },
  bioText: {
    ...commentBodyStyles(theme),
    marginTop: 0,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '& p': {
      margin: 0,
    },
    '& p:first-child': {
      marginTop: 0,
    },
  },
  bioTooltip: {
    width: 380,
    maxWidth: 380,
    maxHeight: 600,
    overflow: 'hidden',
    padding: 16,
    backgroundColor: theme.palette.panelBackground.default,
    boxShadow: theme.palette.boxShadow.lwTagHoverOver,
    borderRadius: 4,
    fontSize: "0.9rem",
    lineHeight: "1.3rem",
    ...commentBodyStyles(theme),
    '& p': {
      margin: '0 0 0.8em 0',
    },
    '& p:last-child': {
      marginBottom: 0,
    },
  },
  postsTooltip: {
    width: 380,
    maxWidth: 380,
    padding: 16,
    backgroundColor: theme.palette.panelBackground.default,
    boxShadow: theme.palette.boxShadow.lwTagHoverOver,
    borderRadius: 4,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    boxSizing: 'border-box',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },
  tooltipPostWrapper: {
    position: 'relative',
    width: '100%',
    height: 'auto',
    overflow: 'visible', // Allow tooltips to overflow
    display: 'table',
    tableLayout: 'fixed',
    cursor: 'pointer',
    // '&:hover': {
    //   backgroundColor: theme.palette.grey[100],
    // },
  },

  tooltipPopper: {
    flex: 1,
    backgroundColor: 'transparent',
    boxShadow: 'none',
    width: 400,
    maxWidth: 400,
    transform: 'translateY(-80px)',
    '& .LWPopper-tooltip': {
      maxWidth: 500,
    }
  },
  recentPosts: {
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    paddingTop: 4,
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    width: '100%',
  },
  postWrapper: {
    position: 'relative',
    width: '100%',
    height: 'auto',
    overflow: 'hidden',
    display: 'table',
    tableLayout: 'fixed',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  }
}));

const UltraFeedSuggestedUserCard = ({ 
  user, 
  onFollowToggle
}: {
  user: UsersMinimumInfo;
  onFollowToggle?: (user: UsersMinimumInfo) => void;
}) => {
  const classes = useStyles(styles);
  const { openDialog } = useDialog();
  const [tooltipDisabled, setTooltipDisabled] = useState(false);
  const followButtonRef = useRef<HTMLDivElement>(null);
  
  const hasBio = !!(user.htmlBio && user.htmlBio.trim().length > 0);
  
  const { data: postsData, loading: postsLoading } = useQuery(UserRecentPostsQuery, {
    variables: {
      selector: { userPosts: { userId: user._id, sortedBy: "new" } },
      limit: 6, // Fetch 6 posts (2 for card, 6 for hover)
      enableTotal: false,
    },
    skip: hasBio,
    notifyOnNetworkStatusChange: true,
  });
  
  const handleOpenUserModal = useCallback(() => {
    openDialog({
      name: "UltraFeedUserDialog",
      closeOnNavigate: true,
      contents: ({ onClose }) => (
        <UltraFeedUserDialog
          user={user}
          onClose={onClose}
        />
      )
    });
  }, [openDialog, user]);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Don't open modal if clicking on follow button
    if (followButtonRef.current?.contains(e.target as Node)) {
      return;
    }
    const target = e.target as HTMLElement;
    // Check if we clicked on a link (like in posts)
    if (target.closest('a')) {
      return;
    }
    handleOpenUserModal();
  }, [handleOpenUserModal]);

  const handleFollowClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onFollowToggle?.(user);
  }, [user, onFollowToggle]);

  if (!user?._id) {
    return <div className={classes.root}>User not found</div>;
  }

  const { htmlBio, displayName } = user;
  const profileUrl = userGetProfileUrl(user);
  const posts = postsData?.posts?.results;

  let tooltipContent = null;
  if (hasBio) {
    tooltipContent = (
      <ContentStyles contentType='postHighlight'>
        <div 
          className={classes.bioTooltip}
          dangerouslySetInnerHTML={{__html: htmlBio}}
        />
      </ContentStyles>
    );
  } else if (posts && posts.length > 0) {
    tooltipContent = (
      <div className={classes.postsTooltip}>
        {posts.map((post) => post && (
          <div 
            key={post._id} 
            className={classes.tooltipPostWrapper}
            onClick={(e) => e.stopPropagation()}
          >
            <TagSmallPostLink
              post={post}
              hideAuthor
              disableHoverPreview
            />
          </div>
        ))}
      </div>
    );
  }

  const cardContent = (
    <div 
      className={classes.root}
      onClick={handleCardClick}
    >
      <div className={classes.nameRow}>
        <Link 
          to={profileUrl}
          className={classNames(classes.name, classes.nameLink)}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleOpenUserModal();
          }}
        >
          {displayName}
        </Link>
        <div 
          ref={followButtonRef}
          className={classes.followButtonWrapper}
          onClick={handleFollowClick}
          onMouseEnter={() => setTooltipDisabled(true)}
          onMouseLeave={() => setTooltipDisabled(false)}
        >
          <FollowUserButton 
            user={user} 
            styleVariant="ultraFeed"
          />
        </div>
      </div>
      
      <div className={classes.metaRow}>
        <UserMetaInfo 
          user={user} 
        />
      </div>
      
      {hasBio && (
        <ContentStyles className={classes.bio} contentType='postHighlight'>
          <div 
            className={classes.bioText} 
            dangerouslySetInnerHTML={{__html: htmlBio}}
          />
        </ContentStyles>
      )}
      
      {!hasBio && postsLoading && (
        <div className={classes.loadingContainer}>
          <Loading />
        </div>
      )}
      
      {!hasBio && posts && posts.length > 0 && (
        <div className={classes.recentPosts}>
          {posts.slice(0, 2).map((post) => post && (
            <div key={post._id} className={classes.postWrapper}>
              <TagSmallPostLink
                post={post}
                hideAuthor
                disableHoverPreview
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <LWTooltip
      title={tooltipContent}
      placement="bottom"
      popperClassName={classes.tooltipPopper}
      clickable
      flip={false}
      disabledOnMobile
      hideOnTouchScreens
      disabled={!tooltipContent || tooltipDisabled}
    >
      {cardContent}
    </LWTooltip>
  );

};

export default UltraFeedSuggestedUserCard;


