import React, { useCallback, useEffect, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { useMulti } from '@/lib/crud/withMulti';
import { useSingle } from '@/lib/crud/withSingle';
import { userGetDisplayName } from '@/lib/collections/users/helpers';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser';
import { userIsAdmin } from '@/lib/vulcan-users/permissions.ts';
import { useLocation, useNavigate } from '@/lib/routeUtil';
import { isEmpty } from 'underscore';
import qs from 'qs';
import { Link } from '../../lib/reactRouterWrapper';
import Checkbox, { CheckboxProps } from "@material-ui/core/Checkbox";
import LWTooltip from "@/components/common/LWTooltip";
import FormatDate from "@/components/common/FormatDate";
import UsersNameDisplay from "@/components/users/UsersNameDisplay";
import { LlmChatMessage } from "@/components/languageModels/LanguageModelChat";
import { SectionTitle } from "@/components/common/SectionTitle";
import Error404 from "@/components/common/Error404";
import { Loading } from "@/components/vulcan-core/Loading";

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
  conversationSelector: {
    height: "calc(100vh - 162px)",
    overflowY: "scroll",
  },
  conversationViewer: {
    marginTop: 48,
    borderRadius: 5,
    width: 500,
    height: "calc(100vh - 162px)",
    backgroundColor: theme.palette.grey[0],
    overflowY: "scroll",
  },
  checkboxContainer: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontFamily: theme.palette.fonts.sansSerifStack
  },
  checkbox: {
    margin: 0,
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

  const conversationCharacterCount = conversation.totalCharacterCount ?? 0;
  const estimatedTokenCount = Math.round(conversationCharacterCount / 4.4);

  return <div className={classNames(classes.conversationRow, {[classes.conversationRowSelected]: isCurrentlySelected})}>
    <span className={classes.conversationRowGroup}>
      <UsersNameDisplay user={user} className={classes.conversationRowUsername} hideFollowButton />
      <span className={classes.conversationRowTitle} onClick={()=>setCurrentConversationId(conversation._id)}>
        <Link to={`/admin/llmConversations?conversationId=${conversation._id}`}>{title}</Link>
      </span>
    </span>
    <span className={classes.conversationRowGroup}>
      <LWTooltip title={`${conversationCharacterCount} characters`} placement='top'>
        <span className={classes.conversationRowWordCount}>{estimatedTokenCount}</span>
      </LWTooltip>
      <span className={classes.conversationRowNumLastUpdated}><FormatDate date={lastUpdatedAt ?? createdAt}/></span>
    </span>
  </div>
}


// Lists all conversations for admins to select from
const LlmConversationSelector = ({currentConversationId, setCurrentConversationId, classes}: {
  currentConversationId?: string
  setCurrentConversationId: (conversationId: string) => void,
  classes: ClassesType<typeof styles>,
}) => {

  const [showDeleted, setShowDeleted] = useState(false);
  const [showAdmin, setShowAdmin] = useState(true);

  const { results, loading } = useMulti({
    collectionName: "LlmConversations",
    fragmentName: "LlmConversationsViewingPageFragment",
    terms: { view: "llmConversationsAll", showDeleted },
    limit: 200,
  });

  const filteredResults = results?.filter((conversation) => {
    if (!showAdmin && userIsAdmin(conversation.user)) {
      return false;
    }
    return true;
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
    return <Loading />
  }
  
  if (!results) {
    return <div>No conversations found</div>;
  }

  return <div className={classes.conversationSelectorRoot}>
    <div className={classes.checkboxContainer}>
      <span>Deleted <Checkbox checked={showDeleted} onChange={() => setShowDeleted(!showDeleted)} className={classes.checkbox}/></span>
      <span>Show admin <Checkbox checked={showAdmin} onChange={() => setShowAdmin(!showAdmin)} className={classes.checkbox}/></span>
    </div>
    <div className={classes.conversationSelector}>
      {filteredResults && filteredResults.length > 0
        ? filteredResults.map((conversation, idx) => {
          return <LlmConversationRow
            key={idx} 
            conversation={conversation}
            currentConversationId={currentConversationId}
            setCurrentConversationId={updateConversationId}
            classes={classes} />;
        })
        : <div>No conversations found</div>
    }
  </div>
  </div>
}


const LlmConversationViewer = ({conversationId, classes}: {
  conversationId?: string
  classes: ClassesType<typeof styles>,
}) => {
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
      <Loading />
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
    return <Error404 />
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

export default LlmConversationsViewingPageComponent;
