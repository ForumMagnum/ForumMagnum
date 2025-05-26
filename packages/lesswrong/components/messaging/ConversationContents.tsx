import React, { useEffect, useRef, useState } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import withErrorBoundary from "../common/withErrorBoundary";
import { useLocation } from "../../lib/routeUtil";
import { useTracking } from "../../lib/analyticsEvents";
import { getBrowserLocalStorage } from "../editor/localStorageHandlers";
import { useOnServerSentEvent } from "../hooks/useUnreadNotifications";
import stringify from "json-stringify-deterministic";
import {isFriendlyUI} from '../../themes/forumTheme.ts'
import MessagesNewForm from "./MessagesNewForm";
import Error404 from "../common/Error404";
import Loading from "../vulcan-core/Loading";
import MessageItem from "./MessageItem";
import Divider from "../common/Divider";
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const messageListFragmentMultiQuery = gql(`
  query multiMessageConversationContentsQuery($selector: MessageSelector, $limit: Int, $enableTotal: Boolean) {
    messages(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...messageListFragment
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  conversationTitle: {
    ...theme.typography.commentStyle,
    marginTop: 8,
    marginBottom: 12,
  },
  editor: {
    position: "relative",
    '& .form-submit': {
      // form-submit has display: block by default, which for some reason makes it take up 0 height
      // on mobile. This fixes that.
      display: "flex",
    },
    ...(isFriendlyUI ? {
      padding: '18px 0px',
      marginTop: "auto",
    } : {
      margin: '32px 0px',
    })
  },
  backButton: {
    color: theme.palette.lwTertiary.main,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
  },
});

const ConversationContents = ({
  conversation,
  currentUser,
  scrollRef,
  classes,
}: {
  conversation: ConversationsList;
  currentUser: UsersCurrent;
  scrollRef?: React.RefObject<HTMLDivElement|null>;
  classes: ClassesType<typeof styles>;
}) => {
  // Count messages sent, and use it to set a distinct value for `key` on `MessagesNewForm`
  // that increments with each message. This is a way of clearing the form, which works
  // around problems inside the editor related to debounce timers and autosave and whatnot,
  // by guaranteeing that it's a fresh set of react components each time.
  const [messageSentCount, setMessageSentCount] = useState(0);

  const stateSignatureRef = useRef(stringify({conversationId: conversation._id, numMessagesShown: 0}));

  const { data, loading, refetch } = useQuery(messageListFragmentMultiQuery, {
    variables: {
      selector: { messagesConversation: { conversationId: conversation._id } },
      limit: 100000,
      enableTotal: false,
    },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.messages?.results;

  const { query } = useLocation();
  const { captureEvent } = useTracking();

  // Whenever either the number of messages changes, or the conversationId changes,
  // scroll to the bottom. This happens on pageload, and also happens when the messages
  // list is refreshed because of the useOnServerSentEvent() call below, if the refresh
  // increased the message count.
  //
  // Note, if you're refreshing (as opposed to navigating or opening a new
  // tab), this can wind up fighting with the browser's scroll restoration (see
  // client/scrollRestoration.ts).
  useEffect(() => {
    const newNumMessages = results?.length ?? 0;
    const newStateSignature = stringify({conversationId: conversation._id, numMessagesShown: newNumMessages});
    if (newStateSignature !== stateSignatureRef.current) {
      stateSignatureRef.current = newStateSignature;
      setTimeout(() => {
        // Always scroll the whole window. This may be a problem in future, but it's here to make
        // scroll work nicely on both desktop (uses inner div) and mobile (uses whole window)
        const scrollPadding = 550; // Stop it scrolling way off the end of the page
        window.scroll({top: document.body.scrollHeight-scrollPadding, behavior: 'smooth'})

        // Also scroll the exact element we are embedded in, if we have a ref to it
        if (scrollRef?.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 0);
    }
  }, [stateSignatureRef, results?.length, scrollRef, conversation._id]);

  useOnServerSentEvent('notificationCheck', currentUser, () => refetch());

  // try to attribute this sent message to where the user came from
  const profileViewedFrom = useRef("");
  useEffect(() => {
    const ls = getBrowserLocalStorage();
    if (query.from) {
      profileViewedFrom.current = query.from;
    } else if (conversation && conversation.participantIds?.length === 2 && ls) {
      // if this is a conversation with one other person, see if we have info on where the current user found them
      const otherUserId = conversation.participantIds.find((id) => id !== currentUser._id);
      const storedLastViewedProfiles = ls.getItem("lastViewedProfiles")
      const lastViewedProfiles = storedLastViewedProfiles ? JSON.parse(storedLastViewedProfiles) : [];
      profileViewedFrom.current = lastViewedProfiles?.find((profile: any) => profile.userId === otherUserId)?.from;
    }
  }, [query.from, conversation, currentUser._id]);
  const renderMessages = () => {
    if (loading && !results) return <Loading />;
    if (!results?.length) return null;

    return (
      <div data-testid="conversation-messages">
        {results.map((message) => (
          <MessageItem key={message._id} message={message} />
        ))}
      </div>
    );
  };

  if (loading && !results) return <Loading />;
  if (!conversation) return <Error404 />;

  return (
    <>
      {renderMessages()}
      <div className={classes.editor}>
        <MessagesNewForm
          key={`sendMessage-${messageSentCount}`}
          conversationId={conversation._id}
          templateQueries={{ templateId: query.templateId, displayName: query.displayName }}
          formStyle={isFriendlyUI ? "minimalist" : undefined}
          successEvent={() => {
            setMessageSentCount(messageSentCount + 1);
            captureEvent("messageSent", {
              conversationId: conversation._id,
              sender: currentUser._id,
              participantIds: conversation.participantIds,
              messageCount: (conversation.messageCount || 0) + 1,
              ...(profileViewedFrom?.current && { from: profileViewedFrom.current }),
            });
          }}
        />
      </div>
    </>
  );
};

export default registerComponent("ConversationContents", ConversationContents, {
  styles,
  hocs: [withErrorBoundary],
});


