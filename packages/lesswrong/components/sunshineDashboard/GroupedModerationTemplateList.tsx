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
import LWTooltip from '../common/LWTooltip';
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

// Same matching as the rejection dialog's template search: case-insensitive substring of the name
function templateMatchesQuery(template: ModerationTemplateFragment, lowercaseQuery: string) {
  return template.name.toLowerCase().includes(lowercaseQuery);
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
    marginBottom: 16,
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
    gap: 6,
    cursor: 'pointer',
    marginBottom: 8,
    '& h3': {
      margin: 0,
    },
    '&:hover': {
      opacity: 0.7,
    },
  },
  templateGroupCount: {
    color: theme.palette.grey[600],
    fontSize: 12,
  },
  templateGroupExpandIcon: {
    height: 14,
    width: 14,
    flexShrink: 0,
    color: theme.palette.grey[600],
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

const TemplateSearchBar = ({searchOpen, searchQuery, onOpen, onClose, onQueryChange}: {
  searchOpen: boolean,
  searchQuery: string,
  onOpen: () => void,
  onClose: () => void,
  onQueryChange: (query: string) => void,
}) => {
  const classes = useStyles(styles);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      inputRef.current?.focus();
    }
  }, [searchOpen]);

  if (!searchOpen) {
    return (
      <div className={classes.listHeader}>
        <LWTooltip title="Search templates" placement="left">
          <ForumIcon icon="Search" className={classes.searchIcon} onClick={onOpen} />
        </LWTooltip>
      </div>
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
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            // The supermod shortcut handler listens on document and acts on Escape even
            // from inside text inputs, so it would deselect the user out from under the
            // search. React's own listener is on document too, so only
            // stopImmediatePropagation keeps the event from reaching it.
            e.nativeEvent.stopImmediatePropagation();
            onClose();
          }
        }}
      />
      <ForumIcon icon="Close" className={classes.searchIcon} onClick={onClose} />
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

const TemplateGroup = ({group, templatesInGroup, expanded, onToggleExpanded, onTemplateClick, highlightedTemplateNames}: {
  group: string,
  templatesInGroup: ModerationTemplateFragment[],
  expanded: boolean,
  onToggleExpanded: (group: string, expanded: boolean) => void,
  onTemplateClick: (template: ModerationTemplateFragment) => void,
  highlightedTemplateNames?: Set<string>,
}) => {
  const classes = useStyles(styles);
  const {setNodeRef, isOver} = useDroppable({id: group});

  return (
    <div ref={setNodeRef} className={classNames(classes.templateGroup, {[classes.templateGroupDropTarget]: isOver})}>
      <div className={classes.templateGroupHeader} onClick={() => onToggleExpanded(group, !expanded)}>
        <ForumIcon icon={expanded ? "ExpandLess" : "ExpandMore"} className={classes.templateGroupExpandIcon} />
        <h3>{group}</h3>
        <span className={classes.templateGroupCount}>{templatesInGroup.length}</span>
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
export const GroupedModerationTemplateList = ({ collectionName, onTemplateClick, highlightedTemplateNames }: {
  collectionName: TemplateType,
  onTemplateClick: (template: ModerationTemplateFragment) => void,
  highlightedTemplateNames?: Set<string>,
}) => {
  const classes = useStyles(styles);
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [groupExpandedOverrides, setGroupExpandedOverrides] = useState<Record<string, boolean>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const queryVariables = getModerationTemplatesQueryVariables(collectionName);
  const { data } = useQuery(ModerationTemplatesListQuery, { variables: queryVariables });
  const [updateTemplateGroup] = useMutation(UpdateModerationTemplateGroupMutation);

  const dndSensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}));

  const templates = data?.moderationTemplates?.results ?? [];

  const handleToggleGroupExpanded = (group: string, expanded: boolean) => {
    setGroupExpandedOverrides(prev => ({...prev, [group]: expanded}));
  };

  // A changed query re-derives which groups should be open, so manual toggles are dropped
  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    setGroupExpandedOverrides({});
  };

  const handleCloseSearch = () => {
    setSearchOpen(false);
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
    void updateTemplateGroup({
      variables: {
        selector: {_id: template._id},
        data: {groupLabel: newGroupLabel},
      },
      optimisticResponse: {
        updateModerationTemplate: {
          __typename: "ModerationTemplateOutput",
          data: {
            __typename: "ModerationTemplate",
            ...template,
            groupLabel: newGroupLabel,
          },
        },
      },
    });
  };

  const lowercaseQuery = searchQuery.trim().toLowerCase();
  const visibleGroups = groupTemplatesByLabel(templates)
    .map(([group, templatesInGroup]): [string, ModerationTemplateFragment[]] => [
      group,
      lowercaseQuery ? templatesInGroup.filter(template => templateMatchesQuery(template, lowercaseQuery)) : templatesInGroup,
    ])
    .filter(([, templatesInGroup]) => templatesInGroup.length > 0);

  return <DndContext sensors={dndSensors} collisionDetection={pointerWithin} onDragEnd={handleTemplateDragEnd}>
    <div className={classes.root}>
      <TemplateSearchBar
        searchOpen={searchOpen}
        searchQuery={searchQuery}
        onOpen={() => setSearchOpen(true)}
        onClose={handleCloseSearch}
        onQueryChange={handleSearchQueryChange}
      />
      {visibleGroups.map(([group, templatesInGroup]) => {
        // Groups start collapsed unless they hold a suggested template — except when
        // there's only one group, where collapsing it would hide the whole list.
        const defaultExpanded = visibleGroups.length === 1
          || templatesInGroup.some(template => highlightedTemplateNames?.has(template.name));
        return (
          <TemplateGroup
            key={group}
            group={group}
            templatesInGroup={templatesInGroup}
            expanded={groupExpandedOverrides[group] ?? (lowercaseQuery ? true : defaultExpanded)}
            onToggleExpanded={handleToggleGroupExpanded}
            onTemplateClick={onTemplateClick}
            highlightedTemplateNames={highlightedTemplateNames}
          />
        );
      })}
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
