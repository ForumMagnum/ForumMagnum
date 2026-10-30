// EXPERIMENT (experiment/iframe-layout-ronny-exp2): dragging and resizing iframe widgets in the editor.
import {
  BlockBox, ColumnRect, DropSlotInput, adjacentSlot, autoScrollStep, chooseDropSlot, chooseSide, fitMatchesWidth, insertionKey,
  moveChipText, resizeChipText, resizeTarget, roomInPlace, shrinkWarning, stepWidth, widgetRoom,
} from '../components/lexical/embeds/IframeWidgetEmbed/widgetDragGeometry';
import { IframeWidgetFit, injectResizeScript, readIframeWidgetFit } from '../components/lexical/embeds/IframeWidgetEmbed/iframeResizeScript';
import {
  IframeWidgetLayout, alignOf, minColumnToWrap, offeredSnapFractions, offeredWidths, parseIframeWidgetLayout, sameLayout,
  setIframeWidgetLayout, shouldWrapWidget, withAlign, wrappableWidths,
} from '../components/contents/iframeWidgetLayout';

const COLUMN: ColumnRect = { left: 0, width: 682 };
const LEFT_33: IframeWidgetLayout = { position: 'left', width: '33%' };
const RIGHT_33: IframeWidgetLayout = { position: 'right', width: '33%' };
const INLINE: IframeWidgetLayout = { position: 'inline', width: null };

function block(key: string, index: number, top: number, height = 80, kind: BlockBox['kind'] = 'other'): BlockBox {
  return { key, index, kind, float: 'none', top, bottom: top + height };
}

function float(key: string, index: number, side: 'left' | 'right', top: number, bottom: number): BlockBox {
  return { key, index, kind: 'widget', float: side, top, bottom };
}

/**
 * p0 p1 p2 h p3 p4 p5 at 100px pitch, a left float (fl) at the top of p1 (running on beside p2), a right
 * float (fr) at the top of p4, and the dragged widget (w, full width) between p4 and p5.
 */
function post(dragged: Partial<BlockBox> = {}): BlockBox[] {
  return [
    block('p0', 0, 0),
    float('fl', 1, 'left', 106, 260),
    block('p1', 2, 100),
    block('p2', 3, 200),
    block('h', 4, 300, 40, 'heading'),
    block('p3', 5, 400),
    float('fr', 6, 'right', 506, 640),
    block('p4', 7, 500),
    { key: 'w', index: 8, kind: 'widget', float: 'none', top: 600, bottom: 680, ...dragged },
    block('p5', 9, 700),
  ];
}

function slot(overrides: Partial<DropSlotInput>) {
  return chooseDropSlot({
    blocks: post(),
    draggedKey: 'w',
    pointerX: 100,
    pointerY: 0,
    column: COLUMN,
    layout: INLINE,
    prevSide: null,
    ghostHeight: 100,
    ...overrides,
  });
}

describe('iframe widget layout helpers', () => {
  it('knows the narrowest column each width wraps in, as shouldWrapWidget rounds it', () => {
    // 25% needs a 150px widget (598 * 25% rounds to 150); the others need 300px of text beside them.
    expect(['25%', '33%', '38%', '50%'].map(minColumnToWrap)).toEqual([598, 495, 535, 664]);
    expect(['149px', '150px'].map(minColumnToWrap)).toEqual([Infinity, 482]);
  });

  it('lists the widths that wrap in a column', () => {
    expect(wrappableWidths(682)).toEqual(['25%', '33%', '38%', '50%']);
    expect(wrappableWidths(600)).toEqual(['25%', '33%', '38%']);
    expect(wrappableWidths(560)).toEqual(['33%', '38%']);
    expect(wrappableWidths(494)).toEqual([]);
  });

  it('never wraps a widget narrower than 150px', () => {
    expect(shouldWrapWidget({ position: 'left', width: '25%' }, 597)).toBe(false);
    expect(shouldWrapWidget({ position: 'left', width: '25%' }, 598)).toBe(true);
    expect(shouldWrapWidget({ position: 'right', width: '149px' }, 682)).toBe(false);
    expect(shouldWrapWidget({ position: 'right', width: '150px' }, 682)).toBe(true);
  });

  it('offers only the widths at least 150px wide in a column', () => {
    expect(offeredWidths(682)).toEqual(['25%', '33%', '38%', '50%']);
    expect(offeredWidths(560)).toEqual(['33%', '38%', '50%']);
    expect(offeredWidths(400)).toEqual(['38%', '50%']);
    expect(offeredWidths(300)).toEqual(['50%']);
    expect(offeredWidths(298)).toEqual([]);
    // Not measured yet: all of them.
    expect(offeredWidths(0)).toEqual(['25%', '33%', '38%', '50%']);
    expect(offeredSnapFractions(560)).toEqual([0.33, 0.38, 0.5, 1]);
    expect(offeredSnapFractions(280)).toEqual([1]);
  });

  it('compares layouts', () => {
    expect(sameLayout(LEFT_33, { position: 'left', width: '33%' })).toBe(true);
    expect(sameLayout(LEFT_33, RIGHT_33)).toBe(false);
  });
});

