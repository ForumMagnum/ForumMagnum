import React, { useState } from 'react';
import { useTracking } from '../../lib/analyticsEvents';
import { TemplateQueryStrings } from '../messaging/NewConversationButton';
import EmailIcon from '@/lib/vendor/@material-ui/icons/src/Email';
import { Link } from '../../lib/reactRouterWrapper';
import isEqual from 'lodash/isEqual';
import MessagesNewForm from "../messaging/MessagesNewForm";
import UsersName from "../users/UsersName";
import MetaInfo from "../common/MetaInfo";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import ConversationPreview from '../messaging/ConversationPreview';
import ForumIcon from '../common/ForumIcon';
import { defineStyles, useStyles } from '../hooks/useStyles';
import LWTooltip from '../common/LWTooltip';
import { ModerationTemplateSunshineItem } from './ModerationTemplateSunshineItem';

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

const ModerationTemplatesListQuery = gql(`
  query multiModerationTemplateSunshineUserMessagesQuery($selector: ModerationTemplateSelector, $limit: Int, $enableTotal: Boolean) {
    moderationTemplates(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ModerationTemplateFragment
      }
      totalCount
    }
  }
`);

const styles = defineStyles('SunshineUserMessages', (theme: ThemeType) => ({
  row: {
    display: "flex",
    alignItems: "center"
  },
  icon: {
    height: 13,
    width: 13,
    position: "relative",
    top: 2,
    marginRight: 3,
  },
  conversationItem: {
    marginBottom: theme.spacing.unit,
  },
  conversationHeader: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  expandIcon: {
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
    cursor: "pointer",
    "&:hover": {
      opacity: 0.7,
    },
    marginBottom: -1,
    marginLeft: 4,
  },
  conversationForm: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit,
    borderBottom: theme.palette.border.extraFaint,
    // border: theme.palette.border.normal,
    // borderRadius: theme.spacing.unit/2,
  },
  expandablePreview: {
    maxHeight: 100,
    overflow: 'hidden',
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 30,
      background: `linear-gradient(to bottom, ${theme.palette.inverseGreyAlpha(0)}, ${theme.palette.background.pageActiveAreaBackground})`,
      pointerEvents: 'none',
    },
  },
  templateList: {
    marginTop: theme.spacing.unit * 4,
    opacity: 0.5,
    display: 'flex',
    flexDirection: 'column',
    "&:hover": {
      opacity: 1,
    },
  },
  templateItem: {
    cursor: "pointer",
    padding: theme.spacing.unit / 2,
    marginBottom: theme.spacing.unit / 2,
    "&:hover": {
      backgroundColor: theme.palette.greyAlpha(0.1),
    },
  },
  templateGroup: {
    marginBottom: theme.spacing.unit * 2,
    display: 'flex',
    flexDirection: 'column',
    '& h3': {
      marginBottom: theme.spacing.unit,
    },
  },
}));

export const SunshineUserMessages = ({user, currentUser, showExpandablePreview}: {
  user: SunshineUsersList,
  currentUser: UsersCurrent,
  showExpandablePreview?: boolean,
}) => {
  const classes = useStyles(styles);
  
  const [embeddedConversationId, setEmbeddedConversationId] = useState<string | undefined>();
  const [templateQueries, setTemplateQueries] = useState<TemplateQueryStrings | undefined>();
  const [expandedConversationId, setExpandedConversationId] = useState<string | undefined>();

  const { captureEvent } = useTracking()

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

  const { data } = useQuery(ConversationsListMultiQuery, {
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

  const handleTemplateClick = (template: NonNullable<typeof templates>[0]) => {
    setTemplateQueries({
      templateId: template._id,
      displayName: user.displayName,
      template: template as any,
    } as TemplateQueryStrings);
  };

  // insofar as these stay hardcoded (maybe worth creating a "moderationTemplate group-label" on the backend?), I think it's better for them to be names than IDs because it's easier to review and update, and if someone is editing one it's not obvious they should stay in the same groupings anyway.

  // (probably should add a "group" field to moderationTemplates)
  const allTemplates = {
    "Offboard": [
      'Bad fit first post, unlikely to get better',
      'This isn\'t gonna work out (multiple LLM rejections)',
      'This isn\'t gonna work out',
    ],
    "Quality Warning": [
      'Read Sequence Highlights First',
      'Read Sequences Highlights',
      'Your Submissions Aren\'t Finding Traction',
    ],
    "Other": [
      'Make Username Pronounceable',
      'Your Submissions Aren\'t Finding Traction',
      'Make Username Pronounceable',
      'Formatting / Grammar',
      'Lotsa DMs',
      'Spoilers',
    ],
  }

  return <div>
    {results?.map(conversation => {
      const isExpanded = expandedConversationId === conversation._id;
      return (
        <div key={conversation._id} className={classes.conversationItem}>
          <LWTooltip tooltip={false} placement="left" title={ <ConversationPreview conversationId={conversation._id} showTitle={false} showFullWidth />}>
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
              <ForumIcon icon={isExpanded ? "ExpandLess" : "ExpandMore"} className={classes.expandIcon} />
              <Link to={`/inbox?isModInbox=true&conversation=${conversation._id}`} onClick={(e) => e.stopPropagation()}>
                <ForumIcon icon="Link" className={classes.linkIcon} />
              </Link>
            </div>
          </LWTooltip>
        </div>
      );
    })}
    <div className={classes.conversationForm} onClick={() => setEmbeddedConversationId(undefined)}>
      <MessagesNewForm 
        conversationId={embeddedConversationId ?? ''} 
        templateQueries={templateQueries}
        successEvent={() => {
          captureEvent('messageSent', {
            conversationId: embeddedConversationId,
            sender: currentUser._id,
            moderatorConveration: true
          })
        }}
      />
    </div>
    {templates && templates.length > 0 && (
      <div className={classes.templateList}>
        {Object.entries(allTemplates).map(([group, templateNames]) => (
          <div key={group} className={classes.templateGroup}>
            <h3>{group}</h3>
            {templateNames.map(templateName => {
              const template = templates.find(template => template.name === templateName);
              if (!template) return null;
              return (
              <ModerationTemplateSunshineItem key={template._id} template={template} onTemplateClick={handleTemplateClick} />
              )
            })}
          </div>
        ))}
      </div>
    )}
  </div>;
}

export default SunshineUserMessages;
