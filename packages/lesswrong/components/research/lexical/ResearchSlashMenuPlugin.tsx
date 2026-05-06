'use client';

import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { TextNode } from 'lexical';
import React, { useCallback, useMemo, useState } from 'react';
import * as ReactDOM from 'react-dom';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import {
  typeaheadPopover,
  typeaheadList,
  typeaheadListItem,
  typeaheadItem,
  typeaheadItemText,
  componentPickerMenu,
} from '@/components/lexical/styles/typeaheadStyles';
import { INSERT_AGENT_BLOCK_COMMAND } from './AgentBlockPlugin';

const styles = defineStyles('ResearchSlashMenu', (theme: ThemeType) => ({
  popover: {
    ...typeaheadPopover(theme),
    ...componentPickerMenu(),
  },
  list: {
    ...typeaheadList(theme),
    maxHeight: 400,
  },
  listItem: typeaheadListItem(theme),
  item: typeaheadItem(theme),
  text: typeaheadItemText(),
}));

class ResearchSlashOption extends MenuOption {
  title: string;
  keywords: string[];
  onSelect: () => void;

  constructor(title: string, opts: { keywords?: string[]; onSelect: () => void }) {
    super(title);
    this.title = title;
    this.keywords = opts.keywords ?? [];
    this.onSelect = opts.onSelect.bind(this);
  }
}

interface ResearchSlashMenuItemProps {
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  option: ResearchSlashOption;
  index: number;
}

function ResearchSlashMenuItem({
  isSelected,
  onClick,
  onMouseEnter,
  option,
  index,
}: ResearchSlashMenuItemProps) {
  const classes = useStyles(styles);
  return (
    <li
      key={option.key}
      tabIndex={-1}
      className={classNames(classes.item, classes.listItem, { selected: isSelected })}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      id={'research-slash-item-' + index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <span className={classes.text}>{option.title}</span>
    </li>
  );
}

/**
 * Slash menu specific to the research workspace. Currently exposes a single
 * `/query` command that creates a new AgentBlock placeholder, fires a
 * conversation via the host environment, then patches the AgentBlock with the
 * new conversationId.
 *
 * The research document host disables the standard ComponentPickerPlugin while
 * mounting this, so the user sees exactly one slash menu.
 */
export function ResearchSlashMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const classes = useStyles(styles);
  const [queryString, setQueryString] = useState<string | null>(null);

  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch('/', { minLength: 0 });

  const insertEmptyAgentBlock = useCallback(() => {
    editor.dispatchCommand(INSERT_AGENT_BLOCK_COMMAND, {
      conversationId: '',
      placement: 'at-selection',
    });
  }, [editor]);

  const options = useMemo<ResearchSlashOption[]>(() => {
    const base = [
      new ResearchSlashOption('Query (research agent)', {
        keywords: ['query', 'agent', 'ask', 'research', 'claude'],
        onSelect: insertEmptyAgentBlock,
      }),
    ];
    if (!queryString) return base;
    const regex = new RegExp(queryString, 'i');
    return base.filter(
      (o) => regex.test(o.title) || o.keywords.some((kw) => regex.test(kw)),
    );
  }, [queryString, insertEmptyAgentBlock]);

  const onSelectOption = useCallback(
    (
      selected: ResearchSlashOption,
      nodeToRemove: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        nodeToRemove?.remove();
      });
      selected.onSelect();
      closeMenu();
    },
    [editor],
  );

  return (
    <LexicalTypeaheadMenuPlugin<ResearchSlashOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForTriggerMatch}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) =>
        anchorElementRef.current && options.length
          ? ReactDOM.createPortal(
              <div className={classes.popover}>
                <ul className={classes.list}>
                  {options.map((option, i) => (
                    <ResearchSlashMenuItem
                      key={option.key}
                      index={i}
                      option={option}
                      isSelected={selectedIndex === i}
                      onClick={() => {
                        setHighlightedIndex(i);
                        selectOptionAndCleanUp(option);
                      }}
                      onMouseEnter={() => setHighlightedIndex(i)}
                    />
                  ))}
                </ul>
              </div>,
              anchorElementRef.current,
            )
          : null
      }
    />
  );
}
