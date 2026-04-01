'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { getSandboxedHomePageSrcdoc, wrapBodyInSrcdoc } from './SandboxedHomePageSrcdoc';
import { useCurrentUser } from '../common/withUser';
import { useHomeDesignChat } from './HomeDesignChatContext';
import { useLocation } from '@/lib/routeUtil';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { useApolloClient } from '@apollo/client/react';
import HomeDesignChatPanel from './HomeDesignChatPanel';
import DeferRender from './DeferRender';
import { UnreadNotificationCountsQuery, useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { NotificationsListMultiQuery } from '../notifications/NotificationsListMultiQuery';

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
    width: '100%',
    position: 'relative',
  },
  iframe: {
    width: '100%',
    border: 'none',
    // Height is set dynamically via postMessage from the iframe content
    minHeight: 500,
  },
  customizeButton: {
    position: 'fixed',
    bottom: 24,
    right: 80,
    zIndex: theme.zIndexes.lwPopper - 1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    background: '#5f9b65',
    color: '#fff',
    border: 'none',
    borderRadius: 24,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    '&:hover': {
      background: '#4e8a54',
    },
  },
}));

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

const SandboxedHomePage = () => {
  const classes = useStyles(styles);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const currentUser = useCurrentUser();
  const designChat = useHomeDesignChat();
  const { query } = useLocation();
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
      default:
        throw new Error(`Unknown RPC method: ${method}`);
    }
  }, [currentUser, client, latestUnreadCount]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;

      // Handle iframe content height updates
      if (event.data?.type === 'resize' && typeof event.data.height === 'number') {
        if (iframeRef.current) {
          iframeRef.current.style.height = `${event.data.height}px`;
        }
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

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const themeHtml = themeData?.homePageDesignByPublicId?.html;
  const themeSrcdoc = themeHtml ? wrapBodyInSrcdoc(themeHtml, { origin }) : null;
  const latestDesignHtml = myDesignsData?.myHomePageDesigns?.[0]?.html;
  const userLatestSrcdoc = latestDesignHtml ? wrapBodyInSrcdoc(latestDesignHtml, { origin }) : null;
  const defaultSrcdoc = getSandboxedHomePageSrcdoc({ origin });
  const srcdoc = designChat.customSrcdoc ?? themeSrcdoc ?? userLatestSrcdoc ?? defaultSrcdoc;

  return (
    <DeferRender ssr={false}>
      <div className={classes.root}>
        <iframe
          ref={iframeRef}
          className={classes.iframe}
          sandbox="allow-scripts allow-top-navigation-by-user-activation"
          srcDoc={srcdoc}
        />
      </div>
      {!designChat.isOpen && (
        <button
          className={classes.customizeButton}
          onClick={() => designChat.setIsOpen(true)}
        >
          ✨ Customize
        </button>
      )}
      <HomeDesignChatPanel />
    </DeferRender>
  );
};

export default SandboxedHomePage;
