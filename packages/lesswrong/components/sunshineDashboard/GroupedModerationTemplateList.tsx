import React, { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import {
  DndContext,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useMutation } from '@apollo/client/react';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { ModerationTemplateSunshineItem } from './ModerationTemplateSunshineItem';
import { ModerationTemplatesForm } from '../moderationTemplates/ModerationTemplateForm';
import ForumIcon from '../common/ForumIcon';
import LWTooltip from '../common/LWTooltip';
import { useCurrentUser } from '../common/withUser';
import { getBrowserLocalStorage } from '../editor/localStorageHandlers';
import { useGlobalKeydown } from '../common/withGlobalKeydown';
import type { TemplateType } from '@/lib/collections/moderationTemplates/constants';

const ModerationTemplatesListQuery = gql(`
  query multiModerationTemplateGroupedTemplateListQuery($selector: ModerationTemplateSelector, $limit: Int, $enableTotal: Boolean) {
    moderationTemplates(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ModerationTemplateFragment
      }
      totalCount
    }
  }
`);

const UpdateModerationTemplateGroupMutation = gql(`
  mutation updateModerationTemplateGroupedTemplateList($selector: SelectorInput!, $data: UpdateModerationTemplateDataInput!) {
    updateModerationTemplate(selector: $selector, data: $data) {
      data {
        ...ModerationTemplateFragment
      }
    }
  }
`);

const UNGROUPED_TEMPLATES_LABEL = "Other";
const HIDDEN_TEMPLATES_LABEL = "Hidden";

// Hiding is per-moderator, so it lives in localStorage
const HIDDEN_TEMPLATES_STORAGE_PREFIX = 'hiddenModerationTemplates_';

function getHiddenTemplatesStorageKey(userId: string, collectionName: TemplateType) {
  return `${HIDDEN_TEMPLATES_STORAGE_PREFIX}${collectionName}_${userId}`;
}

function loadHiddenTemplateIds(userId: string, collectionName: TemplateType): string[] {
  const ls = getBrowserLocalStorage();
  const stored = ls?.getItem(getHiddenTemplatesStorageKey(userId, collectionName));
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}

function saveHiddenTemplateIds(userId: string, collectionName: TemplateType, hiddenTemplateIds: Set<string>) {
  const ls = getBrowserLocalStorage();
  ls?.setItem(getHiddenTemplatesStorageKey(userId, collectionName), JSON.stringify([...hiddenTemplateIds]));
}

function getModerationTemplatesQueryVariables(collectionName: TemplateType) {
  return {
    selector: { moderationTemplatesList: { collectionName } },
    limit: 50,
    enableTotal: false,
  };
}

function groupTemplatesByLabel(templates: ModerationTemplateFragment[]): [string, ModerationTemplateFragment[]][] {
  const grouped: Record<string, ModerationTemplateFragment[]> = {};
  const templatesWithoutGroup: ModerationTemplateFragment[] = [];

  templates.forEach(template => {
    const groupLabel = template.groupLabel;
    if (groupLabel) {
      if (!grouped[groupLabel]) {
        grouped[groupLabel] = [];
      }
      grouped[groupLabel].push(template);
    } else {
      templatesWithoutGroup.push(template);
    }
  });

  if (templatesWithoutGroup.length > 0) {
    grouped[UNGROUPED_TEMPLATES_LABEL] = templatesWithoutGroup;
  }

  return Object.entries(grouped);
}

// Same matching as the rejection dialog's template search: case-insensitive substring of the name
function templateMatchesQuery(template: ModerationTemplateFragment, lowercaseQuery: string) {
  return template.name.toLowerCase().includes(lowercaseQuery);
}

function isInTextInput(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
}

function getGroupLabelUpdateOptions(template: ModerationTemplateFragment, newGroupLabel: string | null) {
  return {
    variables: {
      selector: {_id: template._id},
      data: {groupLabel: newGroupLabel},
    },
    optimisticResponse: {
      updateModerationTemplate: {
        __typename: "ModerationTemplateOutput" as const,
        data: {
          __typename: "ModerationTemplate" as const,
          ...template,
          groupLabel: newGroupLabel,
        },
      },
    },
  };
}

const styles = defineStyles('GroupedModerationTemplateList', (theme: ThemeType) => ({
  root: {
    marginTop: 32,
    opacity: 0.5,
    display: 'flex',
    flexDirection: 'column',
    "&:hover": {
      opacity: 1,
    },
    // Typing in the search box doesn't count as hovering, so keep the list lit while it has focus
    "&:focus-within": {
      opacity: 1,
    },
  },
  listHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginBottom: 8,
  },
  // Collapsed state reads as an unopened search field: icon on the left,
  // greyed placeholder, underlined like the open input
  collapsedSearch: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 0',
    marginBottom: 8,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    cursor: 'pointer',
  },
  collapsedSearchPlaceholder: {
    fontSize: 13,
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[500],
  },
  searchIcon: {
    height: 16,
    width: 16,
    cursor: 'pointer',
    color: theme.palette.grey[600],
    '&:hover': {
      color: theme.palette.grey[900],
    },
  },
  searchInput: {
    flex: 1,
    padding: '4px 8px',
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
    fontSize: 13,
    fontFamily: theme.palette.fonts.sansSerifStack,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.normal,
    outline: 'none',
    // Necessary to override the default input styling which removes the border if the input is focused
    '&:focus': {
      border: `1px solid ${theme.palette.grey[300]}`,
    },
  },
  noSearchResults: {
    color: theme.palette.grey[600],
    fontSize: 13,
    fontStyle: 'italic',
  },
  templateGroup: {
    marginBottom: 8,
    display: 'flex',
    flexDirection: 'column',
  },
  templateGroupDropTarget: {
    backgroundColor: theme.palette.greyAlpha(0.05),
    outline: `1px dashed ${theme.palette.greyAlpha(0.3)}`,
    borderRadius: 4,
  },
  templateGroupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    cursor: 'pointer',
    marginBottom: 2,
    marginLeft: -4,
    '&:hover': {
      opacity: 0.7,
    },
  },
  templateGroupLabel: {
    fontSize: 11,
    fontWeight: 600,
    lineHeight: '16px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: theme.palette.grey[600],
  },
  templateGroupExpandIcon: {
    height: 12,
    width: 12,
    flexShrink: 0,
    color: theme.palette.grey[600],
  },
  // Sized to take the label's place in the header without reflowing the row
  groupNameInput: {
    flex: 1,
    minWidth: 0,
    padding: '1px 4px',
    fontSize: 11,
    fontWeight: 600,
    lineHeight: '16px',
    letterSpacing: '0.5px',
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.text.normal,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
    outline: 'none',
    '&:focus': {
      border: `1px solid ${theme.palette.grey[300]}`,
    },
  },
  draggedTemplate: {
    position: 'relative',
    zIndex: 2,
    opacity: 0.7,
  },
  addTemplateButton: {
    marginLeft: 'auto',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  addTemplateIcon: {
    height: 14,
    width: 14,
    color: theme.palette.grey[600],
    '&:hover': {
      color: theme.palette.grey[900],
    },
  },
  newTemplateForm: {
    marginTop: 4,
    marginBottom: 8,
    paddingLeft: 12,
    paddingRight: 0,
    marginLeft: -6,
    marginRight: -6,
    border: theme.palette.border.normal,
    borderRadius: 4,
    backgroundColor: theme.palette.background.paper,
    '& .vulcan-form': {
      marginTop: -16
    },
  },
}));

