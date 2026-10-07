import React, { useEffect, useRef, useState } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import withErrorBoundary from "../common/withErrorBoundary";
import { useLocation } from "../../lib/routeUtil";
import { useTracking } from "../../lib/analyticsEvents";
import { getBrowserLocalStorage } from "../editor/localStorageHandlers";
import stringify from "json-stringify-deterministic";
import MessagesNewForm from "./MessagesNewForm";
import Error404 from "../common/Error404";
import Loading from "../vulcan-core/Loading";
import MessageItem from "./MessageItem";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { SideItemsContainer } from "../contents/SideItems.tsx";
import { Link } from "../../lib/reactRouterWrapper";
import ConversationDetails from "./ConversationDetails";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

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

const styles = defineStyles("ConversationContents", (theme: ThemeType) => ({
  root: {
    flex: "1 1 auto",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  },
  // The scrolling region. The editor sits below it as a separate flex item, so
  // a taller editor shrinks this region rather than covering part of it.
  scrollArea: {
    flex: "1 1 auto",
    minHeight: 0,
    overflowY: "auto",
    padding: "0px 16px",
    [theme.breakpoints.down('xs')]: {
      padding: "0px 24px",
    },
  },
  backButton: {
    ...theme.typography.body2,
    color: theme.palette.lwTertiary.main,
    width: 'fit-content',
    padding: "12px 0 0 0",
    fontWeight: 600,
    display: "none",
    // Only show on mobile
    [theme.breakpoints.down('xs')]: {
      display: "block",
    }
  },
  messages: {
    [theme.breakpoints.down("xs")]: {
      width: "calc(100% - 5px)",
    },
  },
  editor: {
    flex: "0 0 auto",
    '& .form-submit': {
      // form-submit has display: block by default, which for some reason makes it take up 0 height
      // on mobile. This fixes that.
      display: "flex",
    },
    // Cap the height of the text area (but not the send button next to it) so
    // that a very long unsent message scrolls inside the input box rather than
    // pushing the message history off-screen entirely.
    '& .form-component-EditorFormComponent': {
      maxHeight: "50vh",
      overflowY: "auto",
    },
    padding: '8px 16px',
    backgroundColor: theme.palette.background.paper,
    [theme.breakpoints.down('xs')]: {
      padding: "8px 24px",
    },
  },
}));

/**
 * Keep the messages that are visible just above the editor in place when the
 * editor changes height (e.g. because the user typed a multi-line message):
 * when the editor grows by N pixels, the scroll area shrinks by N pixels from
 * the bottom, so scrolling down by N pixels pushes the message history up
 * rather than hiding the bottom of it.
 */
function keepScrollAnchoredAboveEditor(scrollEl: HTMLElement, editorEl: HTMLElement): () => void {
  let lastHeight: number | null = null;
  const observer = new ResizeObserver((entries) => {
    const newHeight = entries[0]?.contentRect.height;
    if (newHeight === undefined) return;
    if (lastHeight !== null && newHeight !== lastHeight) {
      scrollEl.scrollTop += newHeight - lastHeight;
    }
    lastHeight = newHeight;
  });
  observer.observe(editorEl);
  return () => observer.disconnect();
}

const ConversationContents = ({conversation, currentUserId, sendEmail = true}: {
  conversation: ConversationsList;
  currentUserId: string;
  sendEmail?: boolean;
}) => {
  const classes = useStyles(styles);
  const scrollRef = useRef<HTMLDivElement|null>(null);
  const editorRef = useRef<HTMLDivElement|null>(null);

  // Count messages sent, and use it to set a distinct value for `key` on `MessagesNewForm`
  // that increments with each message. This is a way of clearing the form, which works
  // around problems inside the editor related to debounce timers and autosave and whatnot,
  // by guaranteeing that it's a fresh set of react components each time.
  const [messageSentCount, setMessageSentCount] = useState(0);

  const stateSignatureRef = useRef(stringify({conversationId: conversation._id, numMessagesShown: 0}));

  const { data, loading, refetch, updateQuery } = useQuery(messageListFragmentMultiQuery, {
    variables: {
      selector: { messagesConversation: { conversationId: conversation._id } },
      limit: 100000,
      enableTotal: false,
    },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.messages?.results;
  const showLoading = loading && !results;

  useEffect(() => {
    const scrollEl = scrollRef.current;
    const editorEl = editorRef.current;
    if (showLoading || !scrollEl || !editorEl) return;
    return keepScrollAnchoredAboveEditor(scrollEl, editorEl);
  }, [showLoading]);

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
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 0);
    }
  }, [stateSignatureRef, results?.length, conversation._id]);

  // TODO: replace this functionality without SSE
  // useOnServerSentEvent('notificationCheck', currentUser, () => refetch());

  // try to attribute this sent message to where the user came from
  const profileViewedFrom = useRef("");
  useEffect(() => {
    const ls = getBrowserLocalStorage();
    if (query.from) {
      profileViewedFrom.current = query.from;
    } else if (conversation && conversation.participantIds?.length === 2 && ls) {
      // if this is a conversation with one other person, see if we have info on where the current user found them
      const otherUserId = conversation.participantIds.find((id) => id !== currentUserId);
      const storedLastViewedProfiles = ls.getItem("lastViewedProfiles")
      const lastViewedProfiles = storedLastViewedProfiles ? JSON.parse(storedLastViewedProfiles) : [];
      profileViewedFrom.current = lastViewedProfiles?.find((profile: any) => profile.userId === otherUserId)?.from;
    }
  }, [query.from, conversation, currentUserId]);

  const renderMessages = () => {
    if (!results?.length) return null;

    return (
      <div data-testid="conversation-messages" className={classes.messages}>
        {results.map((message, idx) => (
          <SideItemsContainer key={message._id} hideBlockSideItems>
            <MessageItem message={message} />
          </SideItemsContainer>
        ))}
      </div>
    );
  };

  if (showLoading) return <Loading />;
  if (!conversation) return <Error404 />;

  return (
    <div className={classes.root}>
      <div className={classes.scrollArea} ref={scrollRef}>
        <Link to="/inbox" className={classes.backButton}>
          Go back to Inbox
        </Link>
        <ConversationDetails conversation={conversation} hideOptions />
        {renderMessages()}
      </div>
      <div className={classes.editor} ref={editorRef}>
        <MessagesNewForm
          key={`sendMessage-${conversation._id}-${messageSentCount}`}
          conversationId={conversation._id}
          templateQueries={{ templateId: query.templateId, displayName: query.displayName }}
          formStyle="minimalist"
          sendEmail={sendEmail}
          successEvent={(newMessage) => {
            setMessageSentCount(messageSentCount + 1);
            captureEvent("messageSent", {
              conversationId: conversation._id,
              sender: currentUserId,
              participantIds: conversation.participantIds,
              messageCount: (conversation.messageCount || 0) + 1,
              ...(profileViewedFrom?.current && { from: profileViewedFrom.current }),
            });
            updateQuery((_, { previousData }) => {
              const previousResults = previousData?.messages?.results ?? [];
              const previousMessages = previousResults.filter((m): m is messageListFragment => m !== undefined) ?? [];

              return {
                __typename: "Query" as const,
                messages: {
                  __typename: "MultiMessageOutput" as const,
                  results: [...previousMessages, newMessage],
                  totalCount: previousData?.messages?.totalCount ? previousData?.messages?.totalCount + 1 : 1,
                },
              }
            })
          }}
        />
      </div>
    </div>
  );
};

export default registerComponent("ConversationContents", ConversationContents, {
  hocs: [withErrorBoundary],
});


