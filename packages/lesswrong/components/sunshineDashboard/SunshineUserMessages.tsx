import React, { useState, useEffect, useMemo } from 'react';
import { useTracking } from '../../lib/analyticsEvents';
import { TemplateQueryStrings } from '../messaging/NewConversationButton';
import EmailIcon from '@/lib/vendor/@material-ui/icons/src/Email';
import { Link } from '../../lib/reactRouterWrapper';
import isEqual from 'lodash/isEqual';
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
import MessagesNewForm from "../messaging/MessagesNewForm";
import { getDraftMessageHtml } from '../../lib/collections/messages/helpers';
import UsersName from "../users/UsersName";
import MetaInfo from "../common/MetaInfo";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import ConversationPreview from '../messaging/ConversationPreview';
import ForumIcon from '../common/ForumIcon';
import { defineStyles, useStyles } from '../hooks/useStyles';
import LWTooltip from '../common/LWTooltip';
import { ModerationTemplateSunshineItem } from './ModerationTemplateSunshineItem';
import { useInitiateConversation } from '../hooks/useInitiateConversation';
import { useAppendToEditor, AppendToEditorProvider } from '../editor/AppendToEditorContext';
import { getHighlightedTemplateNames } from './supermod/templateHighlightRules';
import FormatDate from '../common/FormatDate';

const ConversationsListMultiQuery = gql(`
  query multiConversationSunshineUserMessagesQuery($selector: ConversationSelector, $limit: Int, $enableTotal: Boolean) {
    conversations(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ConversationsList
      }
      totalCount
    }
  }
`);

export const ModerationTemplatesListQuery = gql(`
  query multiModerationTemplateSunshineUserMessagesQuery($selector: ModerationTemplateSelector, $limit: Int, $enableTotal: Boolean) {
    moderationTemplates(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ModerationTemplateFragment
      }
      totalCount
    }
  }
`);

const UpdateModerationTemplateGroupMutation = gql(`
  mutation updateModerationTemplateSunshineUserMessages($selector: SelectorInput!, $data: UpdateModerationTemplateDataInput!) {
    updateModerationTemplate(selector: $selector, data: $data) {
      data {
        ...ModerationTemplateFragment
      }
    }
  }
`);

const UNGROUPED_TEMPLATES_LABEL = "Other";

const styles = defineStyles('SunshineUserMessages', (theme: ThemeType) => ({
  icon: {
    height: 13,
    width: 13,
    position: "relative",
    top: 2,
    marginRight: 3,
  },
  conversationItem: {
    marginBottom: 8,
  },
  conversationHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    width: "100%",
  },
  expandIcon: {
    marginLeft: "auto",
    height: 16,
    width: 16,
    cursor: "pointer",
    "&:hover": {
      opacity: 0.7,
    }
  },
  linkIcon: {
    height: 12,
    width: 12,
    color: theme.palette.grey[600],
    cursor: "pointer",
    "&:hover": {
      opacity: 0.7,
    },
    marginBottom: -1,
    marginLeft: 4,
  },
  conversationForm: {
    marginTop: 16,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottom: theme.palette.border.extraFaint,
  },
  templateList: {
    marginTop: 32,
    opacity: 0.5,
    display: 'flex',
    flexDirection: 'column',
    "&:hover": {
      opacity: 1,
    },
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
  messagePrompt: {
    padding: 8,
    color: theme.palette.grey[600],
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.greyAlpha(0.1),
    },
  },
  date: {
    color: theme.palette.grey[600],
    fontSize: 10,
  },
  conversationPreviewTooltip: {
    maxHeight: "100vh",
    overflow: "hidden",
  }
}));

interface SunshineUserMessagesProps {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  posts?: SunshinePostsList[];
  comments?: SunshineCommentsList[];
  showExpandablePreview?: boolean;
}

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
  highlightedTemplateNames: Set<string>,
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
          highlighted={highlightedTemplateNames.has(template.name)}
        />
      ))}
    </div>
  );
};

