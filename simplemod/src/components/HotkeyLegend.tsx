'use client';

import React from 'react';
import type { QueueCard } from '../lib/types';

export type LegendAction = 'approve' | 'rejectIntent' | 'dm' | 'approveUser' | 'skip' | 'context';

interface LegendEntry {
  keys: string;
  label: string;
  action: LegendAction;
}

function legendForCard(card: QueueCard): LegendEntry[] {
  switch (card.type) {
    case 'content':
      return [
        { keys: '→ / A', label: 'Approve', action: 'approve' },
        { keys: '← / R', label: 'Reject…', action: 'rejectIntent' },
        { keys: 'D', label: 'Approve + DM…', action: 'dm' },
        { keys: 'U', label: 'Approve user', action: 'approveUser' },
        { keys: 'S', label: 'Skip user', action: 'skip' },
      ];
    case 'offboard':
      return [
        { keys: '← / R', label: 'Offboard…', action: 'rejectIntent' },
        { keys: '→ / A / U', label: 'Approve user', action: 'approveUser' },
        { keys: 'S', label: 'Skip user', action: 'skip' },
      ];
    case 'wrapup':
      return [
        { keys: '→ / A / U', label: 'Approve user', action: 'approveUser' },
        { keys: '← / R / S', label: 'Skip user', action: 'skip' },
      ];
  }
}

const HotkeyLegend = ({ card, onAction }: { card: QueueCard; onAction: (action: LegendAction) => void }) => {
  return (
    <footer className="hotkey-legend">
      {[...legendForCard(card), { keys: '⇥', label: 'Context', action: 'context' as const }].map(entry => (
        <button
          key={entry.action}
          type="button"
          className="hotkey-legend-entry"
          onClick={() => onAction(entry.action)}
        >
          <kbd>{entry.keys}</kbd> {entry.label}
        </button>
      ))}
    </footer>
  );
};

export default HotkeyLegend;