const TemplateSearchBar = ({searchOpen, searchQuery, focusToken, onOpen, onClose, onQueryChange, onKeyDown}: {
  searchOpen: boolean,
  searchQuery: string,
  // Bumped whenever the search hotkey is pressed, so it refocuses an already-open search
  focusToken: number,
  onOpen: () => void,
  onClose: () => void,
  onQueryChange: (query: string) => void,
  onKeyDown: (event: React.KeyboardEvent) => void,
}) => {
  const classes = useStyles(styles);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      inputRef.current?.focus();
    }
  }, [searchOpen, focusToken]);

  if (!searchOpen) {
    return (
      <LWTooltip title="Search templates (/)" placement="left">
        <div className={classes.collapsedSearch} onClick={onOpen}>
          <ForumIcon icon="Search" className={classes.searchIcon} />
          <span className={classes.collapsedSearchPlaceholder}>Search templates...</span>
        </div>
      </LWTooltip>
    );
  }

  return (
    <div className={classes.listHeader}>
      <input
        ref={inputRef}
        className={classes.searchInput}
        type="text"
        placeholder="Search templates..."
        value={searchQuery}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <ForumIcon icon="Close" className={classes.searchIcon} onClick={onClose} />
    </div>
  );
};

const DraggableTemplateItem = ({template, onTemplateClick, highlighted, selected, onHideTemplate}: {
  template: ModerationTemplateFragment,
  onTemplateClick: (template: ModerationTemplateFragment) => void,
  highlighted: boolean,
  selected: boolean,
  onHideTemplate: (template: ModerationTemplateFragment) => void,
}) => {
  const classes = useStyles(styles);
  const {attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging} = useDraggable({
    id: template._id,
  });
  const rowRef = useRef<HTMLDivElement | null>(null);

  // dnd-kit needs the same node, so the two refs are combined here
  const setRefs = useCallback((node: HTMLDivElement | null) => {
    rowRef.current = node;
    setNodeRef(node);
  }, [setNodeRef]);

  useEffect(() => {
    if (selected) {
      rowRef.current?.scrollIntoView({block: 'nearest'});
    }
  }, [selected]);

  return (
    <div
      ref={setRefs}
      className={classNames({[classes.draggedTemplate]: isDragging})}
      style={{transform: CSS.Translate.toString(transform)}}
    >
      <ModerationTemplateSunshineItem
        template={template}
        onTemplateClick={onTemplateClick}
        highlighted={highlighted}
        selected={selected}
        dragHandleProps={{ref: setActivatorNodeRef, attributes, listeners}}
        onHide={onHideTemplate}
      />
    </div>
  );
};

