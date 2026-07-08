/**
 * Pure data model + reducer for the research chat surface's tiling layout.
 *
 * The chat surface is a miniature tiling window manager: an ordered list of
 * vertical columns, each column an ordered stack of chat tiles (one open
 * conversation per tile). This module is deliberately free of React and of any
 * DOM/measurement concern — callers pass in a `maxColumns` derived from the
 * current chat-area width, and every operation returns a new layout so it can
 * drive `useState` directly.
 *
 * Packing policy for opening a new chat while others are open (see `openTile`):
 *   1. add a new column beside the others, as long as one more fits the current
 *      chat-area width (`maxColumns`) — so opening a chat "makes room" beside;
 *   2. else densify: fill an existing column that has room up to
 *      `MAX_TILES_PER_COLUMN` (stack a second chat under an existing one);
 *   3. else replace the least-recently-used tile in place.
 *
 * (Columns-first rather than fill-first: with an area wide enough for several
 * columns, a second chat should appear beside the first, not stacked under it
 * with empty space to the right. Widen the area to raise `maxColumns` and get
 * more columns before densification kicks in.)
 *
 * `recency` is a monotonic counter (not a wall-clock time — this runs during
 * React state updates) stamped on open and bumped on focus, so "least recently
 * used" is well defined for the replacement step.
 */

export const MAX_TILES_PER_COLUMN = 2;

export interface ChatTile {
  conversationId: string;
  /** Monotonic stamp; higher = more recently opened or focused. Drives LRU replacement. */
  recency: number;
  /** Vertical grow weight within its column (used by resize; defaults to 1). */
  weight: number;
}

export interface ChatColumn {
  /** Stable id for React keys and drag-and-drop; assigned from `nextColumnId`. */
  id: string;
  tiles: ChatTile[];
  /** Horizontal grow weight among columns (used by resize; defaults to 1). */
  weight: number;
}

export interface ChatTilingLayout {
  columns: ChatColumn[];
  /** Next recency stamp to hand out. */
  nextRecency: number;
  /** Monotonic source of stable column ids (avoids Date.now()/random in render). */
  nextColumnId: number;
}

export const EMPTY_CHAT_LAYOUT: ChatTilingLayout = { columns: [], nextRecency: 1, nextColumnId: 1 };

export interface TileLocation {
  columnIndex: number;
  tileIndex: number;
}

export function findTile(layout: ChatTilingLayout, conversationId: string): TileLocation | null {
  for (let columnIndex = 0; columnIndex < layout.columns.length; columnIndex++) {
    const tileIndex = layout.columns[columnIndex].tiles.findIndex((t) => t.conversationId === conversationId);
    if (tileIndex >= 0) return { columnIndex, tileIndex };
  }
  return null;
}

export function isChatLayoutEmpty(layout: ChatTilingLayout): boolean {
  return layout.columns.every((c) => c.tiles.length === 0);
}

/** Total open tiles across all columns. */
export function chatTileCount(layout: ChatTilingLayout): number {
  return layout.columns.reduce((n, c) => n + c.tiles.length, 0);
}

/** Bump a tile's recency so it's treated as most-recently-used (called on focus/re-open). */
export function focusTile(layout: ChatTilingLayout, conversationId: string): ChatTilingLayout {
  const loc = findTile(layout, conversationId);
  if (!loc) return layout;
  const recency = layout.nextRecency;
  const columns = layout.columns.map((column, ci) =>
    ci !== loc.columnIndex
      ? column
      : {
          ...column,
          tiles: column.tiles.map((tile, ti) =>
            ti === loc.tileIndex ? { ...tile, recency } : tile),
        });
  return { ...layout, columns, nextRecency: recency + 1 };
}

function makeTile(conversationId: string, recency: number): ChatTile {
  return { conversationId, recency, weight: 1 };
}

/** Index of the column with the fewest tiles that still has room, or -1 if all are full. */
function firstColumnWithRoom(layout: ChatTilingLayout): number {
  return layout.columns.findIndex((c) => c.tiles.length < MAX_TILES_PER_COLUMN);
}