const SunshineUserMessagesInner = ({user, currentUser, posts, comments, showExpandablePreview}: SunshineUserMessagesProps) => {
  const classes = useStyles(styles);
  
  const highlightedTemplateNames = useMemo(() => {
    if (!posts || !comments) return new Set<string>();
    return getHighlightedTemplateNames(
      {
        user,
        moderatorActions: user.moderatorActions ?? [],
      },
      posts,
      comments
    );
  }, [user, posts, comments]);

  const [embeddedConversationId, setEmbeddedConversationId] = useState<string | undefined>();
  const [templateQueries, setTemplateQueries] = useState<TemplateQueryStrings | undefined>();
  const [expandedConversationId, setExpandedConversationId] = useState<string | undefined>();
  const [groupExpandedOverrides, setGroupExpandedOverrides] = useState<Record<string, boolean>>({});

  const { captureEvent } = useTracking()
  const { conversation, initiateConversation } = useInitiateConversation({ includeModerators: true });
  const { appendToEditor } = useAppendToEditor();

  // When a conversation is created/found, sync it to state
  useEffect(() => {
    if (conversation && !embeddedConversationId) {
      setEmbeddedConversationId(conversation._id);
    }
  }, [conversation, embeddedConversationId]);

  const embedConversation = (conversationId: string, newTemplateQueries: TemplateQueryStrings) => {
    setEmbeddedConversationId(conversationId);
    // Downstream components rely on referential equality of the templateQueries object in a useEffect; we get an infinite loop here if we don't check for value equality
    if (!isEqual(newTemplateQueries, templateQueries)) {
      setTemplateQueries(newTemplateQueries);
    }
  }

  const toggleConversationPreview = (conversationId: string) => {
    setExpandedConversationId(prev => prev === conversationId ? undefined : conversationId);
  }

  const { data, refetch } = useQuery(ConversationsListMultiQuery, {
    variables: {
      selector: { moderatorConversations: { userId: user._id } },
      limit: 10,
      enableTotal: true,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const { data: templatesData } = useQuery(ModerationTemplatesListQuery, {
    variables: {
      selector: { moderationTemplatesList: { collectionName: "Messages" } },
      limit: 50,
      enableTotal: false,
    },
  });

  const results = data?.conversations?.results;
  const templates = templatesData?.moderationTemplates?.results;

  const [updateTemplateGroup] = useMutation(UpdateModerationTemplateGroupMutation);

  const dndSensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}));

  const handleToggleGroupExpanded = (group: string, expanded: boolean) => {
    setGroupExpandedOverrides(prev => ({...prev, [group]: expanded}));
  };

  const handleTemplateDragEnd = (event: DragEndEvent) => {
    const {active, over} = event;
    if (!over || !templates) return;
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

  const handleTemplateClick = (template: NonNullable<typeof templates>[0]) => {
    // Initiate conversation if we don't have one yet
    if (!embeddedConversationId) {
      initiateConversation([user._id]);
      // For new conversations, use templateQueries to prefill
      setTemplateQueries({
        templateId: template._id,
        displayName: user.displayName,
      });
    } else if (template.contents?.html) {
      // Append to editor via context
      const processedHtml = getDraftMessageHtml({
        html: template.contents.html,
        displayName: user.displayName,
      });
      appendToEditor(processedHtml);
    }
  };

  const handleStartConversation = () => {
    if (!embeddedConversationId) {
      initiateConversation([user._id]);
    }
  };

  const allTemplatesGrouped: Record<string, NonNullable<typeof templates>[0][]> = templates ? (() => {
    const grouped: Record<string, NonNullable<typeof templates>[0][]> = {};
    const templatesWithoutGroup: NonNullable<typeof templates>[0][] = [];
    
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
    
    return grouped;
  })() : {};

  return <div>
    {results?.map(conversation => {
      const isExpanded = expandedConversationId === conversation._id;
      return (
        <LWTooltip key={conversation._id} placement="left-start" tooltip={false} titleClassName={classes.conversationPreviewTooltip} title={<div><ConversationPreview conversationId={conversation._id} showTitle={false} showFullWidth /></div>}>
          <div  className={classes.conversationItem}>
            <div className={classes.conversationHeader} onClick={() => toggleConversationPreview(conversation._id)}>
              <MetaInfo><EmailIcon className={classes.icon}/> {conversation.messageCount}</MetaInfo>
              <span>
                Conversation with{" "} 
                {conversation.participants?.filter(participant => participant._id !== user._id).map(participant => {
                  return <MetaInfo key={`${conversation._id}${participant._id}`}>
                    <UsersName simple user={participant}/>
                  </MetaInfo>
                })}
              </span>
              {conversation.latestActivity && <span className={classes.date}><FormatDate date={conversation.latestActivity} /></span>}
              <Link to={`/inbox?isModInbox=true&conversation=${conversation._id}`} onClick={(e) => e.stopPropagation()}>
                <ForumIcon icon="Link" className={classes.linkIcon} />
              </Link> 
              <ForumIcon icon={isExpanded ? "ExpandLess" : "ExpandMore"} className={classes.expandIcon} />
            </div>
            {isExpanded && (
              <ConversationPreview conversationId={conversation._id} showTitle={false} showFullWidth />
            )}
          </div>
        </LWTooltip>
      );
    })}
    {embeddedConversationId ? (
      <div className={classes.conversationForm}>
        <MessagesNewForm 
          conversationId={embeddedConversationId} 
          templateQueries={templateQueries}
          successEvent={async (newMessage) => {
            await refetch();
            captureEvent('messageSent', {
              conversationId: newMessage.conversationId,
              sender: currentUser._id,
              moderatorConveration: true
            })
          }}
        />
      </div>
    ) : (
      <div className={classes.messagePrompt} onClick={handleStartConversation}>
        Click to start a new message...
      </div>
    )}
    {templates && templates.length > 0 && (
      <DndContext sensors={dndSensors} collisionDetection={pointerWithin} onDragEnd={handleTemplateDragEnd}>
        <div className={classes.templateList}>
          {Object.entries(allTemplatesGrouped).map(([group, templatesInGroup]) => {
            const defaultExpanded = templatesInGroup.some(template => highlightedTemplateNames.has(template.name));
            return (
              <TemplateGroup
                key={group}
                group={group}
                templatesInGroup={templatesInGroup}
                expanded={groupExpandedOverrides[group] ?? defaultExpanded}
                onToggleExpanded={handleToggleGroupExpanded}
                onTemplateClick={handleTemplateClick}
                highlightedTemplateNames={highlightedTemplateNames}
              />
            );
          })}
        </div>
      </DndContext>
    )}
    
  </div>;
}

export const SunshineUserMessages = (props: SunshineUserMessagesProps) => {
  return (
    <AppendToEditorProvider>
      <SunshineUserMessagesInner {...props} />
    </AppendToEditorProvider>
  );
};

export default SunshineUserMessages;
