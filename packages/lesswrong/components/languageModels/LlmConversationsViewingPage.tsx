// TODO: Import component in components.ts
import React, { useEffect } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { useMulti } from '@/lib/crud/withMulti';
import { useSingle } from '@/lib/crud/withSingle';
import { userGetDisplayName } from '@/lib/collections/users/helpers';
import classNames from 'classnames';

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
    width: 600,
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
  conversationRowLeftAligned: {
    display: "flex",
    alignItems: "center",
  },
  conversationRowUsername: {
      ...theme.typography.commentStyle,
      width: 100,
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
      maxWidth: 450,
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
  }
});

const LlmConversationRow = ({conversation, currentConversationId, setCurrentConversationId, classes}: {
  conversation: LlmConversationsWithUserInfoFragment
  currentConversationId: string|undefined,
  setCurrentConversationId: (conversationId: string) => void,
  classes: ClassesType<typeof styles>,
}) => {

  const isCurrentlySelected = currentConversationId === conversation._id;
  const { title, user, lastUpdatedAt, createdAt } = conversation;

  return <div 
    className={classNames(classes.conversationRow, {[classes.conversationRowSelected]: isCurrentlySelected})}
    onClick={()=> setCurrentConversationId(conversation._id)}
    >
    <span className={classes.conversationRowLeftAligned}>
      <span className={classes.conversationRowUsername}>{userGetDisplayName(user)}</span>
      <span className={classes.conversationRowTitle}>{title}</span>
    </span>
    <span className={classes.conversationRowNumLastUpdated}><Components.FormatDate date={lastUpdatedAt ?? createdAt}/></span>
  </div>
}


// Lists all conversations for admins to select from
const LlmConversationSelector = ({currentConversationId, setCurrentConversationId, classes}: {
  currentConversationId: string|undefined,
  setCurrentConversationId: (conversationId: string) => void,
  classes: ClassesType<typeof styles>,
}) => {

  const { results, loading } = useMulti({
    collectionName: "LlmConversations",
    fragmentName: "LlmConversationsWithUserInfoFragment",
    terms: { view: "llmConversationsAll" },
  });

  useEffect(() => {
    if (results) {
      setCurrentConversationId(results[0]?._id);
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
      setCurrentConversationId={setCurrentConversationId}
      classes={classes} />;
    })}
  </div>
}


const LlmConversationViewer = ({conversationId, classes}: {
  conversationId: string|undefined,
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
    {messages.map((message, idx) => {
      return <LlmChatMessage  key={idx} message={message} />
    })}
  </div> 
}


export const LlmConversationsViewingPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const [currentConversationId, setCurrentConversationId] = React.useState<string|undefined>(undefined);

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