/** Replace the least-recently-used tile in place, keeping its column/slot and weight. */
function replaceLeastRecentlyUsed(layout: ChatTilingLayout, tile: ChatTile): ChatTilingLayout {
  let target: TileLocation | null = null;
  let lowestRecency = Infinity;
  for (let ci = 0; ci < layout.columns.length; ci++) {
    for (let ti = 0; ti < layout.columns[ci].tiles.length; ti++) {
      const r = layout.columns[ci].tiles[ti].recency;
      if (r < lowestRecency) {
        lowestRecency = r;
        target = { columnIndex: ci, tileIndex: ti };
      }
    }
  }
  if (!target) {
    // No tiles at all — shouldn't happen when this path is reached, but fall back to a column.
    return {
      ...layout,
      columns: [{ id: `col-${layout.nextColumnId}`, tiles: [tile], weight: 1 }],
      nextColumnId: layout.nextColumnId + 1,
    };
  }
  const { columnIndex, tileIndex } = target;
  const columns = layout.columns.map((column, ci) =>
    ci !== columnIndex
      ? column
      : {
          ...column,
          tiles: column.tiles.map((existing, ti) =>
            ti === tileIndex ? { ...tile, weight: existing.weight } : existing),
        });
  return { ...layout, columns };
}

/**
 * Open `conversationId` as a tile, applying the packing policy. If the
 * conversation is already open, this is a focus (recency bump) rather than an
 * insertion. `maxColumns` is how many columns currently fit the chat area.
 */
export function openTile(
  layout: ChatTilingLayout,
  conversationId: string,
  maxColumns: number,
): ChatTilingLayout {
  if (findTile(layout, conversationId)) return focusTile(layout, conversationId);

  const recency = layout.nextRecency;
  const tile = makeTile(conversationId, recency);
  const withRecency = { ...layout, nextRecency: recency + 1 };
  const columnCap = Math.max(1, Math.floor(maxColumns));

  // 1. add a new column beside the others if one still fits the area width
  if (layout.columns.length < columnCap) {
    const column: ChatColumn = { id: `col-${layout.nextColumnId}`, tiles: [tile], weight: 1 };
    return { ...withRecency, columns: [...layout.columns, column], nextColumnId: layout.nextColumnId + 1 };
  }

  // 2. densify: fill an existing column that has room
  const roomIdx = firstColumnWithRoom(layout);
  if (roomIdx >= 0) {
    const columns = layout.columns.map((column, ci) =>
      ci === roomIdx ? { ...column, tiles: [...column.tiles, tile] } : column);
    return { ...withRecency, columns };
  }

  // 3. replace the least-recently-used tile
  return replaceLeastRecentlyUsed(withRecency, tile);
}

/** Remove a tile; drop any column left empty. */
export function closeTile(layout: ChatTilingLayout, conversationId: string): ChatTilingLayout {
  const loc = findTile(layout, conversationId);
  if (!loc) return layout;
  const columns = layout.columns
    .map((column, ci) =>
      ci !== loc.columnIndex
        ? column
        : { ...column, tiles: column.tiles.filter((_, ti) => ti !== loc.tileIndex) })
    .filter((column) => column.tiles.length > 0);
  return { ...layout, columns };
}

/**
 * Where a dragged tile is being dropped. `columnId` names an existing column
 * (drop into that stack at `tileIndex`); a null `columnId` opens a brand-new
 * column inserted at `columnIndex`.
 */
export interface TileDropTarget {
  columnId: string | null;
  /** Insertion index of the new column when `columnId` is null. */
  columnIndex?: number;
  /** Insertion index within the target column's stack. */
  tileIndex?: number;
}

/** Move an already-open tile to a new position (drag-and-drop). Preserves the tile's recency. */
export function moveTile(
  layout: ChatTilingLayout,
  conversationId: string,
  target: TileDropTarget,
): ChatTilingLayout {
  const loc = findTile(layout, conversationId);
  if (!loc) return layout;
  const moving = layout.columns[loc.columnIndex].tiles[loc.tileIndex];

  // Remove from the source (without yet pruning empty columns, so indices stay stable).
  let columns: ChatColumn[] = layout.columns.map((column, ci) =>
    ci !== loc.columnIndex
      ? column
      : { ...column, tiles: column.tiles.filter((_, ti) => ti !== loc.tileIndex) });

  if (target.columnId === null) {
    // New column at the requested position.
    const newColumn: ChatColumn = { id: `col-${layout.nextColumnId}`, tiles: [moving], weight: 1 };
    const at = Math.min(Math.max(0, target.columnIndex ?? columns.length), columns.length);
    columns = [...columns.slice(0, at), newColumn, ...columns.slice(at)];
    columns = columns.filter((c) => c.tiles.length > 0);
    return { ...layout, columns, nextColumnId: layout.nextColumnId + 1 };
  }

  const destIdx = columns.findIndex((c) => c.id === target.columnId);
  if (destIdx < 0) return layout;
  const dest = columns[destIdx];
  if (dest.tiles.length >= MAX_TILES_PER_COLUMN) return layout; // column full — reject
  const at = Math.min(Math.max(0, target.tileIndex ?? dest.tiles.length), dest.tiles.length);
  columns = columns.map((column, ci) =>
    ci !== destIdx
      ? column
      : { ...column, tiles: [...column.tiles.slice(0, at), moving, ...column.tiles.slice(at)] });
  columns = columns.filter((c) => c.tiles.length > 0);
  return { ...layout, columns };
}

