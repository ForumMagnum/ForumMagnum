'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import classNames from 'classnames';
import { AnimatePresence } from 'framer-motion';
import * as api from '../lib/api';
import { ApiError, ConflictError } from '../lib/api';
import type { ContentCardData, NextItemResponse, OffboardCardData, QueueCard } from '../lib/types';
import SwipeCard, { type SwipeDirection } from './SwipeCard';
import ContentCard, { type CheckState } from './ContentCard';
import WrapupCard from './WrapupCard';
import OffboardCard, { type OffboardSelection } from './OffboardCard';
import Composer, { type ComposerResult } from './Composer';
import HotkeyLegend, { type LegendAction } from './HotkeyLegend';
import ContextPanel from './ContextPanel';

const PANEL_OPEN_STORAGE_KEY = 'simplemod_contextPanelOpen';
const USER_ACTION_GRACE_MS = 2000;

type ComposerState =
  | { mode: 'reject'; card: ContentCardData }
  | { mode: 'dm'; card: ContentCardData }
  | { mode: 'offboard'; card: OffboardCardData };

interface Toast {
  text: string;
  kind: 'info' | 'error';
}

interface ActionFlash {
  label: string;
  direction: SwipeDirection;
  nonce: number;
}

interface PendingUserAction {
  label: string;
  timer: number;
}

function cardKey(card: QueueCard): string {
  return card.type === 'content'
    ? `content-${card.user._id}-${card.item.documentId}`
    : `${card.type}-${card.user._id}`;
}

function stampsForCard(card: QueueCard): { left: string; right: string } {
  switch (card.type) {
    case 'content': return { left: 'REJECT…', right: 'APPROVE' };
    case 'offboard': return { left: 'OFFBOARD…', right: 'APPROVE USER' };
    case 'wrapup': return { left: 'SKIP', right: 'APPROVE USER' };
  }
}

function scrollTopCardBody(delta: number) {
  document.querySelector('.swipe-card .card-body')?.scrollBy({ top: delta, behavior: 'smooth' });
}

function isTextEntryTarget(target: HTMLElement | null): boolean {
  if (!target) return false;
  if (target.tagName === 'TEXTAREA' || target.isContentEditable) return true;
  if (target.tagName === 'INPUT') {
    const type = (target as HTMLInputElement).type;
    return type !== 'checkbox' && type !== 'radio' && type !== 'button';
  }
  return false;
}

