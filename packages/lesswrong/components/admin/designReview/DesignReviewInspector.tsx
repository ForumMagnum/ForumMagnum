'use client';

import React, { useState, useCallback } from 'react';
import { useQuery } from '@/lib/crud/useQuery';
import { useMutation } from '@apollo/client/react';
import { useCurrentUser } from '../../common/withUser';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';
import ErrorAccessDenied from '../../common/ErrorAccessDenied';
import { defineStyles, useStyles } from '../../hooks/useStyles';
import { wrapBodyInSrcdoc } from '../../common/SandboxedHomePageSrcdoc';
import { adminHomePageDesignsQuery, setHomePageDesignVerifiedMutation } from './designReviewQueries';
import { MARKETPLACE_POST_ID } from '@/lib/collections/homePageDesigns/constants';
import { Link } from '@/lib/reactRouterWrapper';
import classNames from 'classnames';
import type { AdminHomePageDesignsQuery } from '@/lib/generated/gql-codegen/graphql';

type Design = AdminHomePageDesignsQuery['adminHomePageDesigns'][number];

type FilterTab = 'needsReview' | 'failed' | 'verified' | 'all';

function matchesFilter(design: Design, filter: FilterTab): boolean {
  switch (filter) {
    case 'needsReview':
      return design.autoReviewPassed === true && !design.verified;
    case 'failed':
      return design.autoReviewPassed === false;
    case 'verified':
      return design.verified;
    case 'all':
      return true;
  }
}

function getStatusIcon(design: Design): string {
  if (design.verified) return '\u2705';
  if (design.autoReviewPassed === false) return '\u274c';
  if (design.autoReviewPassed === true) return '\u23f3';
  return '\u2022';
}