describe('chooseDropSlot', () => {
  it('drops before the first block above its middle, and at the end below the last one', () => {
    expect(slot({ pointerY: 10 }).beforeKey).toBe('p0');
    const end = slot({ pointerY: 760 });
    expect(end.beforeKey).toBe(null);
    expect(end.atEnd).toBe(true);
    expect(end.insertIndex).toBe(10);
    expect(slot({ pointerY: 5000 }).atEnd).toBe(true);
    expect(slot({ pointerY: -500 }).beforeKey).toBe('p0');
  });

  it('picks the nearer block in a gap and goes by its middle', () => {
    // p1 ends at 180 and p2 starts at 200.
    expect(slot({ pointerY: 185 }).slotKey).toBe('p2');
    expect(slot({ pointerY: 195 }).slotKey).toBe('p2');
    expect(slot({ pointerY: 120 }).slotKey).toBe('p1');
    expect(slot({ pointerY: 150 }).slotKey).toBe('p2');
    // (A float: the line stays in the gap, where a full-width widget's would go below a float running there.)
    expect(slot({ pointerY: 385, layout: LEFT_33, pointerX: 50 }).lineY).toBe(370);
  });

  it('ignores floats when hit-testing', () => {
    // Over the left float's box, which sits beside p1 and p2: p2's upper half.
    expect(slot({ pointerY: 220, pointerX: 50 }).slotKey).toBe('p2');
  });

  // EXPERIMENT (experiment/iframe-layout-ronny-exp3): a heading sits beside a widget instead of clearing it.
  it('lets a widget that wraps sit right before a heading, but never line up with one', () => {
    const before = slot({ pointerY: 305, layout: LEFT_33, pointerX: 50 });
    expect(before.beforeKey).toBe('h');
    expect(before.snapped).toBe(false);
    expect(alignOf(before.layout)).toBe('top');
    // Over the heading's lower half: the slot after it (a heading is no bottom-align target).
    const after = slot({ pointerY: 335, layout: LEFT_33, pointerX: 50 });
    expect(after.beforeKey).toBe('p3');
    expect(alignOf(after.layout)).toBe('top');
    const inline = slot({ pointerY: 305 });
    expect(inline.beforeKey).toBe('h');
    expect(inline.snapped).toBe(false);
  });

  it('moves a widget that wraps below a divider', () => {
    const blocks = post().map(b => b.key === 'h' ? { ...b, kind: 'divider' as const, clears: true } : b);
    const snapped = chooseDropSlot({
      blocks, draggedKey: 'w', pointerX: 50, pointerY: 305, column: COLUMN, layout: LEFT_33, prevSide: null, ghostHeight: 100,
    });
    expect(snapped.beforeKey).toBe('p3');
    expect(snapped.snapped).toBe(true);
    expect(moveChipText(snapped, LEFT_33)).toBe('Below the divider · Left · 33%');
    // A full-width widget may sit before a divider.
    const inline = chooseDropSlot({
      blocks, draggedKey: 'w', pointerX: 100, pointerY: 305, column: COLUMN, layout: INLINE, prevSide: null, ghostHeight: 100,
    });
    expect(inline.beforeKey).toBe('h');
    expect(inline.snapped).toBe(false);
  });

  it('snaps past consecutive dividers and embeds', () => {
    const blocks = [
      block('p0', 0, 0),
      { ...block('d', 1, 100, 40, 'divider'), clears: true },
      { ...block('e', 2, 160, 40, 'embed'), clears: true },
      block('p1', 3, 220),
      { ...block('w', 4, 320), kind: 'widget' as const },
    ];
    const snapped = chooseDropSlot({
      blocks, draggedKey: 'w', pointerX: 50, pointerY: 105, column: COLUMN, layout: LEFT_33, prevSide: null, ghostHeight: 100,
    });
    expect(snapped.beforeKey).toBe('p1');
    expect(snapped.snapped).toBe(true);
    expect(snapped.snappedBelow).toBe('embed');
  });

  it('switches sides from the pointer, keeping the side in the middle band', () => {
    expect(slot({ pointerY: 10, layout: RIGHT_33, pointerX: 100 }).layout.position).toBe('left');
    expect(slot({ pointerY: 10, layout: LEFT_33, pointerX: 600 }).layout.position).toBe('right');
    expect(slot({ pointerY: 10, layout: LEFT_33, pointerX: 341, prevSide: 'right' }).layout.position).toBe('right');
    expect(slot({ pointerY: 10, layout: RIGHT_33, pointerX: 341, prevSide: null }).layout.position).toBe('right');
    expect(slot({ pointerY: 10, layout: RIGHT_33, pointerX: -500 }).layout.position).toBe('left');
    expect(slot({ pointerY: 10, layout: LEFT_33, pointerX: 2000 }).layout.position).toBe('right');
    // A full-width widget stays full width wherever the pointer is.
    expect(slot({ pointerY: 10, pointerX: 2000 }).layout).toEqual(INLINE);
  });

  it('chooses sides by fractions of the column', () => {
    const column = { left: 100, width: 500 };
    expect(chooseSide(299, column, 'right')).toBe('left');
    expect(chooseSide(350, column, 'right')).toBe('right');
    expect(chooseSide(350, column, 'left')).toBe('left');
    expect(chooseSide(401, column, 'left')).toBe('right');
  });

  it('ignores x and keeps the stored side where the widget cannot wrap', () => {
    const right25: IframeWidgetLayout = { position: 'right', width: '25%' };
    const narrow = slot({ pointerY: 10, column: { left: 0, width: 400 }, layout: right25, pointerX: 10 });
    expect(narrow.layout).toEqual(right25);
    expect(narrow.wraps).toBe(false);
    expect(narrow.ghostTop).toBe(null);
    expect(moveChipText(narrow, right25)).toBe('Full width here: no room to wrap');
  });

  it('knows when a drop changes nothing', () => {
    // w sits before p5. Aimed at p5's upper half, or w's own lower half: no change.
    const own = slot({ pointerY: 710, pointerX: 341 });
    expect(own.beforeKey).toBe('p5');
    expect(own.sameSlot).toBe(true);
    expect(own.noOp).toBe(true);
    expect(moveChipText(own, INLINE)).toBe('No change');
    // Pulled sideways it is still full width: the chip says how to make the text wrap.
    expect(moveChipText(slot({ pointerY: 710, pointerX: 100 }), INLINE)).toBe('Full width · drag an edge to wrap text');
    expect(moveChipText(slot({ pointerY: 710, pointerX: 640 }), INLINE)).toBe('Full width · drag an edge to wrap text');
    expect(slot({ pointerY: 670 }).noOp).toBe(true);
    // Its own slot on the other side is a side change only.
    const blocks = post({ float: 'right', top: 606, bottom: 700 });
    const sideOnly = chooseDropSlot({
      blocks, draggedKey: 'w', pointerX: 100, pointerY: 710, column: COLUMN, layout: RIGHT_33, prevSide: null, ghostHeight: 100,
    });
    expect(sideOnly.sameSlot).toBe(true);
    expect(sideOnly.noOp).toBe(false);
    expect(sideOnly.layout).toEqual(LEFT_33);
    // The last block dropped at the end.
    const last = [...post().filter(b => b.key !== 'p5')];
    const atEnd = chooseDropSlot({
      blocks: last, draggedKey: 'w', pointerX: 100, pointerY: 900, column: COLUMN, layout: INLINE, prevSide: null, ghostHeight: 100,
    });
    expect(atEnd.atEnd).toBe(true);
    expect(atEnd.noOp).toBe(true);
  });

  it('puts a full-width widget before the floats at the top of its slot, and a float after them', () => {
    // The right float fr sits at the top of p4 (it comes just before p4 in the post).
    const full = slot({ pointerY: 505 });
    expect(full.slotKey).toBe('p4');
    expect(full.beforeKey).toBe('fr');
    expect(full.insertIndex).toBe(6);
    expect(insertionKey(post(), 'w', 'p4', false)).toBe('fr');
    expect(insertionKey(post(), 'w', 'p4', true)).toBe('p4');
    expect(insertionKey(post(), 'w', 'p1', false)).toBe('fl');
    expect(insertionKey(post(), 'w', null, false)).toBe(null);
  });

  it('skips the empty sentinel paragraphs the editor keeps around widgets', () => {
    const sentinel = (key: string, index: number, top: number): BlockBox => ({ key, index, kind: 'sentinel', float: 'none', top, bottom: top });
    const blocks: BlockBox[] = [
      block('p0', 0, 0),
      sentinel('s1', 1, 90),
      float('w', 2, 'left', 96, 300),
      sentinel('s2', 3, 90),
      block('p1', 4, 90, 120),
      block('p2', 5, 230),
    ];
    // Aimed at the widget's own top: its own slot, not "before the sentinel".
    const own = chooseDropSlot({
      blocks, draggedKey: 'w', pointerX: 50, pointerY: 100, column: COLUMN, layout: LEFT_33, prevSide: null, ghostHeight: 100,
    });
    expect(own.beforeKey).toBe('p1');
    expect(own.noOp).toBe(true);
    // Keyboard steps go from block to block.
    const room = widgetRoom(blocks, 'w', LEFT_33, COLUMN.width, 204);
    expect(adjacentSlot(blocks, 'w', 'down', room)).toBe('p2');
    expect(adjacentSlot(blocks, 'w', 'up', room)).toBe('p0');
  });

  // EXPERIMENT (experiment/iframe-layout-ronny-exp3): no two widgets share a height (Ronny, Oct 29 2026).
  it('moves a widget that wraps down past a widget still running beside the text it was aimed at', () => {
    // Before p2: the left float fl (106-260) still runs beside p2's top, so it goes on to the heading.
    const left = slot({ pointerY: 205, layout: LEFT_33, pointerX: 50 });
    expect(left.beforeKey).toBe('h');
    expect(left.moved).toBe('down');
    expect(left.ghostTop).toBe(290);
    expect(moveChipText(left, LEFT_33)).toBe('Left · 33% · moved down, clear of the widget above');
    // A short one fits at p2's bottom, below fl's end: the first spot from there on down with room.
    const short = slot({ pointerY: 205, layout: LEFT_33, pointerX: 50, ghostHeight: 15 });
    expect([short.beforeKey, alignOf(short.layout), short.moved]).toEqual(['p2', 'bottom', 'down']);
    expect(moveChipText(short, LEFT_33)).toBe('Left · 33% · bottom of the paragraph · moved down, clear of the widget above');
    // Before p3 nothing is in the way.
    const free = slot({ pointerY: 405, layout: RIGHT_33, pointerX: 600 });
    expect([free.beforeKey, free.moved, free.ghostTop]).toEqual(['p3', null, 370]);
    expect(moveChipText(free, RIGHT_33)).toBe('Right · 33%');
  });

  it('never lines two widgets up with the same paragraph', () => {
    // The right float fr lines up with p4: a widget aimed there, either side, top or bottom, goes on to p5.
    for (const [layout, pointerX, pointerY] of [[RIGHT_33, 600, 505], [LEFT_33, 50, 505], [RIGHT_33, 600, 560]] as const) {
      const drop = slot({ pointerY, layout, pointerX });
      expect([drop.beforeKey, drop.moved, alignOf(drop.layout)]).toEqual(['p5', 'down', 'top']);
    }
  });

  it('keeps a widget clear of one after it, once the text between them wraps around it', () => {
    // Before p3 (top 406), with fr starting at 506: the 100px between them grows to 100 / 0.62 beside a
    // 33% widget, so a widget up to 160px tall ends before fr starts.
    expect(slot({ pointerY: 405, layout: LEFT_33, pointerX: 50, ghostHeight: 160 }).beforeKey).toBe('p3');
    const tall = slot({ pointerY: 405, layout: LEFT_33, pointerX: 50, ghostHeight: 161 });
    // Taller, it would reach fr: past p3 and fr's p4 to p5.
    expect([tall.beforeKey, tall.moved]).toEqual(['p5', 'down']);
  });

  it('starts a widget at the bottom margin of the block before it', () => {
    // r lines up with a (AI content, say) and ends at 112; p starts at 118, 18px below a.
    const blocks = (marginBottom: number): BlockBox[] => [
      float('r', 0, 'right', 6, 112),
      { ...block('a', 1, 0, 100), marginBottom },
      block('p', 2, 118),
      float('w', 3, 'left', 900, 1000),
    ];
    const drop = (marginBottom: number) => chooseDropSlot({
      blocks: blocks(marginBottom), draggedKey: 'w', pointerX: 50, pointerY: 125, column: COLUMN, layout: LEFT_33, prevSide: null, ghostHeight: 100,
    });
    // After a block with an 18px bottom margin a widget before p starts at 124, below r's end.
    expect(drop(18).slotKey).toBe('p');
    // After one with none it starts at 106, beside r: it goes on, to the end of the post.
    expect([drop(0).atEnd, drop(0).moved]).toEqual([true, 'down']);
  });

  it('goes up to the nearest spot with room when there is none below', () => {
    // p0 p1 p2, a left float at the top of p1 and a right one at the end; w (full width) at the top.
    const blocks: BlockBox[] = [
      { ...block('w', 0, 0), kind: 'widget' },
      block('p0', 1, 100),
      float('fa', 2, 'left', 206, 300),
      block('p1', 3, 200),
      block('p2', 4, 300),
      float('fz', 5, 'right', 406, 600),
    ];
    const drop = (ghostHeight: number) => chooseDropSlot({
      blocks, draggedKey: 'w', pointerX: 50, pointerY: 390, column: COLUMN, layout: LEFT_33, prevSide: null, ghostHeight,
    });
    // The end has fz: the bottom of p2 (above fz, below fa) is the nearest with room.
    const up = drop(100);
    expect([up.beforeKey, alignOf(up.layout), up.moved, up.noRoom]).toEqual(['p2', 'bottom', 'up', false]);
    expect(moveChipText(up, LEFT_33)).toBe('Left · 33% · bottom of the paragraph · moved up, clear of the widget below');
    // A taller one has room nowhere: dropping it changes nothing.
    const none = drop(200);
    expect([none.noRoom, none.noOp]).toEqual([true, true]);
    expect(moveChipText(none, LEFT_33)).toBe('No room: every paragraph it could go beside has another widget beside it');
  });

  it('allows only the third of Ronny\'s three placements (Oct 29 2026)', () => {
    // A heading, P1 with a right widget at its top that runs on beside the AI content below it, then a
    // last paragraph below that widget's end. The left widget being placed sits at the end.
    const blocks: BlockBox[] = [
      block('h', 0, 0, 40, 'heading'),
      float('r', 1, 'right', 66, 500),
      block('p1', 2, 60, 300),
      block('ai', 3, 380, 100),
      block('last', 4, 520, 180),
      float('l', 5, 'left', 706, 1106),
    ];
    const drop = (pointerY: number) => chooseDropSlot({
      blocks, draggedKey: 'l', pointerX: 50, pointerY, column: COLUMN, layout: LEFT_33, prevSide: null, ghostHeight: 400,
    });
    // 1: beside the right widget at P1's top. 2: lined up with the AI content, which the right widget
    // still runs beside. Both go on to the last paragraph. 3: below the right widget's end: allowed.
    expect([drop(80).beforeKey, drop(80).moved]).toEqual(['last', 'down']);
    expect([drop(390).beforeKey, drop(390).moved]).toEqual(['last', 'down']);
    expect([drop(530).beforeKey, drop(530).moved]).toEqual(['last', null]);
  });

  it('stops at the next divider or full-width widget, which a taller widget pushes down', () => {
    // p0 p1 h (a divider, a right float at its top) p2 fw p3; w is a left float at the end.
    const blocks: BlockBox[] = [
      block('p0', 0, 0),
      block('p1', 1, 100),
      { ...block('h', 2, 200, 40, 'divider'), clears: true },
      float('fr', 3, 'right', 246, 600),
      block('p2', 4, 240),
      { ...block('fw', 5, 400, 200, 'widget'), clears: true },
      block('p3', 6, 620),
      float('w', 7, 'left', 706, 900),
    ];
    const drop = (pointerY: number, ghostHeight: number) => chooseDropSlot({
      blocks, draggedKey: 'w', pointerX: 50, pointerY, column: COLUMN, layout: LEFT_33, prevSide: null, ghostHeight,
    });
    // Before p1 (line at 90), 400px tall: the right float after the divider would overlap the ghost,
    // but the divider clears the widget, so that float lands below it and nothing gets narrow.
    const tall = drop(105, 400);
    expect(tall.slotKey).toBe('p1');
    expect(tall.moved).toBe(null);
    expect(tall.sectionEnd).toBe(200);
    expect(tall.pushesDown).toBe('divider');
    expect(moveChipText(tall, LEFT_33)).toBe('Left · 33% · pushes the divider down');
    // A short one fits in its section.
    const short = drop(105, 80);
    expect(short.pushesDown).toBe(null);
    expect(moveChipText(short, LEFT_33)).toBe('Left · 33%');
    // One that reaches past the divider's top, but not past the end of the text narrowed beside it
    // (p1's 100px at 62% of the column run to about 251), leaves the divider to the text.
    const textDecides = drop(105, 150);
    expect(textDecides.sectionEnd).toBe(200);
    expect(textDecides.pushesDown).toBe(null);
    expect(moveChipText(textDecides, LEFT_33)).toBe('Left · 33%');
    expect(drop(105, 200).pushesDown).toBe('divider');
    // Below the divider, p2 has the right float: it goes on below the full-width widget too.
    const below = drop(205, 300);
    expect([below.slotKey, below.snappedBelow, below.moved, below.sectionEnd]).toEqual(['p3', 'widget', 'down', null]);
    expect(moveChipText(below, LEFT_33)).toBe('Below the widget · Left · 33% · moved down, clear of the widget above');
    // Without that float it takes p2, up to the full-width widget, which it pushes down.
    const alone = chooseDropSlot({
      blocks: blocks.filter(b => b.key !== 'fr'), draggedKey: 'w', pointerX: 50, pointerY: 205, column: COLUMN, layout: LEFT_33, prevSide: null, ghostHeight: 300,
    });
    expect([alone.slotKey, alone.sectionEnd, alone.pushesDown]).toEqual(['p2', 400, 'widget']);
    expect(moveChipText(alone, LEFT_33)).toBe('Below the divider · Left · 33% · pushes the widget below down');
    // A full-width drop stops nothing.
    expect(chooseDropSlot({
      blocks, draggedKey: 'w', pointerX: 50, pointerY: 105, column: COLUMN, layout: INLINE, prevSide: null, ghostHeight: 400,
    }).sectionEnd).toBe(null);
  });

  it('moves the line of a full-width drop below a float still running beside the gap', () => {
    // Before p2 (gap at 190) the left float fl (106-260) still runs: the widget clears it.
    const full = slot({ pointerY: 205 });
    expect(full.beforeKey).toBe('p2');
    expect(full.clearsFloat).toBe(true);
    expect(full.lineY).toBe(268);
    expect(moveChipText(full, INLINE)).toBe('Full width · below the widget beside it');
    // Before p3, nothing runs past the gap.
    const clear = slot({ pointerY: 405 });
    expect(clear.clearsFloat).toBe(false);
    expect(clear.lineY).toBe(370);
  });

  it('moves a widget that wraps below a full-width widget, never just before it', () => {
    const blocks: BlockBox[] = [
      block('p0', 0, 0),
      float('w', 1, 'left', 106, 300),
      block('p1', 2, 100),
      { ...block('fw', 3, 200, 200, 'widget'), clears: true },
      block('p2', 4, 420),
    ];
    const below = chooseDropSlot({
      blocks, draggedKey: 'w', pointerX: 50, pointerY: 205, column: COLUMN, layout: LEFT_33, prevSide: null, ghostHeight: 100,
    });
    expect(below.slotKey).toBe('p2');
    expect(below.snapped).toBe(true);
    expect(moveChipText(below, LEFT_33)).toBe('Below the widget · Left · 33%');
    // A full-width one may go right before it.
    const full = chooseDropSlot({
      blocks, draggedKey: 'w', pointerX: 50, pointerY: 205, column: COLUMN, layout: INLINE, prevSide: null, ghostHeight: 100,
    });
    expect(full.slotKey).toBe('fw');
    // Keyboard steps skip that slot too.
    expect(adjacentSlot(blocks, 'w', 'down', widgetRoom(blocks, 'w', LEFT_33, COLUMN.width, 194))).toBe('p2');
    expect(adjacentSlot(blocks, 'w', 'down', null)).toBe('fw');
  });

  it('moves on a widget sharing its paragraph with another (from before the rule), even dropped in place', () => {
    // w (left) and f (right) both float at the top of p1.
    const run = (order: 'w-first' | 'f-first'): BlockBox[] => [
      block('p0', 0, 0),
      order === 'w-first' ? float('w', 1, 'left', 106, 300) : float('f', 1, 'right', 106, 260),
      order === 'w-first' ? float('f', 2, 'right', 106, 260) : float('w', 2, 'left', 106, 300),
      block('p1', 3, 100, 300),
      block('p2', 4, 420),
    ];
    for (const order of ['w-first', 'f-first'] as const) {
      for (const pointerX of [50, 600]) {
        const drop = chooseDropSlot({
          blocks: run(order), draggedKey: 'w', pointerX, pointerY: 150, column: COLUMN, layout: LEFT_33, prevSide: null, ghostHeight: 194,
        });
        expect([drop.slotKey, drop.sameSlot, drop.moved]).toEqual(['p2', false, 'down']);
      }
    }
  });

  it('writes the chips', () => {
    const heading = slot({ pointerY: 305, layout: RIGHT_33, pointerX: 600 });
    expect(moveChipText(heading, RIGHT_33)).toBe('Right · 33%');
    expect(moveChipText(slot({ pointerY: 760 }), INLINE)).toBe('End of post · Full width');
    expect(moveChipText(slot({ pointerY: 10 }), INLINE)).toBe('Full width');
  });
});

