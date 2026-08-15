'use client';

import React from 'react';
import type { QueueCard } from '../lib/types';

interface LegendEntry {
  keys: string;
  label: string;
}

function legendForCard(card: QueueCard): LegendEntry[] {
  switch (card.type) {
    case 'content':
      return [
        { keys: '→ / A', label: 'Approve' },
        { keys: '← / R', label: 'Reject…' },
        { keys: 'D', label: 'Approve + DM…' },
        { keys: 'U', label: 'Approve user' },
        { keys: 'S', label: 'Skip user' },
      ];
    case 'offboard':
      return [
        { keys: '← / R', label: 'Offboard…' },
        { keys: '→ / A / U', label: 'Approve user' },
        { keys: 'S', label: 'Skip user' },
      ];
    case 'wrapup':
      return [
        { keys: '→ / A / U', label: 'Approve user' },
        { keys: '← / R / S', label: 'Skip user' },
      ];
  }
}

const HotkeyLegend = ({ card }: { card: QueueCard }) => {
  return (
    <footer className="hotkey-legend">
      {[...legendForCard(card), { keys: '⇥', label: 'Context' }].map(entry => (
        <span key={entry.keys} className="hotkey-legend-entry">
          <kbd>{entry.keys}</kbd> {entry.label}
        </span>
      ))}
    </footer>
  );
};

export default HotkeyLegend;