const TemplateGroup = ({group, templatesInGroup, expanded, onToggleExpanded, onTemplateClick, onRenameGroup, onHideTemplate, onAddTemplate, newTemplateForm, highlightedTemplateNames, insertedTemplateIds, selectedTemplateId}: {
  group: string,
  templatesInGroup: ModerationTemplateFragment[],
  expanded: boolean,
  onToggleExpanded: (group: string, expanded: boolean) => void,
  onTemplateClick: (template: ModerationTemplateFragment) => void,
  onRenameGroup: (group: string, newGroup: string) => void,
  onHideTemplate: (template: ModerationTemplateFragment) => void,
  onAddTemplate: (group: string) => void,
  newTemplateForm: React.ReactNode,
  highlightedTemplateNames?: Set<string>,
  insertedTemplateIds?: Set<string>,
  selectedTemplateId: string | null,
}) => {
  const classes = useStyles(styles);
  const {setNodeRef, isOver} = useDroppable({id: group});
  const [draftName, setDraftName] = useState<string | null>(null);
  const isRenaming = draftName !== null;

  const commitRename = () => {
    if (draftName === null) return;
    const trimmed = draftName.trim();
    setDraftName(null);
    if (trimmed && trimmed !== group) {
      onRenameGroup(group, trimmed);
    }
  };

  return (
    <div ref={setNodeRef} className={classNames(classes.templateGroup, {[classes.templateGroupDropTarget]: isOver})}>
      <div
        className={classes.templateGroupHeader}
        onClick={() => !isRenaming && onToggleExpanded(group, !expanded)}
      >
        <ForumIcon icon={expanded ? "ExpandLess" : "ExpandMore"} className={classes.templateGroupExpandIcon} />
        {isRenaming
          // Renaming relabels every template in the group, so it's edited in place rather
          // than one template at a time through the template form.
          ? <input
              className={classes.groupNameInput}
              type="text"
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commitRename();
                } else if (e.key === 'Escape') {
                  // Keep Escape from reaching the supermod shortcut handler on document,
                  // which would otherwise close the detail view out from under the edit.
                  e.nativeEvent.stopImmediatePropagation();
                  setDraftName(null);
                }
              }}
            />
          : <span className={classes.templateGroupLabel} onDoubleClick={() => setDraftName(group)}>{group}</span>}
        <LWTooltip title="New template in this group" placement="left" className={classes.addTemplateButton}>
          <ForumIcon
            icon="Plus"
            className={classes.addTemplateIcon}
            onClick={(e) => {
              e.stopPropagation();
              onAddTemplate(group);
            }}
          />
        </LWTooltip>
      </div>
      {newTemplateForm}
      {expanded && templatesInGroup.map(template => (
        <DraggableTemplateItem
          key={template._id}
          template={template}
          onTemplateClick={onTemplateClick}
          highlighted={!!highlightedTemplateNames?.has(template.name)}
          selected={template._id === selectedTemplateId || !!insertedTemplateIds?.has(template._id)}
          onHideTemplate={onHideTemplate}
        />
      ))}
    </div>
  );
};

