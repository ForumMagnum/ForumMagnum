// EXPERIMENT (experiment/iframe-layout-ronny-exp3): Experiment 3, how each kind of content block behaves
// next to a partial-width widget. It has two demo posts, each with an Editor tab and a Post tab, and each
// keeping its own edits in this browser (see widgetDragEdits): the AI Futures post from Experiment 2, and
// a second post that shows every block next to a widget. The post page opens in Experiment 3's mode
// with ?widgetBlocks=<demo id>.
import { LAYOUT_DEMO_TITLE } from './constants';

export const WIDGET_BLOCKS_DEMO_PATH = "/experiment-widget-blocks-7qunirv1o86fgfg7k1e9bru6e";
export const WIDGET_BLOCKS_QUERY_PARAM = "widgetBlocks";

/** The second demo post. Found by title in the shared database, so this never changes. */
export const BLOCKS_DEMO_TITLE = "How content blocks behave next to widgets";

export type WidgetBlocksDemoId = 'ai-futures' | 'blocks';

export interface WidgetBlocksDemo {
  id: WidgetBlocksDemoId,
  /** Its name in the demo's post switcher. */
  label: string,
  title: string,
  postPath: string,
  editorPath: string,
  /** The post as the editor starts it, as JSON {base, html}. */
  defaultPostPath: string,
  storageKey: string,
}

export const WIDGET_BLOCKS_DEMOS: Record<WidgetBlocksDemoId, WidgetBlocksDemo> = {
  'ai-futures': {
    id: 'ai-futures',
    label: 'AI Futures post',
    title: LAYOUT_DEMO_TITLE,
    postPath: WIDGET_BLOCKS_DEMO_PATH,
    editorPath: `${WIDGET_BLOCKS_DEMO_PATH}/editor`,
    defaultPostPath: `${WIDGET_BLOCKS_DEMO_PATH}/default-post`,
    storageKey: 'lwWidgetBlocksEdits:ai-futures',
  },
  'blocks': {
    id: 'blocks',
    label: 'Content blocks post',
    title: BLOCKS_DEMO_TITLE,
    postPath: `${WIDGET_BLOCKS_DEMO_PATH}/blocks`,
    editorPath: `${WIDGET_BLOCKS_DEMO_PATH}/blocks/editor`,
    defaultPostPath: `${WIDGET_BLOCKS_DEMO_PATH}/blocks/default-post`,
    storageKey: 'lwWidgetBlocksEdits:blocks',
  },
};

export const WIDGET_BLOCKS_DEMO_ORDER: WidgetBlocksDemoId[] = ['ai-futures', 'blocks'];

/**
 * Which Experiment 3 demo a post page shows, if any: the content blocks post always opens in Experiment
 * 3's mode; the AI Futures post only with ?widgetBlocks=ai-futures (it is shared with the earlier
 * experiments).
 */
export function widgetBlocksDemoFor(postTitle: string, queryValue: string | undefined | null): WidgetBlocksDemo | null {
  if (postTitle === BLOCKS_DEMO_TITLE) return WIDGET_BLOCKS_DEMOS.blocks;
  if (postTitle === LAYOUT_DEMO_TITLE && queryValue === 'ai-futures') return WIDGET_BLOCKS_DEMOS['ai-futures'];
  return null;
}
