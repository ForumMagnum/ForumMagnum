/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { type JSX } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  type MenuTextMatch,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { $createTextNode, $getSelection, $isRangeSelection, $isTextNode, TextNode } from 'lexical';
import { $createLinkNode, $isLinkNode, type LinkNode } from '@lexical/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import * as ReactDOM from 'react-dom';

import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import {
  typeaheadPopover,
  typeaheadList,
  typeaheadListItem,
  typeaheadItem,
  typeaheadItemText,
} from '../../styles/typeaheadStyles';
import {
  getLexicalMentionFeeds,
  type MentionFeed,
} from '@/components/editor/lexicalPlugins/mentions/lexicalMentionsConfig';
import type { MentionItem } from '@/components/editor/lexicalPlugins/mentions/MentionDropdown';
import { userMentionQuery, userMentionValue } from '@/lib/pingback';

const styles = defineStyles('LexicalMentions', (theme: ThemeType) => ({
  popover: {
    ...typeaheadPopover(theme),
    minWidth: 220,
    maxWidth: 420,
  },
  list: {
    ...typeaheadList(theme),
    width: '100%',
    maxHeight: 280,
    overflowY: 'auto',
  },
  listItem: typeaheadListItem(theme),
  item: {
    ...typeaheadItem(theme),
    width: '100%',
  },
  text: typeaheadItemText(),
  itemContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  itemLabel: {
    fontSize: '14px',
    color: theme.palette.text.normal,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemDescription: {
    fontSize: '12px',
    color: theme.palette.grey[600],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}));

const MAX_MENTION_LENGTH = 20;
const FEED_DEBOUNCE_MS = 100;
const DEFAULT_SUGGESTION_LIMIT = 10;

let cachedUnicodePropertySupport: boolean | null = null;

function supportsUnicodePropertyEscapes(): boolean {
  if (cachedUnicodePropertySupport != null) {
    return cachedUnicodePropertySupport;
  }
  try {
    void new RegExp('\\p{Ps}', 'u');
    cachedUnicodePropertySupport = true;
  } catch {
    cachedUnicodePropertySupport = false;
  }
  return cachedUnicodePropertySupport;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createMentionRegExp(marker: string, minimumCharacters: number): RegExp {
  const numberOfCharacters = `{${minimumCharacters},${MAX_MENTION_LENGTH}}`;
  const openAfterCharacters = supportsUnicodePropertyEscapes()
    ? '\\p{Ps}\\p{Pi}"\''
    : '\\(\\[{"\'';
  const pattern = `(?:^|[ ${openAfterCharacters}])([${escapeRegex(marker)}])(.${numberOfCharacters})$`;
  return new RegExp(pattern, 'u');
}

type MentionMatch = {
  match: MenuTextMatch;
  feed: MentionFeed;
};

function getMentionMatch(text: string, feeds: MentionFeed[]): MentionMatch | null {
  let bestMatch: MentionMatch | null = null;
  let bestPosition = -1;

  for (const feed of feeds) {
    const marker = feed.marker;
    if (marker.length !== 1) {
      continue;
    }
    const markerPosition = text.lastIndexOf(marker);
    if (markerPosition < 0) {
      continue;
    }

    const splitStart = markerPosition === 0 ? 0 : markerPosition - 1;
    const textToTest = text.substring(splitStart);
    const regExp = createMentionRegExp(marker, feed.minimumCharacters ?? 0);
    const match = textToTest.match(regExp);
    if (!match) {
      continue;
    }

    const matchingString = match[2] ?? '';
    const replaceableString = `${match[1]}${matchingString}`;
    const matchData: MenuTextMatch = {
      leadOffset: markerPosition,
      matchingString,
      replaceableString,
    };

    if (markerPosition >= bestPosition) {
      bestPosition = markerPosition;
      bestMatch = { match: matchData, feed };
    }
  }

  return bestMatch;
}

function findNearestLinkNode(node: TextNode): LinkNode | null {
  let current = node.getParent();
  while (current) {
    if ($isLinkNode(current)) {
      return current;
    }
    current = current.getParent();
  }
  return null;
}

function isMentionLink(url: string): boolean {
  try {
    const parsedUrl = typeof window !== 'undefined'
      ? new URL(url, window.location.origin)
      : new URL(url, 'https://example.invalid');
    return parsedUrl.searchParams.get(userMentionQuery) === userMentionValue;
  } catch {
    return false;
  }
}

function isSelectionInsideMentionLink(): boolean {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return false;
  }
  const anchorNode = selection.anchor.getNode();
  if (!$isTextNode(anchorNode)) {
    return false;
  }
  const linkNode = findNearestLinkNode(anchorNode);
  return !!linkNode && isMentionLink(linkNode.getURL());
}

class MentionTypeaheadOption extends MenuOption {
  item: MentionItem;
  marker: string;

  constructor(item: MentionItem, marker: string) {
    super(item.id);
    this.item = item;
    this.marker = marker;
  }
}

function MentionsTypeaheadMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  option,
  classes,
  content,
}: {
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  option: MentionTypeaheadOption;
  classes: Record<string, string>;
  content: React.ReactNode;
}) {
  return (
    <li
      key={option.key}
      tabIndex={-1}
      className={classNames(classes.item, classes.listItem, { selected: isSelected })}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      id={'typeahead-item-' + index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}>
      {content}
    </li>
  );
}