const HiddenTemplatesSection = ({hiddenTemplates, expanded, onToggleExpanded, onTemplateClick, onUnhideTemplate}: {
  hiddenTemplates: ModerationTemplateFragment[],
  expanded: boolean,
  onToggleExpanded: (expanded: boolean) => void,
  onTemplateClick: (template: ModerationTemplateFragment) => void,
  onUnhideTemplate: (template: ModerationTemplateFragment) => void,
}) => {
  const classes = useStyles(styles);

  return (
    <div className={classes.templateGroup}>
      <div className={classes.templateGroupHeader} onClick={() => onToggleExpanded(!expanded)}>
        <ForumIcon icon={expanded ? "ExpandLess" : "ExpandMore"} className={classes.templateGroupExpandIcon} />
        <span className={classes.templateGroupLabel}>{HIDDEN_TEMPLATES_LABEL} ({hiddenTemplates.length})</span>
      </div>
      {expanded && hiddenTemplates.map(template => (
        <ModerationTemplateSunshineItem
          key={template._id}
          template={template}
          onTemplateClick={onTemplateClick}
          onUnhide={onUnhideTemplate}
        />
      ))}
    </div>
  );
};

/**
 * The list of moderation templates shown underneath a moderator-facing composer,
 * grouped by `groupLabel`. Parameterized by collection so the same list can back
 * both message templates and rejection reasons; dragging a template onto another
 * group's header re-labels it, and double-clicking a group name renames the group.
 *
 * The search box drives the same keyboard flow as the rejection dialog: "/" opens and
 * focuses it, up/down move the selection through the visible templates, Enter applies
 * the selected one, Tab (or ArrowUp past the top of the list) jumps to the composer,
 * and Escape closes the search (and, via `onEscape`, the section around it).
 *
 * `focusSearchToken` is bumped by the composer above the list when the moderator
 * presses ArrowDown on its last line; it opens and focuses the search with nothing
 * selected, so the next ArrowDown steps into the template list.
 */