const ModQueueApp = () => {
  const router = useRouter();
  const [cards, setCards] = useState<QueueCard[] | null>(null);
  const [moderatorName, setModeratorName] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [exitDirection, setExitDirection] = useState<SwipeDirection>(1);
  const [exitingKey, setExitingKey] = useState<string | null>(null);
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [actionFlash, setActionFlash] = useState<ActionFlash | null>(null);
  const [pendingUserAction, setPendingUserAction] = useState<PendingUserAction | null>(null);
  const [decidedCount, setDecidedCount] = useState(0);
  const [offboardSelection, setOffboardSelection] = useState<OffboardSelection>({ selectedIds: [], removePermissions: true });
  const [panelOpen, setPanelOpen] = useState(false);
  const [checkState, setCheckState] = useState<CheckState>(null);
  const [checkNonce, setCheckNonce] = useState(0);
  const checkAttemptedRef = useRef<Set<string>>(new Set());
  const flashNonceRef = useRef(0);

  const topCard = cards?.[0] ?? null;
  const topKey = topCard ? cardKey(topCard) : null;

  useEffect(() => {
    setPanelOpen(localStorage.getItem(PANEL_OPEN_STORAGE_KEY) === 'true');
  }, []);

  const togglePanel = useCallback(() => {
    setPanelOpen(previous => {
      localStorage.setItem(PANEL_OPEN_STORAGE_KEY, String(!previous));
      return !previous;
    });
  }, []);

  const loadQueue = useCallback(async () => {
    try {
      const response = await api.fetchQueue();
      setCards(response.cards);
      setModeratorName(response.moderator.displayName);
      setLoadError(null);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        router.push('/login');
        return;
      }
      setLoadError(error instanceof Error ? error.message : String(error));
    }
  }, [router]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    if (topCard?.type === 'offboard') {
      setOffboardSelection({
        selectedIds: topCard.items.map(item => item.documentId),
        removePermissions: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topKey]);

  const topItemDocumentId = topCard?.type === 'content' ? topCard.item.documentId : null;
  const topItemCollectionName = topCard?.type === 'content' ? topCard.item.collectionName : null;
  const topItemHasScore = topCard?.type === 'content' ? topCard.item.pangramScore !== null : true;

  useEffect(() => {
    if (!topItemDocumentId || !topItemCollectionName || topItemHasScore) {
      setCheckState(null);
      return;
    }
    if (checkAttemptedRef.current.has(topItemDocumentId)) {
      setCheckState('failed');
      return;
    }
    checkAttemptedRef.current.add(topItemDocumentId);
    setCheckState('running');
    api.runCheck({ collectionName: topItemCollectionName, documentId: topItemDocumentId })
      .then(result => {
        setCheckState(result.pangramScore === null ? 'failed' : null);
        setCards(previous => previous?.map(entry =>
          entry.type === 'content' && entry.item.documentId === topItemDocumentId
            ? {
                ...entry,
                item: {
                  ...entry.item,
                  pangramScore: result.pangramScore,
                  pangramFractionAi: result.pangramFractionAi,
                  pangramPrediction: result.pangramPrediction,
                  pangramWindowScores: result.pangramWindowScores,
                },
              }
            : entry
        ) ?? previous);
      })
      .catch(() => setCheckState('failed'));
  }, [topItemDocumentId, topItemCollectionName, topItemHasScore, checkNonce]);

  const retryCheck = useCallback(() => {
    if (topItemDocumentId) {
      checkAttemptedRef.current.delete(topItemDocumentId);
      setCheckNonce(nonce => nonce + 1);
    }
  }, [topItemDocumentId]);

  useEffect(() => {
    if (!toast || toast.kind === 'error') return;
    const timeout = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const handleActionError = useCallback(async (error: unknown) => {
    if (error instanceof ConflictError) {
      setToast({ text: 'Someone else got there first — queue reloaded', kind: 'info' });
    } else {
      setToast({ text: error instanceof Error ? error.message : String(error), kind: 'error' });
    }
    await loadQueue();
  }, [loadQueue]);

  const flashAction = useCallback((label: string, direction: SwipeDirection) => {
    flashNonceRef.current += 1;
    setActionFlash({ label, direction, nonce: flashNonceRef.current });
  }, []);

  const runAction = useCallback(async (direction: SwipeDirection, flashLabel: string, action: () => Promise<void>) => {
    if (busy || !topKey) return;
    setBusy(true);
    setExitDirection(direction);
    setExitingKey(topKey);
    flashAction(flashLabel, direction);
    try {
      await action();
    } catch (error) {
      await handleActionError(error);
    } finally {
      setExitingKey(null);
      setBusy(false);
    }
  }, [busy, topKey, flashAction, handleActionError]);

  const advanceContentCard = useCallback((card: ContentCardData, result: NextItemResponse) => {
    setDecidedCount(count => count + 1);
    setCards(previous => {
      if (!previous) return previous;
      const key = cardKey(card);
      if (result.nextItem) {
        const nextItem = result.nextItem;
        return previous.map(entry => cardKey(entry) === key
          ? { ...card, item: nextItem, remainingCount: result.remainingCount }
          : entry
        );
      }
      return previous.filter(entry => cardKey(entry) !== key);
    });
  }, []);

  const removeUserCards = useCallback((userId: string) => {
    setDecidedCount(count => count + 1);
    setCards(previous => previous?.filter(entry => entry.user._id !== userId) ?? previous);
  }, []);

  const approveTop = useCallback((card: ContentCardData) =>
    runAction(1, 'Approved', async () => {
      const result = await api.approveItem({
        userId: card.user._id,
        collectionName: card.item.collectionName,
        documentId: card.item.documentId,
      });
      advanceContentCard(card, result);
    }), [runAction, advanceContentCard]);

  const rejectTop = useCallback((card: ContentCardData, rejectedReason: string) =>
    runAction(-1, 'Rejected', async () => {
      const result = await api.rejectItem({
        userId: card.user._id,
        collectionName: card.item.collectionName,
        documentId: card.item.documentId,
        rejectedReason,
      });
      advanceContentCard(card, result);
    }), [runAction, advanceContentCard]);

  const approveAndDmTop = useCallback((card: ContentCardData, messageHtml: string) =>
    runAction(1, 'Approved + DM sent', async () => {
      const result = await api.approveItemAndDm({
        userId: card.user._id,
        collectionName: card.item.collectionName,
        documentId: card.item.documentId,
        messageHtml,
      });
      advanceContentCard(card, result);
    }), [runAction, advanceContentCard]);

  const offboardTop = useCallback((card: OffboardCardData, selection: OffboardSelection, result: ComposerResult) =>
    runAction(-1, 'Offboarded', async () => {
      const rejectedReason = result.rejectedReason;
      const selectedItems = card.items.filter(item => selection.selectedIds.includes(item.documentId));
      await api.offboardUser({
        userId: card.user._id,
        rejections: rejectedReason
          ? selectedItems.map(item => ({
              collectionName: item.collectionName,
              documentId: item.documentId,
              rejectedReason,
            }))
          : [],
        removePermissions: selection.removePermissions,
        messageHtml: result.messageHtml,
      });
      removeUserCards(card.user._id);
    }), [runAction, removeUserCards]);

  const cancelPendingUserAction = useCallback(() => {
    setPendingUserAction(previous => {
      if (previous) {
        clearTimeout(previous.timer);
      }
      return null;
    });
  }, []);

  // U (approve user) and S (skip user) are single-keystroke, user-level
  // actions, so they get a short cancellable grace period instead of firing
  // instantly.
  const scheduleUserAction = useCallback((label: string, run: () => void) => {
    cancelPendingUserAction();
    const timer = window.setTimeout(() => {
      setPendingUserAction(null);
      run();
    }, USER_ACTION_GRACE_MS);
    setPendingUserAction({ label, timer });
  }, [cancelPendingUserAction]);

  const approveUserTop = useCallback((card: QueueCard) =>
    scheduleUserAction(`Approving ${card.user.displayName} as a user`, () => {
      void runAction(1, 'User approved', async () => {
        await api.approveUser(card.user._id);
        removeUserCards(card.user._id);
      });
    }), [scheduleUserAction, runAction, removeUserCards]);

  const skipTop = useCallback((card: QueueCard) =>
    scheduleUserAction(`Removing ${card.user.displayName} from the queue`, () => {
      void runAction(-1, 'Skipped', async () => {
        await api.skipUser(card.user._id);
        removeUserCards(card.user._id);
      });
    }), [scheduleUserAction, runAction, removeUserCards]);

  const handleSwipe = useCallback((direction: SwipeDirection) => {
    if (!topCard || busy || composer || pendingUserAction) return;
    if (direction === 1) {
      if (topCard.type === 'content') {
        void approveTop(topCard);
      } else {
        approveUserTop(topCard);
      }
    } else {
      if (topCard.type === 'content') {
        setComposer({ mode: 'reject', card: topCard });
      } else if (topCard.type === 'offboard') {
        setComposer({ mode: 'offboard', card: topCard });
      } else {
        skipTop(topCard);
      }
    }
  }, [topCard, busy, composer, pendingUserAction, approveTop, approveUserTop, skipTop]);

  const handleLegendAction = useCallback((action: LegendAction) => {
    if (!topCard) return;
    switch (action) {
      case 'approve':
        if (topCard.type === 'content') handleSwipe(1);
        break;
      case 'rejectIntent':
        handleSwipe(-1);
        break;
      case 'dm':
        if (topCard.type === 'content' && !busy && !composer && !pendingUserAction) {
          setComposer({ mode: 'dm', card: topCard });
        }
        break;
      case 'approveUser':
        if (!busy && !composer && !pendingUserAction) approveUserTop(topCard);
        break;
      case 'skip':
        if (!busy && !composer && !pendingUserAction) skipTop(topCard);
        break;
      case 'context':
        togglePanel();
        break;
    }
  }, [topCard, busy, composer, pendingUserAction, handleSwipe, approveUserTop, skipTop, togglePanel]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (composer) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTextEntryTarget(event.target as HTMLElement | null)) return;

      if (pendingUserAction) {
        if (event.key.toLowerCase() === 'z' || event.key === 'Escape') {
          event.preventDefault();
          cancelPendingUserAction();
        }
        return;
      }

      if (event.key === 'Tab') {
        event.preventDefault();
        togglePanel();
        return;
      }
      if (event.key === 'Escape' && panelOpen) {
        event.preventDefault();
        togglePanel();
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          scrollTopCardBody(120);
          return;
        case 'ArrowUp':
          event.preventDefault();
          scrollTopCardBody(-120);
          return;
        case 'PageDown':
        case ' ':
          event.preventDefault();
          scrollTopCardBody(480);
          return;
        case 'PageUp':
          event.preventDefault();
          scrollTopCardBody(-480);
          return;
      }

      if (busy || !topCard) return;
      switch (event.key.toLowerCase()) {
        case 'arrowright':
        case 'a':
          event.preventDefault();
          handleSwipe(1);
          break;
        case 'arrowleft':
        case 'r':
          event.preventDefault();
          handleSwipe(-1);
          break;
        case 'd':
          if (topCard.type === 'content') {
            event.preventDefault();
            setComposer({ mode: 'dm', card: topCard });
          }
          break;
        case 's':
          event.preventDefault();
          skipTop(topCard);
          break;
        case 'u':
          event.preventDefault();
          approveUserTop(topCard);
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [composer, busy, topCard, panelOpen, pendingUserAction, handleSwipe, skipTop, approveUserTop, togglePanel, cancelPendingUserAction]);

  const counts = useMemo(() => {
    const summed = (cards ?? []).reduce((total, card) => {
      if (card.type === 'content') return total + card.remainingCount;
      if (card.type === 'offboard') return total + Math.max(card.items.length, 1);
      return total + 1;
    }, 0);
    const offboard = cards?.filter(card => card.type === 'offboard').length ?? 0;
    return { users: cards?.length ?? 0, items: summed, offboard };
  }, [cards]);

  const handleComposerSubmit = (result: ComposerResult) => {
    if (!composer) return;
    const activeComposer = composer;
    setComposer(null);
    if (activeComposer.mode === 'reject' && result.rejectedReason) {
      void rejectTop(activeComposer.card, result.rejectedReason);
    } else if (activeComposer.mode === 'dm' && result.messageHtml) {
      void approveAndDmTop(activeComposer.card, result.messageHtml);
    } else if (activeComposer.mode === 'offboard') {
      void offboardTop(activeComposer.card, offboardSelection, result);
    }
  };

  if (loadError) {
    return (
      <main className="queue-shell">
        <div className="queue-message">
          <h2>Couldn&apos;t load the queue</h2>
          <p>{loadError}</p>
          <button className="button button-primary" onClick={() => void loadQueue()}>Retry</button>
        </div>
      </main>
    );
  }

  if (!cards) {
    return (
      <main className="queue-shell">
        <header className="queue-hud">
          <span className="queue-hud-title">SimpleMod</span>
          <span className="queue-hud-counts"><span>loading queue…</span></span>
        </header>
        <div className="stage-row">
          <div className="card-stage">
            <div className="skeleton-card">
              <div className="skeleton-line skeleton-line-half" />
              <div className="skeleton-line skeleton-line-wide" />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
              <div className="skeleton-line skeleton-line-half" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  const stamps = topCard ? stampsForCard(topCard) : null;
  const showTopCard = topCard && stamps && topKey !== exitingKey;

  return (
    <main className="queue-shell">
      <header className="queue-hud">
        <span className="queue-hud-title">SimpleMod</span>
        <span className="queue-hud-counts">
          {counts.items > 0 && <span>{counts.items} item{counts.items === 1 ? '' : 's'} · {counts.users} user{counts.users === 1 ? '' : 's'}</span>}
          {counts.offboard > 0 && <span className="hud-offboard">{counts.offboard} offboard</span>}
          {cards.length === 0 && <span>queue clear</span>}
          {decidedCount > 0 && <span className="hud-decided">✓ {decidedCount} this session</span>}
        </span>
        <button type="button" className="hud-context-toggle" onClick={togglePanel}>
          {panelOpen ? 'Hide context' : 'Context'} <kbd>⇥</kbd>
        </button>
        <span className="queue-hud-moderator">{moderatorName}</span>
      </header>
      <div className={classNames('stage-row', panelOpen && topCard && 'stage-row-with-panel')}>
        {panelOpen && topCard && (
          <>
            <div className="context-scrim" onClick={togglePanel} />
            <ContextPanel
              user={topCard.user}
              currentDocumentId={topCard.type === 'content' ? topCard.item.documentId : null}
              onClose={togglePanel}
            />
          </>
        )}
        <div className="card-stage">
          {cards.slice(1, 3).map((card, index) => (
            <div
              key={cardKey(card)}
              className="peek-card"
              style={{ transform: `scale(${0.96 - index * 0.03}) translateY(${(index + 1) * 14}px)` }}
            />
          ))}
          <AnimatePresence custom={exitDirection} initial={false}>
            {showTopCard && (
              <SwipeCard
                key={topKey}
                onSwipe={handleSwipe}
                disabled={busy || !!composer || !!pendingUserAction}
                busy={busy}
                leftStamp={stamps.left}
                rightStamp={stamps.right}
              >
                {topCard.type === 'content' && (
                  <ContentCard card={topCard} checkState={checkState} onRetryCheck={retryCheck} />
                )}
                {topCard.type === 'wrapup' && <WrapupCard card={topCard} />}
                {topCard.type === 'offboard' && (
                  <OffboardCard
                    card={topCard}
                    selection={offboardSelection}
                    onChangeSelection={setOffboardSelection}
                  />
                )}
              </SwipeCard>
            )}
          </AnimatePresence>
          {actionFlash && (
            <div
              key={actionFlash.nonce}
              className={classNames('action-flash', actionFlash.direction === 1 ? 'action-flash-right' : 'action-flash-left')}
              onAnimationEnd={() => setActionFlash(null)}
            >
              {actionFlash.label}
            </div>
          )}
          {cards.length === 0 && (
            <div className="queue-message queue-done">
              <h2>All clear 🎉</h2>
              <p>No users waiting for review.</p>
              <button className="button button-secondary" onClick={() => void loadQueue()}>Check again</button>
            </div>
          )}
        </div>
      </div>
      {topCard && <HotkeyLegend card={topCard} onAction={handleLegendAction} />}
      {composer && (
        <Composer
          mode={composer.mode}
          draftKey={
            composer.mode === 'offboard'
              ? `offboard-${composer.card.user._id}`
              : `${composer.mode}-${composer.card.item.documentId}`
          }
          title={
            composer.mode === 'reject'
              ? `Reject ${composer.card.item.collectionName === 'Posts' ? `"${composer.card.item.title}"` : 'this comment'}`
              : composer.mode === 'dm'
                ? `Approve and message ${composer.card.user.displayName}`
                : `Offboard ${composer.card.user.displayName}`
          }
          rejectionCount={composer.mode === 'offboard' ? offboardSelection.selectedIds.length : 1}
          submitLabel={
            composer.mode === 'reject' ? 'Reject'
              : composer.mode === 'dm' ? 'Approve & send'
                : 'Offboard'
          }
          onSubmit={handleComposerSubmit}
          onCancel={() => setComposer(null)}
        />
      )}
      {pendingUserAction && (
        <div className="pending-action">
          <span>{pendingUserAction.label}…</span>
          <button type="button" className="button button-secondary" onClick={cancelPendingUserAction}>
            Cancel <kbd>Z</kbd>
          </button>
        </div>
      )}
      {toast && (
        <div className={classNames('toast', toast.kind === 'error' && 'toast-error')}>
          {toast.text}
          {toast.kind === 'error' && (
            <button type="button" className="toast-close" onClick={() => setToast(null)} aria-label="Dismiss">✕</button>
          )}
        </div>
      )}
    </main>
  );
};

export default ModQueueApp;
