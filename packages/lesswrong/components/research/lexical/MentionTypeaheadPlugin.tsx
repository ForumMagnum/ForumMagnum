'use client';

import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createTextNode,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  type TextNode,
} from 'lexical';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import * as ReactDOM from 'react-dom';
import classNames from 'classnames';
import moment from 'moment';
import { useMessages } from '@/components/common/withMessages';
import { EditorUserModeContext } from '@/components/common/sharedContexts';
import { EditorUserMode } from '@/components/editor/lexicalPlugins/suggestions/EditorUserMode';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import {
  typeaheadPopover,
  typeaheadList,
  typeaheadListItem,
  typeaheadItem,
  componentPickerMenu,
} from '@/components/lexical/styles/typeaheadStyles';
import ForumIcon, { type ForumIconName } from '@/components/common/ForumIcon';
import { $createMentionNode } from './MentionNode';
import { type MentionKind } from './mentionFormat';

const MentionTypeaheadProjectResourcesQuery = gql(`
  query MentionTypeaheadProjectResourcesQuery($projectId: String!) {
    researchDocuments(selector: { byProject: { projectId: $projectId } }, limit: 200) {
      results { _id title createdAt }
    }
    researchConversations(selector: { byProject: { projectId: $projectId } }, limit: 200) {
      results { _id title lastActivityAt }
    }
  }
`);

const KIND_ICON: Record<MentionKind, ForumIconName> = {
  doc: 'Document',
  conv: 'ChatBubbleLeftRight',
};

const KIND_UNTITLED_LABEL: Record<MentionKind, string> = {
  doc: 'Untitled document',
  conv: 'Untitled conversation',
};

const styles = defineStyles('MentionTypeahead', (theme: ThemeType) => ({
  popover: {
    ...typeaheadPopover(theme),
    ...componentPickerMenu(),
    minWidth: 280,
    maxWidth: 380,
  },
  list: {
    ...typeaheadList(theme),
    maxHeight: 320,
  },
  listItem: typeaheadListItem(theme),
  item: {
    ...typeaheadItem(theme),
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '6px 10px',
  },
  icon: {
    flex: 'none',
    marginTop: 2,
    color: theme.palette.text.dim,
    '--icon-size': '14px',
  },
  iconAssistant: {
    color: theme.palette.primary.main,
  },
  body: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  title: {
    fontSize: 13,
    color: theme.palette.text.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  meta: {
    fontSize: 11,
    color: theme.palette.text.dim,
  },
}));

interface MentionOption {
  kind: MentionKind;
  id: string;
  title: string;
  rankAt: number;
  metaText: string;
}

class MentionMenuOption extends MenuOption {
  data: MentionOption;
  constructor(data: MentionOption) {
    super(`${data.kind}:${data.id}`);
    this.data = data;
  }
}

interface MentionTypeaheadPluginProps {
  projectId: string;
}

export function MentionTypeaheadPlugin({ projectId }: MentionTypeaheadPluginProps) {
  const [editor] = useLexicalComposerContext();
  const classes = useStyles(styles);
  const [queryString, setQueryString] = useState<string | null>(null);
  const { flash } = useMessages();
  const externalModeContext = useContext(EditorUserModeContext);
  const isSuggestionMode = externalModeContext?.userMode === EditorUserMode.Suggest;

  const baseCheckForTriggerMatch = useBasicTypeaheadTriggerMatch('@', { minLength: 0 });
  // Mention chips are decorator nodes inserted directly into the document,
  // which can't be represented as tracked suggestions — suppress the
  // typeahead entirely in suggesting mode.
  const checkForTriggerMatch = useCallback(
    (text: string, editorInstance: typeof editor) =>
      isSuggestionMode ? null : baseCheckForTriggerMatch(text, editorInstance),
    [isSuggestionMode, baseCheckForTriggerMatch],
  );

  const { data } = useQuery(MentionTypeaheadProjectResourcesQuery, {
    variables: { projectId },
    fetchPolicy: 'cache-and-network',
    // Don't fetch until the user opens the typeahead — saves a round-trip
    // on every workspace mount.
    skip: queryString === null,
  });

  const allOptions = useMemo<MentionOption[]>(() => {
    const docs = (data?.researchDocuments?.results ?? []).map<MentionOption>((d) => ({
      kind: 'doc',
      id: d._id,
      title: d.title && d.title.length > 0 ? d.title : KIND_UNTITLED_LABEL.doc,
      rankAt: new Date(d.createdAt).getTime(),
      metaText: `Document · ${moment(d.createdAt).fromNow()}`,
    }));
    const convs = (data?.researchConversations?.results ?? []).map<MentionOption>((c) => {
      const lastActivityAt = c.lastActivityAt ?? new Date(0);
      return {
        kind: 'conv',
        id: c._id,
        title: c.title && c.title.length > 0 ? c.title : KIND_UNTITLED_LABEL.conv,
        rankAt: new Date(lastActivityAt).getTime(),
        metaText: `Conversation · ${moment(lastActivityAt).fromNow()}`,
      };
    });
    return [...docs, ...convs].sort((a, b) => b.rankAt - a.rankAt);
  }, [data]);

  const options = useMemo<MentionMenuOption[]>(() => {
    const filtered = !queryString
      ? allOptions
      : allOptions.filter((o) => o.title.toLowerCase().includes(queryString.toLowerCase()));
    return filtered.slice(0, 12).map((o) => new MentionMenuOption(o));
  }, [allOptions, queryString]);

  const onSelectOption = useCallback(
    (
      selected: MentionMenuOption,
      nodeToRemove: TextNode | null,
      closeMenu: () => void,
    ) => {
      if (isSuggestionMode) {
        flash({ messageString: 'Mentions are not supported in suggesting mode', type: 'error' });
        closeMenu();
        return;
      }
      editor.update(() => {
        nodeToRemove?.remove();
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        const mentionNode = $createMentionNode({
          kind: selected.data.kind,
          id: selected.data.id,
          title: selected.data.title,
        });
        // Trailing space so the next keystroke goes after the chip, not into
        // Lexical's after-decorator no-op zone.
        const spaceNode = $createTextNode(' ');
        $insertNodes([mentionNode, spaceNode]);
        spaceNode.select();
      });
      closeMenu();
    },
    [editor, isSuggestionMode, flash],
  );

  return (
    <LexicalTypeaheadMenuPlugin<MentionMenuOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForTriggerMatch}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) => (
        anchorElementRef.current && options.length
          ? ReactDOM.createPortal(
              <div className={classes.popover}>
                <ul className={classes.list}>
                  {options.map((option, i) => (
                    <MentionMenuRow
                      key={option.key}
                      classes={classes}
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
      )}
    />
  );
}

interface MentionMenuRowProps {
  classes: Record<string, string>;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  option: MentionMenuOption;
  index: number;
}

function MentionMenuRow({
  classes,
  isSelected,
  onClick,
  onMouseEnter,
  option,
  index,
}: MentionMenuRowProps) {
  const data = option.data;
  return (
    <li
      key={option.key}
      tabIndex={-1}
      className={classNames(classes.item, classes.listItem, { selected: isSelected })}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      id={'research-mention-item-' + index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <ForumIcon
        icon={KIND_ICON[data.kind]}
        className={classNames(classes.icon, data.kind === 'conv' && classes.iconAssistant)}
      />
      <span className={classes.body}>
        <span className={classes.title}>{data.title}</span>
        <span className={classes.meta}>{data.metaText}</span>
      </span>
    </li>
  );
}

