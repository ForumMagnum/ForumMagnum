import React, { useCallback, useEffect, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { useMulti } from '@/lib/crud/withMulti';
import { useSingle } from '@/lib/crud/withSingle';
import { userGetDisplayName } from '@/lib/collections/users/helpers';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser';
import { userIsAdmin } from '@/lib/vulcan-users';
import { useLocation, useNavigate } from '@/lib/routeUtil';
import { isEmpty } from 'underscore';
import qs from 'qs';

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    justifyContent: "flex-start",
  },
  mainColumn: {
    display: "flex",
    flexDirection: "row",
    marginLeft: 20,
  },
  conversationSelectorRoot: {
    marginRight: 24,
  },
  conversationViewer: {
    borderRadius: 5,
    width: 500,
    height: "calc(100vh - 114px)",
    backgroundColor: theme.palette.grey[0],
    overflowY: "scroll",
  },
  conversationViewerTitle: {
    ...theme.typography.commentStyle,
    marginLeft: 20,
  },
  conversationRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: 600,
    padding: 10,
    marginBottom: 5,
    backgroundColor: theme.palette.grey[0],
    borderRadius: 5,
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.grey[100],
    }
  },
  conversationRowSelected: {
    backgroundColor: theme.palette.grey[300],
  },
  conversationRowGroup: {
    display: "flex",
    alignItems: "center",
  },
  conversationRowUsername: {
    ...theme.typography.commentStyle,
    width: 90,
    fontWeight: 400,
    fontSize: "0.95rem",
    marginRight: 10,
    opacity: 0.7,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  conversationRowTitle: {
    ...theme.typography.commentStyle,
    maxWidth: 375,
    fontWeight: 500,
    fontSize: "1.15rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  conversationRowNumLastUpdated: {
    ...theme.typography.commentStyle,
    padding: 2,
    fontWeight: 400,
    fontSize: "0.9rem",
    opacity: 0.8
  },
  conversationRowWordCount: {
    ...theme.typography.commentStyle,
    padding: 2,
    fontWeight: 400,
    fontSize: "0.9rem",
    fontStyle: "italic",
    opacity: 0.7,
    marginRight: 10,
  },
});

const LlmConversationRow = ({conversation, currentConversationId, setCurrentConversationId, classes}: {
  conversation: LlmConversationsViewingPageFragment
  currentConversationId?: string
  setCurrentConversationId: (conversationId: string) => void,
  classes: ClassesType<typeof styles>,
}) => {
  const isCurrentlySelected = currentConversationId === conversation._id;
  const { title, user, lastUpdatedAt, createdAt } = conversation;

  return <div 
    className={classNames(classes.conversationRow, {[classes.conversationRowSelected]: isCurrentlySelected})}
    onClick={()=> setCurrentConversationId(conversation._id)}
    >
    <span className={classes.conversationRowGroup}>
      <span className={classes.conversationRowUsername}>{userGetDisplayName(user)}</span>
      <span className={classes.conversationRowTitle}>{title}</span>
    </span>
    <span className={classes.conversationRowGroup}>
      <Components.LWTooltip title={`Character count, estimated ${Math.round((conversation.totalCharacterCount ?? 0)/4.4)} tokens`} placement='top'>
        <span className={classes.conversationRowWordCount}>{conversation.totalCharacterCount}</span>
      </Components.LWTooltip>
      <span className={classes.conversationRowNumLastUpdated}><Components.FormatDate date={lastUpdatedAt ?? createdAt}/></span>
    </span>
  </div>
}


// Lists all conversations for admins to select from
const LlmConversationSelector = ({currentConversationId, setCurrentConversationId, classes}: {
  currentConversationId?: string
  setCurrentConversationId: (conversationId: string) => void,
  classes: ClassesType<typeof styles>,
}) => {
  const { results, loading } = useMulti({
    collectionName: "LlmConversations",
    fragmentName: "LlmConversationsViewingPageFragment",
    terms: { view: "llmConversationsAll" },
    limit: 200,
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { query } = location;

  const updateConversationId = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
    const currentQuery = isEmpty(query) ? {} : query;
    const newQuery = { ...currentQuery, conversationId };
    navigate({...location.location, search: `?${qs.stringify(newQuery)}`})
  }, [query, location, navigate, setCurrentConversationId]);

  useEffect(() => {
    if (results) {
      const initialConversationId = query.conversationId ?? results[0]?._id;
      updateConversationId(initialConversationId);
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!results && loading) {
    return <Components.Loading />
  }
  
  if (!results) {
    return <div>No conversations found</div>;
  }

  return <div className={classes.conversationSelectorRoot}>
    {results.map((conversation, idx) => {
      return <LlmConversationRow
        key={idx} 
        conversation={conversation}
        currentConversationId={currentConversationId}
        setCurrentConversationId={updateConversationId}
        classes={classes} />;
    })}
  </div>
}


const LlmConversationViewer = ({conversationId, classes}: {
  conversationId?: string
  classes: ClassesType<typeof styles>,
}) => {
  const { LlmChatMessage, SectionTitle } = Components

  const { document: conversation, loading } = useSingle({
    collectionName: "LlmConversations",
    fragmentName: "LlmConversationsWithMessagesFragment",
    documentId: conversationId,
    skip: !conversationId
  });


  if (!conversationId) {
    return <div className={classes.conversationViewer}>
      No conversation selected
    </div>
  }

  if (!conversation && loading) {
    return <div className={classes.conversationViewer}>
      <Components.Loading />
    </div>
  }

  if (!conversation) {
    throw new Error("No conversation with selectedId");
  }
  
  const { title, messages } = conversation;

  return <div className={classes.conversationViewer}>
    <SectionTitle title={title} titleClassName={classes.conversationViewerTitle} />
    {!messages?.length && <div>No messages in this conversation</div>}
    {messages?.length && messages.map((message, idx) => {
      return <LlmChatMessage key={idx} message={message} />
    })}
  </div> 
}


export const LlmConversationsViewingPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const [currentConversationId, setCurrentConversationId] = useState<string>();

  if (!userIsAdmin(currentUser)) {
    return <Components.Error404 />
  }

  return <AnalyticsContext pageContext="llmConversationViewingPage">
    <div className={classes.root}>
      <div className={classes.mainColumn}>
        <LlmConversationSelector
          currentConversationId={currentConversationId}
          setCurrentConversationId={setCurrentConversationId}
          classes={classes}
        />
        <LlmConversationViewer
          conversationId={currentConversationId}
          classes={classes}
        />
      </div>
  </div>
  </AnalyticsContext>
}

const LlmConversationsViewingPageComponent = registerComponent('LlmConversationsViewingPage', LlmConversationsViewingPage, {styles});

declare global {
  interface ComponentTypes {
    LlmConversationsViewingPage: typeof LlmConversationsViewingPageComponent
  }
}
