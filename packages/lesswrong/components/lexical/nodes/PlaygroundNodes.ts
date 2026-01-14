/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Klass, LexicalNode} from 'lexical';

import {CodeHighlightNode, CodeNode} from '@lexical/code';
import {HashtagNode} from '@lexical/hashtag';
import {AutoLinkNode, LinkNode} from '@lexical/link';
import {ListItemNode, ListNode} from '@lexical/list';
import {MarkNode} from '@lexical/mark';
import {OverflowNode} from '@lexical/overflow';
import {HorizontalRuleNode} from '@lexical/react/LexicalHorizontalRuleNode';
import {HeadingNode, QuoteNode} from '@lexical/rich-text';
import {TableCellNode, TableNode, TableRowNode} from '@lexical/table';

import {CollapsibleContainerNode} from '../plugins/CollapsiblePlugin/CollapsibleContainerNode';
import {CollapsibleContentNode} from '../plugins/CollapsiblePlugin/CollapsibleContentNode';
import {CollapsibleTitleNode} from '../plugins/CollapsiblePlugin/CollapsibleTitleNode';
import {AutocompleteNode} from './AutocompleteNode';
import {DateTimeNode} from './DateTimeNode/DateTimeNode';
import {EmojiNode} from './EmojiNode';
import {EquationNode} from './EquationNode';
// import {ExcalidrawNode} from './ExcalidrawNode';
import {FigmaNode} from './FigmaNode';
import {ImageNode} from './ImageNode';
import {KeywordNode} from './KeywordNode';
import {LayoutContainerNode} from './LayoutContainerNode';
import {LayoutItemNode} from './LayoutItemNode';
import {MentionNode} from './MentionNode';
import {PageBreakNode} from './PageBreakNode';
import {PollNode} from './PollNode';
import {SpecialTextNode} from './SpecialTextNode';
import {StickyNode} from './StickyNode';
// import {TweetNode} from '../embeds/TwitterEmbed/TweetNode';
import {YouTubeNode} from '../embeds/YouTubeEmbed/YouTubeNode';
import {MetaculusNode} from '../embeds/MetaculusEmbed/MetaculusNode';
import {ThoughtsaverNode} from '../embeds/ThoughtsaverEmbed/ThoughtsaverNode';
import {ManifoldNode} from '../embeds/ManifoldEmbed/ManifoldNode';
import {NeuronpediaNode} from '../embeds/NeuronpediaEmbed/NeuronpediaNode';
import {StrawpollNode} from '../embeds/StrawpollEmbed/StrawpollNode';
import {MetaforecastNode} from '../embeds/MetaforecastEmbed/MetaforecastNode';
import {OWIDNode} from '../embeds/OWIDEmbed/OWIDNode';
import {EstimakerNode} from '../embeds/EstimakerEmbed/EstimakerNode';
import {ViewpointsNode} from '../embeds/ViewpointsEmbed/ViewpointsNode';
import {CalendlyNode} from '../embeds/CalendlyEmbed/CalendlyNode';
import {LWArtifactsNode} from '../embeds/LWArtifactsEmbed/LWArtifactsNode';
import { SpoilerNode } from '@/components/editor/lexicalPlugins/spoilers/SpoilerNode';
import { ClaimNode } from '../embeds/ElicitEmbed/ClaimNode';
import { FootnoteBackLinkNode } from '@/components/editor/lexicalPlugins/footnotes/FootnoteBackLinkNode';
import { FootnoteContentNode } from '@/components/editor/lexicalPlugins/footnotes/FootnoteContentNode';
import { FootnoteItemNode } from '@/components/editor/lexicalPlugins/footnotes/FootnoteItemNode';
import { FootnoteReferenceNode } from '@/components/editor/lexicalPlugins/footnotes/FootnoteReferenceNode';
import { FootnoteSectionNode } from '@/components/editor/lexicalPlugins/footnotes/FootnoteSectionNode';

const PlaygroundNodes: Array<Klass<LexicalNode>> = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  CodeNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  HashtagNode,
  CodeHighlightNode,
  AutoLinkNode,
  LinkNode,
  OverflowNode,
  PollNode,
  StickyNode,
  ImageNode,
  MentionNode,
  EmojiNode,
  // ExcalidrawNode,
  EquationNode,
  AutocompleteNode,
  KeywordNode,
  HorizontalRuleNode,
  // TweetNode,
  YouTubeNode,
  MetaculusNode,
  ThoughtsaverNode,
  ManifoldNode,
  NeuronpediaNode,
  StrawpollNode,
  MetaforecastNode,
  OWIDNode,
  EstimakerNode,
  ViewpointsNode,
  CalendlyNode,
  LWArtifactsNode,
  FigmaNode,
  MarkNode,
  CollapsibleContainerNode,
  CollapsibleContentNode,
  CollapsibleTitleNode,
  PageBreakNode,
  LayoutContainerNode,
  LayoutItemNode,
  SpecialTextNode,
  DateTimeNode,

  // Custom plugin nodes
  FootnoteReferenceNode,
  FootnoteSectionNode,
  FootnoteItemNode,
  FootnoteContentNode,
  FootnoteBackLinkNode,
  SpoilerNode,
  ClaimNode,
];

export default PlaygroundNodes;