describe('resizeTarget', () => {
  const resize = (pointerX: number, edge: 'left' | 'right' = 'right', startLayout = LEFT_33, startWraps = true) =>
    resizeTarget({ edge, startLayout, startWraps, pointerX, column: COLUMN });

  it('snaps a left float pulled by its right edge', () => {
    expect([170, 225, 259, 341].map(x => resize(x).layout.width)).toEqual(['25%', '33%', '38%', '50%']);
    expect(resize(600).layout).toEqual(INLINE);
    expect(resize(600).snap).toBe(1);
    // Past the fixed edge is the narrowest width, not a wider one.
    expect(resize(-300).layout.width).toBe('25%');
    expect(resize(225).side).toBe('left');
  });

  it('keeps a right float right, resizing from its left edge', () => {
    const target = resize(682 - 225, 'left', RIGHT_33, true);
    expect(target.layout).toEqual(RIGHT_33);
    expect(target.fixedEdgeX).toBe(682);
  });

  it('turns a full-width widget into a float by the edge pulled in', () => {
    expect(resize(225, 'right', INLINE, false).layout).toEqual(LEFT_33);
    expect(resize(682 - 225, 'left', INLINE, false).layout).toEqual(RIGHT_33);
  });

  it('keeps the stored layout of a full-width widget snapped back to full width', () => {
    const right50: IframeWidgetLayout = { position: 'right', width: '50%' };
    expect(resize(670, 'right', right50, false).layout).toBe(right50);
    expect(resize(670, 'right', INLINE, false).layout).toBe(INLINE);
  });

  it('skips the snap widths narrower than 150px in this column', () => {
    // 25% of 528 is 132px: a pull to there snaps to 33%.
    const narrow = resizeTarget({ edge: 'right', startLayout: LEFT_33, startWraps: true, pointerX: 132, column: { left: 0, width: 528 } });
    expect(narrow.layout.width).toBe('33%');
    expect(resizeTarget({ edge: 'right', startLayout: LEFT_33, startWraps: true, pointerX: -50, column: { left: 0, width: 528 } }).layout.width).toBe('33%');
    // In a 280px column only full width is left.
    expect(resizeTarget({ edge: 'right', startLayout: INLINE, startWraps: false, pointerX: 70, column: { left: 0, width: 280 } }).snap).toBe(1);
  });

  it('says when a width cannot wrap at this window size', () => {
    const narrow = resizeTarget({ edge: 'right', startLayout: LEFT_33, startWraps: true, pointerX: 264, column: { left: 0, width: 528 } });
    expect(narrow.layout.width).toBe('50%');
    expect(narrow.wraps).toBe(false);
    expect(resizeChipText(narrow)).toBe('Left · 50%: full width at this window size (wraps on wider screens)');
    expect(resizeChipText(resize(225))).toBe('Left · 33%');
    // A sided widget shown full width, pulled in from its left edge, becomes a right float: said so.
    const flipped = resizeTarget({ edge: 'left', startLayout: { position: 'left', width: '38%' }, startWraps: false, pointerX: 528 - 200, column: { left: 0, width: 528 } });
    expect(resizeChipText(flipped)).toBe('Right · 38%: full width at this window size (wraps on wider screens)');
    expect(resizeChipText(resize(600))).toBe('Full width');
    expect(resizeChipText(resize(225), true)).toBe('Left · 33%: no room, another widget is beside the text here');
  });

  it('can snap back to an in-between starting width', () => {
    const start: IframeWidgetLayout = { position: 'left', width: '44%' };
    const back = resizeTarget({ edge: 'right', startLayout: start, startWraps: true, pointerX: 0.44 * 682, column: COLUMN });
    expect(back.layout).toEqual(start);
    expect(back.snaps).toContain(0.44);
    expect(resizeTarget({ edge: 'right', startLayout: start, startWraps: true, pointerX: 0.5 * 682, column: COLUMN }).layout.width).toBe('50%');
    // Only the widget's own width is added, and only while it wraps.
    expect(resizeTarget({ edge: 'right', startLayout: start, startWraps: false, pointerX: 0.44 * 682, column: COLUMN }).snaps).not.toContain(0.44);
  });
});

