import React, { useEffect, useRef, useState } from 'react';
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
import type { TemplateType } from '@/lib/collections/moderationTemplates/constants';

export const ModerationTemplatesListQuery = gql(`
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

export function getModerationTemplatesQueryVariables(collectionName: TemplateType) {
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

// Same matching as the rejection dialog's template search: case-insensitive substring of the name
function templateMatchesQuery(template: ModerationTemplateFragment, lowercaseQuery: string) {
  return template.name.toLowerCase().includes(lowercaseQuery);
}

const styles = defineStyles('GroupedModerationTemplateList', (theme: ThemeType) => ({
  root: {
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
  rootTopMargin: {
    marginTop: 32,
  },
  listHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    width: '100%',
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
  groupNameInput: {
    ...theme.typography.commentStyle,
    flex: 1,
    minWidth: 0,
    padding: '2px 4px',
    fontSize: '1.17em',
    fontWeight: 700,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.normal,
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
  newTemplateButton: {
    flexShrink: 0,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
    letterSpacing: '0.5px',
  },
  newTemplateForm: {
    marginTop: 16,
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

const TemplateSearchBar = ({searchQuery, autoFocus, onClear, onQueryChange}: {
  searchQuery: string,
  autoFocus: boolean,
  onClear: () => void,
  onQueryChange: (query: string) => void,
}) => {
  const classes = useStyles(styles);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  return (
    <div className={classes.listHeader}>
      <input
        ref={inputRef}
        className={classes.searchInput}
        type="text"
        placeholder="Search templates..."
        value={searchQuery}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={(e) => {
          // Escape clears a query in progress; with nothing to clear it falls through to
          // the supermod shortcut handler, which closes the detail view.
          if (e.key === 'Escape' && searchQuery) {
            // That handler listens on document and acts on Escape even from inside text
            // inputs. React's own listener is on document too, so only
            // stopImmediatePropagation keeps the event from reaching it.
            e.nativeEvent.stopImmediatePropagation();
            onClear();
          }
        }}
      />
    </div>
  );
};

const DraggableTemplateItem = ({template, onTemplateClick, highlighted}: {
  template: ModerationTemplateFragment,
  onTemplateClick: (template: ModerationTemplateFragment) => void,
  highlighted: boolean,
}) => {
  const classes = useStyles(styles);
  const {attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging} = useDraggable({
    id: template._id,
  });

  return (
    <div
      ref={setNodeRef}
      className={classNames({[classes.draggedTemplate]: isDragging})}
      style={{transform: CSS.Translate.toString(transform)}}
    >
      <ModerationTemplateSunshineItem
        template={template}
        onTemplateClick={onTemplateClick}
        highlighted={highlighted}
        dragHandleProps={{ref: setActivatorNodeRef, attributes, listeners}}
      />
    </div>
  );
};

const TemplateGroup = ({group, templatesInGroup, expanded, onToggleExpanded, onTemplateClick, onRenameGroup, highlightedTemplateNames}: {
  group: string,
  templatesInGroup: ModerationTemplateFragment[],
  expanded: boolean,
  onToggleExpanded: (group: string, expanded: boolean) => void,
  onTemplateClick: (template: ModerationTemplateFragment) => void,
  onRenameGroup: (group: string, newGroup: string) => void,
  highlightedTemplateNames?: Set<string>,
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
      </div>
      {expanded && templatesInGroup.map(template => (
        <DraggableTemplateItem
          key={template._id}
          template={template}
          onTemplateClick={onTemplateClick}
          highlighted={!!highlightedTemplateNames?.has(template.name)}
        />
      ))}
    </div>
  );
};

/**
 * The list of moderation templates shown underneath a moderator-facing composer,
 * grouped by `groupLabel`. Used for both message templates and rejection-reason
 * templates; clicking a template appends it to whichever editor is open, and
 * dragging one onto another group's header re-labels it.
 */
export const GroupedModerationTemplateList = ({ collectionName, onTemplateClick, highlightedTemplateNames, autoFocusSearch, noTopMargin }: {
  collectionName: TemplateType,
  onTemplateClick: (template: ModerationTemplateFragment) => void,
  highlightedTemplateNames?: Set<string>,
  /** Puts the cursor in the template search as soon as the list mounts. */
  autoFocusSearch?: boolean,
  /** For callers that put the list at the top of a panel rather than under a composer. */
  noTopMargin?: boolean,
}) => {
  const classes = useStyles(styles);
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [groupExpandedOverrides, setGroupExpandedOverrides] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const queryVariables = getModerationTemplatesQueryVariables(collectionName);
  const { data } = useQuery(ModerationTemplatesListQuery, { variables: queryVariables });
  const [updateTemplateGroup] = useMutation(UpdateModerationTemplateGroupMutation);

  const dndSensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}));

  const templates = data?.moderationTemplates?.results ?? [];

  const handleToggleGroupExpanded = (group: string, expanded: boolean) => {
    setGroupExpandedOverrides(prev => ({...prev, [group]: expanded}));
  };

  // Dropping manual toggles on a query change reopens anything the moderator collapsed, so matches stay visible
  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    setGroupExpandedOverrides({});
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setGroupExpandedOverrides({});
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

  // Renaming a group relabels every template in it — within this collection only, since
  // the list is already scoped to one collectionName.
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
  const visibleGroups = groupTemplatesByLabel(templates)
    .map(([group, templatesInGroup]): [string, ModerationTemplateFragment[]] => [
      group,
      lowercaseQuery ? templatesInGroup.filter(template => templateMatchesQuery(template, lowercaseQuery)) : templatesInGroup,
    ])
    .filter(([, templatesInGroup]) => templatesInGroup.length > 0);

  // DndContext gets an explicit id because the ids dnd-kit puts in aria-describedby
  // otherwise come from a module-level counter, which drifts between the server and
  // the client and trips a hydration mismatch
  return <DndContext
    id={`supermod-template-groups-${collectionName}`}
    sensors={dndSensors}
    collisionDetection={pointerWithin}
    onDragEnd={handleTemplateDragEnd}
  >
    <div className={classNames(classes.root, {[classes.rootTopMargin]: !noTopMargin})}>
      <TemplateSearchBar
        searchQuery={searchQuery}
        autoFocus={!!autoFocusSearch}
        onClear={handleClearSearch}
        onQueryChange={handleSearchQueryChange}
      />
      {visibleGroups.map(([group, templatesInGroup]) => (
        <TemplateGroup
          key={group}
          group={group}
          templatesInGroup={templatesInGroup}
          expanded={groupExpandedOverrides[group] ?? true}
          onToggleExpanded={handleToggleGroupExpanded}
          onTemplateClick={onTemplateClick}
          onRenameGroup={handleRenameGroup}
          highlightedTemplateNames={highlightedTemplateNames}
        />
      ))}
      {lowercaseQuery && visibleGroups.length === 0 && (
        <div className={classes.noSearchResults}>No templates match “{searchQuery.trim()}”</div>
      )}
      <div className={classes.newTemplateButton} onClick={() => setShowNewTemplateForm(true)}>
        New {collectionName === "Rejections" ? "Rejection Reason" : "Mod Template"}
      </div>
      {showNewTemplateForm && (
        <div className={classes.newTemplateForm}>
          <ModerationTemplatesForm
            initialCollectionName={collectionName}
            onSuccess={() => setShowNewTemplateForm(false)}
            onCancel={() => setShowNewTemplateForm(false)}
            refetchQueries={[{ query: ModerationTemplatesListQuery, variables: queryVariables }]}
          />
        </div>
      )}
    </div>
  </DndContext>;
};

export default GroupedModerationTemplateList;
