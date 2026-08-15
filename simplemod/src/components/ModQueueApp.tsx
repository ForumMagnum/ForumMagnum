'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import * as api from '../lib/api';
import { ApiError, ConflictError } from '../lib/api';
import type { ContentCardData, NextItemResponse, OffboardCardData, QueueCard } from '../lib/types';
import SwipeCard, { type SwipeDirection } from './SwipeCard';
import ContentCard from './ContentCard';
import WrapupCard from './WrapupCard';
import OffboardCard, { type OffboardSelection } from './OffboardCard';
import Composer, { type ComposerResult } from './Composer';
import HotkeyLegend from './HotkeyLegend';

type ComposerState =
  | { mode: 'reject'; card: ContentCardData }
  | { mode: 'dm'; card: ContentCardData }
  | { mode: 'offboard'; card: OffboardCardData };

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

const ModQueueApp = () => {
  const router = useRouter();
  const [cards, setCards] = useState<QueueCard[] | null>(null);
  const [moderatorName, setModeratorName] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [exitDirection, setExitDirection] = useState<SwipeDirection>(1);
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [offboardSelection, setOffboardSelection] = useState<OffboardSelection>({ selectedIds: [], removePermissions: true });

  const topCard = cards?.[0] ?? null;
  const topKey = topCard ? cardKey(topCard) : null;

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

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const handleActionError = useCallback(async (error: unknown) => {
    if (error instanceof ConflictError) {
      setToast('Someone else got there first — queue reloaded');
    } else {
      setToast(error instanceof Error ? error.message : String(error));
    }
    await loadQueue();
  }, [loadQueue]);

  const runAction = useCallback(async (direction: SwipeDirection, action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setExitDirection(direction);
    try {
      await action();
    } catch (error) {
      await handleActionError(error);
    } finally {
      setBusy(false);
    }
  }, [busy, handleActionError]);

  const advanceContentCard = useCallback((card: ContentCardData, result: NextItemResponse) => {
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
    setCards(previous => previous?.filter(entry => entry.user._id !== userId) ?? previous);
  }, []);

  const approveTop = useCallback((card: ContentCardData) =>
    runAction(1, async () => {
      const result = await api.approveItem({
        userId: card.user._id,
        collectionName: card.item.collectionName,
        documentId: card.item.documentId,
      });
      advanceContentCard(card, result);
    }), [runAction, advanceContentCard]);

  const rejectTop = useCallback((card: ContentCardData, rejectedReason: string) =>
    runAction(-1, async () => {
      const result = await api.rejectItem({
        userId: card.user._id,
        collectionName: card.item.collectionName,
        documentId: card.item.documentId,
        rejectedReason,
      });
      advanceContentCard(card, result);
    }), [runAction, advanceContentCard]);

  const approveAndDmTop = useCallback((card: ContentCardData, messageHtml: string) =>
    runAction(1, async () => {
      const result = await api.approveItemAndDm({
        userId: card.user._id,
        collectionName: card.item.collectionName,
        documentId: card.item.documentId,
        messageHtml,
      });
      advanceContentCard(card, result);
    }), [runAction, advanceContentCard]);

  const approveUserTop = useCallback((card: QueueCard) =>
    runAction(1, async () => {
      await api.approveUser(card.user._id);
      removeUserCards(card.user._id);
    }), [runAction, removeUserCards]);

  const skipTop = useCallback((card: QueueCard) =>
    runAction(-1, async () => {
      await api.skipUser(card.user._id);
      removeUserCards(card.user._id);
    }), [runAction, removeUserCards]);

  const offboardTop = useCallback((card: OffboardCardData, selection: OffboardSelection, result: ComposerResult) =>
    runAction(-1, async () => {
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

  const handleSwipe = useCallback((direction: SwipeDirection) => {
    if (!topCard || busy || composer) return;
    if (direction === 1) {
      if (topCard.type === 'content') {
        void approveTop(topCard);
      } else {
        void approveUserTop(topCard);
      }
    } else {
      if (topCard.type === 'content') {
        setComposer({ mode: 'reject', card: topCard });
      } else if (topCard.type === 'offboard') {
        setComposer({ mode: 'offboard', card: topCard });
      } else {
        void skipTop(topCard);
      }
    }
  }, [topCard, busy, composer, approveTop, approveUserTop, skipTop]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (composer || busy || !topCard) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
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
          void skipTop(topCard);
          break;
        case 'u':
          event.preventDefault();
          void approveUserTop(topCard);
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [composer, busy, topCard, handleSwipe, skipTop, approveUserTop]);

  const counts = useMemo(() => {
    const content = cards?.filter(card => card.type === 'content').length ?? 0;
    const offboard = cards?.filter(card => card.type === 'offboard').length ?? 0;
    const wrapup = cards?.filter(card => card.type === 'wrapup').length ?? 0;
    return { content, offboard, wrapup };
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
        <div className="queue-message">Loading queue…</div>
      </main>
    );
  }

  const stamps = topCard ? stampsForCard(topCard) : null;

  return (
    <main className="queue-shell">
      <header className="queue-hud">
        <span className="queue-hud-title">SimpleMod</span>
        <span className="queue-hud-counts">
          {counts.content > 0 && <span>{counts.content} content</span>}
          {counts.offboard > 0 && <span className="hud-offboard">{counts.offboard} offboard</span>}
          {counts.wrapup > 0 && <span>{counts.wrapup} wrap-up</span>}
          {cards.length === 0 && <span>queue clear</span>}
        </span>
        <span className="queue-hud-moderator">{moderatorName}</span>
      </header>
      <div className="card-stage">
        {cards.slice(1, 3).map((card, index) => (
          <div
            key={cardKey(card)}
            className="peek-card"
            style={{ transform: `scale(${0.96 - index * 0.03}) translateY(${(index + 1) * 14}px)` }}
          />
        ))}
        <AnimatePresence custom={exitDirection} initial={false}>
          {topCard && stamps && (
            <SwipeCard
              key={topKey}
              onSwipe={handleSwipe}
              disabled={busy || !!composer}
              leftStamp={stamps.left}
              rightStamp={stamps.right}
            >
              {topCard.type === 'content' && <ContentCard card={topCard} />}
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
        {cards.length === 0 && (
          <div className="queue-message queue-done">
            <h2>All clear 🎉</h2>
            <p>No users waiting for review.</p>
            <button className="button button-secondary" onClick={() => void loadQueue()}>Check again</button>
          </div>
        )}
      </div>
      {topCard && <HotkeyLegend card={topCard} />}
      {composer && (
        <Composer
          mode={composer.mode}
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
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
};

export default ModQueueApp;