describe('auto-scroll', () => {
  it('scrolls only near the edges, faster nearer them', () => {
    expect(autoScrollStep(450, 900)).toBe(0);
    expect(autoScrollStep(56, 900)).toBe(0);
    expect(autoScrollStep(55, 900)).toBe(-1);
    expect(autoScrollStep(0, 900)).toBe(-18);
    expect(autoScrollStep(-50, 900)).toBe(-18);
    expect(autoScrollStep(845, 900)).toBe(1);
    expect(autoScrollStep(890, 900)).toBeGreaterThan(10);
    expect(autoScrollStep(2000, 900)).toBe(18);
  });
});

describe('keyboard moves', () => {
  it('steps through the slots, skipping before-divider slots for a widget that wraps', () => {
    const blocks = post();
    // w sits before p5.
    expect(adjacentSlot(blocks, 'w', 'down', null)).toBe(null);
    expect(adjacentSlot(blocks, 'w', 'up', null)).toBe('p4');
    const atTop = post().map(b => b.key === 'w' ? { ...b, index: -1 } : b);
    expect(adjacentSlot(atTop, 'w', 'up', null)).toBe(undefined);
    // A wrapping widget just below a divider: up skips the slot before the divider...
    const belowDivider: BlockBox[] = [
      block('p0', 0, 0),
      { ...block('d', 1, 100, 40, 'divider'), clears: true },
      float('w', 2, 'left', 150, 300),
      block('p1', 3, 150),
      block('p2', 4, 250),
    ];
    const room = (blocks: BlockBox[]) => widgetRoom(blocks, 'w', LEFT_33, COLUMN.width, 150);
    expect(adjacentSlot(belowDivider, 'w', 'up', room(belowDivider))).toBe('p0');
    expect(adjacentSlot(belowDivider, 'w', 'up', null)).toBe('d');
    expect(adjacentSlot(belowDivider, 'w', 'down', room(belowDivider))).toBe('p2');
    // ...but not the one before a heading (EXPERIMENT experiment/iframe-layout-ronny-exp3: it sits beside).
    const belowHeading = belowDivider.map(b => b.key === 'd' ? { ...b, kind: 'heading' as const, clears: false } : b);
    expect(adjacentSlot(belowHeading, 'w', 'up', room(belowHeading))).toBe('d');
    // At the end there is no further down.
    const last = [...post().filter(b => b.key !== 'p5')];
    expect(adjacentSlot(last, 'w', 'down', null)).toBe(undefined);
  });

  // EXPERIMENT (experiment/iframe-layout-ronny-exp3): no two widgets share a height.
  it('steps past the paragraphs another widget is beside, keeping the alignment', () => {
    // w, a left float lined up with p5; up: p4 has fr, p3 has room (fr starts 100px below its top).
    const blocks = post({ float: 'left', top: 706, bottom: 806 });
    const up = (height: number) => adjacentSlot(blocks, 'w', 'up', widgetRoom(blocks, 'w', LEFT_33, COLUMN.width, height));
    expect(up(100)).toBe('p3');
    // A 300px one would reach fr from p3 (it needs 187px of text above fr), not from the heading (200px).
    expect(up(300)).toBe('h');
    // A 330px one has no room above: the heading is too close to fr, p2 has fl's end beside it, p1 has
    // fl, and from p0 it would reach fl.
    expect(up(330)).toBe(undefined);
    // Lined up with bottoms, a short one fits at the bottom of a paragraph whose top has another widget's end beside it.
    const tallP2: BlockBox[] = [
      block('p0', 0, 0),
      float('fl', 1, 'left', 106, 260),
      block('p1', 2, 100),
      block('p2', 3, 200, 130),
      float('w', 4, 'left', 356, 406),
      block('p3', 5, 350),
    ];
    const room = widgetRoom(tallP2, 'w', LEFT_33, COLUMN.width, 50);
    expect(adjacentSlot(tallP2, 'w', 'up', room, 'top')).toBe('p0');
    expect(adjacentSlot(tallP2, 'w', 'up', room, 'bottom')).toBe('p2');
  });

  it('steps widths through the allowed ones', () => {
    expect(stepWidth('33%', 1, 682)).toBe('38%');
    expect(stepWidth('33%', -1, 682)).toBe('25%');
    expect(stepWidth('44%', 1, 682)).toBe('50%');
    expect(stepWidth('44%', -1, 682)).toBe('38%');
    expect(stepWidth('50%', 1, 682)).toBe(null);
    expect(stepWidth('25%', -1, 682)).toBe(null);
    expect(stepWidth(null, -1, 682)).toBe('50%');
    // 25% of 528 is under 150px: never stepped to.
    expect(stepWidth('33%', -1, 528)).toBe(null);
  });
});

