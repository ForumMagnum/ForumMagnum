'use client';

import React, { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { getSandboxedHomePageSrcdoc, wrapBodyInSrcdoc } from './SandboxedHomePageSrcdoc';
import { useCurrentUser } from '../common/withUser';
import { useHomeDesignChat } from './HomeDesignChatContext';
import { useLocation, useNavigate } from '@/lib/routeUtil';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { useApolloClient } from '@apollo/client/react';
import HomeDesignChatPanel from './HomeDesignChatPanel';
import { UnreadNotificationCountsQuery, useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { NotificationsListMultiQuery } from '../notifications/NotificationsListMultiQuery';
import { SuspenseWrapper } from './SuspenseWrapper';

const homePageDesignByPublicIdQuery = gql(`
  query HomePageDesignByPublicId($publicId: String!) {
    homePageDesignByPublicId(publicId: $publicId) {
      _id
      publicId
      html
      title
    }
  }
`);

const myHomePageDesignsQuery = gql(`
  query MyHomePageDesigns($limit: Int) {
    myHomePageDesigns(limit: $limit) {
      _id
      publicId
      html
      title
    }
  }
`);

const homeDesignKarmaChangesQuery = gql(`
  query HomeDesignKarmaChanges($documentId: String) {
    user(selector: { documentId: $documentId }) {
      result {
        _id
        karmaChanges {
          totalChange
          updateFrequency
          startDate
          endDate
          nextBatchDate
          posts {
            _id
            scoreChange
            postId
            title
            slug
            collectionName
          }
          comments {
            _id
            scoreChange
            commentId
            description
            postId
            postTitle
            postSlug
            tagSlug
            tagName
            tagCommentType
            collectionName
          }
          tagRevisions {
            _id
            scoreChange
            tagId
            tagSlug
            tagName
            collectionName
          }
        }
      }
    }
  }
`);

const styles = defineStyles('SandboxedHomePage', (theme: ThemeType) => ({
  root: {
    position: 'fixed',
    inset: 0,
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    height: '100dvh',
    overflow: 'hidden',
    overscrollBehavior: 'none',
    background: '#f8f4ee',
    [theme.breakpoints.down('md')]: {
      flexDirection: 'column',
    },
  },
  mainViewport: {
    position: 'relative',
    flex: '1 1 auto',
    minWidth: 0,
    minHeight: 0,
    height: '100%',
  },
  mainViewportWithPanel: {
    flexBasis: 'calc(100% - clamp(360px, 30vw, 470px))',
  },
  iframeWrap: {
    position: 'relative',
    width: '100%',
    height: '100%',
    minWidth: 0,
    minHeight: 0,
  },
  iframe: {
    display: 'block',
    width: '100%',
    height: '100%',
    border: 'none',
  },
  customizeButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: theme.zIndexes.lwPopper - 1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '9px 16px',
    background: 'rgba(248, 244, 238, 0.96)',
    color: '#37623b',
    border: '1px solid rgba(95, 155, 101, 0.5)',
    fontFamily: '"gill-sans-nova", "Gill Sans", "Helvetica Neue", sans-serif',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    boxShadow: '0 1px 0 rgba(23,20,17,0.06)',
    '&:hover': {
      background: 'rgba(95, 155, 101, 0.12)',
      borderColor: '#5f9b65',
      color: '#2d5331',
    },
    [theme.breakpoints.down('md')]: {
      position: 'fixed',
      bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
      right: 'calc(16px + env(safe-area-inset-right, 0px))',
    },
  },
}));

const subscribeNoop = () => () => {};

function useOrigin(): string {
  return useSyncExternalStore(
    subscribeNoop,
    () => window.location.origin,
    () => ''
  );
}

function sanitizeCurrentUserForHomeDesign(currentUser: UsersCurrent): Pick<UsersCurrent, '_id' | 'displayName' | 'slug' | 'karma'> {
  return {
    _id: currentUser._id,
    displayName: currentUser.displayName,
    slug: currentUser.slug,
    karma: currentUser.karma,
  };
}

interface RpcRequest {
  type: 'rpc-request';
  id: number;
  method: string;
  params: Record<string, unknown>;
}

function isRpcRequest(data: unknown): data is RpcRequest {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return obj.type === 'rpc-request' && typeof obj.id === 'number' && typeof obj.method === 'string';
}

/**
 * Outer shell: renders the fixed-position overlay immediately (never suspends).
 * The inner content with queries is wrapped in a Suspense boundary so that
 * the overlay covers the underlying layout even while data is loading.
 */
const SandboxedHomePage = () => {
  const classes = useStyles(styles);
  const designChat = useHomeDesignChat();

  return (
    <div className={classes.root}>
      <div className={classNames(classes.mainViewport, {
        [classes.mainViewportWithPanel]: designChat.isOpen,
      })}>
        <SuspenseWrapper name="SandboxedHomePageContent">
          <SandboxedHomePageContent/>
        </SuspenseWrapper>
      </div>
      <HomeDesignChatPanel />
    </div>
  );
};

/**
 * Inner content: does the useQuery calls (which may suspend) and renders
 * the iframe + customize button.
 */
function SandboxedHomePageContent() {
  const classes = useStyles(styles);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const currentUser = useCurrentUser();
  const designChat = useHomeDesignChat();
  const { query } = useLocation();
  const navigate = useNavigate();
  const themePublicId = query.theme as string | undefined;
  const { latestUnreadCount } = useUnreadNotifications();

  const { data: themeData } = useQuery(homePageDesignByPublicIdQuery, {
    variables: { publicId: themePublicId! },
    skip: !themePublicId,
  });

  const { data: myDesignsData } = useQuery(myHomePageDesignsQuery, {
    variables: { limit: 1 },
    skip: !!themePublicId,
  });

  const client = useApolloClient();

  const handleRpc = useCallback(async (method: string, params: Record<string, unknown>): Promise<unknown> => {
    switch (method) {
      case 'getCurrentUser': {
        if (!currentUser) {
          return { loggedIn: false, user: null };
        }
        return {
          loggedIn: true,
          user: sanitizeCurrentUserForHomeDesign(currentUser),
        };
      }
      case 'getNotificationCounts': {
        if (!currentUser) {
          return {
            loggedIn: false,
            unreadNotifications: 0,
            unreadPrivateMessages: 0,
            faviconBadgeNumber: 0,
            checkedAt: null,
          };
        }

        const { data } = await client.query({
          query: UnreadNotificationCountsQuery,
          fetchPolicy: 'cache-first',
        });
        const counts = data?.unreadNotificationCounts;

        return {
          loggedIn: true,
          unreadNotifications: latestUnreadCount ?? counts?.unreadNotifications ?? 0,
          unreadPrivateMessages: counts?.unreadPrivateMessages ?? 0,
          faviconBadgeNumber: counts?.faviconBadgeNumber ?? 0,
          checkedAt: counts?.checkedAt ?? null,
        };
      }
      case 'getNotifications': {
        if (!currentUser) {
          return { loggedIn: false, notifications: [] };
        }

        const limit = typeof params.limit === 'number' ? Math.min(Math.max(params.limit, 1), 50) : 10;
        const { data } = await client.query({
          query: NotificationsListMultiQuery,
          variables: {
            selector: { userNotifications: { userId: currentUser._id } },
            limit,
            enableTotal: false,
          },
          fetchPolicy: 'cache-first',
        });

        return {
          loggedIn: true,
          notifications: data?.notifications?.results ?? [],
        };
      }
      case 'getTextAsset': {
        const path = typeof params.path === 'string' ? params.path : '';
        if (!path.startsWith('/fooming-shoggoths/lyrics/') || !path.endsWith('.txt')) {
          throw new Error('Invalid text asset path');
        }
        const resp = await fetch(path, { credentials: 'same-origin' });
        if (!resp.ok) {
          throw new Error(`Text asset request failed: ${resp.status}`);
        }
        return await resp.text();
      }
      case 'getKarmaNotifications': {
        if (!currentUser) {
          return {
            loggedIn: false,
            hasNewKarmaChanges: false,
            karmaChanges: null,
          };
        }

        const { data } = await client.query({
          query: homeDesignKarmaChangesQuery,
          variables: { documentId: currentUser._id },
          fetchPolicy: 'cache-first',
        });

        const karmaChanges = data?.user?.result?.karmaChanges ?? null;
        const hasNewKarmaChanges = !!(
          karmaChanges &&
          new Date(currentUser.karmaChangeLastOpened ?? 0) < new Date(karmaChanges.endDate ?? 0) &&
          (
            karmaChanges.posts.length > 0 ||
            karmaChanges.comments.length > 0 ||
            karmaChanges.tagRevisions.length > 0
          )
        );

        return {
          loggedIn: true,
          hasNewKarmaChanges,
          karmaChanges,
        };
      }
      case 'getReadStatuses': {
        if (!currentUser) return {};
        const postIds = params.postIds;
        if (!Array.isArray(postIds)) return {};
        // TODO: Wire up to real read status queries
        const statuses: Record<string, boolean> = {};
        for (const id of postIds) {
          statuses[id] = false;
        }
        return statuses;
      }
      case 'getVoteStatuses': {
        if (!currentUser) return {};
        // TODO: Wire up to real vote status queries
        return {};
      }
      case 'castVote': {
        if (!currentUser) throw new Error('Must be logged in to vote');
        // TODO: Wire up to real vote mutation
        // params: { documentId: string, collectionName: string, voteType: string }
        return { success: false, error: 'Voting not yet implemented' };
      }
      case 'openCustomizePanel': {
        designChat.setIsOpen(true);
        return { success: true };
      }
      case 'navigate': {
        const href = typeof params.href === 'string' ? params.href : null;
        if (!href) {
          throw new Error('Missing href');
        }
        navigate(href, params.replace === true ? { replace: true } : undefined);
        return { success: true };
      }
      case 'revertToNormalHomepage': {
        designChat.setIsOpen(false);
        const url = new URL(window.location.href);
        url.searchParams.delete('theme');
        url.searchParams.set('classicHome', '1');
        window.location.assign(`${url.pathname}${url.search}${url.hash}`);
        return { success: true };
      }
      default:
        throw new Error(`Unknown RPC method: ${method}`);
    }
  }, [currentUser, client, designChat, latestUnreadCount, navigate]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;

      if (event.data?.type === 'resize') {
        return;
      }

      if (!isRpcRequest(event.data)) return;

      const { id, method, params } = event.data;
      handleRpc(method, params ?? {}).then(
        (result) => {
          iframeRef.current?.contentWindow?.postMessage(
            { type: 'rpc-response', id, result },
            '*'
          );
        },
        (err) => {
          iframeRef.current?.contentWindow?.postMessage(
            { type: 'rpc-response', id, error: err instanceof Error ? err.message : String(err) },
            '*'
          );
        }
      );
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [handleRpc]);

  const origin = useOrigin();
  const themeHtml = themeData?.homePageDesignByPublicId?.html;
  const themeSrcdoc = themeHtml ? wrapBodyInSrcdoc(themeHtml, { origin }) : null;
  const latestDesignHtml = myDesignsData?.myHomePageDesigns?.[0]?.html;
  const userLatestSrcdoc = latestDesignHtml ? wrapBodyInSrcdoc(latestDesignHtml, { origin }) : null;
  const defaultSrcdoc = getSandboxedHomePageSrcdoc({ origin });
  const srcdoc = designChat.customSrcdoc ?? (designChat.useDefaultDesign ? defaultSrcdoc : (themeSrcdoc ?? userLatestSrcdoc ?? defaultSrcdoc));

  return (
    <div className={classes.iframeWrap}>
      <iframe
        ref={iframeRef}
        className={classes.iframe}
        sandbox="allow-scripts allow-top-navigation-by-user-activation"
        srcDoc={srcdoc}
      />
      {!designChat.isOpen && (
        <button
          className={classes.customizeButton}
          onClick={() => designChat.setIsOpen(true)}
        >
          Customize
        </button>
      )}
    </div>
  );
}

export default SandboxedHomePage;