function useMentionLookupService(
  mentionString: string | null,
  activeFeed: MentionFeed | null,
  dropdownLimit: number
) {
  const [results, setResults] = useState<MentionItem[]>([]);
  const lastRequestIdRef = useRef(0);

  useEffect(() => {
    if (!mentionString || !activeFeed) {
      setResults([]);
      return;
    }

    const requestId = ++lastRequestIdRef.current;
    const { feed } = activeFeed;
    const timeoutId = window.setTimeout(() => {
      const fetchResults = async () => {
        try {
          let items: MentionItem[];
          if (typeof feed === 'function') {
            const response = feed(mentionString);
            items = response instanceof Promise ? await response : response;
          } else {
            items = feed.filter(item => {
              const searchText = (item.label || item.id).toLowerCase();
              return searchText.includes(mentionString.toLowerCase());
            });
          }

          if (requestId !== lastRequestIdRef.current) {
            return;
          }
          setResults(items.slice(0, dropdownLimit));
        } catch {
          if (requestId === lastRequestIdRef.current) {
            setResults([]);
          }
        }
      };

      void fetchResults();
    }, FEED_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [mentionString, activeFeed, dropdownLimit]);

  return results;
}

export default function MentionsPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const feeds = useMemo(() => getLexicalMentionFeeds(), []);

  const [queryString, setQueryString] = useState<string | null>(null);
  const [activeFeed, setActiveFeed] = useState<MentionFeed | null>(null);
  const activeFeedRef = useRef<MentionFeed | null>(null);

  const results = useMentionLookupService(
    queryString,
    activeFeed,
    DEFAULT_SUGGESTION_LIMIT
  );

  const checkForSlashTriggerMatch = useBasicTypeaheadTriggerMatch('/', {
    minLength: 0,
  });

  const options = useMemo(
    () => results.map((item) => new MentionTypeaheadOption(item, activeFeed?.marker ?? '@')),
    [results, activeFeed]
  );

  const onSelectOption = useCallback(
    (
      selectedOption: MentionTypeaheadOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return;
        }
        const anchorNode = selection.anchor.getNode();
        const format = $isTextNode(anchorNode) ? anchorNode.getFormat() : 0;
        const style = $isTextNode(anchorNode) ? anchorNode.getStyle() : '';

        const mentionText = selectedOption.item.text || selectedOption.item.id;
        const linkNode = $createLinkNode(selectedOption.item.link);
        const mentionTextNode = $createTextNode(mentionText);
        mentionTextNode.setFormat(format);
        mentionTextNode.setStyle(style);
        linkNode.append(mentionTextNode);

        const spaceNode = $createTextNode(' ');
        spaceNode.setFormat(format);
        spaceNode.setStyle(style);

        if (nodeToReplace) {
          nodeToReplace.replace(linkNode);
          linkNode.insertAfter(spaceNode);
        } else {
          selection.insertNodes([linkNode, spaceNode]);
        }

        spaceNode.select();
      });

      closeMenu();
    },
    [editor],
  );

  const checkForMentionMatch = useCallback(
    (text: string): MenuTextMatch | null => {
      const slashMatch = checkForSlashTriggerMatch(text, editor);
      if (slashMatch !== null) {
        if (activeFeedRef.current) {
          activeFeedRef.current = null;
          setActiveFeed(null);
        }
        return null;
      }

      if (editor.getEditorState().read(() => isSelectionInsideMentionLink())) {
        if (activeFeedRef.current) {
          activeFeedRef.current = null;
          setActiveFeed(null);
        }
        return null;
      }

      const match = getMentionMatch(text, feeds);
      const nextFeed = match?.feed ?? null;
      if (activeFeedRef.current !== nextFeed) {
        activeFeedRef.current = nextFeed;
        setActiveFeed(nextFeed);
      }
      return match?.match ?? null;
    },
    [checkForSlashTriggerMatch, editor, feeds],
  );

  const classes = useStyles(styles);

  return (
    <LexicalTypeaheadMenuPlugin<MentionTypeaheadOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForMentionMatch}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) =>
        anchorElementRef.current && options.length
          ? ReactDOM.createPortal(
              <div className={classes.popover}>
                <ul className={classes.list}>
                  {options.map((option, i: number) => {
                    const item = option.item;
                    const customRenderer = activeFeed?.itemRenderer;
                    const content = customRenderer ? (
                      customRenderer(item)
                    ) : (
                      <div className={classes.itemContent}>
                        <div className={classes.itemLabel}>{item.label || item.id}</div>
                        {item.description && (
                          <div className={classes.itemDescription}>{item.description}</div>
                        )}
                      </div>
                    );

                    return (
                      <MentionsTypeaheadMenuItem
                        index={i}
                        isSelected={selectedIndex === i}
                        onClick={() => {
                          setHighlightedIndex(i);
                          selectOptionAndCleanUp(option);
                        }}
                        onMouseEnter={() => {
                          setHighlightedIndex(i);
                        }}
                        key={option.key}
                        option={option}
                        classes={classes}
                        content={content}
                      />
                    );
                  })}
                </ul>
              </div>,
              anchorElementRef.current,
            )
          : null
      }
    />
  );
}