describe('room in place (the gear)', () => {
  it('keeps a full-width widget full width beside another widget, and checks top and bottom', () => {
    // w, full width, put in a slot: an empty one, right below the block before it, so nothing after it moves
    // up when it floats.
    const at = (index: number, y: number) => post().map(b => b.key === 'w' ? { ...b, index, top: y, bottom: y } : b);
    // At the end of the post nothing is in the way.
    expect(roomInPlace(at(10, 780), 'w', LEFT_33, COLUMN.width, 80)).toBe(true);
    // Before p4, where fr lines up: no room on either side.
    expect(roomInPlace(at(6.5, 480), 'w', LEFT_33, COLUMN.width, 80)).toBe(false);
    expect(roomInPlace(at(6.5, 480), 'w', RIGHT_33, COLUMN.width, 80)).toBe(false);
    // Before p5 it would line up with p5, whose top fr (to 640) is still beside.
    expect(roomInPlace(post(), 'w', LEFT_33, COLUMN.width, 80)).toBe(false);
    // Before p2, fl's end is beside p2's top, but not its bottom for a short widget.
    expect(roomInPlace(at(2.5, 180), 'w', LEFT_33, COLUMN.width, 15)).toBe(false);
    expect(roomInPlace(at(2.5, 180), 'w', withAlign(LEFT_33, 'bottom'), COLUMN.width, 15)).toBe(true);
  });

  it('judges a full-width widget made to float with the text after it moved up into its place', () => {
    // x, full width, starts below the right float r (which runs on past p1); p2 after it.
    const blocks = (rBottom: number): BlockBox[] => [
      block('p0', 0, 0),
      float('r', 1, 'right', 106, rBottom),
      block('p1', 2, 100),
      { ...block('x', 3, Math.max(198, rBottom + 16), 200, 'widget'), clears: true },
      block('p2', 4, Math.max(198, rBottom + 16) + 218),
    ];
    // Floating, x lines up with p2, which moves up to 198: still beside r (to 400), so no room.
    expect(roomInPlace(blocks(400), 'x', LEFT_33, COLUMN.width, 200)).toBe(false);
    // With r ending at 150, p2 is clear of it.
    expect(roomInPlace(blocks(150), 'x', LEFT_33, COLUMN.width, 200)).toBe(true);
  });
});

