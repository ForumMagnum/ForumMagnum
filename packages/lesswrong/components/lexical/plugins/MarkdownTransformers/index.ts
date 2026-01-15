/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  CHECK_LIST,
  ELEMENT_TRANSFORMERS,
  ElementTransformer,
  MULTILINE_ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
  TextMatchTransformer,
  Transformer,
} from '@lexical/markdown';
import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
  HorizontalRuleNode,
} from '@lexical/react/LexicalHorizontalRuleNode';
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  TableCellHeaderStates,
  TableCellNode,
  TableNode,
  TableRowNode,
} from '@lexical/table';
import {
  $createTextNode,
  $createParagraphNode,
  $getRoot,
  $isParagraphNode,
  $isTextNode,
  LexicalNode,
} from 'lexical';

import {
  $createMathNode,
  $isMathNode,
  MathNode,
} from '@/components/editor/lexicalPlugins/math/MathNode';
import { generateFootnoteId } from '@/components/editor/lexicalPlugins/footnotes/constants';
import {
  $createFootnoteBackLinkNode,
  FootnoteBackLinkNode,
} from '@/components/editor/lexicalPlugins/footnotes/FootnoteBackLinkNode';
import {
  $createFootnoteContentNode,
  FootnoteContentNode,
} from '@/components/editor/lexicalPlugins/footnotes/FootnoteContentNode';
import {
  $createFootnoteItemNode,
  $isFootnoteItemNode,
  FootnoteItemNode,
} from '@/components/editor/lexicalPlugins/footnotes/FootnoteItemNode';
import {
  $createFootnoteReferenceNode,
  $isFootnoteReferenceNode,
  FootnoteReferenceNode,
} from '@/components/editor/lexicalPlugins/footnotes/FootnoteReferenceNode';
import {
  $createFootnoteSectionNode,
  $isFootnoteSectionNode,
  FootnoteSectionNode,
} from '@/components/editor/lexicalPlugins/footnotes/FootnoteSectionNode';
import {$createImageNode, $isImageNode, ImageNode} from '../../nodes/ImageNode';
// import {$createTweetNode, $isTweetNode, TweetNode} from '../../embeds/TwitterEmbed/TweetNode';
import emojiList from '../../utils/emoji-list';

export const HR: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node: LexicalNode) => {
    return $isHorizontalRuleNode(node) ? '***' : null;
  },
  regExp: /^(---|\*\*\*|___)\s?$/,
  replace: (parentNode, _1, _2, isImport) => {
    const line = $createHorizontalRuleNode();

    // TODO: Get rid of isImport flag
    if (isImport || parentNode.getNextSibling() != null) {
      parentNode.replace(line);
    } else {
      parentNode.insertBefore(line);
    }

    line.selectNext();
  },
  type: 'element',
};