const styles = defineStyles('DesignReviewInspector', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    height: 'calc(100vh - 64px)',
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  sidebar: {
    width: 320,
    flexShrink: 0,
    borderRight: theme.palette.greyBorder('1px', 0.15),
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '16px 16px 0',
    flexShrink: 0,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: 700,
    margin: '0 0 12px',
  },
  tabs: {
    display: 'flex',
    gap: 2,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tab: {
    padding: '4px 10px',
    fontSize: 11,
    fontFamily: theme.palette.fonts.sansSerifStack,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    borderRadius: 4,
    color: theme.palette.greyAlpha(0.6),
    '&:hover': {
      background: theme.palette.greyAlpha(0.08),
    },
  },
  tabActive: {
    background: theme.palette.greyAlpha(0.12),
    color: theme.palette.text.normal,
    fontWeight: 600,
  },
  listContainer: {
    flex: 1,
    overflowY: 'auto',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    cursor: 'pointer',
    borderBottom: theme.palette.greyBorder('1px', 0.08),
    '&:hover': {
      background: theme.palette.greyAlpha(0.04),
    },
  },
  listItemSelected: {
    background: theme.palette.greyAlpha(0.08),
  },
  listItemIcon: {
    fontSize: 14,
    flexShrink: 0,
  },
  listItemText: {
    flex: 1,
    minWidth: 0,
  },
  listItemTitle: {
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  listItemMeta: {
    fontSize: 11,
    color: theme.palette.greyAlpha(0.5),
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  emptyMain: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.greyAlpha(0.4),
    fontSize: 14,
  },
  detailHeader: {
    padding: 16,
    borderBottom: theme.palette.greyBorder('1px', 0.12),
    flexShrink: 0,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
  },
  detailMeta: {
    fontSize: 12,
    color: theme.palette.greyAlpha(0.6),
    marginTop: 4,
  },
  metaLink: {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    '&:hover': { textDecoration: 'underline' },
  },
  detailBadges: {
    display: 'flex',
    gap: 6,
    marginTop: 8,
  },
  pill: {
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 10,
    color: theme.palette.contrastText,
  },
  pillPending: {
    background: theme.palette.greyAlpha(0.4),
  },
  pillPassed: {
    background: theme.palette.primary.main,
  },
  pillFailed: {
    background: theme.palette.error.main,
  },
  pillVerified: {
    background: theme.palette.link.primaryDim,
  },
  reviewMessage: {
    fontSize: 12,
    color: theme.palette.greyAlpha(0.7),
    background: theme.palette.greyAlpha(0.05),
    padding: '8px 12px',
    borderRadius: 4,
    marginTop: 8,
    whiteSpace: 'pre-wrap',
  },
  contentArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  contentTabs: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    borderBottom: theme.palette.greyBorder('1px', 0.12),
    flexShrink: 0,
  },
  contentTab: {
    padding: '8px 16px',
    fontSize: 12,
    fontWeight: 500,
    fontFamily: theme.palette.fonts.sansSerifStack,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: theme.palette.greyAlpha(0.5),
    borderBottom: '2px solid transparent',
    '&:hover': {
      color: theme.palette.text.normal,
    },
  },
  contentTabActive: {
    color: theme.palette.text.normal,
    borderBottomColor: theme.palette.primary.main,
  },
  contentTabsSpacer: {
    flex: 1,
  },
  rpcToggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginRight: 16,
    cursor: 'pointer',
    userSelect: 'none',
  },
  rpcToggleText: {
    fontSize: 12,
    fontWeight: 500,
    color: theme.palette.text.normal,
  },
  rpcToggleInput: {
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none',
  },
  rpcToggleTrack: {
    position: 'relative',
    width: 36,
    height: 20,
    borderRadius: 999,
    background: theme.palette.greyAlpha(0.25),
    transition: 'background 150ms ease',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 2,
      left: 2,
      width: 16,
      height: 16,
      borderRadius: '50%',
      background: theme.palette.panelBackground.default,
      boxShadow: `0 1px 3px ${theme.palette.boxShadowColor(0.25)}`,
      transition: 'transform 150ms ease',
    },
  },
  rpcToggleTrackChecked: {
    background: theme.palette.primary.main,
    '&::after': {
      transform: 'translateX(16px)',
    },
  },
  previewFrame: {
    flex: 1,
    width: '100%',
    border: 'none',
  },
  sourceContainer: {
    flex: 1,
    overflow: 'auto',
    padding: 16,
  },
  sourceCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: 0,
    lineHeight: 1.5,
  },
  actionBar: {
    padding: 12,
    borderTop: theme.palette.greyBorder('1px', 0.12),
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexShrink: 0,
  },
  actionButton: {
    fontSize: 12,
    fontWeight: 600,
    padding: '6px 16px',
    borderRadius: 4,
    border: 'none',
    cursor: 'pointer',
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.contrastText,
  },
  verifyButton: {
    background: theme.palette.primary.main,
    '&:hover': { background: theme.palette.primary.dark },
  },
  unverifyButton: {
    background: theme.palette.warning.main,
    '&:hover': { background: theme.palette.error.dark },
  },
  actionSpacer: {
    flex: 1,
  },
  commentLink: {
    fontSize: 12,
    color: theme.palette.primary.main,
    textDecoration: 'none',
    '&:hover': { textDecoration: 'underline' },
  },
}));