describe('shrink warning', () => {
  const fit = (zoom: number, minText: number | null, minTextInDrawing = false): IframeWidgetFit =>
    ({ width: 225, zoom, minText, minTextInDrawing });

  it('says nothing for a widget shown at a readable size', () => {
    expect(shrinkWarning(null)).toBe(null);
    expect(shrinkWarning(fit(1, 9.5))).toBe(null);
    // Right at the limits is still fine.
    expect(shrinkWarning(fit(0.85, 12))).toBe(null);
    expect(shrinkWarning(fit(0.93, 7))).toBe(null);
    // The engine diagram's labels at normal width.
    expect(shrinkWarning(fit(1, 7.2, true))).toBe(null);
  });

  it('warns about a widget zoomed down to fit, with its smallest text', () => {
    // The fixed 620px widget at 33% of the normal column.
    expect(shrinkWarning(fit(0.3629, 4.72))).toBe('Shrunk to 36% · text 4.7px');
    expect(shrinkWarning(fit(0.8, 12.4))).toBe('Shrunk to 80% · text 12px');
    expect(shrinkWarning(fit(0.5, null))).toBe('Shrunk to 50%');
  });

  it('warns about tiny text even when nothing was zoomed, naming chart labels', () => {
    // The time-horizon chart at 50%: never zoomed, but its SVG labels shrink with the chart.
    expect(shrinkWarning(fit(1, 4.8, true))).toBe('Chart labels 4.8px');
    expect(shrinkWarning(fit(1, 6.5))).toBe('Smallest text 6.5px');
    expect(shrinkWarning(fit(0.9, 6.81, true))).toBe('Shrunk to 90% · chart labels 6.8px');
  });

  it('only trusts a measurement taken at about the width shown', () => {
    expect(fitMatchesWidth(fit(1, 10), 225)).toBe(true);
    expect(fitMatchesWidth(fit(1, 10), 227)).toBe(true);
    expect(fitMatchesWidth(fit(1, 10), 229)).toBe(false);
  });

  it('reads the fit a measuring frame sends, and ignores anything malformed', () => {
    expect(readIframeWidgetFit({ type: 'iframe-widget-resize', height: 300 })).toBe(null);
    expect(readIframeWidgetFit({ fit: { width: 225, zoom: 0.36, minText: 4.7, minTextInDrawing: false } }))
      .toEqual({ width: 225, zoom: 0.36, minText: 4.7, minTextInDrawing: false });
    expect(readIframeWidgetFit({ fit: { width: 341, zoom: 1, minText: null, minTextInDrawing: true } }))
      .toEqual({ width: 341, zoom: 1, minText: null, minTextInDrawing: true });
    // A widget can post anything: bad numbers are dropped, a zoom over 1 means no zoom.
    expect(readIframeWidgetFit({ fit: { width: '225', zoom: 1 } })).toBe(null);
    expect(readIframeWidgetFit({ fit: { width: 225, zoom: 0 } })).toBe(null);
    expect(readIframeWidgetFit({ fit: { width: 225, zoom: NaN } })).toBe(null);
    expect(readIframeWidgetFit({ fit: { width: 225, zoom: 3, minText: -1, minTextInDrawing: 'yes' } }))
      .toEqual({ width: 225, zoom: 1, minText: null, minTextInDrawing: false });
    expect(readIframeWidgetFit(null)).toBe(null);
    expect(readIframeWidgetFit('iframe-widget-resize')).toBe(null);
  });

  it('measures only in frames that ask for it', () => {
    expect(injectResizeScript('<p>hi</p>')).toContain('var MEASURE = false;');
    expect(injectResizeScript('<p>hi</p>', { measure: true })).toContain('var MEASURE = true;');
    expect(injectResizeScript('<p>hi</p>', { measure: true }).startsWith('<p>hi</p>')).toBe(true);
  });
});