export const IMAGE: TextMatchTransformer = {
  dependencies: [ImageNode],
  export: (node) => {
    if (!$isImageNode(node)) {
      return null;
    }

    return `![${node.getAltText()}](${node.getSrc()})`;
  },
  importRegExp: /!(?:\[([^[]*)\])(?:\(([^(]+)\))/,
  regExp: /!(?:\[([^[]*)\])(?:\(([^(]+)\))$/,
  replace: (textNode, match) => {
    const [, altText, src] = match;
    const imageNode = $createImageNode({
      altText,
      maxWidth: 800,
      src,
    });
    textNode.replace(imageNode);
  },
  trigger: ')',
  type: 'text-match',
};

export const EMOJI: TextMatchTransformer = {
  dependencies: [],
  export: () => null,
  importRegExp: /:([a-z0-9_]+):/,
  regExp: /:([a-z0-9_]+):$/,
  replace: (textNode, [, name]) => {
    const emoji = emojiList.find((e) => e.aliases.includes(name))?.emoji;
    if (emoji) {
      textNode.replace($createTextNode(emoji));
    }
  },
  trigger: ':',
  type: 'text-match',
};

export const EQUATION: TextMatchTransformer = {
  dependencies: [MathNode],
  export: (node) => {
    if (!$isMathNode(node)) {
      return null;
    }

    return `$${node.getEquation()}$`;
  },
  importRegExp: /\$([^$]+?)\$/,
  regExp: /\$([^$]+?)\$$/,
  replace: (textNode, match) => {
    const [, equation] = match;
    const equationNode = $createMathNode(equation, true);
    textNode.replace(equationNode);
  },
  trigger: '$',
  type: 'text-match',
};

function $getFootnoteSection(): FootnoteSectionNode | null {
  const root = $getRoot();
  const children = root.getChildren();
  for (const child of children) {
    if ($isFootnoteSectionNode(child)) {
      return child;
    }
  }
  return null;
}

function $getFootnoteItems(section: FootnoteSectionNode): FootnoteItemNode[] {
  const items: FootnoteItemNode[] = [];
  for (const child of section.getChildren()) {
    if ($isFootnoteItemNode(child)) {
      items.push(child);
    }
  }
  return items;
}

function $getFootnoteItemByIndex(
  section: FootnoteSectionNode,
  index: number,
): FootnoteItemNode | null {
  const items = $getFootnoteItems(section);
  return items.find((item) => item.getFootnoteIndex() === index) ?? null;
}

export const FOOTNOTE: TextMatchTransformer = {
  dependencies: [
    FootnoteReferenceNode,
    FootnoteSectionNode,
    FootnoteItemNode,
    FootnoteContentNode,
    FootnoteBackLinkNode,
  ],
  export: (node) => {
    if (!$isFootnoteReferenceNode(node)) {
      return null;
    }
    return `[^${node.getFootnoteIndex()}]`;
  },
  importRegExp: /\[\^([0-9]+)\]/,
  regExp: /\[\^([0-9]+)\]$/,
  replace: (textNode, match) => {
    const index = Number.parseInt(match[1], 10);
    if (!Number.isFinite(index) || index < 1) {
      return;
    }

    let section = $getFootnoteSection();
    if (!section) {
      if (index !== 1) {
        return;
      }
      section = $createFootnoteSectionNode();
      $getRoot().append(section);
    }

    const items = $getFootnoteItems(section);
    const maxAllowedIndex = items.length + 1;
    if (index > maxAllowedIndex) {
      return;
    }

    let footnoteId: string;
    if (index === maxAllowedIndex) {
      footnoteId = generateFootnoteId();
      const footnoteItem = $createFootnoteItemNode(footnoteId, index);
      const footnoteBackLink = $createFootnoteBackLinkNode(footnoteId);
      const footnoteContent = $createFootnoteContentNode();
      const paragraph = $createParagraphNode();
      footnoteContent.append(paragraph);
      footnoteItem.append(footnoteBackLink);
      footnoteItem.append(footnoteContent);
      section.append(footnoteItem);
    } else {
      const existingItem = $getFootnoteItemByIndex(section, index);
      if (!existingItem) {
        return;
      }
      footnoteId = existingItem.getFootnoteId();
    }

    const referenceNode = $createFootnoteReferenceNode(footnoteId, index);
    textNode.replace(referenceNode);
  },
  trigger: ']',
  type: 'text-match',
};

// export const TWEET: ElementTransformer = {
//   dependencies: [TweetNode],
//   export: (node) => {
//     if (!$isTweetNode(node)) {
//       return null;
//     }
//
//     return `<tweet id="${node.getId()}" />`;
//   },
//   regExp: /<tweet id="([^"]+?)"\s?\/>\s?$/,
//   replace: (textNode, _1, match) => {
//     const [, id] = match;
//     const tweetNode = $createTweetNode(id);
//     textNode.replace(tweetNode);
//   },
//   type: 'element',
// };

// Very primitive table setup
const TABLE_ROW_REG_EXP = /^(?:\|)(.+)(?:\|)\s?$/;
const TABLE_ROW_DIVIDER_REG_EXP = /^(\| ?:?-*:? ?)+\|\s?$/;

export const TABLE: ElementTransformer = {
  dependencies: [TableNode, TableRowNode, TableCellNode],
  export: (node: LexicalNode) => {
    if (!$isTableNode(node)) {
      return null;
    }

    const output: string[] = [];

    for (const row of node.getChildren()) {
      const rowOutput = [];
      if (!$isTableRowNode(row)) {
        continue;
      }

      let isHeaderRow = false;
      for (const cell of row.getChildren()) {
        // It's TableCellNode so it's just to make flow happy
        if ($isTableCellNode(cell)) {
          rowOutput.push(
            $convertToMarkdownString(PLAYGROUND_TRANSFORMERS, cell)
              .replace(/\n/g, '\\n')
              .trim(),
          );
          if (cell.__headerState === TableCellHeaderStates.ROW) {
            isHeaderRow = true;
          }
        }
      }

      output.push(`| ${rowOutput.join(' | ')} |`);
      if (isHeaderRow) {
        output.push(`| ${rowOutput.map((_) => '---').join(' | ')} |`);
      }
    }

    return output.join('\n');
  },
  regExp: TABLE_ROW_REG_EXP,
  replace: (parentNode, _1, match) => {
    // Header row
    if (TABLE_ROW_DIVIDER_REG_EXP.test(match[0])) {
      const table = parentNode.getPreviousSibling();
      if (!table || !$isTableNode(table)) {
        return;
      }

      const rows = table.getChildren();
      const lastRow = rows[rows.length - 1];
      if (!lastRow || !$isTableRowNode(lastRow)) {
        return;
      }

      // Add header state to row cells
      lastRow.getChildren().forEach((cell) => {
        if (!$isTableCellNode(cell)) {
          return;
        }
        cell.setHeaderStyles(
          TableCellHeaderStates.ROW,
          TableCellHeaderStates.ROW,
        );
      });

      // Remove line
      parentNode.remove();
      return;
    }

    const matchCells = mapToTableCells(match[0]);

    if (matchCells == null) {
      return;
    }

    const rows = [matchCells];
    let sibling = parentNode.getPreviousSibling();
    let maxCells = matchCells.length;

    while (sibling) {
      if (!$isParagraphNode(sibling)) {
        break;
      }

      if (sibling.getChildrenSize() !== 1) {
        break;
      }

      const firstChild = sibling.getFirstChild();

      if (!$isTextNode(firstChild)) {
        break;
      }

      const cells = mapToTableCells(firstChild.getTextContent());

      if (cells == null) {
        break;
      }

      maxCells = Math.max(maxCells, cells.length);
      rows.unshift(cells);
      const previousSibling = sibling.getPreviousSibling();
      sibling.remove();
      sibling = previousSibling;
    }

    const table = $createTableNode();

    for (const cells of rows) {
      const tableRow = $createTableRowNode();
      table.append(tableRow);

      for (let i = 0; i < maxCells; i++) {
        tableRow.append(i < cells.length ? cells[i] : $createTableCell(''));
      }
    }

    const previousSibling = parentNode.getPreviousSibling();
    if (
      $isTableNode(previousSibling) &&
      getTableColumnsSize(previousSibling) === maxCells
    ) {
      previousSibling.append(...table.getChildren());
      parentNode.remove();
    } else {
      parentNode.replace(table);
    }

    table.selectEnd();
  },
  type: 'element',
};

function getTableColumnsSize(table: TableNode) {
  const row = table.getFirstChild();
  return $isTableRowNode(row) ? row.getChildrenSize() : 0;
}

const $createTableCell = (textContent: string): TableCellNode => {
  textContent = textContent.replace(/\\n/g, '\n');
  const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);
  $convertFromMarkdownString(textContent, PLAYGROUND_TRANSFORMERS, cell);
  return cell;
};

const mapToTableCells = (textContent: string): Array<TableCellNode> | null => {
  const match = textContent.match(TABLE_ROW_REG_EXP);
  if (!match || !match[1]) {
    return null;
  }
  return match[1].split('|').map((text) => $createTableCell(text));
};

export const PLAYGROUND_TRANSFORMERS: Array<Transformer> = [
  TABLE,
  HR,
  IMAGE,
  EMOJI,
  FOOTNOTE,
  EQUATION,
  // TWEET,
  CHECK_LIST,
  ...ELEMENT_TRANSFORMERS,
  ...MULTILINE_ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
];