const GroupedModerationTemplateList = ({ collectionName, onTemplateClick, highlightedTemplateNames, insertedTemplateIds, onlyHighlighted = false, onFocusComposer, focusSearchToken, active = true, onEscape }: {
  collectionName: TemplateType,
  onTemplateClick: (template: ModerationTemplateFragment) => void,
  highlightedTemplateNames?: Set<string>,
  insertedTemplateIds?: Set<string>,
  onlyHighlighted?: boolean,
  onFocusComposer?: () => void,
  focusSearchToken?: number,
  // False while the list's composer tab is hidden (but kept mounted to
  // preserve drafts), so the "/" shortcut only reaches the visible list
  active?: boolean,
  // Called when Escape is pressed in the search; closes the sidebar section containing the list
  onEscape?: () => void,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [newTemplateGroup, setNewTemplateGroup] = useState<string | null>(null);
  const [groupExpandedOverrides, setGroupExpandedOverrides] = useState<Record<string, boolean>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocusToken, setSearchFocusToken] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hiddenTemplateIds, setHiddenTemplateIds] = useState<Set<string>>(new Set());
  const [hiddenSectionExpanded, setHiddenSectionExpanded] = useState(false);

  // "/" is the way into the template list from the rest of the supermod keyboard flow,
  // which is why this listens globally rather than on the list itself
  useGlobalKeydown(useCallback((event: KeyboardEvent) => {
    if (!active) return;
    if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
    if (isInTextInput(event.target)) return;
    event.preventDefault();
    setSearchOpen(true);
    setSelectedIndex(0);
    setSearchFocusToken(token => token + 1);
  }, [active]));

  // ArrowDown from the last line of the composer lands here: the search itself is
  // the selection (index -1), and the next ArrowDown moves into the template list
  useEffect(() => {
    if (!focusSearchToken) return;
    setSearchOpen(true);
    setSelectedIndex(-1);
    setSearchFocusToken(token => token + 1);
  }, [focusSearchToken]);

  // In an effect, not render: localStorage would break hydration
  useEffect(() => {
    if (!currentUser) return;
    setHiddenTemplateIds(new Set(loadHiddenTemplateIds(currentUser._id, collectionName)));
  }, [currentUser, collectionName]);

  const queryVariables = getModerationTemplatesQueryVariables(collectionName);
  const { data } = useQuery(ModerationTemplatesListQuery, { variables: queryVariables });
  const [updateTemplateGroup] = useMutation(UpdateModerationTemplateGroupMutation);

  const dndSensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}));

  const templates = data?.moderationTemplates?.results ?? [];

  if (onlyHighlighted) {
    const highlightedTemplates = templates.filter(template => highlightedTemplateNames?.has(template.name));
    if (highlightedTemplates.length === 0) return null;
    return <div className={classes.root}>
      {highlightedTemplates.map(template => (
        <ModerationTemplateSunshineItem
          key={template._id}
          template={template}
          onTemplateClick={onTemplateClick}
          highlighted
          selected={insertedTemplateIds?.has(template._id)}
        />
      ))}
    </div>;
  }

  const handleToggleGroupExpanded = (group: string, expanded: boolean) => {
    setGroupExpandedOverrides(prev => ({...prev, [group]: expanded}));
  };

  const setTemplateHidden = (template: ModerationTemplateFragment, hidden: boolean) => {
    if (!currentUser) return;
    const newHiddenIds = new Set(hiddenTemplateIds);
    if (hidden) {
      newHiddenIds.add(template._id);
    } else {
      newHiddenIds.delete(template._id);
    }
    setHiddenTemplateIds(newHiddenIds);
    saveHiddenTemplateIds(currentUser._id, collectionName, newHiddenIds);
  };

  const handleHideTemplate = (template: ModerationTemplateFragment) => setTemplateHidden(template, true);
  const handleUnhideTemplate = (template: ModerationTemplateFragment) => setTemplateHidden(template, false);

  // Expand the group so the form (and, after submitting, the new template) is visible
  const handleAddTemplate = (group: string) => {
    setGroupExpandedOverrides(prev => ({...prev, [group]: true}));
    setNewTemplateGroup(group);
  };

  // Dropping manual toggles on a query change reopens anything the moderator collapsed, so matches stay visible
  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    setGroupExpandedOverrides({});
    setSelectedIndex(0);
  };

  const handleCloseSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setGroupExpandedOverrides({});
    setSelectedIndex(0);
  };

  const handleTemplateDragEnd = (event: DragEndEvent) => {
    const {active, over} = event;
    if (!over) return;
    const template = templates.find(t => t._id === active.id);
    if (!template) return;
    const targetGroup = String(over.id);
    const currentGroup = template.groupLabel ?? UNGROUPED_TEMPLATES_LABEL;
    if (currentGroup === targetGroup) return;
    const newGroupLabel = targetGroup === UNGROUPED_TEMPLATES_LABEL ? null : targetGroup;
    // Keep the target group open so the dropped template stays visible
    setGroupExpandedOverrides(prev => ({...prev, [targetGroup]: true}));
    void updateTemplateGroup(getGroupLabelUpdateOptions(template, newGroupLabel));
  };

  // Renaming a group relabels every template in it. Renaming to "Other" clears the
  // label back to null, matching what dragging a template into Other does.
  const handleRenameGroup = (group: string, newGroup: string) => {
    const newGroupLabel = newGroup === UNGROUPED_TEMPLATES_LABEL ? null : newGroup;
    setGroupExpandedOverrides(prev => ({...prev, [newGroup]: prev[group] ?? true}));
    templates
      .filter(template => (template.groupLabel ?? UNGROUPED_TEMPLATES_LABEL) === group)
      .forEach(template => {
        void updateTemplateGroup(getGroupLabelUpdateOptions(template, newGroupLabel));
      });
  };

  const lowercaseQuery = searchQuery.trim().toLowerCase();
  const matchingTemplates = lowercaseQuery
    ? templates.filter(template => templateMatchesQuery(template, lowercaseQuery))
    : templates;
  // Groups are only created when non-empty, so all-hidden ones vanish
  const visibleGroups = groupTemplatesByLabel(matchingTemplates.filter(template => !hiddenTemplateIds.has(template._id)));
  const hiddenTemplates = matchingTemplates.filter(template => hiddenTemplateIds.has(template._id));
  // Outside of a search, always show "Other" (even when empty) so its "+" button
  // is the standing affordance for creating an ungrouped template
  if (!lowercaseQuery && !visibleGroups.some(([group]) => group === UNGROUPED_TEMPLATES_LABEL)) {
    visibleGroups.push([UNGROUPED_TEMPLATES_LABEL, []]);
  }

  const isGroupExpanded = (group: string) => groupExpandedOverrides[group] ?? true;

  // What the arrow keys walk: everything on screen, in display order. Templates in
  // collapsed groups and hidden templates aren't visible, so they aren't navigable.
  const navigableTemplates = visibleGroups
    .filter(([group]) => isGroupExpanded(group))
    .flatMap(([, templatesInGroup]) => templatesInGroup);

  // Collapsing a group can leave the index past the end of the list
  const selectedTemplate = navigableTemplates[selectedIndex];

  const handleSearchKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (navigableTemplates.length === 0) return;
        setSelectedIndex(prev => prev >= navigableTemplates.length - 1 ? 0 : prev + 1);
        break;
      case 'ArrowUp':
        // Mirrors ArrowDown's composer → search → list flow: walk back up the
        // list, pause at the search level (-1), then continue into the composer
        event.preventDefault();
        if (selectedIndex < 0) {
          onFocusComposer?.();
          return;
        }
        setSelectedIndex(prev => prev - 1);
        break;
      case 'Enter':
        // Cmd/Ctrl+Enter submits the composer above the list (e.g. rejecting
        if (event.metaKey || event.ctrlKey) return;
        event.preventDefault();
        if (selectedTemplate) {
          onTemplateClick(selectedTemplate);
        }
        break;
      case 'Tab':
        event.preventDefault();
        onFocusComposer?.();
        break;
      case 'Escape':
        // The supermod shortcut handler listens on document and acts on Escape even
        // from inside text inputs, so it would deselect the user out from under the
        // search. React's own listener is on document too, so only
        // stopImmediatePropagation keeps the event from reaching it.
        event.nativeEvent.stopImmediatePropagation();
        handleCloseSearch();
        onEscape?.();
        break;
    }
  };

  // DndContext gets an explicit id because the ids dnd-kit puts in aria-describedby
  // otherwise come from a module-level counter, which drifts between the server and
  // the client and trips a hydration mismatch
  return <DndContext
    id={`supermod-template-groups-${collectionName}`}
    sensors={dndSensors}
    collisionDetection={pointerWithin}
    onDragEnd={handleTemplateDragEnd}
  >
    <div className={classes.root}>
      {templates.length > 0 && (
        <TemplateSearchBar
          searchOpen={searchOpen}
          searchQuery={searchQuery}
          focusToken={searchFocusToken}
          onOpen={() => setSearchOpen(true)}
          onClose={handleCloseSearch}
          onQueryChange={handleSearchQueryChange}
          onKeyDown={handleSearchKeyDown}
        />
      )}
      {visibleGroups.map(([group, templatesInGroup]) => (
        <TemplateGroup
          key={group}
          group={group}
          templatesInGroup={templatesInGroup}
          expanded={isGroupExpanded(group)}
          onToggleExpanded={handleToggleGroupExpanded}
          onTemplateClick={onTemplateClick}
          onRenameGroup={handleRenameGroup}
          onHideTemplate={handleHideTemplate}
          onAddTemplate={handleAddTemplate}
          newTemplateForm={newTemplateGroup === group && (
            <div className={classes.newTemplateForm}>
              <ModerationTemplatesForm
                initialCollectionName={collectionName}
                initialGroupLabel={group === UNGROUPED_TEMPLATES_LABEL ? undefined : group}
                hideMetadataFields
                onSuccess={() => setNewTemplateGroup(null)}
                onCancel={() => setNewTemplateGroup(null)}
                refetchQueries={[{ query: ModerationTemplatesListQuery, variables: queryVariables }]}
              />
            </div>
          )}
          highlightedTemplateNames={highlightedTemplateNames}
          insertedTemplateIds={insertedTemplateIds}
          selectedTemplateId={searchOpen ? (selectedTemplate?._id ?? null) : null}
        />
      ))}
      {hiddenTemplates.length > 0 && (
        <HiddenTemplatesSection
          hiddenTemplates={hiddenTemplates}
          expanded={hiddenSectionExpanded}
          onToggleExpanded={setHiddenSectionExpanded}
          onTemplateClick={onTemplateClick}
          onUnhideTemplate={handleUnhideTemplate}
        />
      )}
      {lowercaseQuery && visibleGroups.length === 0 && hiddenTemplates.length === 0 && (
        <div className={classes.noSearchResults}>No templates match “{searchQuery.trim()}”</div>
      )}
    </div>
  </DndContext>;
};

export default GroupedModerationTemplateList;