describe('bottom alignment', () => {
  const RIGHT_33_BOTTOM: IframeWidgetLayout = { position: 'right', width: '33%', align: 'bottom' };

  it('reads and writes align=bottom, only for a left or right widget', () => {
    expect(parseIframeWidgetLayout('<meta name="lw-layout" content="position=right width=33% align=bottom"><p>x</p>'))
      .toEqual(RIGHT_33_BOTTOM);
    expect(parseIframeWidgetLayout('<meta name="lw-layout" content="position=inline align=bottom"><p>x</p>'))
      .toEqual(INLINE);
    expect(setIframeWidgetLayout('<p>x</p>', RIGHT_33_BOTTOM))
      .toBe('<meta name="lw-layout" content="position=right width=33% align=bottom">\n<p>x</p>');
    expect(setIframeWidgetLayout('<p>x</p>', withAlign(RIGHT_33_BOTTOM, 'top')))
      .toBe('<meta name="lw-layout" content="position=right width=33%">\n<p>x</p>');
    expect(alignOf(withAlign(INLINE, 'bottom'))).toBe('top');
    expect(sameLayout(RIGHT_33, RIGHT_33_BOTTOM)).toBe(false);
    expect(sameLayout(RIGHT_33, withAlign(RIGHT_33_BOTTOM, 'top'))).toBe(true);
  });

  it('lines a wrapping widget up with the bottom of the paragraph whose lower half the pointer is over', () => {
    // p3 runs from 400 to 480, with nothing beside it: its upper half means its top, its lower half its bottom.
    const upper = slot({ layout: RIGHT_33, pointerX: 600, pointerY: 420, ghostHeight: 50 });
    expect([upper.slotKey, alignOf(upper.layout)]).toEqual(['p3', 'top']);
    const lower = slot({ layout: RIGHT_33, pointerX: 600, pointerY: 460, ghostHeight: 50 });
    expect([lower.slotKey, lower.beforeKey, alignOf(lower.layout)]).toEqual(['p3', 'p3', 'bottom']);
    // The ghost ends at the paragraph's bottom, where the line is.
    expect([lower.ghostTop, lower.lineY]).toEqual([430, 480]);
    expect(moveChipText(lower, RIGHT_33)).toBe('Right · 33% · bottom of the paragraph');
    // In the gap after it, it's the top of the next paragraph again (with fr there, the next with room).
    const gap = slot({ layout: RIGHT_33, pointerX: 600, pointerY: 486, ghostHeight: 50 });
    expect([gap.slotKey, alignOf(gap.layout)]).toEqual(['p5', 'top']);
    const noFr = post().filter(b => b.key !== 'fr');
    const gapNoFr = slot({ blocks: noFr, layout: RIGHT_33, pointerX: 600, pointerY: 486, ghostHeight: 50 });
    expect([gapNoFr.slotKey, alignOf(gapNoFr.layout)]).toEqual(['p4', 'top']);
  });

  it('keeps a widget taller than the paragraph at its top, and never lines up with a heading', () => {
    // Its top can't go above the paragraph's (the line between the heading and p3 is at 370). (Without fr,
    // which it would reach.)
    const tall = slot({ blocks: post().filter(b => b.key !== 'fr'), layout: RIGHT_33, pointerX: 600, pointerY: 460, ghostHeight: 200 });
    expect([alignOf(tall.layout), tall.ghostTop]).toEqual(['bottom', 370]);
    // The heading (300 to 340) is never a bottom: below its middle means the paragraph after it.
    const heading = slot({ layout: RIGHT_33, pointerX: 600, pointerY: 330, ghostHeight: 50 });
    expect([heading.slotKey, alignOf(heading.layout)]).toEqual(['p3', 'top']);
  });

  // EXPERIMENT (experiment/iframe-layout-ronny-exp3): opening or closing a section would move the widget.
  it('never lines a widget up with a collapsible section', () => {
    const blocks = post().filter(b => b.key !== 'fr').map(b => b.key === 'p3' ? { ...b, kind: 'section' as const } : b);
    // p3 (400 to 480) is now a section: its lower half means the slot after it, at the top of p4.
    const lower = slot({ blocks, layout: RIGHT_33, pointerX: 600, pointerY: 460, ghostHeight: 50 });
    expect([lower.slotKey, alignOf(lower.layout)]).toEqual(['p4', 'top']);
    // Its upper half is still the slot before it.
    const upper = slot({ blocks, layout: RIGHT_33, pointerX: 600, pointerY: 420, ghostHeight: 50 });
    expect([upper.slotKey, alignOf(upper.layout)]).toEqual(['p3', 'top']);
  });

  it('gives a full-width widget no alignment', () => {
    const full = slot({ layout: INLINE, pointerY: 160 });
    expect([full.slotKey, alignOf(full.layout)]).toEqual(['p2', 'top']);
  });

  it('dropping on its own paragraph\'s bottom only changes the alignment', () => {
    // w sits before p5 (700 to 780); as a right float there, dropped on p5's lower half.
    const blocks = post({ float: 'right', top: 706, bottom: 756 });
    const same = slot({ blocks, layout: RIGHT_33, pointerX: 600, pointerY: 760, ghostHeight: 50 });
    expect([same.slotKey, same.sameSlot, same.noOp, alignOf(same.layout)]).toEqual(['p5', true, false, 'bottom']);
    const again = slot({ blocks, layout: RIGHT_33_BOTTOM, pointerX: 600, pointerY: 760, ghostHeight: 50 });
    expect(again.noOp).toBe(true);
  });

  it('keeps the alignment when the widget is resized', () => {
    const target = resizeTarget({ edge: 'left', startLayout: RIGHT_33_BOTTOM, startWraps: true, pointerX: 682 - 260, column: COLUMN });
    expect(target.layout).toEqual({ position: 'right', width: '38%', align: 'bottom' });
  });
});