const DesignReviewInspector = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [filter, setFilter] = useState<FilterTab>('needsReview');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contentView, setContentView] = useState<'preview' | 'source'>('preview');
  const [rpcEnabled, setRpcEnabled] = useState(false);

  const { data, loading, refetch } = useQuery(adminHomePageDesignsQuery);
  const [mutate] = useMutation(setHomePageDesignVerifiedMutation);

  const handleVerify = useCallback(async (designId: string, verified: boolean) => {
    await mutate({ variables: { designId, verified } });
    void refetch();
  }, [mutate, refetch]);

  if (!currentUser || !userIsAdmin(currentUser)) {
    return <ErrorAccessDenied />;
  }

  const designs = data?.adminHomePageDesigns ?? [];
  const filtered = designs.filter(d => matchesFilter(d, filter));
  const selected = selectedId ? designs.find(d => d._id === selectedId) ?? null : null;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const filterLabels: Record<FilterTab, string> = {
    needsReview: `Review (${designs.filter(d => matchesFilter(d, 'needsReview')).length})`,
    failed: `Failed (${designs.filter(d => matchesFilter(d, 'failed')).length})`,
    verified: `Verified (${designs.filter(d => matchesFilter(d, 'verified')).length})`,
    all: `All (${designs.length})`,
  };

  return (
    <div className={classes.root}>
      <div className={classes.sidebar}>
        <div className={classes.sidebarHeader}>
          <h2 className={classes.sidebarTitle}>Design Review</h2>
          <div className={classes.tabs}>
            {(Object.keys(filterLabels) as FilterTab[]).map(tab => (
              <button
                key={tab}
                className={classNames(classes.tab, filter === tab && classes.tabActive)}
                onClick={() => setFilter(tab)}
              >
                {filterLabels[tab]}
              </button>
            ))}
          </div>
        </div>
        <div className={classes.listContainer}>
          {loading && <div className={classes.emptyMain}>Loading...</div>}
          {filtered.map(design => (
            <div
              key={design._id}
              className={classNames(classes.listItem, selectedId === design._id && classes.listItemSelected)}
              onClick={() => { setSelectedId(design._id); setContentView('preview'); }}
            >
              <span className={classes.listItemIcon}>{getStatusIcon(design)}</span>
              <div className={classes.listItemText}>
                <div className={classes.listItemTitle}>{design.title}</div>
                <div className={classes.listItemMeta}>{design.ownerDisplayName}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={classes.main}>
        {!selected ? (
          <div className={classes.emptyMain}>Select a design to inspect</div>
        ) : (
          <>
            <div className={classes.detailHeader}>
              <h2 className={classes.detailTitle}>{selected.title}</h2>
              <div className={classes.detailMeta}>
                by <Link to={`/users/${selected.ownerSlug}`} className={classes.metaLink}>{selected.ownerDisplayName}</Link>
                {' · '}{new Date(selected.createdAt).toLocaleDateString()}
                {' · '}{selected.source}
                {selected.modelName && ` · ${selected.modelName}`}
                {' · '}<code>{selected.publicId}</code>
              </div>
              <div className={classes.detailBadges}>
                <span className={classNames(classes.pill,
                  selected.autoReviewPassed === null ? classes.pillPending :
                  selected.autoReviewPassed ? classes.pillPassed : classes.pillFailed
                )}>
                  {selected.autoReviewPassed === null ? 'Pending' : selected.autoReviewPassed ? 'Auto-Review Passed' : 'Auto-Review Failed'}
                </span>
                {selected.verified && (
                  <span className={classNames(classes.pill, classes.pillVerified)}>Verified</span>
                )}
              </div>
              {selected.autoReviewPassed === false && selected.autoReviewMessage && (
                <div className={classes.reviewMessage}>{selected.autoReviewMessage}</div>
              )}
            </div>

            <div className={classes.contentTabs}>
              <button
                className={classNames(classes.contentTab, contentView === 'preview' && classes.contentTabActive)}
                onClick={() => setContentView('preview')}
              >
                Preview
              </button>
              <button
                className={classNames(classes.contentTab, contentView === 'source' && classes.contentTabActive)}
                onClick={() => setContentView('source')}
              >
                Source
              </button>
              <div className={classes.contentTabsSpacer} />
              <label className={classes.rpcToggleLabel}>
                <span className={classes.rpcToggleText}>Enable RPC</span>
                <input
                  type="checkbox"
                  className={classes.rpcToggleInput}
                  checked={rpcEnabled}
                  onChange={(event) => setRpcEnabled(event.target.checked)}
                />
                <span
                  className={classNames(
                    classes.rpcToggleTrack,
                    rpcEnabled && classes.rpcToggleTrackChecked,
                  )}
                  aria-hidden
                />
              </label>
            </div>

            <div className={classes.contentArea}>
              {contentView === 'preview' ? (
                <iframe
                  key={`${selected._id}-${rpcEnabled ? 'rpc' : 'no-rpc'}`}
                  className={classes.previewFrame}
                  srcDoc={wrapBodyInSrcdoc(selected.html, { origin, omitRpcBridge: !rpcEnabled })}
                  sandbox="allow-scripts"
                />
              ) : (
                <div className={classes.sourceContainer}>
                  <pre className={classes.sourceCode}>{selected.html}</pre>
                </div>
              )}
            </div>

            <div className={classes.actionBar}>
              {!selected.verified ? (
                <button
                  className={classNames(classes.actionButton, classes.verifyButton)}
                  onClick={() => handleVerify(selected._id, true)}
                >
                  Verify
                </button>
              ) : (
                <button
                  className={classNames(classes.actionButton, classes.unverifyButton)}
                  onClick={() => handleVerify(selected._id, false)}
                >
                  Unverify
                </button>
              )}
              <div className={classes.actionSpacer} />
              {selected.commentId && (
                <Link to={`/posts/${MARKETPLACE_POST_ID}#${selected.commentId}`} className={classes.commentLink} target="_blank" rel="noopener noreferrer">
                  View marketplace comment
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DesignReviewInspector;