/** Set new grow weights for the named columns (used by horizontal resize). */
export function withColumnWeights(
  layout: ChatTilingLayout,
  weights: Record<string, number>,
): ChatTilingLayout {
  const columns = layout.columns.map((column) =>
    column.id in weights ? { ...column, weight: weights[column.id] } : column);
  return { ...layout, columns };
}

/** Set new grow weights for tiles (keyed by conversationId) within one column (vertical resize). */
export function withTileWeights(
  layout: ChatTilingLayout,
  columnId: string,
  weights: Record<string, number>,
): ChatTilingLayout {
  const columns = layout.columns.map((column) =>
    column.id !== columnId
      ? column
      : {
          ...column,
          tiles: column.tiles.map((tile) =>
            tile.conversationId in weights ? { ...tile, weight: weights[tile.conversationId] } : tile),
        });
  return { ...layout, columns };
}

/** Conversation ids of all open tiles, column-major (left-to-right, top-to-bottom). */
export function chatLayoutConversationIds(layout: ChatTilingLayout): string[] {
  return layout.columns.flatMap((c) => c.tiles.map((t) => t.conversationId));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseTile(value: unknown): ChatTile | null {
  if (!isRecord(value)) return null;
  const { conversationId, recency, weight } = value;
  if (typeof conversationId !== 'string') return null;
  return {
    conversationId,
    recency: typeof recency === 'number' ? recency : 0,
    weight: typeof weight === 'number' && weight > 0 ? weight : 1,
  };
}

export function serializeChatLayout(layout: ChatTilingLayout): string {
  return JSON.stringify(layout);
}

/**
 * Parse a persisted layout back into a validated `ChatTilingLayout`, or null if
 * the stored value is missing/corrupt/an older shape — callers fall back to an
 * empty layout. Empty columns are dropped and the id/recency counters are
 * repaired so subsequent inserts stay unique even after hand-edited storage.
 */
export function parseChatLayout(raw: string): ChatTilingLayout | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed) || !Array.isArray(parsed.columns)) return null;

  const columns: ChatColumn[] = [];
  let maxRecency = 0;
  let maxColumnNumber = 0;
  for (const rawColumn of parsed.columns) {
    if (!isRecord(rawColumn) || typeof rawColumn.id !== 'string' || !Array.isArray(rawColumn.tiles)) return null;
    const tiles: ChatTile[] = [];
    for (const rawTile of rawColumn.tiles) {
      const tile = parseTile(rawTile);
      if (!tile) return null;
      tiles.push(tile);
      maxRecency = Math.max(maxRecency, tile.recency);
    }
    if (tiles.length === 0) continue;
    const parsedNumber = parseInt(rawColumn.id.replace(/^col-/, ''), 10);
    if (!Number.isNaN(parsedNumber)) maxColumnNumber = Math.max(maxColumnNumber, parsedNumber);
    columns.push({
      id: rawColumn.id,
      tiles,
      weight: typeof rawColumn.weight === 'number' && rawColumn.weight > 0 ? rawColumn.weight : 1,
    });
  }

  const nextRecency = typeof parsed.nextRecency === 'number' && parsed.nextRecency > maxRecency
    ? parsed.nextRecency
    : maxRecency + 1;
  const nextColumnId = typeof parsed.nextColumnId === 'number' && parsed.nextColumnId > maxColumnNumber
    ? parsed.nextColumnId
    : maxColumnNumber + 1;
  return { columns, nextRecency, nextColumnId };
}
